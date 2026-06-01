import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, FlatList, RefreshControl, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: any;
    likes: string[];
    commentsCount?: number;
}

export default function CommunityScreen() {
    const { user, updateUserProfile } = useAuth();
    const { colors, theme } = useTheme();
    const router = useRouter();

    const scrollY = React.useRef(new Animated.Value(0)).current;

    const headerBgOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];
            setPosts(data);
            setLoading(false);
            setRefreshing(false);
        }, (err) => {
            console.error('Community Snapshot Error:', err);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        if (!user) {
            Alert.alert('Authentication required', 'Please sign in to make a post.');
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'posts'), {
                authorId: user.uid,
                authorName: user.name || 'Anonymous Student',
                authorAvatar: user.photoURL || null,
                content: newPostContent.trim(),
                timestamp: serverTimestamp(),
                likes: [],
                commentsCount: 0
            });

            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    points: increment(10)
                });
                updateUserProfile({ points: (user.points || 0) + 10 });
            } catch (err) {
                console.warn('Could not award points:', err);
            }

            setNewPostContent('');
            Alert.alert('Success', '✨ Post shared! You earned 10 XP.');
        } catch (error: any) {
            console.error('Failed to save post:', error);
            Alert.alert('Error', 'Failed to share post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (postId: string, likes: string[]) => {
        if (!user) return;
        const hasLiked = likes.includes(user.uid);
        const postRef = doc(db, 'posts', postId);

        try {
            if (hasLiked) {
                await updateDoc(postRef, {
                    likes: arrayRemove(user.uid)
                });
            } else {
                await updateDoc(postRef, {
                    likes: arrayUnion(user.uid)
                });
            }
        } catch (err) {
            console.error('Failed to update like status:', err);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        try {
            const date = timestamp.toDate();
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffSec = Math.floor(diffMs / 1000);
            
            if (diffSec < 60) return `${diffSec}s ago`;
            const diffMin = Math.floor(diffSec / 60);
            if (diffMin < 60) return `${diffMin}m ago`;
            const diffHr = Math.floor(diffMin / 60);
            if (diffHr < 24) return `${diffHr}h ago`;
            const diffDays = Math.floor(diffHr / 24);
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return 'Just now';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
            {/* Backdrop gradient mesh behind header & list */}
            <LinearGradient
                colors={theme === 'dark'
                    ? ['rgba(41,151,255,0.15)', 'rgba(0,102,204,0.02)', 'transparent']
                    : ['rgba(0,102,204,0.08)', 'rgba(0,102,204,0.01)', 'transparent']
                }
                style={styles.heroBackground}
            />

            {/* ═══ TOP BAR — Seamless ═══ */}
            <View style={styles.topBar}>
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    {
                        opacity: headerBgOpacity,
                        backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.bgMain,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.dividerSoft
                    }
                ]}>
                    {Platform.OS === 'ios' && (
                        <BlurView
                            intensity={80}
                            tint={theme === 'dark' ? 'dark' : 'light'}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                </Animated.View>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, borderWidth: 1 }]}>
                    <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Community</Text>
                <View style={{ width: 38 }} />
            </View>

            {/* Compose Post Box */}
            <View style={[styles.composeCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
                <View style={styles.composeRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </Text>
                    </View>
                    <TextInput
                        style={[styles.composeInput, { color: colors.textPrimary }]}
                        placeholder="Ask a question or share resource info..."
                        placeholderTextColor={colors.textMuted}
                        value={newPostContent}
                        onChangeText={setNewPostContent}
                        multiline
                        maxLength={500}
                    />
                </View>
                <View style={[styles.composeFooter, { borderTopColor: colors.hairline }]}>
                    <Text style={[styles.characterCount, { color: colors.textMuted }]}>
                        {newPostContent.length}/500
                    </Text>
                    <TouchableOpacity 
                        style={[styles.postButton, { backgroundColor: colors.primary, opacity: !newPostContent.trim() || submitting ? 0.6 : 1 }]}
                        onPress={handleCreatePost}
                        disabled={!newPostContent.trim() || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.postButtonText}>Post</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Feed List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <Animated.FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    contentContainerStyle={styles.listContent}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    renderItem={({ item }) => {
                        const likesList = item.likes || [];
                        const hasLiked = user ? likesList.includes(user.uid) : false;
                        return (
                            <View style={[styles.postCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
                                {/* Header */}
                                <View style={styles.postHeader}>
                                    <View style={[styles.authorAvatarCircle, { backgroundColor: colors.primarySoft }]}>
                                        <Text style={[styles.authorAvatarText, { color: colors.primary }]}>
                                            {item.authorName ? item.authorName.charAt(0).toUpperCase() : '?'}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.authorName, { color: colors.textPrimary }]}>{item.authorName}</Text>
                                        <Text style={[styles.postTime, { color: colors.textMuted }]}>{formatDate(item.timestamp)}</Text>
                                    </View>
                                </View>

                                {/* Content */}
                                <Text style={[styles.postContent, { color: colors.textPrimary }]}>{item.content}</Text>

                                {/* Action Bar */}
                                <View style={[styles.actionBar, { borderTopColor: colors.hairline }]}>
                                    <TouchableOpacity 
                                        style={styles.actionButton} 
                                        onPress={() => handleLike(item.id, likesList)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons 
                                            name={hasLiked ? "heart" : "heart-outline"} 
                                            size={20} 
                                            color={hasLiked ? "#ff3b30" : colors.textMuted} 
                                        />
                                        <Text style={[styles.actionText, { color: hasLiked ? "#ff3b30" : colors.textMuted }]}>
                                            {likesList.length}
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={styles.actionButton}>
                                        <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
                                        <Text style={[styles.actionText, { color: colors.textMuted }]}>
                                            {item.commentsCount || 0}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubbles-outline" size={48} color={colors.textDisabled} style={{ marginBottom: 12 }} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No discussions started yet.</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Be the first to share an update!</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    heroBackground: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 260,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    topTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
    
    composeCard: {
        marginHorizontal: 20, marginTop: 108, borderRadius: 20, borderWidth: 1, padding: 16,
    },
    composeRow: { flexDirection: 'row', gap: 12 },
    avatarCircle: {
        width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 16, fontWeight: '700' },
    composeInput: { flex: 1, fontSize: 16, fontWeight: '400', minHeight: 44, textAlignVertical: 'top', paddingTop: 6 },
    composeFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth,
    },
    characterCount: { fontSize: 12, fontWeight: '500' },
    postButton: {
        paddingHorizontal: 18, paddingVertical: 8, borderRadius: 9999,
    },
    postButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 110, gap: 14 },
    
    postCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
    postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    authorAvatarCircle: {
        width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center',
    },
    authorAvatarText: { fontSize: 15, fontWeight: '700' },
    authorName: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
    postTime: { fontSize: 12, fontWeight: '400', marginTop: 1 },
    postContent: { fontSize: 15, fontWeight: '400', lineHeight: 22, marginBottom: 14 },
    actionBar: {
        flexDirection: 'row', gap: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth,
    },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontSize: 13, fontWeight: '600' },
    
    emptyState: { alignItems: 'center', paddingVertical: 64 },
    emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    emptySubtext: { fontSize: 13, fontWeight: '400' },
});

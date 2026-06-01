import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useDownloads } from '../../context/DownloadsContext';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 56) / 2;

interface NoteFile {
  id: string;
  title: string;
  type: string;
  uploader: string;
  subject: string;
  year: string;
  rating?: number;
  downloads?: number;
}

// ── Essential categories ──
const CATEGORIES = [
  { icon: 'book', label: 'Study', route: '/exam-mode', bg: '#0066cc', bgLight: 'rgba(0,102,204,0.1)' },
  { icon: 'document-text', label: 'PYQs', route: '/pyqs', bg: '#ff9500', bgLight: 'rgba(255,149,0,0.1)' },
  { icon: 'chatbubbles', label: 'Community', route: '/community', bg: '#af52de', bgLight: 'rgba(175,82,222,0.1)' },
  { icon: 'people', label: 'Clubs', route: '/clubs', bg: '#ff2d55', bgLight: 'rgba(255,45,85,0.1)' },
];

// ── Quick Actions (new) ──
const QUICK_ACTIONS = [
  { icon: 'trophy', label: 'Leaderboard', route: '/leaderboard', color: '#ffcc00', bgLight: 'rgba(255,204,0,0.12)' },

  { icon: 'newspaper', label: 'News', route: '/news', color: '#5856d6', bgLight: 'rgba(88,86,214,0.1)' },
  { icon: 'cloud-download', label: 'Downloads', route: '/(tabs)/downloads', color: '#34c759', bgLight: 'rgba(52,199,89,0.1)' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const { downloads } = useDownloads();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [recentFiles, setRecentFiles] = useState<NoteFile[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const fetchRecentFiles = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'files'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const snapshot = await getDocs(q);
        setRecentFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NoteFile[]);
      } catch (err) {
        console.warn('Error fetching recent files:', err);
        setRecentFiles([]);
      } finally { setLoading(false); }
    };
    fetchRecentFiles();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'there';

  const getTypeColor = (t: string) => t === 'Notes' ? '#0066cc' : t === 'PYQ' ? '#ff9500' : '#34c759';
  const getTypeIcon = (t: string): string => t === 'Notes' ? 'document-text' : t === 'PYQ' ? 'help-circle' : 'clipboard';

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ═══ HERO BANNER ═══ */}
          <LinearGradient
            colors={theme === 'dark'
              ? ['rgba(41,151,255,0.15)', 'rgba(0,102,204,0.05)', 'transparent']
              : ['rgba(0,102,204,0.08)', 'rgba(0,102,204,0.02)', 'transparent']
            }
            style={styles.heroBanner}
          >
            <View style={styles.topNav}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image source={require('../../../assets/images/icon.png')} style={{ width: 34, height: 34, borderRadius: 10 }} />
                <Text style={[styles.brand, { color: colors.textPrimary }]}>Sutras</Text>
              </View>
              <View style={styles.topRight}>
                <TouchableOpacity
                  style={[styles.navBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, borderWidth: 1 }]}
                  onPress={() => router.push('/notifications' as any)}
                >
                  <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    {user?.photoURL ? (
                      <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarLetter}>{(user?.name || 'S')[0].toUpperCase()}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.heroGreeting, { color: colors.textMuted, marginTop: 16 }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.heroName, { color: colors.textPrimary }]}>
              {displayName} 👋
            </Text>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              What would you like to study today?
            </Text>

            {/* Search bar inside hero */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/search')}
              style={{ marginTop: 20 }}
            >
              <View style={[styles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.hairline }]}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <Text style={[styles.searchText, { color: colors.textDisabled }]}>
                  Search notes, PYQs, assignments...
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* ═══ CATEGORY GRID ═══ */}
          <View style={styles.catGrid}>
            {CATEGORIES.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.catTile, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.catIconWrap, { backgroundColor: item.bgLight }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.bg} />
                </View>
                <Text style={[styles.catLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ═══ QUICK ACTIONS — horizontal scroll glassmorphic cards ═══ */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Access</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
            {QUICK_ACTIONS.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.quickActionCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.bgLight }]}>
                  <Ionicons name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
                {action.label === 'Downloads' && downloads.length > 0 && (
                  <View style={[styles.quickActionBadge, { backgroundColor: colors.successSoft }]}>
                    <Text style={[styles.quickActionBadgeText, { color: colors.success }]}>{downloads.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ═══ AI CTA ═══ */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/exam-mode' as any)}
          >
            <LinearGradient
              colors={['#1a1a2e', '#16213e', '#0f3460']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaTile}
            >
              <View style={styles.ctaLeft}>
                <View style={styles.ctaIconWrap}>
                  <Ionicons name="sparkles" size={24} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ctaTitle}>AI Study Prep</Text>
                  <Text style={styles.ctaSub}>Flashcards, summaries & practice Q's</Text>
                </View>
                <View style={[styles.ctaBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ═══ RECENT FILES ═══ */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent files</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>View all →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 32 }} />
          ) : (
            <View style={styles.fileGrid}>
              {recentFiles.map(file => {
                const tc = getTypeColor(file.type);
                return (
                  <TouchableOpacity
                    key={file.id}
                    style={[styles.fileCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}
                    onPress={() => router.push(`/file-detail/${file.id}`)}
                    activeOpacity={0.8}
                  >
                    {/* Colored top accent strip */}
                    <View style={[styles.fileAccent, { backgroundColor: tc }]} />
                    <View style={styles.fileCardInner}>
                      <View style={[styles.fileIconBox, { backgroundColor: tc + '12' }]}>
                        <Ionicons name={getTypeIcon(file.type) as any} size={20} color={tc} />
                      </View>
                      <Text style={[styles.fileTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {file.title}
                      </Text>
                      <Text style={[styles.fileMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        {file.subject}
                      </Text>
                      <View style={styles.fileFooter}>
                        <View style={[styles.fileTypePill, { backgroundColor: tc + '12' }]}>
                          <Text style={[styles.fileTypeText, { color: tc }]}>{file.type}</Text>
                        </View>
                        {file.rating ? (
                          <Text style={[styles.fileRating, { color: colors.textMuted }]}>★ {file.rating}</Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: 12,
  },
  brand: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { color: '#fff', fontSize: 15, fontWeight: '600' },
  scroll: { paddingBottom: 110 },

  heroBanner: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  heroGreeting: { fontSize: 15, fontWeight: '500', letterSpacing: -0.2 },
  heroName: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, marginTop: 2 },
  heroSub: { fontSize: 17, fontWeight: '400', letterSpacing: -0.374, marginTop: 6, lineHeight: 24 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 9999,
    paddingHorizontal: 16, borderWidth: 1, gap: 10,
  },
  searchText: { fontSize: 16, fontWeight: '400' },

  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, justifyContent: 'space-between',
    marginTop: 10,
  },
  catTile: {
    width: (SW - 64) / 4,
    borderRadius: 16, borderWidth: 0,
    paddingVertical: 12, alignItems: 'center', gap: 8,
  },
  catIconWrap: {
    width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  catLabel: { fontSize: 12, fontWeight: '600', letterSpacing: -0.1 },

  // Quick Actions — new horizontal scroll row
  quickActionsScroll: { paddingLeft: 20, paddingRight: 8, gap: 10 },
  quickActionCard: {
    width: 100, borderRadius: 16, borderWidth: 1,
    paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', gap: 8,
  },
  quickActionIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  quickActionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: -0.1 },
  quickActionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  quickActionBadgeText: { fontSize: 10, fontWeight: '700' },

  // CTA tile
  ctaTile: {
    marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 20,
  },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaIconWrap: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  ctaTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  ctaSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '400', marginTop: 2 },
  ctaBtn: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 28, marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionLink: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },

  // File grid
  fileGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, justifyContent: 'center',
  },
  fileCard: {
    width: CARD_W, margin: 4, borderRadius: 18,
    borderWidth: 1, overflow: 'hidden',
  },
  fileAccent: { height: 4, width: '100%' },
  fileCardInner: { padding: 14 },
  fileIconBox: {
    width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  fileTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2, lineHeight: 20 },
  fileMeta: { fontSize: 13, fontWeight: '400', marginTop: 4 },
  fileFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10,
  },
  fileTypePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  fileTypeText: { fontSize: 11, fontWeight: '700' },
  fileRating: { fontSize: 12, fontWeight: '600' },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, Image, Dimensions, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

const { width: SW } = Dimensions.get('window');

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  emoji: string;
  membersCount: number;
  upcomingEvent?: string;
  tags?: string[];
  bannerUrl?: string;
}

export default function ClubsScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();

  const scrollY = React.useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'clubs'));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Club[];
        setClubs(data);
      } catch (err) {
        console.warn('Clubs fetch error:', err);
        setClubs([
          {
            id: 'c1',
            name: 'Physics Elites',
            description: 'Recent activity: "Marcus shared a new theorem on quantum entanglement..."',
            category: 'Science',
            emoji: '🌌',
            membersCount: 452,
            tags: ['Science', 'Advanced'],
            bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400'
          },
          {
            id: 'c2',
            name: 'Philosophy Circle',
            description: 'Recent activity: "Discussing Stoicism vs. Epicureanism in modern digital life..."',
            category: 'Humanities',
            emoji: '📚',
            membersCount: 891,
            tags: ['Humanities', 'Debate'],
            bannerUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=400'
          },
          {
            id: 'c3',
            name: 'Algorithm Architects',
            description: 'Recent activity: "New contest for optimized search algorithms starts tomorrow!"',
            category: 'CS',
            emoji: '💻',
            membersCount: 1200,
            tags: ['CS', 'Competitive'],
            bannerUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
      {/* Decorative gradient mesh backdrop behind header & page */}
      <LinearGradient
        colors={theme === 'dark'
          ? ['rgba(41,151,255,0.15)', 'rgba(0,102,204,0.02)', 'transparent']
          : ['rgba(0,102,204,0.08)', 'rgba(0,102,204,0.01)', 'transparent']
        }
        style={styles.heroBackground}
      />

      {/* ═══ TOP APP BAR — Seamless ═══ */}
      <View style={styles.topAppBar}>
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
        <Text style={[styles.appTitle, { color: colors.textPrimary }]}>Clubs</Text>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, borderWidth: 1 }]}>
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* ═══ OFFICIAL ANNOUNCEMENTS ═══ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Announcements</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.announcementsScroll}>
          <View style={[styles.announcementCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            <View style={[styles.annBadge, { backgroundColor: 'rgba(255,149,0,0.1)' }]}>
              <Text style={[styles.annBadgeText, { color: '#ff9500' }]}>⚡ HIGH PRIORITY</Text>
            </View>
            <Text style={[styles.annTitle, { color: colors.textPrimary }]}>Exam Schedule Updated</Text>
            <Text style={[styles.annDesc, { color: colors.textMuted }]} numberOfLines={2}>
              The final assessment dates for all FE modules have been released. Check portal.
            </Text>
          </View>

          <View style={[styles.announcementCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            <View style={[styles.annBadge, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
              <Text style={[styles.annBadgeText, { color: '#34c759' }]}>📅 CAMPUS EVENT</Text>
            </View>
            <Text style={[styles.annTitle, { color: colors.textPrimary }]}>Annual Fest Registration</Text>
            <Text style={[styles.annDesc, { color: colors.textMuted }]} numberOfLines={2}>
              Registration for the upcoming hackathon starts today. Sign up before Friday!
            </Text>
          </View>
        </ScrollView>

        {/* ═══ SEARCH BAR ═══ */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search for groups or topics..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* ═══ CLUB FEED / CLUBS ═══ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Club Feed</Text>
          <View style={[styles.activeNowBadge, { backgroundColor: colors.primarySoft }]}>
            <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.activeNowText, { color: colors.primary }]}>Active Now</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.clubFeedList}>
            {filteredClubs.map((club) => (
              <TouchableOpacity
                key={club.id}
                style={[styles.clubFeedCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}
                onPress={() => setSelectedClub(club)}
                activeOpacity={0.85}
              >
                {/* Banner Image with Overlay Title */}
                <View style={styles.bannerContainer}>
                  <Image source={{ uri: club.bannerUrl }} style={styles.bannerImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.bannerGradient}
                  >
                    <Text style={styles.bannerClubName}>{club.name}</Text>
                  </LinearGradient>
                </View>

                {/* Card Content Footer */}
                <View style={styles.cardContentBody}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.memberText, { color: colors.textMuted }]}>
                      👥 {club.membersCount >= 1000 ? `${(club.membersCount / 1000).toFixed(1)}k` : club.membersCount} Members
                    </Text>
                    <View style={styles.tagsContainer}>
                      {club.tags?.map((t, i) => (
                        <View key={i} style={[styles.tagPill, { backgroundColor: colors.primarySoft }]}>
                          <Text style={[styles.tagText, { color: colors.primary }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Text style={[styles.clubDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {club.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* CLUB DETAILS MODAL */}
      <Modal
        visible={!!selectedClub}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedClub(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            {selectedClub && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalEmoji}>{selectedClub.emoji}</Text>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{selectedClub.name}</Text>
                  <Text style={styles.modalCategory}>{selectedClub.category} Club</Text>
                </View>

                <View style={[styles.modalDivider, { backgroundColor: colors.hairline }]} />

                <Text style={[styles.modalLabel, { color: colors.textPrimary }]}>About the Club</Text>
                <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{selectedClub.description}</Text>

                <Text style={[styles.modalLabel, { color: colors.textPrimary, marginTop: 18 }]}>Members</Text>
                <Text style={[styles.modalValue, { color: colors.textSecondary }]}>👥 {selectedClub.membersCount} students joined</Text>

                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedClub(null)}
                >
                  <Text style={styles.closeButtonText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBackground: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 260,
  },
  topAppBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  appTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  scrollContent: { paddingTop: 108, paddingBottom: 110 },
  
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  viewAllText: { fontSize: 13, fontWeight: '600' },
  
  announcementsScroll: { paddingLeft: 20, paddingRight: 8, marginBottom: 4 },
  announcementCard: {
    width: 250, borderRadius: 18, borderWidth: 1, padding: 16, marginRight: 10,
  },
  annBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 10,
  },
  annBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  annTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, marginBottom: 4 },
  annDesc: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  
  searchContainer: { paddingHorizontal: 20, marginTop: 24 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 22,
    paddingHorizontal: 16, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '400' },
  
  activeNowBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeNowText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  
  clubFeedList: { paddingHorizontal: 20, gap: 14 },
  clubFeedCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  bannerContainer: { height: 130, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 12,
  },
  bannerClubName: { color: '#fff', fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  cardContentBody: { padding: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  memberText: { fontSize: 13, fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', gap: 6 },
  tagPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '600' },
  clubDescription: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%', maxWidth: 340, borderRadius: 24, borderWidth: 1, padding: 24,
  },
  modalHeader: { alignItems: 'center', marginBottom: 16 },
  modalEmoji: { fontSize: 44, marginBottom: 8 },
  modalTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.3 },
  modalCategory: { fontSize: 13, fontWeight: '600', color: '#8e8e93', marginTop: 2 },
  modalDivider: { height: 1, width: '100%', marginVertical: 14 },
  modalLabel: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  modalDesc: { fontSize: 14, fontWeight: '400', lineHeight: 20, marginBottom: 12 },
  modalValue: { fontSize: 14, fontWeight: '600' },
  closeButton: {
    height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 24,
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

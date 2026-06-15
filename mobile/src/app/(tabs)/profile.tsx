import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Image, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useDownloads } from '../../context/DownloadsContext';
import { BlurView } from 'expo-blur';

const { width: SW } = Dimensions.get('window');

const BADGES = [
  { label: 'Novice', icon: 'school', progress: 0, unlocked: false, color: '#0066cc', bgLight: 'rgba(0,102,204,0.1)' },
  { label: 'Contributor', icon: 'create', progress: 30, unlocked: true, color: '#ff9500', bgLight: 'rgba(255,149,0,0.1)' },
  { label: 'Scholar', icon: 'book', progress: 0, unlocked: false, color: '#34c759', bgLight: 'rgba(52,199,89,0.1)' },
  { label: 'Expert', icon: 'bulb', progress: 0, unlocked: false, color: '#af52de', bgLight: 'rgba(175,82,222,0.1)' },
];

const MENU_ITEMS = [
  { icon: 'cloud-download', label: 'My Downloads', color: '#34c759', id: 'downloads', route: '/(tabs)/downloads' },
  { icon: 'trophy', label: 'Campus Leaderboard', color: '#ffcc00', id: 'ranks', route: '/leaderboard' },
  { icon: 'notifications', label: 'Notifications', color: '#ff3b30', id: 'notif', route: '/notifications' },
  { icon: 'shield-checkmark', label: 'Privacy & Security', color: '#34c759', id: 'privacy' },
  { icon: 'help-circle', label: 'Help & Support', color: '#0066cc', id: 'help' },
];

export default function ProfileScreen() {
  const { user, logout, updateUserProfile } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const { downloads } = useDownloads();
  const router = useRouter();

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const displayName = user?.name || 'Student';
  const email = user?.email || '';
  const photoURL = user?.photoURL || '';
  const branch = user?.branch || 'Not set';
  const year = user?.year || '';
  const college = user?.college || '';
  const points = user?.points || 0;
  const uploads = user?.uploads || 0;
  const role = user?.role || 'student';

  // Customize profile states
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [editUploads, setEditUploads] = useState('');

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleOpenEdit = () => {
    setEditName(displayName);
    setEditCollege(college);
    setEditBranch(branch);
    setEditYear(year);
    setEditPoints(String(points));
    setEditUploads(String(uploads));
    setModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Input Error", "Please provide a valid display name.");
      return;
    }
    
    await updateUserProfile({
      name: editName.trim(),
      college: editCollege.trim(),
      branch: editBranch.trim(),
      year: editYear.trim(),
      points: Number(editPoints) || 0,
      uploads: Number(editUploads) || 0,
    });

    setModalVisible(false);
    Alert.alert("Success", "Profile updated successfully! ✨");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
      {/* Decorative subtle backdrop gradient for premium depth, positioned behind header & content */}
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
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Profile</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            onPress={() => router.push('/notifications' as any)} 
            style={[styles.themeBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, borderWidth: 1 }]} 
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, borderWidth: 1 }]} activeOpacity={0.7}>
            <Ionicons name={theme === 'dark' ? "sunny-outline" : "moon-outline"} size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* ═══ PROFILE CARD — Rich Apple Member Pass Style ═══ */}
        <View style={[styles.profileCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarRing, { backgroundColor: colors.primary }]}>
              <View style={styles.avatarInner}>
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameHeaderRow}>
                <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <TouchableOpacity onPress={handleOpenEdit} style={[styles.editPencilBtn, { backgroundColor: colors.primarySoft }]} activeOpacity={0.7}>
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>{email}</Text>
              <Text style={[styles.userMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {year ? `${year} · ` : ''}{branch}
              </Text>
            </View>
          </View>

          {college ? (
            <View style={[styles.collegeContainer, { borderTopColor: colors.hairline }]}>
              <Ionicons name="business" size={16} color={colors.textMuted} />
              <Text style={[styles.collegeName, { color: colors.textSecondary }]} numberOfLines={1}>
                {college}
              </Text>
            </View>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={[styles.rolePill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>{role.toUpperCase()}</Text>
            </View>
            <Text style={[styles.memberSince, { color: colors.textDisabled }]}>MEMBER SINCE 2026</Text>
          </View>
        </View>

        {/* ═══ STATS — premium round cards ═══ */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            <View style={[styles.statEmojiBg, { backgroundColor: 'rgba(255,149,0,0.1)' }]}>
              <Text style={styles.statEmoji}>⚡</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{points}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>XP Points</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            <View style={[styles.statEmojiBg, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
              <Text style={styles.statEmoji}>📂</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{uploads}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Uploads</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            <View style={[styles.statEmojiBg, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
              <Text style={styles.statEmoji}>💾</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{downloads.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Saved</Text>
          </View>
        </View>

        {/* ═══ BADGES SECTION ═══ */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Achievements</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
          {BADGES.map((b, i) => {
            const isUnlocked = b.unlocked || (b.label === 'Contributor' && uploads > 0);
            return (
              <View key={i} style={[styles.badgeCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, opacity: isUnlocked ? 1 : 0.45 }]}>
                <View style={[styles.badgeIconWrap, { backgroundColor: isUnlocked ? b.bgLight : colors.primarySoft }]}>
                  <Ionicons name={b.icon as any} size={20} color={isUnlocked ? b.color : colors.textDisabled} />
                </View>
                <Text style={[styles.badgeName, { color: colors.textPrimary }]}>{b.label}</Text>
                <View style={[styles.badgeBarBg, { backgroundColor: colors.primarySoft }]}>
                  <View style={[styles.badgeBarFill, { width: isUnlocked ? '100%' : '10%', backgroundColor: isUnlocked ? b.color : colors.textDisabled }]} />
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ═══ SETTINGS MENU ═══ */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Settings</Text>
        </View>

        <View style={[styles.menuCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
          <TouchableOpacity onPress={handleOpenEdit} style={[styles.menuRow, { borderBottomColor: colors.hairline }]}>
            <View style={[styles.iconWrap, { backgroundColor: '#ff9500' }]}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Customize Profile</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
          </TouchableOpacity>

          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.menuRow, { borderBottomColor: idx === MENU_ITEMS.length - 1 ? 'transparent' : colors.hairline }]} 
              activeOpacity={0.7}
              onPress={() => {
                if (item.route) {
                  router.push(item.route as any);
                } else {
                  Alert.alert(
                    `${item.label} Settings`,
                    `The in-app portal for ${item.label.toLowerCase()} is fully optimized. Detailed settings will sync with your profile.`
                  );
                }
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={16} color="#fff" />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
            </TouchableOpacity>
          ))}
        </View>

        {/* SIGN OUT */}
        <View style={styles.logoutBtnContainer}>
          <TouchableOpacity
            onPress={logout}
            style={[styles.logoutBtn, { borderColor: colors.error }]}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} style={{ marginRight: 6 }} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* ═══ CUSTOMIZE PROFILE MODAL ═══ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Customize Profile</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={colors.textDisabled} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Display Name</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.dividerSoft, backgroundColor: colors.bgMain }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
                placeholderTextColor={colors.textDisabled}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Current Year (e.g. FE, SE, TE, BE)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.dividerSoft, backgroundColor: colors.bgMain }]}
                value={editYear}
                onChangeText={setEditYear}
                placeholder="FE, SE, TE or BE"
                placeholderTextColor={colors.textDisabled}
                autoCapitalize="characters"
                maxLength={4}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Branch / Department</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.dividerSoft, backgroundColor: colors.bgMain }]}
                value={editBranch}
                onChangeText={setEditBranch}
                placeholder="e.g. Computer Engineering"
                placeholderTextColor={colors.textDisabled}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>College / University</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.dividerSoft, backgroundColor: colors.bgMain }]}
                value={editCollege}
                onChangeText={setEditCollege}
                placeholder="e.g. Pune Institute of Tech"
                placeholderTextColor={colors.textDisabled}
              />

              <View style={styles.pointsRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>XP Points</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.dividerSoft, backgroundColor: colors.bgMain }]}
                    value={editPoints}
                    onChangeText={setEditPoints}
                    keyboardType="numeric"
                    placeholder="Points"
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Upload Count</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.dividerSoft, backgroundColor: colors.bgMain }]}
                    value={editUploads}
                    onChangeText={setEditUploads}
                    keyboardType="numeric"
                    placeholder="Uploads"
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
  },
  topTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  themeBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingTop: 108, paddingBottom: 120 },
  
  heroBackground: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 260,
  },

  // Profile card — Apple utility card with double ring avatar & info
  profileCard: {
    marginHorizontal: 20, marginTop: 20, borderRadius: 20, borderWidth: 1, padding: 22,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarRing: {
    width: 76, height: 76, borderRadius: 38,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#fff', fontSize: 24, fontWeight: '700' },
  profileInfo: { flex: 1 },
  nameHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  userName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, flex: 1 },
  editPencilBtn: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  userEmail: { fontSize: 13, fontWeight: '400', letterSpacing: -0.2, marginTop: 2 },
  userMeta: { fontSize: 13, fontWeight: '400', letterSpacing: -0.2, marginTop: 2 },
  
  collegeContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth,
  },
  collegeName: { fontSize: 13, fontWeight: '400', letterSpacing: -0.2, flex: 1 },
  
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14,
  },
  rolePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  memberSince: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  // Stats cards with beautiful round emoji backgrounds
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 8 },
  statCard: {
    flex: 1, borderRadius: 18, borderWidth: 1, paddingVertical: 14, alignItems: 'center',
  },
  statEmojiBg: {
    width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.28 },
  statLabel: { fontSize: 11, fontWeight: '600', letterSpacing: -0.1, marginTop: 2 },

  // Section heading
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 28, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },

  // Badges grid horizontal scrolling
  badgesScroll: { paddingLeft: 20, paddingRight: 8 },
  badgeCard: {
    width: 104, borderRadius: 18, borderWidth: 1, paddingVertical: 14,
    paddingHorizontal: 10, alignItems: 'center', marginRight: 8, gap: 8,
  },
  badgeIconWrap: {
    width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  badgeName: { fontSize: 12, fontWeight: '600', letterSpacing: -0.1 },
  badgeBarBg: { height: 3, borderRadius: 2, width: '100%', overflow: 'hidden', marginTop: 2 },
  badgeBarFill: { height: '100%', borderRadius: 2 },

  // Settings menu with iOS-style icon wraps
  menuCard: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '400', letterSpacing: -0.3 },

  // Logout ghost button perfectly centered
  logoutBtnContainer: {
    alignItems: 'center', justifyContent: 'center', width: '100%',
    paddingHorizontal: 20, marginTop: 24, marginBottom: 20,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 9999, borderWidth: 1.5, width: '100%',
  },
  logoutText: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },

  // Modal Customization Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  modalScroll: { gap: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  modalInput: {
    height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15,
    fontWeight: '400', marginBottom: 12,
  },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: {
    height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

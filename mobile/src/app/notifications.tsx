import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'news' | 'update' | 'alert' | 'info';
  createdAt: string;
  read: boolean;
  targetRoute?: string;
  pinned?: boolean;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  news: { icon: 'newspaper-outline', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', label: 'News' },
  update: { icon: 'arrow-up-circle-outline', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Update' },
  alert: { icon: 'warning-outline', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', label: 'Alert' },
  info: { icon: 'information-circle-outline', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', label: 'Info' },
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

export default function NotificationsScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();

  const scrollY = React.useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AsyncStorage persistent states
  const [readIds, setReadIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const loadLocalStates = async () => {
    try {
      const [savedRead, savedPinned, savedDeleted] = await Promise.all([
        AsyncStorage.getItem('sutras_read_notifications'),
        AsyncStorage.getItem('sutras_pinned_notifications'),
        AsyncStorage.getItem('sutras_deleted_notifications'),
      ]);
      if (savedRead) setReadIds(JSON.parse(savedRead));
      if (savedPinned) setPinnedIds(JSON.parse(savedPinned));
      if (savedDeleted) setDeletedIds(JSON.parse(savedDeleted));
    } catch (err) {
      console.error('Error loading AsyncStorage states:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const currentUser = auth.currentUser;
      const userUid = currentUser ? currentUser.uid : '';
      const userEmail = currentUser ? currentUser.email : '';

      // Run parallel query lookups targeting global, uid-specific, and email-specific notifications.
      // This complies with Firestore rules and avoids composite index requirements.
      const [globalSnap, privateSnap, emailSnap] = await Promise.all([
        getDocs(query(collection(db, 'notifications'), where('recipientId', '==', 'global'), limit(50))),
        userUid ? getDocs(query(collection(db, 'notifications'), where('recipientId', '==', userUid), limit(50))) : Promise.resolve({ docs: [] }),
        userEmail ? getDocs(query(collection(db, 'notifications'), where('recipientEmail', '==', userEmail), limit(50))) : Promise.resolve({ docs: [] })
      ]);

      const combinedDocs = [
        ...globalSnap.docs,
        ...((privateSnap && privateSnap.docs) || []),
        ...((emailSnap && emailSnap.docs) || [])
      ];

      // De-duplicate documents by ID
      const seenIds = new Set<string>();
      const uniqueDocs = combinedDocs.filter(doc => {
        if (seenIds.has(doc.id)) return false;
        seenIds.add(doc.id);
        return true;
      });

      const data: Notification[] = uniqueDocs.map(doc => {
        const d = doc.data();
        let dateVal = '';
        if (d.timestamp) {
          dateVal = d.timestamp.toDate ? d.timestamp.toDate().toISOString() : new Date(d.timestamp).toISOString();
        }
        return {
          id: doc.id,
          title: d.title || 'Notification',
          body: d.body || '',
          type: d.type || 'info',
          targetRoute: d.targetRoute || '',
          createdAt: dateVal,
          read: false,
        };
      });

      // Sort combined results by timestamp descending
      data.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadLocalStates(), fetchNotifications()]).finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const togglePin = async (id: string) => {
    try {
      let updatedPinned;
      if (pinnedIds.includes(id)) {
        updatedPinned = pinnedIds.filter(x => x !== id);
      } else {
        updatedPinned = [...pinnedIds, id];
      }
      setPinnedIds(updatedPinned);
      await AsyncStorage.setItem('sutras_pinned_notifications', JSON.stringify(updatedPinned));
    } catch (err) {
      console.error('Error saving pinned state:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const updatedDeleted = [...deletedIds, id];
      setDeletedIds(updatedDeleted);
      await AsyncStorage.setItem('sutras_deleted_notifications', JSON.stringify(updatedDeleted));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const markAsRead = async (id: string) => {
    if (readIds.includes(id)) return;
    try {
      const updatedRead = [...readIds, id];
      setReadIds(updatedRead);
      await AsyncStorage.setItem('sutras_read_notifications', JSON.stringify(updatedRead));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const allIds = notifications.map(n => n.id);
      const uniqueRead = Array.from(new Set([...readIds, ...allIds]));
      setReadIds(uniqueRead);
      await AsyncStorage.setItem('sutras_read_notifications', JSON.stringify(uniqueRead));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotifPress = async (notif: Notification) => {
    await markAsRead(notif.id);
    if (notif.targetRoute) {
      try {
        router.push(notif.targetRoute as any);
      } catch (err) {
        console.error('Navigation failed:', err);
      }
    }
  };

  // Filter out deleted items, map unread/pinned flags, and sort pinned items to the top
  const processedNotifications = notifications
    .filter(n => !deletedIds.includes(n.id))
    .map(n => ({
      ...n,
      read: readIds.includes(n.id),
      pinned: pinnedIds.includes(n.id)
    }))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  const unreadCount = processedNotifications.filter(n => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
      {/* ═══ TOP BAR ═══ */}
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
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCard }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.appTitle, { color: colors.textPrimary }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : processedNotifications.length === 0 ? (
        /* ═══ EMPTY STATE ═══ */
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.bgCard }]}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Notifications Yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            When there are campus updates, study materials, or alerts, they'll appear here.
          </Text>
          <TouchableOpacity onPress={onRefresh} style={[styles.refreshBtn, { borderColor: colors.border }]}>
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={[styles.refreshBtnText, { color: colors.primary }]}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Unread count and mark all read */}
          {unreadCount > 0 && (
            <View style={styles.topInfoRow}>
              <Text style={[styles.topInfoText, { color: colors.textMuted }]}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
              </TouchableOpacity>
            </View>
          )}

          {processedNotifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
            return (
              <View
                key={notif.id}
                style={[
                  styles.notifCard,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                  !notif.read && { borderLeftWidth: 3, borderLeftColor: cfg.color },
                  notif.pinned && { borderLeftWidth: 3, borderLeftColor: '#eab308' }
                ]}
              >
                <View style={styles.notifRow}>
                  {/* Left Column - Main Details (Pressable to deep link) */}
                  <TouchableOpacity
                    style={styles.notifMainContent}
                    onPress={() => handleNotifPress(notif)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notifMainRow}>
                      <View style={[styles.notifIconWrap, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.notifTitleRow}>
                          <Text
                            style={[
                              styles.notifTitle,
                              { color: colors.textPrimary },
                              !notif.read && { fontWeight: '900' }
                            ]}
                            numberOfLines={1}
                          >
                            {notif.title}
                          </Text>
                          {notif.pinned && (
                            <Ionicons name="pin" size={12} color="#eab308" style={{ marginLeft: 4 }} />
                          )}
                          {!notif.read && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}
                        </View>
                        {notif.body ? (
                          <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>{notif.body}</Text>
                        ) : null}
                        <View style={styles.notifFooter}>
                          <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.typePillText, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
                          {notif.createdAt ? (
                            <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeAgo(notif.createdAt)}</Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Right Column - Client Quick Controls */}
                  <View style={[styles.notifActions, { borderLeftColor: colors.dividerSoft }]}>
                    <TouchableOpacity onPress={() => togglePin(notif.id)} style={styles.actionBtn}>
                      <Ionicons
                        name={notif.pinned ? "pin" : "pin-outline"}
                        size={16}
                        color={notif.pinned ? "#eab308" : colors.textMuted}
                      />
                    </TouchableOpacity>
                    {!notif.read && (
                      <TouchableOpacity onPress={() => markAsRead(notif.id)} style={styles.actionBtn}>
                        <Ionicons name="checkmark-done" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => deleteNotification(notif.id)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAppBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  appTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  unreadBadge: { minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingTop: 108, paddingBottom: 40 },

  // Empty state
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 120 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyDesc: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  refreshBtnText: { fontSize: 13, fontWeight: '700' },

  // Top info
  topInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  topInfoText: { fontSize: 12, fontWeight: '600' },
  markAllText: { fontSize: 12, fontWeight: '700' },

  // Notification card
  notifCard: {
    marginHorizontal: 20, marginBottom: 8, borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  notifRow: { flexDirection: 'row', padding: 14, alignItems: 'center' },
  notifMainContent: { flex: 1 },
  notifMainRow: { flexDirection: 'row' },
  notifIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  notifTitle: { fontSize: 14, fontWeight: '700', flexShrink: 1, marginRight: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  notifBody: { fontSize: 12, fontWeight: '500', lineHeight: 17, marginTop: 4 },
  notifFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typePillText: { fontSize: 9, fontWeight: '800' },
  timeText: { fontSize: 10, fontWeight: '600' },

  // Quick Controls Column
  notifActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: StyleSheet.hairlineWidth,
    minHeight: 60,
  },
  actionBtn: { padding: 4, marginVertical: 2 },
});

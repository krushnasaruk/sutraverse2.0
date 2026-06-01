import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform, Animated } from 'react-native';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

const { width: SW } = Dimensions.get('window');

const getTypeMeta = (type: string) => {
  switch(type) {
    case 'Academic': return { color: '#0066cc', icon: 'school-outline', tag: 'Academic' };
    case 'Event': return { color: '#af52de', icon: 'calendar-outline', tag: 'Event' };
    case 'Urgent': return { color: '#ff3b30', icon: 'warning-outline', tag: 'Urgent' };
    default: return { color: '#34c759', icon: 'newspaper-outline', tag: type || 'Notice' };
  }
};

export default function NewsScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter approved or general news
        const approved = data.filter((n: any) => !n.status || n.status === 'approved');
        setNotices(approved);
      } catch (err) {
        console.error("Error fetching news:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
      {/* HEADER */}
      <View style={styles.topHeader}>
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
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notice Board</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* SCROLLING NOTICES */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listScroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Text style={[styles.headline, { color: colors.textPrimary }]}>Campus Circulars</Text>
        <Text style={[styles.subhead, { color: colors.textMuted }]}>
          Official college notifications and examination alerts.
        </Text>

        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : notices.length === 0 ? (
            <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 40 }}>No campus notices right now.</Text>
          ) : (
            notices.map(item => {
              const meta = getTypeMeta(item.type);
              const dateObj = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp || Date.now());
              const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <View 
                  key={item.id} 
                  style={[
                    styles.noticeCard, 
                    { 
                      backgroundColor: colors.bgCard, 
                      borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : colors.dividerSoft 
                    }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: meta.color + '12' }]}>
                      <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                    </View>
                    <View style={styles.headerText}>
                      <View style={[styles.tagPill, { backgroundColor: meta.color + '12' }]}>
                        <Text style={[styles.tagText, { color: meta.color }]}>{meta.tag}</Text>
                      </View>
                      <Text style={[styles.dateText, { color: colors.textMuted }]}>{dateStr}</Text>
                    </View>
                  </View>

                  <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  
                  <Text style={[styles.noticeDesc, { color: colors.textSecondary }]}>
                    {item.content || item.desc}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  listScroll: {
    paddingHorizontal: 20,
    paddingTop: 108,
    paddingBottom: 40,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subhead: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 25,
  },
  listContainer: {
    gap: 16,
  },
  noticeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 22,
    marginBottom: 8,
  },
  noticeDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});

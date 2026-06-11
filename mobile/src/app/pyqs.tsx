import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Share, ActivityIndicator, Dimensions, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { getAllSubjects } from '../lib/subjectMap';

const { width: SW } = Dimensions.get('window');

interface PYQFile {
  id: string;
  title: string;
  subject: string;
  year?: string;
  pattern?: string;
  size?: string;
  downloads?: number;
  rating?: number;
  fileURL?: string;
  fileUrl?: string;
}

export default function PYQScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const [loading, setLoading] = useState(true);
  const [pyqs, setPyqs] = useState<PYQFile[]>([]);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchPyqs = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'files'),
          where('type', '==', 'PYQ'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        
        const data = snap.docs.map(d => {
          const f = d.data();
          return { id: d.id, ...f } as PYQFile;
        });
        
        setPyqs(data);
        
        // Auto-select first subject if exists
        const validSubjects = getAllSubjects();
        const subjects = [...new Set(data.map(d => d.subject?.trim() || 'Other'))].filter(s => validSubjects.includes(s)).sort();
        if (subjects.length > 0) setActiveSubject(subjects[0]);
      } catch (error) {
        console.warn('Error fetching pyqs:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPyqs();
    return () => { cancelled = true; };
  }, []);

  const subjectsList = useMemo(() => {
    const validSubjects = getAllSubjects();
    return [...new Set(pyqs.map(p => p.subject?.trim() || 'Other'))]
           .filter(s => validSubjects.includes(s))
           .sort();
  }, [pyqs]);

  const activePapers = useMemo(() => {
    if (!activeSubject) return [];
    return pyqs.filter(p => (p.subject?.trim() || 'Other') === activeSubject);
  }, [pyqs, activeSubject]);

  const handleDownload = (id: string) => {
    router.push(`/file-detail/${id}`);
  };

  const handleShare = async (title: string) => {
    try {
      await Share.share({
        message: `Sutraverse Study Center: Sharing academic resource: ${title}`,
        title: title,
      });
    } catch (err: any) {
      console.warn('Share error:', err.message);
    }
  };

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>PYQ Vault</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : pyqs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={48} color={colors.textDisabled} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No PYQs available yet.</Text>
        </View>
      ) : (
        <>
          {/* HORIZONTAL SUBJECT BAR */}
          <View style={styles.selectorContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
              {subjectsList.map(subj => {
                const isActive = subj === activeSubject;
                return (
                  <TouchableOpacity
                    key={subj}
                    onPress={() => setActiveSubject(subj)}
                    style={[
                      styles.subjectTab,
                      { 
                        backgroundColor: isActive ? colors.primary : colors.bgCard,
                        borderColor: isActive ? colors.primary : colors.dividerSoft
                      }
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text 
                      style={[
                        styles.subjectTabText, 
                        { 
                          color: isActive ? '#ffffff' : colors.textPrimary,
                          fontWeight: isActive ? '700' : '600'
                        }
                      ]}
                    >
                      {subj.replace('Engineering ', '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* LIST OF PAPERS */}
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listScroll}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            <Text style={[styles.subjectHeadline, { color: colors.textPrimary }]}>
              {activeSubject}
            </Text>
            <Text style={[styles.subjectSubhead, { color: colors.textMuted }]}>
              {activePapers.length} Question Papers
            </Text>

            <View style={styles.listContainer}>
              {activePapers.map(paper => (
                <View 
                  key={paper.id} 
                  style={[
                    styles.paperCard, 
                    { 
                      backgroundColor: colors.bgCard, 
                      borderColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.08)' : colors.dividerSoft 
                    }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                      <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={[styles.paperTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {paper.title}
                      </Text>
                      <View style={styles.tagRow}>
                        <View style={[styles.tagPill, { backgroundColor: colors.primary + '12' }]}>
                          <Text style={[styles.tagText, { color: colors.primary }]}>{paper.pattern || '2019 Pattern'}</Text>
                        </View>
                        {paper.downloads !== undefined && (
                          <Text style={[styles.sizeText, { color: colors.textMuted }]}>↓ {paper.downloads} downloads</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.cardDivider, { backgroundColor: colors.dividerSoft }]} />

                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      onPress={() => handleShare(paper.title)} 
                      style={[styles.actionBtn, { borderColor: colors.dividerSoft, borderWidth: 1 }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="share-social-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => handleDownload(paper.id)} 
                      style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="cloud-download-outline" size={16} color="#ffffff" />
                      <Text style={styles.downloadBtnText}>Get PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </Animated.ScrollView>
        </>
      )}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  selectorContainer: {
    marginTop: 113,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  selectorScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  subjectTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  subjectTabText: {
    fontSize: 13,
  },
  listScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  subjectHeadline: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subjectSubhead: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
  },
  listContainer: {
    gap: 16,
  },
  paperCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardMeta: {
    flex: 1,
  },
  paperTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sizeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    marginVertical: 14,
    opacity: 0.6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  downloadBtn: {
    flex: 1.2,
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});


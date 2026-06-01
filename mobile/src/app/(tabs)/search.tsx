import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';
import { useDownloads } from '../../context/DownloadsContext';
import { BlurView } from 'expo-blur';

const { width: SW } = Dimensions.get('window');

const SECTIONS = [
  { key: 'notes', label: 'Notes', desc: 'Lecture notes & summaries', icon: 'document-text', filter: 'Notes', color: '#0066cc', bgLight: 'rgba(0,102,204,0.1)' },
  { key: 'pyq', label: 'PYQ Vault', desc: 'Past year questions', icon: 'help-circle', filter: 'PYQ', color: '#ff9500', bgLight: 'rgba(255,149,0,0.1)' },
  { key: 'assignment', label: 'Assignments', desc: 'Solutions & lab manuals', icon: 'clipboard', filter: 'Assignment', color: '#34c759', bgLight: 'rgba(52,199,89,0.1)' },
];

const getTypeColor = (t: string) => t==='Notes'?'#0066cc':t==='PYQ'?'#ff9500':'#34c759';

export default function SearchScreen() {
  const { colors, theme } = useTheme();
  const { isDownloaded } = useDownloads();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'files'), where('status', '==', 'approved'));
        const snap = await getDocs(q);
        setAllFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.warn('Error fetching all files:', err);
        setAllFiles([]);
      } finally { setLoading(false); }
    })();
  }, []);

  const secMeta = SECTIONS.find(s => s.key === activeSection);
  const sectionFiles = useMemo(() => {
    if (!activeSection) return allFiles;
    return allFiles.filter(f => f.type === secMeta?.filter);
  }, [allFiles, activeSection, secMeta]);

  const subjects = useMemo(() => {
    const m: Record<string,{count:number;downloads:number}> = {};
    sectionFiles.forEach(f => {
      const s = f.subject?.trim()||'Other';
      if (!m[s]) m[s]={count:0,downloads:0};
      m[s].count++; m[s].downloads += f.downloads||0;
    });
    return Object.entries(m).map(([name,d])=>({name,...d})).sort((a,b)=>b.count-a.count);
  }, [sectionFiles]);

  const drillFiles = useMemo(() => {
    if (!activeSubject) return [];
    let files = sectionFiles.filter(f => (f.subject?.trim()||'Other') === activeSubject);
    if (searchQuery) files = files.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return files;
  }, [sectionFiles, activeSubject, searchQuery]);

  const goBack = () => {
    if (activeSubject) { setActiveSubject(null); setSearchQuery(''); }
    else if (activeSection) setActiveSection(null);
  };

  const pageTitle = activeSubject ? activeSubject : activeSection ? secMeta?.label||'Library' : 'Library';

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
      {/* Dynamic background mesh matching index.tsx */}
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
        {(activeSection||activeSubject) ? (
          <TouchableOpacity onPress={goBack} style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, borderWidth: 1 }]}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : <View style={{width:44}} />}
        <Text style={[styles.topTitle, { color: colors.textPrimary }]} numberOfLines={1}>{pageTitle}</Text>
        <View style={{width:44}} />
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 108, paddingBottom: 100 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >

          {/* ═══ LEVEL 1: LANDING ═══ */}
          {!activeSection && !activeSubject && (<>
            {/* Search — Apple pill */}
            <View style={styles.searchWrap}>
              <View style={[styles.searchBar, {
                backgroundColor: searchFocused ? colors.canvas : colors.bgCard,
                borderColor: searchFocused ? colors.hairline : colors.dividerSoft,
              }]}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Search all files..."
                  placeholderTextColor={colors.textDisabled}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {searchQuery.length>0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textDisabled}/>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Search results */}
            {searchQuery.trim().length>0 ? (
              <View style={{paddingHorizontal:20}}>
                <Text style={[styles.resultLabel, { color: colors.textMuted }]}>
                  {allFiles.filter(f=>f.title.toLowerCase().includes(searchQuery.toLowerCase())).length} results
                </Text>
                {allFiles.filter(f=>f.title.toLowerCase().includes(searchQuery.toLowerCase())).map(file => (
                  <TouchableOpacity key={file.id} activeOpacity={0.85}
                    onPress={() => router.push(`/file-detail/${file.id}` as any)}
                    style={[styles.fileRow, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
                    <View style={[styles.fileIcon, { backgroundColor: getTypeColor(file.type) + '12' }]}>
                      <Ionicons name="document-text" size={18} color={getTypeColor(file.type)} />
                    </View>
                    <View style={{flex:1}}>
                      <Text style={[styles.fileTitle, { color: colors.textPrimary }]} numberOfLines={1}>{file.title}</Text>
                      <Text style={[styles.fileMeta, { color: colors.textMuted }]}>{file.subject} · {file.uploader}</Text>
                    </View>
                    {isDownloaded(file.id) && (
                      <View style={[styles.offlineDot, { backgroundColor: colors.successSoft }]}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (<>
              {/* Section cards — rich colored icons */}
              <View style={styles.sectionList}>
                {SECTIONS.map(sec => {
                  const count = allFiles.filter(f => f.type === sec.filter).length;
                  return (
                    <TouchableOpacity key={sec.key} activeOpacity={0.85} onPress={() => setActiveSection(sec.key)}
                      style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
                      <View style={[styles.sectionIconBox, { backgroundColor: sec.bgLight }]}>
                        <Ionicons name={sec.icon as any} size={22} color={sec.color} />
                      </View>
                      <View style={{flex:1}}>
                        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>{sec.label}</Text>
                        <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>{sec.desc}</Text>
                      </View>
                      <View style={styles.sectionRight}>
                        <View style={[styles.countBadge, { backgroundColor: sec.bgLight }]}>
                          <Text style={[styles.countBadgeText, { color: sec.color }]}>{count}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                {[
                  {v:allFiles.length, l:'Files'},
                  {v:subjects.length, l:'Subjects'},
                  {v:allFiles.reduce((s,f)=>s+(f.downloads||0),0), l:'Downloads'},
                ].map((s,i) => (
                  <View key={i} style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
                    <Text style={[styles.statVal, { color: colors.textPrimary }]}>{s.v}</Text>
                    <Text style={[styles.statLbl, { color: colors.textMuted }]}>{s.l}</Text>
                  </View>
                ))}
              </View>

              {/* Recent */}
              {allFiles.length > 0 && (<>
                <View style={styles.secHeader}>
                  <Text style={[styles.secHeadTitle, { color: colors.textPrimary }]}>Recently added</Text>
                </View>
                {allFiles.slice(0,3).map(file => (
                  <TouchableOpacity key={file.id} activeOpacity={0.85}
                    onPress={() => router.push(`/file-detail/${file.id}` as any)}
                    style={[styles.fileRow, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, marginHorizontal: 20 }]}>
                    <View style={[styles.fileIcon, { backgroundColor: colors.bgMain }]}>
                      <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
                    </View>
                    <View style={{flex:1}}>
                      <Text style={[styles.fileTitle, { color: colors.textPrimary }]} numberOfLines={1}>{file.title}</Text>
                      <Text style={[styles.fileMeta, { color: colors.textMuted }]}>{file.subject} · {file.uploader}</Text>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                      <Text style={[styles.fileMeta, { color: colors.textSecondary }]}>★ {file.rating||'—'}</Text>
                      <Text style={[styles.fileMeta, { color: colors.textMuted }]}>↓{file.downloads||0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>)}
            </>)}
          </>)}

          {/* ═══ LEVEL 2: SUBJECT GRID ═══ */}
          {activeSection && !activeSubject && (<>
            <View style={[styles.secBanner, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
              <View style={[styles.secBannerIcon, { backgroundColor: colors.bgMain }]}>
                <Ionicons name={secMeta!.icon as any} size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.secBannerTitle, { color: colors.textPrimary }]}>{secMeta!.label}</Text>
                <Text style={[styles.secBannerSub, { color: colors.textMuted }]}>
                  {sectionFiles.length} files · {subjects.length} subjects
                </Text>
              </View>
            </View>

            {subjects.length === 0 ? (
              <View style={styles.empty}><Ionicons name="folder-open-outline" size={40} color={colors.textDisabled}/><Text style={[styles.emptyText, { color: colors.textMuted }]}>No files yet</Text></View>
            ) : (
              <View style={styles.subjectList}>
                {subjects.map(subj => (
                  <TouchableOpacity key={subj.name} activeOpacity={0.85} onPress={() => setActiveSubject(subj.name)}
                    style={[styles.subjCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
                    <View style={{flex:1}}>
                      <Text style={[styles.subjName, { color: colors.textPrimary }]} numberOfLines={1}>{subj.name}</Text>
                      <Text style={[styles.subjStat, { color: colors.textMuted }]}>{subj.count} files · {subj.downloads} downloads</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>)}

          {/* ═══ LEVEL 3: FILE LIST ═══ */}
          {activeSubject && (<>
            <View style={styles.breadcrumb}>
              <TouchableOpacity onPress={() => {setActiveSection(null);setActiveSubject(null);}}>
                <Text style={[styles.breadLink, { color: colors.primary }]}>Library</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={12} color={colors.textDisabled} style={{marginHorizontal:4}} />
              <TouchableOpacity onPress={() => setActiveSubject(null)}>
                <Text style={[styles.breadLink, { color: colors.primary }]}>{secMeta?.label}</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={12} color={colors.textDisabled} style={{marginHorizontal:4}} />
              <Text style={[styles.breadCur, { color: colors.textMuted }]} numberOfLines={1}>{activeSubject}</Text>
            </View>

            <View style={{paddingHorizontal:20, paddingTop:8}}>
              <View style={[styles.searchBar, {
                backgroundColor: searchFocused ? colors.canvas : colors.bgCard,
                borderColor: searchFocused ? colors.hairline : colors.dividerSoft,
              }]}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder={`Search in ${activeSubject}...`}
                  placeholderTextColor={colors.textDisabled}
                  value={searchQuery} onChangeText={setSearchQuery}
                  onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
              </View>
            </View>

            <Text style={[styles.resultLabel, { color: colors.textMuted, paddingHorizontal:20 }]}>{drillFiles.length} files</Text>

            {drillFiles.length === 0 ? (
              <View style={styles.empty}><Ionicons name="search-outline" size={40} color={colors.textDisabled}/><Text style={[styles.emptyText, { color: colors.textMuted }]}>No files found</Text></View>
            ) : (
              <View style={{paddingHorizontal:20}}>
                {drillFiles.map(file => (
                  <TouchableOpacity key={file.id} activeOpacity={0.85}
                    onPress={() => router.push(`/file-detail/${file.id}` as any)}
                    style={[styles.fileRow, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
                    <View style={[styles.fileIcon, { backgroundColor: colors.bgMain }]}>
                      <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
                    </View>
                    <View style={{flex:1}}>
                      <Text style={[styles.fileTitle, { color: colors.textPrimary }]} numberOfLines={1}>{file.title}</Text>
                      <Text style={[styles.fileMeta, { color: colors.textMuted }]}>{file.uploader||'Admin'} · {file.year||'FE'}</Text>
                    </View>
                    <View style={{alignItems:'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6}}>
                      {isDownloaded(file.id) && (
                        <View style={[styles.offlineDot, { backgroundColor: colors.successSoft }]}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                        </View>
                      )}
                      <View style={{alignItems:'flex-end'}}>
                        <Text style={[styles.fileMeta, { color: colors.textSecondary }]}>★ {file.rating||'—'}</Text>
                        <Text style={[styles.fileMeta, { color: colors.textMuted }]}>↓{file.downloads||0}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>)}
        </Animated.ScrollView>
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
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingTop:56, paddingHorizontal:20, paddingBottom:12,
  },
  backBtn: { width:34, height:34, borderRadius:17, justifyContent:'center', alignItems:'center' },
  topTitle: { fontSize:21, fontWeight:'700', flex:1, textAlign:'center', letterSpacing:-0.3 },
  loader: { flex:1, justifyContent:'center', alignItems:'center' },

  // Search — Apple pill
  searchWrap: { paddingHorizontal:20, paddingTop:16 },
  searchBar: {
    flexDirection:'row', alignItems:'center', height:44, borderRadius:9999,
    paddingHorizontal:14, borderWidth:1, gap:8,
  },
  searchInput: { flex:1, fontSize:17, fontWeight:'400', letterSpacing:-0.374 },

  // Section cards — Apple store utility
  sectionList: { paddingHorizontal:20, marginTop:24, gap:8 },
  sectionCard: {
    flexDirection:'row', alignItems:'center', borderRadius:18,
    borderWidth:1, padding:16, gap:14,
  },
  sectionIconBox: { width:48, height:48, borderRadius:12, justifyContent:'center', alignItems:'center' },
  sectionLabel: { fontSize:17, fontWeight:'600', letterSpacing:-0.374 },
  sectionDesc: { fontSize:14, fontWeight:'400', letterSpacing:-0.224, marginTop:2 },
  sectionRight: { flexDirection:'row', alignItems:'center', gap:8 },
  sectionCount: { fontSize:17, fontWeight:'400', letterSpacing:-0.374 },
  countBadge: { paddingHorizontal:10, paddingVertical:4, borderRadius:10 },
  countBadgeText: { fontSize:14, fontWeight:'700' },

  // Stats
  statsRow: { flexDirection:'row', paddingHorizontal:16, marginTop:20, gap:8 },
  statCard: { flex:1, borderRadius:18, borderWidth:1, paddingVertical:18, alignItems:'center' },
  statVal: { fontSize:22, fontWeight:'600', letterSpacing:-0.28 },
  statLbl: { fontSize:12, fontWeight:'400', letterSpacing:-0.12, marginTop:4 },

  // Section header
  secHeader: { paddingHorizontal:20, marginTop:32, marginBottom:12 },
  secHeadTitle: { fontSize:21, fontWeight:'600', letterSpacing:0.231 },

  // Section banner
  secBanner: { marginHorizontal:20, marginTop:16, borderRadius:18, borderWidth:1, padding:20, flexDirection:'row', alignItems:'center', gap:14 },
  secBannerIcon: { width:48, height:48, borderRadius:12, justifyContent:'center', alignItems:'center' },
  secBannerTitle: { fontSize:21, fontWeight:'600', letterSpacing:0.231 },
  secBannerSub: { fontSize:14, fontWeight:'400', letterSpacing:-0.224, marginTop:3 },

  // Subject list
  subjectList: { paddingHorizontal:20, marginTop:16, gap:6 },
  subjCard: { flexDirection:'row', alignItems:'center', borderRadius:18, borderWidth:1, padding:16 },
  subjName: { fontSize:17, fontWeight:'600', letterSpacing:-0.374 },
  subjStat: { fontSize:14, fontWeight:'400', letterSpacing:-0.224, marginTop:3 },

  // File rows — Apple utility row with hairline
  fileRow: { flexDirection:'row', borderRadius:18, borderWidth:1, marginBottom:6, padding:14, alignItems:'center', gap:12 },
  fileIcon: { width:44, height:44, borderRadius:12, justifyContent:'center', alignItems:'center' },
  fileTitle: { fontSize:17, fontWeight:'600', letterSpacing:-0.374, marginBottom:2 },
  fileMeta: { fontSize:14, fontWeight:'400', letterSpacing:-0.224 },

  // Breadcrumb
  breadcrumb: { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:14, paddingBottom:4, flexWrap:'wrap' },
  breadLink: { fontSize:14, fontWeight:'400', letterSpacing:-0.224 },
  breadCur: { fontSize:14, fontWeight:'400', letterSpacing:-0.224, flexShrink:1 },

  // Result label
  resultLabel: { fontSize:14, fontWeight:'400', letterSpacing:-0.224, marginTop:14, marginBottom:12 },

  // Empty
  empty: { alignItems:'center', paddingVertical:48 },
  emptyText: { fontSize:17, fontWeight:'400', letterSpacing:-0.374, marginTop:12 },

  // Offline dot
  offlineDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});

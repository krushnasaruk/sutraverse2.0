import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, TextInput, ActivityIndicator, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BlurView } from 'expo-blur';

const { width: SW } = Dimensions.get('window');

export default function ExamModeScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const userYear = user?.year || 'TE';
  const userBranch = user?.branch || 'Computer';

  // Active sub-mode: 'flashcards' | 'calendar' | 'mock'
  const [activeTab, setActiveTab] = useState<'flashcards' | 'calendar' | 'mock'>('flashcards');

  // Global AI State
  const [topicInput, setTopicInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic Data States
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [studyPlan, setStudyPlan] = useState<any[]>([]);
  const [mockQuestions, setMockQuestions] = useState<any[]>([]);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerateGuide = async () => {
    if (!topicInput.trim()) {
      Alert.alert("Input Required", "Enter a study unit or topic to generate AI study materials.");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch('https://sutraverse.co.in/api/generate-study-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: userYear,
          branch: userBranch,
          subject: topicInput
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate study guide');
      
      if (data.flashcards) setFlashcards(data.flashcards);
      
      if (data.summaries) {
        setStudyPlan(data.summaries.map((s: any, idx: number) => ({
          id: String(idx),
          title: s.title,
          unit: s.unit,
          points: s.points || [],
          done: false
        })));
      }
      
      if (data.questions) setMockQuestions(data.questions);
      
      setCardIndex(0);
      setIsFlipped(false);
      
      Alert.alert("Study Guide Ready! 🧠", "Your flashcards, study plan, and mock test are generated.");
    } catch (err: any) {
      console.warn("AI Gen Error:", err);
      Alert.alert("Generation Failed", err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Flashcard controls
  const currentCard = flashcards.length > 0 ? flashcards[cardIndex] : null;
  
  const handleNextCard = () => {
    if (!flashcards.length) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCardIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrevCard = () => {
    if (!flashcards.length) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const toggleCheck = (id: string) => {
    setStudyPlan(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
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
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Study Room</Text>
          <View style={styles.statusBadge}>
            <View style={styles.dot} />
            <Text style={styles.statusText}>AI Active</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* TOP NAVIGATION TABS */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.dividerSoft, marginTop: 113 }]}>
        <TouchableOpacity 
          onPress={() => setActiveTab('flashcards')} 
          style={[styles.tabItem, activeTab === 'flashcards' && { borderBottomColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="layers-outline" size={18} color={activeTab === 'flashcards' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabLabel, { color: activeTab === 'flashcards' ? colors.primary : colors.textMuted }]}>Flashcards</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTab('calendar')} 
          style={[styles.tabItem, activeTab === 'calendar' && { borderBottomColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color={activeTab === 'calendar' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabLabel, { color: activeTab === 'calendar' ? colors.primary : colors.textMuted }]}>Study Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTab('mock')} 
          style={[styles.tabItem, activeTab === 'mock' && { borderBottomColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color={activeTab === 'mock' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabLabel, { color: activeTab === 'mock' ? colors.primary : colors.textMuted }]}>Mock Test</Text>
        </TouchableOpacity>
      </View>

      {/* MASTER INPUT PANEL */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }}>
        <View style={[styles.inputBox, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
          <TextInput
            style={[styles.textInput, { color: colors.textPrimary }]}
            placeholder="Enter a subject (e.g. Operating Systems)"
            placeholderTextColor={colors.textMuted}
            value={topicInput}
            onChangeText={setTopicInput}
          />
          <TouchableOpacity 
            onPress={handleGenerateGuide} 
            style={[styles.genBtn, { backgroundColor: colors.primary }]}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
               <ActivityIndicator size="small" color="#fff" />
            ) : (
               <Text style={styles.genBtnText}>Generate</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* SCREEN SCROLL CONTROLLER */}
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* TAB 1: FLASHCARDS */}
        {activeTab === 'flashcards' && (
          <View style={styles.flashContainer}>
            <Text style={[styles.subTitle, { color: colors.textPrimary }]}>Active Sutra Cards</Text>
            <Text style={[styles.descText, { color: colors.textMuted }]}>
              Tap the card deck to reveal the exact mathematical formulas or theorem solutions.
            </Text>

            {flashcards.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="layers-outline" size={48} color={colors.textDisabled} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Enter a topic above to generate flashcards.</Text>
              </View>
            ) : (
              <>
                {/* FLIPPING CARD */}
                <TouchableOpacity 
                  activeOpacity={0.95} 
                  onPress={() => setIsFlipped(!isFlipped)}
                  style={styles.cardTouch}
                >
                  <LinearGradient
                    colors={isFlipped ? ['#0e1b2f', '#091526'] : ['#1d2433', '#111722']}
                    style={[styles.flashCard, { borderColor: isFlipped ? colors.primary : 'rgba(255,255,255,0.08)' }]}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.subjectBadge}>SUTRAVERSE AI</Text>
                      <Text style={styles.cardProgress}>{cardIndex + 1} / {flashcards.length}</Text>
                    </View>

                    <View style={styles.cardBody}>
                      {isFlipped ? (
                        <ScrollView contentContainerStyle={styles.contentWrap}>
                          <Text style={styles.formulaTitle}>DEFINITION 💡</Text>
                          <Text style={styles.formulaText}>{currentCard?.definition}</Text>
                        </ScrollView>
                      ) : (
                        <View style={styles.contentWrap}>
                          <Text style={styles.questionTitle}>EXAM TERM ❓</Text>
                          <Text style={styles.questionText}>{currentCard?.term}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <Ionicons name="sync-outline" size={14} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.tapPrompt}>Tap Card to Flip</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* CONTROLS */}
                <View style={styles.controlsRow}>
                  <TouchableOpacity onPress={handlePrevCard} style={[styles.circleBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
                    <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => setIsFlipped(!isFlipped)} 
                    style={[styles.flipBtn, { backgroundColor: colors.primary }]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.flipBtnText}>Reveal Answer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleNextCard} style={[styles.circleBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
                    <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* TAB 2: STUDY PLAN */}
        {activeTab === 'calendar' && (
          <View style={styles.planContainer}>
            <Text style={[styles.subTitle, { color: colors.textPrimary }]}>One-Night-Before Strategy</Text>
            <Text style={[styles.descText, { color: colors.textMuted }]}>
              Check off syllabus units as you study to automatically structure your preparation.
            </Text>

            {studyPlan.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.textDisabled} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Enter a topic to generate your master study plan.</Text>
              </View>
            ) : (
              <View style={styles.planList}>
                {studyPlan.map(item => (
                  <TouchableOpacity 
                    key={item.id} 
                    onPress={() => toggleCheck(item.id)}
                    style={[
                      styles.planCard, 
                      { 
                        backgroundColor: colors.bgCard, 
                        borderColor: item.done ? colors.primary + '30' : colors.dividerSoft 
                      }
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkRing, { borderColor: item.done ? colors.primary : colors.textMuted }]}>
                      {item.done && <Ionicons name="checkmark" size={14} color={colors.primary} />}
                    </View>
                    
                    <View style={styles.planInfo}>
                      <Text 
                        style={[
                          styles.planTitleText, 
                          { 
                            color: colors.textPrimary,
                            textDecorationLine: item.done ? 'line-through' : 'none',
                            opacity: item.done ? 0.6 : 1
                          }
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={[styles.planSubjectText, { color: colors.textMuted }]}>
                        {item.unit}
                      </Text>
                      {item.points && item.points.length > 0 && !item.done && (
                        <View style={{ marginTop: 8, gap: 4 }}>
                          {item.points.map((p: string, i: number) => (
                            <Text key={i} style={[styles.pointText, { color: colors.textSecondary }]}>• {p}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: MOCK TEST */}
        {activeTab === 'mock' && (
          <View style={styles.mockContainer}>
            <Text style={[styles.subTitle, { color: colors.textPrimary }]}>AI Mock Question Paper</Text>
            <Text style={[styles.descText, { color: colors.textMuted }]}>
              Predicted examination prompts based on historical university patterns.
            </Text>

            {mockQuestions.length === 0 ? (
               <View style={styles.emptyState}>
                 <Ionicons name="document-text-outline" size={48} color={colors.textDisabled} />
                 <Text style={[styles.emptyText, { color: colors.textMuted }]}>Enter a topic to compile likely exam questions.</Text>
               </View>
            ) : (
              <View style={styles.questionsList}>
                <Text style={[styles.questionListTitle, { color: colors.textPrimary }]}>Current Sample Paper</Text>
                {mockQuestions.map((q, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.mockCard, 
                      { 
                        backgroundColor: colors.bgCard, 
                        borderColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.08)' : colors.dividerSoft 
                      }
                    ]}
                  >
                    <View style={styles.questionBadgeRow}>
                      <Text style={[styles.qNo, { color: colors.primary }]}>Q.{idx + 1}</Text>
                      <View style={styles.marksBadge}>
                        <Text style={styles.marksText}>{q.marks || '5 marks'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.qText, { color: colors.textPrimary }]}>{q.q}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

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
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34c759',
  },
  statusText: {
    color: '#34c759',
    fontSize: 9,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingRight: 10,
  },
  genBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  genBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  descText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  flashContainer: {
    alignItems: 'stretch',
  },
  cardTouch: {
    width: '100%',
    height: 280,
    marginBottom: 20,
  },
  flashCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectBadge: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(56,189,248,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardProgress: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contentWrap: {
    alignItems: 'center',
  },
  formulaTitle: {
    color: '#34c759',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formulaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  questionTitle: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  tapPrompt: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  circleBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  flipBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  planContainer: {
    alignItems: 'stretch',
  },
  planList: {
    gap: 12,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  checkRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  planInfo: {
    flex: 1,
  },
  planTitleText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  planSubjectText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  pointText: {
    fontSize: 12,
    lineHeight: 16,
  },
  mockContainer: {
    alignItems: 'stretch',
  },
  questionsList: {
    gap: 14,
  },
  questionListTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  mockCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  questionBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qNo: {
    fontSize: 13,
    fontWeight: '800',
  },
  marksBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  marksText: {
    color: '#8e8e93',
    fontSize: 10,
    fontWeight: '700',
  },
  qText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from 'expo-blur';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const SUGGESTIONS = [
  { icon: 'document-text-outline', text: 'Summarize Notes', query: 'Summarize my recent lecture notes on databases' },
  { icon: 'flask-outline', text: 'Explain Physics', query: 'Explain the double-slit experiment in simple terms' },
  { icon: 'calendar-outline', text: 'Plan Study', query: 'Create a 5-day study roadmap for calculus' },
  { icon: 'help-circle-outline', text: 'Quiz Me', query: 'Create a 5-question multiple choice quiz on data structures' },
];

const TypingIndicator = ({ colors }: { colors: any }) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    };
    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingRow}>
      <Animated.View style={[styles.typingDot, { backgroundColor: colors.primary, opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: colors.primary, opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: colors.primary, opacity: dot3 }]} />
      <Text style={[styles.thinkText, { color: colors.textDisabled }]}>Thinking...</Text>
    </View>
  );
};

export default function AssistantScreen() {
  const { user } = useAuth();
  const { colors, theme } = useTheme();

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const displayName = user?.name ? user.name.split(' ')[0] : 'there';

  const systemInstruction = `
You are Sutras AI, an elite academic study assistant and professor designed to help college students.
Your personality is encouraging, knowledgeable, and concise.
Proactively suggest suitable study plans, recommend notes, and suggest relevant topics.
Use markdown-like formatting (headers, lists, bold text) for readability.
If a student asks you to explain a concept, explain it clearly with analogies if helpful. Keep it structured and not overly long.
`;

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction
      });

      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({
        history,
        generationConfig: { maxOutputTokens: 2000 },
      });

      const response = await chat.sendMessage(textToSend);
      const text = response.response.text();
      setMessages(prev => [...prev, { role: 'model', content: text }]);
    } catch (err: any) {
      console.warn('Gemini chat error:', err);
      setMessages(prev => [...prev, {
        role: 'model',
        content: "Sorry, I'm having trouble connecting right now. Please check your internet connection."
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const renderText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      let isBullet = false;
      let text = line;
      let isHeading = false;

      if (line.trim().startsWith('## ')) {
        isHeading = true;
        text = line.trim().substring(3);
      } else if (line.trim().startsWith('# ')) {
        isHeading = true;
        text = line.trim().substring(2);
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        isBullet = true;
        text = line.trim().substring(2);
      }

      const parts = text.split('**');
      return (
        <View key={lineIdx} style={line.trim() === '' ? styles.emptyLine : styles.lineWrap}>
          <Text style={[
            styles.msgLine,
            { color: colors.textPrimary },
            isHeading && styles.headingLine,
          ]}>
            {isBullet ? '  •  ' : ''}
            {parts.map((part, pi) => (
              <Text key={pi} style={{ fontWeight: pi % 2 === 1 ? '600' : '400' }}>{part}</Text>
            ))}
          </Text>
        </View>
      );
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      style={[styles.container, { backgroundColor: colors.bgMain }]}
    >
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
        <View style={styles.topLeft}>
          <View style={[styles.aiDot, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={12} color="#fff" />
          </View>
          <View>
            <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Sutras AI</Text>
            <Text style={[styles.topSub, { color: colors.textDisabled }]}>Personal Study Copilot</Text>
          </View>
        </View>
      </View>

      {/* ═══ CHAT ═══ */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Empty state — Apple feature-card style */}
        {messages.length === 0 && (
          <View style={styles.welcomeSection}>
            <View style={[styles.welcomeCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
              <View style={[styles.welcomeIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="sparkles" size={22} color="#fff" />
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
                Hi {displayName}!
              </Text>
              <Text style={[styles.welcomeSub, { color: colors.textMuted }]}>
                I'm your AI study partner. Ask me anything about your syllabus, concepts, or exam prep.
              </Text>
            </View>

            {/* Suggestion chips — Apple configurator-option-chip style */}
            <Text style={[styles.suggestLabel, { color: colors.textDisabled }]}>Try asking</Text>
            <View style={styles.suggestGrid}>
              {SUGGESTIONS.map((sug, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestChip, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}
                  onPress={() => handleSend(sug.query)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={sug.icon as any} size={16} color={colors.primary} />
                  <Text style={[styles.suggestText, { color: colors.textPrimary }]}>{sug.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <View key={idx} style={[styles.msgRow, isUser ? styles.userRow : styles.modelRow]}>
              {!isUser && (
                <View style={[styles.msgAvatar, { backgroundColor: colors.primary }]}>
                  <Ionicons name="sparkles" size={10} color="#fff" />
                </View>
              )}
              <View style={[
                styles.msgBubble,
                isUser
                  ? [styles.userBubble, { backgroundColor: colors.primary }]
                  : [styles.modelBubble, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]
              ]}>
                {isUser ? (
                  <Text style={styles.userText}>{msg.content}</Text>
                ) : (
                  <View style={styles.modelInner}>
                    {renderText(msg.content)}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={[styles.msgRow, styles.modelRow]}>
            <View style={[styles.msgAvatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="sparkles" size={10} color="#fff" />
            </View>
            <View style={[styles.msgBubble, styles.modelBubble, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
              <View style={styles.modelInner}>
                <TypingIndicator colors={colors} />
              </View>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* ═══ INPUT BAR — Apple search-input pill style ═══ */}
      <View style={[styles.inputBar, { 
        backgroundColor: colors.canvas, 
        borderTopColor: colors.hairline,
        paddingBottom: isKeyboardVisible ? 16 : (Platform.OS === 'ios' ? 96 : 76)
      }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.bgMain, borderColor: colors.dividerSoft }]}>
          <TextInput
            style={[styles.inputField, { color: colors.textPrimary }]}
            placeholder="Ask anything about your studies..."
            placeholderTextColor={colors.textDisabled}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!loading}
          />
        </View>
        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={!input.trim() || loading}
          activeOpacity={0.85}
        >
          <View style={[
            styles.sendBtn,
            { backgroundColor: input.trim() && !loading ? colors.primary : colors.secondaryBg }
          ]}>
            <Ionicons name="arrow-up" size={20} color={input.trim() && !loading ? '#fff' : colors.textDisabled} />
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiDot: { width: 28, height: 28, borderRadius: 9999, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  topSub: { fontSize: 12, fontWeight: '400', letterSpacing: -0.12 },
  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: 20, paddingTop: 108, paddingBottom: 10 },

  // Welcome — Apple store utility card
  welcomeSection: { marginBottom: 16 },
  welcomeCard: {
    borderRadius: 18, borderWidth: 1, padding: 32, alignItems: 'center', marginBottom: 24,
  },
  welcomeIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  welcomeTitle: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  welcomeSub: { fontSize: 17, fontWeight: '400', textAlign: 'center', lineHeight: 25, letterSpacing: -0.374 },
  suggestLabel: { fontSize: 12, fontWeight: '400', letterSpacing: -0.12, marginBottom: 10, textTransform: 'uppercase' },
  suggestGrid: { gap: 8 },
  suggestChip: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 9999,
    borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, gap: 10,
  },
  suggestText: { fontSize: 17, fontWeight: '400', letterSpacing: -0.374 },

  // Messages
  msgRow: { flexDirection: 'row', marginBottom: 12, maxWidth: '88%' },
  userRow: { alignSelf: 'flex-end' },
  modelRow: { alignSelf: 'flex-start' },
  msgAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 2 },
  msgBubble: { borderRadius: 18, maxWidth: '100%', overflow: 'hidden' },
  userBubble: { borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 },
  modelBubble: { borderTopLeftRadius: 6, borderWidth: 1 },
  modelInner: { paddingHorizontal: 16, paddingVertical: 12 },
  userText: { color: '#fff', fontSize: 17, fontWeight: '400', lineHeight: 25, letterSpacing: -0.374 },
  lineWrap: { marginVertical: 1 },
  emptyLine: { height: 6 },
  msgLine: { fontSize: 17, lineHeight: 25, letterSpacing: -0.374 },
  headingLine: { fontSize: 17, fontWeight: '600', marginTop: 4, marginBottom: 2 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3 },
  thinkText: { fontSize: 14, fontWeight: '400', letterSpacing: -0.224, marginLeft: 6 },

  // Input bar
  inputBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'flex-end',
  },
  inputWrap: {
    flex: 1, borderRadius: 9999, borderWidth: 1, paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10, minHeight: 44, maxHeight: 120,
    justifyContent: 'center',
  },
  inputField: { fontSize: 17, fontWeight: '400', lineHeight: 25, letterSpacing: -0.374, minHeight: 24 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});

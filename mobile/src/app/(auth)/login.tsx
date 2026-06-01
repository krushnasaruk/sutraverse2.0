import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const { loginWithEmail, resetPassword } = useAuth();
  const { spacing, radius, typography } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Focus states for input styling
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Space/Cyberpunk Theme Colors
  const themeColors = {
    bgStart: '#05080e',
    bgEnd: '#0d1527',
    cardBg: 'rgba(17, 22, 34, 0.85)',
    cardBorder: 'rgba(56, 189, 248, 0.2)',
    primary: '#38bdf8', // Luminous Space Cyan
    primaryGlow: 'rgba(56, 189, 248, 0.4)',
    primaryDark: '#0ea5e9',
    textPrimary: '#f3f4f6', // Crisp off-white
    textSecondary: '#9ca3af', // Steel gray
    textMuted: '#6b7280',
    inputBg: '#090d16',
    border: 'rgba(56, 189, 248, 0.12)',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    errorBorder: 'rgba(239, 68, 68, 0.3)',
    errorText: '#f87171',
    onPrimary: '#090d16',
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Email Required",
        "Please type your email address in the field above first, then tap this link to request a secure password reset link."
      );
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await resetPassword(email.trim());
      Alert.alert(
        "Security Link Sent! ✉️",
        "We have sent a secure password reset link to your email. Click it to set your password, then log in here!"
      );
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[themeColors.bgStart, themeColors.bgEnd]}
      style={styles.container}
    >
      {/* Subtle Background Glow Orbs */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContainer, { padding: spacing.lg }]} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.headerContainer, { marginBottom: spacing.xl }]}>
            <LinearGradient
              colors={[themeColors.primary, '#818cf8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.logoBadge, { borderRadius: radius.lg }]}
            >
              <Text style={styles.logoEmoji}>📚</Text>
            </LinearGradient>
            <Text style={[typography.heroDisplay, { color: themeColors.textPrimary, fontWeight: '800' }]}>Sutraverse</Text>
            <Text style={[typography.caption, { color: themeColors.textSecondary, marginTop: spacing.xxs }]}>The Student OS</Text>
          </View>

          {/* Form Card */}
          <View style={[
            styles.card, 
            { 
              backgroundColor: themeColors.cardBg, 
              borderColor: themeColors.cardBorder,
              borderRadius: radius.lg * 1.5,
              padding: spacing.lg,
            }
          ]}>
            <Text style={[typography.displayLg, { color: themeColors.textPrimary, marginBottom: spacing.md, fontWeight: '700' }]}>Sign In</Text>

            {error ? (
              <View style={[
                styles.errorContainer, 
                { 
                  backgroundColor: themeColors.errorBg, 
                  borderColor: themeColors.errorBorder,
                  borderRadius: radius.md,
                  padding: spacing.sm,
                  marginBottom: spacing.md
                }
              ]}>
                <Ionicons name="alert-circle" size={18} color={themeColors.errorText} style={{ marginRight: spacing.xs }} />
                <Text style={[typography.captionStrong, { color: themeColors.errorText, flex: 1 }]}>{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={[styles.inputContainer, { marginBottom: spacing.md }]}>
              <Text style={[typography.captionStrong, { color: themeColors.textSecondary, marginBottom: spacing.xs }]}>Email Address</Text>
              <View style={[
                styles.inputWrapper, 
                { 
                  backgroundColor: themeColors.inputBg, 
                  borderColor: emailFocused ? themeColors.primary : themeColors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.sm,
                }
              ]}>
                <Ionicons name="mail-outline" size={20} color={emailFocused ? themeColors.primary : themeColors.textSecondary} style={{ marginRight: spacing.xs }} />
                <TextInput
                  style={[typography.body, styles.input, { color: themeColors.textPrimary }]}
                  placeholder="Enter your email"
                  placeholderTextColor={themeColors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, { marginBottom: spacing.sm }]}>
              <Text style={[typography.captionStrong, { color: themeColors.textSecondary, marginBottom: spacing.xs }]}>Password</Text>
              <View style={[
                styles.inputWrapper, 
                { 
                  backgroundColor: themeColors.inputBg, 
                  borderColor: passwordFocused ? themeColors.primary : themeColors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.sm,
                }
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? themeColors.primary : themeColors.textSecondary} style={{ marginRight: spacing.xs }} />
                <TextInput
                  style={[typography.body, styles.input, { color: themeColors.textPrimary }]}
                  placeholder="Enter your password"
                  placeholderTextColor={themeColors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              onPress={handleResetPassword} 
              style={[styles.forgotBtn, { marginBottom: spacing.lg }]} 
              activeOpacity={0.7}
            >
              <Text style={[typography.captionStrong, { color: themeColors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Log In Button */}
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[themeColors.primaryDark, themeColors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, { borderRadius: radius.pill }]}
              >
                {loading ? (
                  <ActivityIndicator color={themeColors.onPrimary} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={[typography.bodyStrong, { color: themeColors.onPrimary }]}>Log In</Text>
                    <Ionicons name="arrow-forward" size={18} color={themeColors.onPrimary} style={{ marginLeft: spacing.xs }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Switch to Signup */}
            <View style={[styles.signupContainer, { marginTop: spacing.lg }]}>
              <Text style={[typography.caption, { color: themeColors.textSecondary }]}>New to Sutras? </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text style={[typography.captionStrong, { color: themeColors.primary }]}>Create account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  glowOrb1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
  },
  headerContainer: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 32,
  },
  card: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  inputContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  buttonContainer: {
    width: '100%',
    height: 48,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function SignupScreen() {
  const { signUpWithEmail } = useAuth();
  const { spacing, radius, typography } = useTheme();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Focus states for input styling
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [branchFocused, setBranchFocused] = useState(false);
  const [yearFocused, setYearFocused] = useState(false);
  const [semesterFocused, setSemesterFocused] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

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

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !branch.trim() || !year.trim() || !semester.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim(), {
        college: 'Pune Institute of Computer Technology (PICT)',
        branch: branch.trim(),
        year: year.trim(),
        semester: semester.trim(),
        subjects: [],
      });
      setVerificationSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <LinearGradient
        colors={[themeColors.bgStart, themeColors.bgEnd]}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: spacing.lg }]}
      >
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[
          styles.card, 
          { 
            backgroundColor: themeColors.cardBg, 
            borderColor: themeColors.cardBorder, 
            borderRadius: radius.lg * 1.5,
            padding: spacing.lg,
            alignItems: 'center',
            width: '100%',
          }
        ]}>
          <Ionicons name="mail-unread-outline" size={80} color={themeColors.primary} style={{ marginBottom: spacing.md }} />
          <Text style={[typography.heroDisplay, { color: themeColors.textPrimary, textAlign: 'center', marginBottom: spacing.xs, fontWeight: '800' }]}>Check Your Email</Text>
          <Text style={[typography.body, { color: themeColors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 }]}>
            We've sent a secure verification link to {email}. Please click the link to verify your account, then log in.
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.buttonContainer} activeOpacity={0.85}>
              <LinearGradient
                colors={[themeColors.primaryDark, themeColors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, { borderRadius: radius.pill }]}
              >
                <Text style={[typography.bodyStrong, { color: themeColors.onPrimary }]}>Go to Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>
      </LinearGradient>
    );
  }

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
          <View style={[styles.headerContainer, { marginBottom: spacing.lg }]}>
            <Text style={[typography.heroDisplay, { color: themeColors.textPrimary, fontWeight: '800' }]}>Create Account</Text>
            <Text style={[typography.caption, { color: themeColors.textSecondary, marginTop: spacing.xxs }]}>Join the Sutras Community</Text>
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

            {/* Full Name Input */}
            <View style={[styles.inputContainer, { marginBottom: spacing.md }]}>
              <Text style={[typography.captionStrong, { color: themeColors.textSecondary, marginBottom: spacing.xs }]}>Full Name</Text>
              <View style={[
                styles.inputWrapper, 
                { 
                  backgroundColor: themeColors.inputBg, 
                  borderColor: nameFocused ? themeColors.primary : themeColors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.sm,
                }
              ]}>
                <Ionicons name="person-outline" size={20} color={nameFocused ? themeColors.primary : themeColors.textSecondary} style={{ marginRight: spacing.xs }} />
                <TextInput
                  style={[typography.body, styles.input, { color: themeColors.textPrimary }]}
                  placeholder="Enter your name"
                  placeholderTextColor={themeColors.textMuted}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>
            </View>

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
                  placeholder="e.g. name@student.com"
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
            <View style={[styles.inputContainer, { marginBottom: spacing.md }]}>
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
                  placeholder="Choose password"
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

            {/* Row layout for college details */}
            <View style={[styles.row, { marginBottom: spacing.md }]}>
              <View style={[styles.inputContainer, { flex: 1.1, marginRight: spacing.sm }]}>
                <Text style={[typography.captionStrong, { color: themeColors.textSecondary, marginBottom: spacing.xs }]}>Branch</Text>
                <View style={[
                  styles.inputWrapper, 
                  { 
                    backgroundColor: themeColors.inputBg, 
                    borderColor: branchFocused ? themeColors.primary : themeColors.border,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.sm,
                  }
                ]}>
                  <TextInput
                    style={[typography.body, styles.input, { color: themeColors.textPrimary }]}
                    placeholder="e.g. CE / IT"
                    placeholderTextColor={themeColors.textMuted}
                    value={branch}
                    onChangeText={setBranch}
                    autoCapitalize="characters"
                    onFocus={() => setBranchFocused(true)}
                    onBlur={() => setBranchFocused(false)}
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, { flex: 0.9 }]}>
                <Text style={[typography.captionStrong, { color: themeColors.textSecondary, marginBottom: spacing.xs }]}>Year</Text>
                <View style={[
                  styles.inputWrapper, 
                  { 
                    backgroundColor: themeColors.inputBg, 
                    borderColor: yearFocused ? themeColors.primary : themeColors.border,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.sm,
                  }
                ]}>
                  <TextInput
                    style={[typography.body, styles.input, { color: themeColors.textPrimary }]}
                    placeholder="e.g. FE / TE"
                    placeholderTextColor={themeColors.textMuted}
                    value={year}
                    onChangeText={setYear}
                    autoCapitalize="characters"
                    onFocus={() => setYearFocused(true)}
                    onBlur={() => setYearFocused(false)}
                  />
                </View>
              </View>
            </View>

            {/* Semester field */}
            <View style={[styles.inputContainer, { marginBottom: spacing.lg }]}>
              <Text style={[typography.captionStrong, { color: themeColors.textSecondary, marginBottom: spacing.xs }]}>Semester</Text>
              <View style={[
                styles.inputWrapper, 
                { 
                  backgroundColor: themeColors.inputBg, 
                  borderColor: semesterFocused ? themeColors.primary : themeColors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.sm,
                }
              ]}>
                <Ionicons name="calendar-outline" size={20} color={semesterFocused ? themeColors.primary : themeColors.textSecondary} style={{ marginRight: spacing.xs }} />
                <TextInput
                  style={[typography.body, styles.input, { color: themeColors.textPrimary }]}
                  placeholder="e.g. Sem 1 / Sem 6"
                  placeholderTextColor={themeColors.textMuted}
                  value={semester}
                  onChangeText={setSemester}
                  onFocus={() => setSemesterFocused(true)}
                  onBlur={() => setSemesterFocused(false)}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleSignup}
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
                    <Text style={[typography.bodyStrong, { color: themeColors.onPrimary }]}>Sign Up</Text>
                    <Ionicons name="checkmark-circle-outline" size={18} color={themeColors.onPrimary} style={{ marginLeft: spacing.xs }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Switch to Login */}
            <View style={[styles.signupContainer, { marginTop: spacing.lg }]}>
              <Text style={[typography.caption, { color: themeColors.textSecondary }]}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={[typography.captionStrong, { color: themeColors.primary }]}>Log In</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

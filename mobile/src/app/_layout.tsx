import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { DownloadsProvider } from '../context/DownloadsContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors, theme } = useTheme();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in → send to login
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
      return () => clearTimeout(timer);
    } else if (user && inAuthGroup) {
      // Logged in but on auth page → send to tabs
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgMain || '#0a0a0f' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 32, marginBottom: 16 }}>📚</Text>
          <Text style={{ color: colors.textPrimary || '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>Sutras</Text>
          <Text style={{ color: colors.textMuted || '#666', fontSize: 12, marginTop: 4, fontWeight: '600' }}>The Student OS</Text>
          <ActivityIndicator size="small" color={colors.primary || '#6366f1'} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DownloadsProvider>
          <RootLayoutNav />
        </DownloadsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from 'expo-blur';

export default function TabsLayout() {
  const { colors, theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 0,
          letterSpacing: -0.12,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={theme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.tabBarBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          height: 44,
          paddingTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "cloud-download" : "cloud-download-outline"} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'AI Partner',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "sparkles" : "sparkles-outline"} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}


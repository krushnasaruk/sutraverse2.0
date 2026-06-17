import React from 'react';

export interface ThemeColors {
  primary: string;
  primaryFocus: string;
  primaryOnDark: string;
  onPrimary: string;
  canvas: string;
  parchment: string;
  pearl: string;
  tileDark1: string;
  tileDark2: string;
  tileDark3: string;
  surfaceBlack: string;
  bgMain: string;
  bgCard: string;
  bgCardElevated: string;
  bgInput: string;
  bgOverlay: string;
  bgChip: string;
  bgChipActive: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textInverse: string;
  bodyMuted: string;
  border: string;
  borderLight: string;
  hairline: string;
  dividerSoft: string;
  borderFocus: string;
  secondaryBg: string;
  secondaryPressed: string;
  chipTranslucent: string;
  success: string;
  successPale: string;
  successSoft: string;
  downloadBg: string;
  error: string;
  errorDeep: string;
  warning: string;
  tabBarBg: string;
  tabBarBorder: string;
  productShadow: string;
  primarySoft: string;
  primaryGlow: string;
  shadow: string;
  cardGlow: string;
  shimmer: string;
  secondary: string;
  accentOrange: string;
  accentGreen: string;
  accentRed: string;
  accentYellow: string;
  primaryLight: string;
  primaryDark: string;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => Promise<void>;
  colors: ThemeColors;
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    section: number;
  };
  radius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    pill: number;
    full: number;
  };
  typography: {
    heroDisplay: any;
    displayLg: any;
    displayMd: any;
    lead: any;
    bodyStrong: any;
    body: any;
    caption: any;
    captionStrong: any;
    finePrint: any;
    buttonLarge: any;
    buttonUtility: any;
  };
}

export declare const ThemeProvider: React.FC<{ children: React.ReactNode }>;
export declare const useTheme: () => ThemeContextType;

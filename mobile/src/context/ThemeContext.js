import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({});

// ═══════════════════════════════════════════════════════════════
// ═══ DESIGN TOKENS — Apple-Inspired Design System ════════════
// ═══ Museum-gallery chrome · Single Action Blue accent ═══════
// ═══ SF Pro / system-ui · Pure white + parchment surfaces ════
// ═══ 17px body · Weight 600 headlines · Near-black ink ═══════
// ═══════════════════════════════════════════════════════════════

const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 17,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 80,
};

const radius = {
  xs: 5,
  sm: 8,
  md: 11,
  lg: 18,
  pill: 9999,
  full: 9999,
};

const typography = {
  heroDisplay: { fontSize: 28, fontWeight: '600', letterSpacing: -0.28 },
  displayLg: { fontSize: 24, fontWeight: '600', lineHeight: 28 },
  displayMd: { fontSize: 21, fontWeight: '600', letterSpacing: 0.231 },
  lead: { fontSize: 20, fontWeight: '400', lineHeight: 24 },
  bodyStrong: { fontSize: 17, fontWeight: '600', letterSpacing: -0.374 },
  body: { fontSize: 17, fontWeight: '400', lineHeight: 25, letterSpacing: -0.374 },
  caption: { fontSize: 14, fontWeight: '400', letterSpacing: -0.224 },
  captionStrong: { fontSize: 14, fontWeight: '600', letterSpacing: -0.224 },
  finePrint: { fontSize: 12, fontWeight: '400', letterSpacing: -0.12 },
  buttonLarge: { fontSize: 18, fontWeight: '300' },
  buttonUtility: { fontSize: 14, fontWeight: '400', letterSpacing: -0.224 },
};

const lightColors = {
  // ── Brand Accent — Action Blue (all interactive elements) ──
  primary: '#0066cc',
  primaryFocus: '#0071e3',
  primaryOnDark: '#2997ff',
  onPrimary: '#ffffff',

  // ── Surfaces — pure white + parchment alternation ──
  canvas: '#ffffff',
  parchment: '#f5f5f7',
  pearl: '#fafafc',
  tileDark1: '#272729',
  tileDark2: '#2a2a2c',
  tileDark3: '#252527',
  surfaceBlack: '#000000',

  // ── Backgrounds (mapped for compatibility) ──
  bgMain: '#f5f5f7',       // parchment — page background
  bgCard: '#ffffff',        // white — card fills
  bgCardElevated: '#ffffff',
  bgInput: '#ffffff',
  bgOverlay: 'rgba(0, 0, 0, 0.5)',
  bgChip: '#f5f5f7',
  bgChipActive: '#1d1d1f',

  // ── Text — Apple near-black ink (NOT pure black) ──
  textPrimary: '#1d1d1f',
  textSecondary: '#333333',
  textMuted: '#7a7a7a',
  textDisabled: '#999999',
  textInverse: '#ffffff',
  bodyMuted: '#cccccc',

  // ── Borders ──
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  hairline: '#e0e0e0',
  dividerSoft: '#f0f0f0',
  borderFocus: '#0071e3',

  // ── Secondary ──
  secondaryBg: '#f5f5f7',
  secondaryPressed: '#e8e8ed',
  chipTranslucent: '#d2d2d7',

  // ── Status ──
  success: '#34c759',
  successPale: '#d1f2d9',
  successSoft: 'rgba(52,199,89,0.1)',
  downloadBg: '#f0faf3',
  error: '#ff3b30',
  errorDeep: '#cc001f',
  warning: '#ff9500',

  // ── Tab Bar ──
  tabBarBg: '#ffffff',
  tabBarBorder: '#e0e0e0',

  // ── Shadows — the ONE Apple shadow ──
  productShadow: 'rgba(0, 0, 0, 0.22)',

  // ── Compatibility aliases for secondary screens ──
  primarySoft: 'rgba(0, 102, 204, 0.08)',
  primaryGlow: 'rgba(0, 102, 204, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.04)',
  cardGlow: 'transparent',
  shimmer: 'transparent',
  secondary: '#7a7a7a',
  accentOrange: '#ff9500',
  accentGreen: '#34c759',
  accentRed: '#ff3b30',
  accentYellow: '#ffcc00',
  primaryLight: '#0066cc',
  primaryDark: '#004999',
};

const darkColors = {
  // ── Brand Accent — Space Cyan/Blue (glowing, luminous contrast) ──
  primary: '#38bdf8',
  primaryFocus: '#0ea5e9',
  primaryOnDark: '#38bdf8',
  onPrimary: '#090d16',

  // ── Surfaces — interstellar deep slate-navy ──
  canvas: '#090d16',
  parchment: '#05080e',
  pearl: '#131926',
  tileDark1: '#ffffff',
  tileDark2: '#f5f5f7',
  tileDark3: '#fafafc',
  surfaceBlack: '#000000',

  // ── Backgrounds ──
  bgMain: '#090d16',       // deep slate-black page background
  bgCard: '#111622',        // premium space card surface
  bgCardElevated: '#171e2f',
  bgInput: '#111622',
  bgOverlay: 'rgba(0, 0, 0, 0.75)',
  bgChip: '#171e2f',
  bgChipActive: '#38bdf8',

  // ── Text — high-contrast cosmic gray & crisp white ──
  textPrimary: '#f3f4f6',   // clean off-white
  textSecondary: '#9ca3af', // light steel-gray
  textMuted: '#6b7280',     // medium gray
  textDisabled: '#4b5563',  // muted gray
  textInverse: '#090d16',
  bodyMuted: '#4b5563',

  // ── Borders — subtle cybernetic cyan glows ──
  border: 'rgba(56, 189, 248, 0.15)',
  borderLight: 'rgba(56, 189, 248, 0.08)',
  hairline: 'rgba(56, 189, 248, 0.12)',
  dividerSoft: 'rgba(56, 189, 248, 0.06)',
  borderFocus: '#38bdf8',

  // ── Secondary ──
  secondaryBg: '#171e2f',
  secondaryPressed: '#1f293d',
  chipTranslucent: 'rgba(56, 189, 248, 0.2)',

  // ── Status ──
  success: '#34d759',
  successPale: 'rgba(52, 215, 89, 0.15)',
  successSoft: 'rgba(52, 215, 89, 0.12)',
  downloadBg: 'rgba(52, 215, 89, 0.06)',
  error: '#ff453a',
  errorDeep: '#ff3b30',
  warning: '#ffb30a',

  // ── Tab Bar ──
  tabBarBg: '#111622',
  tabBarBorder: 'rgba(56, 189, 248, 0.12)',

  // ── Shadows ──
  productShadow: 'rgba(0, 0, 0, 0.4)',

  // ── Compatibility aliases for secondary screens ──
  primarySoft: 'rgba(56, 189, 248, 0.12)',
  primaryGlow: 'rgba(56, 189, 248, 0.2)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  cardGlow: 'transparent',
  shimmer: 'transparent',
  secondary: '#9ca3af',
  accentOrange: '#ffb30a',
  accentGreen: '#34d759',
  accentRed: '#ff453a',
  accentYellow: '#ffd60a',
  primaryLight: '#38bdf8',
  primaryDark: '#0ea5e9',
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('sutras-theme');
        if (saved) {
          setTheme(saved);
        }
      } catch (e) {
        console.warn('Failed to load theme:', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const nextTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(nextTheme);
      await AsyncStorage.setItem('sutras-theme', nextTheme);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, spacing, radius, typography }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

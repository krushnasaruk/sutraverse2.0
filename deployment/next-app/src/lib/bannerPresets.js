/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Banner & Theme Presets — shared across Profile and Club customization     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const BANNER_PRESETS = [
    { id: 'midnight', label: 'Midnight',  gradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
    { id: 'sunset',   label: 'Sunset',    gradient: 'linear-gradient(135deg, #f12711, #f5af19)' },
    { id: 'ocean',    label: 'Ocean',     gradient: 'linear-gradient(135deg, #2193b0, #6dd5ed)' },
    { id: 'aurora',   label: 'Aurora',    gradient: 'linear-gradient(135deg, #7F7FD5, #86A8E7, #91EAE4)' },
    { id: 'neon',     label: 'Neon',      gradient: 'linear-gradient(135deg, #b91c1c, #22c55e)' },
    { id: 'forest',   label: 'Forest',    gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { id: 'fire',     label: 'Fire',      gradient: 'linear-gradient(135deg, #f83600, #f9d423)' },
    { id: 'cosmic',   label: 'Cosmic',    gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { id: 'steel',    label: 'Steel',     gradient: 'linear-gradient(135deg, #485563, #29323c)' },
    { id: 'candy',    label: 'Candy',     gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { id: 'abyss',    label: 'Abyss',     gradient: 'linear-gradient(135deg, #000000, #434343)' },
    { id: 'haze',     label: 'Purple Haze', gradient: 'linear-gradient(135deg, #7028e4, #e5b2ca)' },
];

export const THEME_COLORS = [
    { 
      id: 'blue',   label: 'Ocean Blue',
      hex: '#3b82f6', light: '#60a5fa', dark: '#2563eb', glow: 'rgba(59, 130, 246, 0.4)' 
    },
    { 
      id: 'purple', label: 'Midnight Purple',
      hex: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed', glow: 'rgba(139, 92, 246, 0.4)' 
    },
    { 
      id: 'pink',   label: 'Neon Pink',
      hex: '#ec4899', light: '#f472b6', dark: '#db2777', glow: 'rgba(236, 72, 153, 0.4)' 
    },
    { 
      id: 'cyan',   label: 'Neo Cyan',
      hex: '#06b6d4', light: '#22d3ee', dark: '#0891b2', glow: 'rgba(6, 182, 212, 0.4)' 
    },
    { 
      id: 'green',  label: 'Emerald Green',
      hex: '#10b981', light: '#34d399', dark: '#059669', glow: 'rgba(16, 185, 129, 0.4)' 
    },
    { 
      id: 'orange', label: 'Royal Gold',
      hex: '#f59e0b', light: '#fbbf24', dark: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' 
    },
    { 
      id: 'red',    label: 'Crimson Red',
      hex: '#ef4444', light: '#f87171', dark: '#dc2626', glow: 'rgba(239, 68, 68, 0.4)' 
    },
];

/** Look up a gradient string by preset ID. Falls back to 'neon' if not found. */
export function getBannerGradient(presetId) {
    const preset = BANNER_PRESETS.find(p => p.id === presetId);
    return preset ? preset.gradient : BANNER_PRESETS.find(p => p.id === 'neon').gradient;
}

/** Look up a theme color object by ID. Falls back to blue. */
export function getThemeColor(colorId) {
    const color = THEME_COLORS.find(c => c.id === colorId);
    return color || THEME_COLORS[0];
}

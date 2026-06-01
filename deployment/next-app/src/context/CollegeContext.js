'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/context/ThemeContext';

const CollegeContext = createContext();

// Default branding — used when no Firestore doc exists
const DEFAULT_BRANDING = {
    collegeName: '',
    collegeShortName: '',
    tagline: '',
    heroSubtitle: '',
    // Dark Theme Colors
    primaryColor: '#3b82f6',
    secondaryColor: '#22d3ee',
    accentColor: '#f472b6',
    letterColors: {}, // Per-letter colors for dark theme
    
    // Light Theme Colors
    primaryColorLight: '#2563eb',
    secondaryColorLight: '#0891b2',
    accentColorLight: '#db2777',
    letterColorsLight: {}, // Per-letter colors for light theme
    
    logoUrl: '',
    applyColorsGlobally: true,
};

// Restore cached branding text instantly so the college name doesn't flash blank
function getCachedBranding() {
    if (typeof window === 'undefined') return DEFAULT_BRANDING;
    try {
        const cached = localStorage.getItem('sutra_college_branding_text');
        if (cached) {
            const parsed = JSON.parse(cached);
            return { ...DEFAULT_BRANDING, ...parsed };
        }
    } catch (e) {}
    return DEFAULT_BRANDING;
}

export function CollegeProvider({ children }) {
    const { theme } = useTheme();
    const [branding, setBranding] = useState(DEFAULT_BRANDING);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Hydrate from localStorage on client mount to avoid SSR hydration mismatch
        setBranding(getCachedBranding());

        if (!db) {
            setLoaded(true);
            return;
        }

        // Listen for realtime updates to branding
        const unsub = onSnapshot(
            doc(db, 'settings', 'college'),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    const newBranding = {
                        ...DEFAULT_BRANDING,
                        ...data,
                        letterColors: data.letterColors || {},
                        letterColorsLight: data.letterColorsLight || {},
                    };
                    setBranding(newBranding);
                    // Cache text fields so they load instantly on next visit
                    try {
                        localStorage.setItem('sutra_college_branding_text', JSON.stringify({
                            collegeName: newBranding.collegeName,
                            collegeShortName: newBranding.collegeShortName,
                            tagline: newBranding.tagline,
                            heroSubtitle: newBranding.heroSubtitle,
                            letterColors: newBranding.letterColors,
                            letterColorsLight: newBranding.letterColorsLight,
                        }));
                    } catch (e) {}
                }
                setLoaded(true);
            },
            (error) => {
                console.warn('CollegeContext: Could not load branding:', error.message);
                setLoaded(true);
            }
        );

        return () => unsub();
    }, []);

    // Apply CSS custom properties when branding changes
    useEffect(() => {
        if (!loaded) return;
        const root = document.documentElement;

        if (branding.applyColorsGlobally) {
            const isLight = theme === 'light';
            const activePrimary = isLight ? (branding.primaryColorLight || branding.primaryColor) : branding.primaryColor;
            const activeSecondary = isLight ? (branding.secondaryColorLight || branding.secondaryColor) : branding.secondaryColor;

            root.style.setProperty('--primary', activePrimary);
            root.style.setProperty('--primary-light', adjustColor(activePrimary, 30));
            root.style.setProperty('--primary-dark', adjustColor(activePrimary, -30));
            root.style.setProperty('--primary-glow', hexToRgba(activePrimary, 0.4));
            root.style.setProperty('--secondary', activeSecondary);
            root.style.setProperty('--secondary-glow', hexToRgba(activeSecondary, 0.3));

            // Cache branding colors to prevent flash on refresh
            localStorage.setItem('sutra_college_branding', JSON.stringify({
                primary: activePrimary,
                secondary: activeSecondary,
                glow: hexToRgba(activePrimary, 0.4),
                light: adjustColor(activePrimary, 30),
                dark: adjustColor(activePrimary, -30)
            }));
        }
    }, [branding, loaded, theme]);

    return (
        <CollegeContext.Provider value={{ branding, loaded }}>
            {children}
        </CollegeContext.Provider>
    );
}

export const useCollege = () => useContext(CollegeContext);

// ── Helper utilities ──

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

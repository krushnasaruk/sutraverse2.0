'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light'); // default to Light
    const [performanceMode, setPerformanceMode] = useState('high'); // 'high' or 'low' (Ultra-Performance)

    useEffect(() => {
        const saved = localStorage.getItem('sutras-theme');
        if (saved === 'dark') {
            setTheme('dark');
            document.documentElement.classList.remove('light');
        } else {
            setTheme('light');
            document.documentElement.classList.add('light');
        }

        // Performance Mode Initialization & Auto-Detection
        const savedPerf = localStorage.getItem('sutras-performance');
        if (savedPerf) {
            setPerformanceMode(savedPerf);
            if (savedPerf === 'low') {
                document.documentElement.classList.add('low-performance');
            } else {
                document.documentElement.classList.remove('low-performance');
            }
        } else {
            // Auto-detect budget/old hardware specifications
            const isLowEnd = (typeof navigator !== 'undefined') && (
                (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
                (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            );
            const initialPerf = isLowEnd ? 'low' : 'high';
            setPerformanceMode(initialPerf);
            if (initialPerf === 'low') {
                document.documentElement.classList.add('low-performance');
            } else {
                document.documentElement.classList.remove('low-performance');
            }
        }
    }, []);

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
            localStorage.setItem('sutras-theme', 'dark');
            document.documentElement.classList.remove('light');
        } else {
            setTheme('light');
            localStorage.setItem('sutras-theme', 'light');
            document.documentElement.classList.add('light');
        }
    };

    const togglePerformanceMode = () => {
        const nextPerf = performanceMode === 'high' ? 'low' : 'high';
        setPerformanceMode(nextPerf);
        localStorage.setItem('sutras-performance', nextPerf);
        if (nextPerf === 'low') {
            document.documentElement.classList.add('low-performance');
        } else {
            document.documentElement.classList.remove('low-performance');
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, performanceMode, togglePerformanceMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);


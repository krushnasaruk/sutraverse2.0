'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light'); // default to Light

    useEffect(() => {
        const saved = localStorage.getItem('sutras-theme');
        if (saved === 'dark') {
            setTheme('dark');
            document.documentElement.classList.remove('light');
        } else {
            setTheme('light');
            document.documentElement.classList.add('light');
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

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

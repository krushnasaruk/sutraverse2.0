'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark'); // default to Dark (notebook style)

    useEffect(() => {
        const saved = localStorage.getItem('sutras-theme');
        if (saved === 'light') {
            setTheme('light');
            document.documentElement.classList.add('light');
        } else {
            setTheme('dark');
            document.documentElement.classList.remove('light');
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

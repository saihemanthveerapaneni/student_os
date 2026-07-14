'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeState: (newTheme: Theme | 'system') => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const applyAccentColor = (color: string) => {
    const colors: Record<string, string> = {
      yellow: '#ffe251',
      blue: '#5B7FE8',
      red: '#ff5c5c',
      green: '#4ade80',
      purple: '#b4c5ff',
    };
    if (colors[color]) {
      document.documentElement.style.setProperty('--secondary-container', colors[color]);
      // Also update some other accent variables to make it cohesive
      if (color !== 'yellow') {
        document.documentElement.style.setProperty('--primary', colors[color]);
      } else {
        document.documentElement.style.removeProperty('--primary');
      }
    }
  };

  const applyFontSize = (size: string) => {
    const sizes: Record<string, string> = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    if (sizes[size]) {
      document.documentElement.style.fontSize = sizes[size];
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('studentos-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.add('light');
    }

    // Load API settings for appearance
    import('../utils/api').then(({ api }) => {
      api.getSettings().then((settings) => {
        if (settings.theme && settings.theme !== 'system') {
           // We prioritize localstorage for theme to avoid flash, but sync if api differs
        }
        if (settings.accentColor) applyAccentColor(settings.accentColor);
        if (settings.fontSize) applyFontSize(settings.fontSize);
      }).catch(console.error);
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('studentos-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const setThemeState = (newTheme: Theme | 'system') => {
    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
      localStorage.removeItem('studentos-theme');
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    } else {
      setTheme(newTheme);
      localStorage.setItem('studentos-theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeState, setAccentColor: applyAccentColor, setFontSize: applyFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

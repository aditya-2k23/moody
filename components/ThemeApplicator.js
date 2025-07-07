'use client';

import { useEffect } from 'react';
import { useTheme } from '@/context/themeContext';

export default function ThemeApplicator() {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all theme classes first
    root.classList.remove('dark');
    body.classList.remove('mood-theme');
    body.style.backgroundImage = '';

    // Determine the actual theme to apply
    let actualTheme = theme;

    if (theme === 'system') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      actualTheme = systemPrefersDark ? 'dark' : 'light';
    }

    if (actualTheme === 'dark') {
      root.classList.add('dark');
    }
  }, [theme]);

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // Add listener for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Initial check
    handleSystemThemeChange(mediaQuery);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  return null;
}

'use client';

import { createContext, useContext } from 'react';
import useLocalStorageState from 'use-local-storage-state';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorageState('moody-theme', {
    defaultValue: 'system',
  });

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

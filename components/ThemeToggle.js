"use client";

import { useTheme } from '@/context/themeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const getEffectiveTheme = () => {
    if (theme === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return theme;
  };

  const toggleTheme = () => {
    const newTheme = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center p-2.5 rounded-full transition-all duration-300 ease-in-out bg-indigo-50 hover:bg-indigo-100/70 dark:bg-slate-800 dark:hover:bg-slate-700 border border-indigo-100 dark:border-slate-700 shadow-md hover:shadow-lg"
      aria-label={`Switch to ${getEffectiveTheme() === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${getEffectiveTheme() === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun
        size={20}
        strokeWidth={2.5}
        className={`absolute transition-all duration-300 ease-in-out text-amber-500 ${getEffectiveTheme() === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
      />

      <Moon
        size={20}
        strokeWidth={2.5}
        className={`transition-all duration-300 ease-in-out text-indigo-400 ${getEffectiveTheme() === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
      />
    </button>
  );
};

export default ThemeToggle;

'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  // Return placeholder with same dimensions to avoid layout shift
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center p-2.5 rounded-full transition-all duration-300 ease-in-out bg-indigo-50 hover:bg-indigo-100/70 dark:bg-slate-800 dark:hover:bg-slate-700 border border-indigo-100 dark:border-slate-700 shadow-md hover:shadow-lg"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Sun
        size={20}
        strokeWidth={2.5}
        className={`absolute transition-all duration-300 ease-in-out text-amber-500 ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
      />

      <Moon
        size={20}
        strokeWidth={2.5}
        className={`transition-all duration-300 ease-in-out text-indigo-400 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
      />
    </button>
  );
}

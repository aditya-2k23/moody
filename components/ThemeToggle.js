'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reveal, setReveal] = useState(null);
  const cleanupRef = useRef(null);

  // Only render after mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        clearTimeout(cleanupRef.current);
      }
    };
  }, []);

  // Return placeholder with same dimensions to avoid layout shift
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = (event) => {
    const nextTheme = isDark ? 'light' : 'dark';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setTheme(nextTheme);
      return;
    }

    if (cleanupRef.current) {
      clearTimeout(cleanupRef.current);
    }

    const { clientX, clientY } = event;
    const maxRadius = Math.hypot(
      Math.max(clientX, window.innerWidth - clientX),
      Math.max(clientY, window.innerHeight - clientY)
    );

    setReveal({
      x: clientX,
      y: clientY,
      maxRadius,
      fromTheme: isDark ? 'dark' : 'light',
    });

    setTheme(nextTheme);

    cleanupRef.current = setTimeout(() => {
      setReveal(null);
    }, 650);
  };

  return (
    <>
      {reveal ? (
        <span
          aria-hidden="true"
          className={`theme-reveal-mask ${reveal.fromTheme === 'dark' ? 'theme-reveal-dark' : 'theme-reveal-light'}`}
          style={{
            '--x': `${reveal.x}px`,
            '--y': `${reveal.y}px`,
            '--max-r': `${reveal.maxRadius}px`,
          }}
        />
      ) : null}
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
    </>
  );
}

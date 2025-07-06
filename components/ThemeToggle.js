'use client';

import { useTheme } from '@/context/themeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', icon: '☀️' },
    { value: 'dark', icon: '🌙' }
  ];

  return (
    <div className="flex bg-slate-100/80 dark:bg-slate-800 rounded-full p-1 gap-1 border border-indigo-300 dark:border-slate-700">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`
            w-10 h-10 rounded-full text-lg font-medium transition-all duration-200 flex items-center justify-center
            ${theme === t.value || (theme === 'system' && t.value === 'light')
              ? 'bg-slate-200/85 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-600'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-transparent hover:border-indigo-300 dark:hover:border-indigo-600'
            }
          `}
          title={t.value === 'light' ? 'Light Mode' : 'Dark Mode'}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}

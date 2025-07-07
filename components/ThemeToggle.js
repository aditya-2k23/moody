'use client';

import { useTheme } from '@/context/themeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', icon: '🌞', title: 'Light Mode' },
    { value: 'dark', icon: '🌙', title: 'Dark Mode' },
    { value: 'system', icon: '💻', title: 'System Default' }
  ];

  return (
    <div className="flex bg-slate-100/80 dark:bg-slate-800 rounded-full p-0.5 sm:p-1 gap-0.5 sm:gap-1 border border-indigo-300 dark:border-slate-700">
      {themes.map((t) => {
        const isActive =
          theme === t.value ||
          (theme === 'system' && t.value === 'light' && false);

        return (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`
              w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-lg font-medium transition-all duration-200 flex items-center justify-center
              ${isActive
                ? 'bg-slate-200/85 dark:bg-slate-700 shadow-sm border border-indigo-200 dark:border-indigo-600'
                : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-transparent hover:border-indigo-400 dark:hover:border-indigo-600'
              }
            `}
            title={t.title}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
}

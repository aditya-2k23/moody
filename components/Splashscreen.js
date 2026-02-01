"use client";

import React, { useMemo } from 'react';
import { moodTips } from '../utils';
import ThemeToggle from './ThemeToggle';

export default function Splashscreen({ message = "✨ Fetching your insights..." }) {
  // Get a random tip on each render (mount)
  const randomTip = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * moodTips.length);
    return moodTips[randomIndex];
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/95 flex flex-col items-center justify-center overflow-hidden">

      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Decorative floating orbs */}
      {/* Top-left bluish-white sphere */}
      <div className="absolute top-16 left-20 w-24 h-24 sm:w-32 sm:h-32 animate-float-slow">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-indigo-100 to-indigo-200 dark:from-slate-700 dark:via-indigo-800 dark:to-indigo-900 shadow-lg">
          <div className="absolute top-2 left-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/60 dark:bg-white/20 blur-sm" />
        </div>
      </div>

      {/* Top-right purple ring */}
      <div className="absolute top-28 right-24 w-16 h-16 sm:w-20 sm:h-20 animate-float-medium">
        <div className="w-full h-full rounded-full border-4 border-indigo-300/50 dark:border-indigo-500/30" />
      </div>

      {/* Right side yellow/golden sphere */}
      <div className="absolute top-1/3 right-16 sm:right-32 w-20 h-20 sm:w-28 sm:h-28 animate-float-medium">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-100/80 via-yellow-200/80 to-amber-300/70 dark:from-yellow-300/70 dark:via-amber-400/60 dark:to-amber-500/70 shadow-lg">
          <div className="absolute top-2 left-3 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/50 dark:bg-white/20 blur-sm" />
        </div>
      </div>

      {/* Bottom-right pink ring (larger) */}
      <div className="absolute bottom-20 right-20 sm:right-40 w-32 h-32 sm:w-44 sm:h-44 animate-float-slow">
        <div className="w-full h-full rounded-full border-[6px] border-pink-200/60 dark:border-pink-500/20" />
      </div>

      {/* Left side small decorative dot */}
      <div className="absolute top-1/2 left-12 w-4 h-4 rounded-full bg-gradient-to-br from-purple-300 to-indigo-400 dark:from-purple-600 dark:to-indigo-700 animate-pulse opacity-60" />

      {/* Bottom-left gradient blur */}
      <div className="absolute bottom-32 left-8 sm:left-24 w-40 h-40 bg-gradient-to-tr from-yellow-200/40 to-orange-200/30 dark:from-yellow-600/10 dark:to-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main content container */}
      <div className="flex flex-col items-center gap-6 relative z-10 px-4">
        {/* Logo */}
        <h1 className="fugaz text-5xl sm:text-6xl md:text-7xl textGradient">Moody</h1>

        {/* Progress bar */}
        <div className="w-64 sm:w-72 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar" />
        </div>

        {/* Loading message */}
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
          {message}
        </p>

        {/* Mood Tip Section */}
        <div className="mt-6 sm:mt-8 max-w-sm mx-auto">
          {/* Tip badge */}
          <div className="flex items-center justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Mood Tip
            </span>
          </div>

          {/* Tip content */}
          <div className="bg-indigo-100/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-slate-200 dark:border-slate-700/50">
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base text-center leading-relaxed">
              &ldquo;Did you know? {randomTip}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

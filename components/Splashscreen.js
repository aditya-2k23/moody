"use client";

import React from 'react';

export default function Splashscreen({ message = "✨ Loading your memories and insights..." }) {
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-purple-300/30 to-indigo-300/20 dark:from-purple-500/20 dark:to-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 left-16 w-48 h-48 bg-gradient-to-tr from-yellow-300/30 to-orange-300/30 dark:from-yellow-400/20 dark:to-orange-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-r from-pink-200/20 to-purple-200/20 dark:from-pink-500/20 dark:to-purple-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col items-center gap-8 relative z-10">
        <h1 className="fugaz text-5xl sm:text-6xl textGradient">Moody</h1>
        {/* Progress bar */}
        <div className="w-64 h-2 bg-indigo-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full animate-loading-bar"></div>
        </div>

        {/* Fun loading messages */}
        <p className="text-gray-600 dark:text-gray-300 text-base mt-4">
          {message}
        </p>
      </div>
    </div>
  );
}

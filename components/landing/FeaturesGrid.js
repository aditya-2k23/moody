import { Brain, ImageIcon, Flame, Mic, Moon } from "lucide-react";

export default function FeaturesGrid() {
  return (
    <section className="py-12 md:py-16" id="features">
      {/* Section Label */}
      <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
        Features
      </p>
      {/* Section Headline */}
      <h2 className="fugaz text-2xl sm:text-3xl md:text-4xl leading-snug mb-10 md:mb-12">
        Engineered for <span className="textGradient">your</span> peace of mind.
      </h2>

      {/* Top Row: AI Insights (wider) + Visual Memories */}
      <div className="grid md:grid-cols-5 gap-4 md:gap-5 mb-4 md:mb-5">
        {/* AI Insights - spans 3 of 5 cols */}
        <div className="md:col-span-3 group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6 sm:p-8 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <Brain size={20} className="text-indigo-500 dark:text-indigo-400" />
            </span>
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-1">AI Insights</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
            Powered by Gemini Flash 3, Moody doesn&apos;t just record data—it
            understands the context of your day.
          </p>
          {/* Decorative preview card */}
          <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/40 p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                <Brain size={12} className="text-indigo-500" />
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                AI Insights
              </span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium">
                New
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-3/4 rounded-full bg-slate-200 dark:bg-slate-600/50" />
              <div className="h-2 w-1/2 rounded-full bg-slate-200 dark:bg-slate-600/50" />
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-3 mt-3">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-1">
                  What influenced your Mood?
                </p>
                <div className="h-2 w-2/3 rounded-full bg-indigo-200 dark:bg-indigo-500/30" />
              </div>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 p-3 mt-2">
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-300 mb-1">
                  Grow Yourself Grace
                </p>
                <div className="h-2 w-1/2 rounded-full bg-purple-200 dark:bg-purple-500/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Visual Memories - spans 2 of 5 cols */}
        <div className="md:col-span-2 group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6 sm:p-8 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <ImageIcon size={20} className="text-purple-500 dark:text-purple-400" />
            </span>
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-1">Visual Memories</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Sync your calendar with visual anchors.
          </p>
          {/* Photo collage decoration */}
          <div className="mt-6 flex gap-2">
            <div className="flex-1 aspect-square rounded-xl bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-500/20 dark:to-purple-500/20 border border-slate-100 dark:border-slate-700/40 flex items-center justify-center">
              <ImageIcon size={24} className="text-indigo-400/60 dark:text-indigo-500/40" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex-1 rounded-xl bg-gradient-to-br from-pink-200 to-indigo-200 dark:from-pink-500/20 dark:to-indigo-500/20 border border-slate-100 dark:border-slate-700/40" />
              <div className="flex-1 rounded-xl bg-gradient-to-br from-violet-200 to-slate-200 dark:from-violet-500/20 dark:to-slate-500/20 border border-slate-100 dark:border-slate-700/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Streaks, Voice Input, Theme Reveal */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        {/* Streaks */}
        <div className="group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6 sm:p-8 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Flame size={20} className="text-orange-500 dark:text-orange-400" />
            </span>
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-1">Streaks</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Gamify your consistency.
          </p>
          {/* Large streak number decoration */}
          <p className="fugaz text-7xl sm:text-8xl text-indigo-100 dark:text-indigo-500/10 absolute bottom-2 right-4 select-none pointer-events-none leading-none">
            12
          </p>
        </div>

        {/* Voice Input */}
        <div className="group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6 sm:p-8 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Mic size={20} className="text-red-500 dark:text-red-400" />
            </span>
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-1">Voice Input</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Just talk. We transcribe.
          </p>
          {/* Sound-wave decoration */}
          <div className="mt-8 flex items-end justify-center gap-1 h-16 opacity-60">
            {[40, 65, 50, 80, 55, 70, 45, 60, 35].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-indigo-300 dark:bg-indigo-500/40"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Theme Reveal */}
        <div className="sm:col-span-2 md:col-span-1 group rounded-2xl border border-slate-700/60 bg-slate-900 dark:bg-slate-800/80 p-6 sm:p-8 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative text-white">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-slate-800 dark:bg-slate-700/60 flex items-center justify-center flex-shrink-0">
              <Moon size={20} className="text-slate-300" />
            </span>
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-1">Theme Reveal</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Syncs with your system.
          </p>
          {/* Toggle decoration */}
          <div className="mt-8 flex items-center justify-end">
            <div className="w-14 h-7 rounded-full bg-indigo-500 relative">
              <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

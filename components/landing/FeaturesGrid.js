import { Brain, ImageIcon, Flame, Mic, Calendar, TrendingUp, Check, Zap, ArrowRight, ScanEye, Sparkles, SearchCheck, Lightbulb } from "lucide-react";

export default function FeaturesGrid() {
  return (
    <section className="py-12 md:py-16" id="features">
      {/* Section Label */}
      <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">
        How It Works
      </p>
      {/* Section Headline */}
      <h2 className="fugaz text-2xl sm:text-3xl md:text-4xl leading-snug mb-2">
        Understand Your Emotions With{" "}
        <span className="textGradient">Data, Not Guesswork.</span>
      </h2>
      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mb-6 md:mb-8 leading-relaxed">
        Moody turns daily reflections into measurable emotional patterns.
      </p>

      {/* Workflow Banner */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 md:mb-10 flex-wrap">
        {[
          { label: "Log", icon: <Zap size={14} /> },
          { label: "Analyze", icon: <Brain size={14} /> },
          { label: "Discover", icon: <TrendingUp size={14} /> },
          { label: "Grow", icon: <Flame size={14} /> },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-300">
              {step.icon}
              {step.label}
            </span>
            {i < 3 && (
              <ArrowRight className="text-indigo-300 dark:text-indigo-500 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Top Row: AI Analysis (wider) + Log Your Day */}
      <div className="grid md:grid-cols-5 gap-4 md:gap-5 mb-4 md:mb-5">
        {/* AI-Powered Analysis - spans 3 of 5 cols */}
        <div className="md:col-span-3 group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6 sm:p-8 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
          {/* Subtle glow for AI card */}
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-purple-400/20 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4 relative z-10">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <Brain size={20} className="text-indigo-500 dark:text-indigo-400" />
            </span>
            <h3 className="font-bold text-base sm:text-lg relative z-10">AI-Powered Analysis</h3>
          </div>

          {/* Bullet points */}
          <ul className="space-y-2.5 mb-4 relative z-10">
            {[
              "Detects emotional triggers automatically",
              "Finds recurring mood patterns",
              "Highlights correlations you miss",
              "Instant cached insights via Redis",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Check size={15} className="text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {/* AI Insight Preview */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-indigo-600/5 dark:to-purple-600/5 border border-indigo-200 dark:border-indigo-500/20 p-4 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                <Sparkles size={12} className="text-indigo-500 dark:text-indigo-400" />
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-200">
                AI Insight
              </span>
              <span className="ml-auto text-indigo-600 dark:text-indigo-300">
                <ScanEye size={18} />
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="rounded-lg bg-white/70 dark:bg-slate-800/50 border border-indigo-200/60 dark:border-indigo-500/10 p-3">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <SearchCheck size={12} /> What influenced your Mood?
                  </span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  &quot;You tend to feel anxious on days before presentations.
                  Consider a 10-minute wind-down routine the night before.&quot;
                </p>
              </div>
              <div className="rounded-lg bg-white/70 dark:bg-slate-800/50 border border-purple-200/60 dark:border-purple-500/10 p-3">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <Lightbulb size={12} /> Pro Tip
                  </span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  &quot;Your mood improved 23% on days you journaled in the morning.
                  Try making it a daily habit.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6 sm:p-8 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <ImageIcon size={20} className="text-emerald-500 dark:text-emerald-400" />
            </span>
            <h3 className="font-bold text-base sm:text-lg">Log Your Day</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            Capture your emotional state in seconds.
          </p>

          {/* Bullet points */}
          <ul className="space-y-2.5 mb-8">
            {[
              "One-click mood picker",
              "Write or dictate your journal",
              "Add visual memories",
              "Edit past entries anytime",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Check size={15} className="text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {/* Mini mood picker preview */}
          <div className="flex items-center justify-center gap-3 pt-6 sm:pt-10 border-t border-slate-200 dark:border-slate-700/40 cursor-default">
            {["😭", "😢", "😐", "😊", "😍"].map((emoji, i) => (
              <span
                key={i}
                className={`w-14 h-14 flex items-center justify-center text-2xl rounded-full border transition-all duration-200 ${i === 3
                  ? "scale-110 hover:scale-125 border-indigo-300 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 shadow-md shadow-indigo-200/50 dark:shadow-indigo-500/20"
                  : "border-slate-200 dark:border-slate-700 hover:scale-110"
                  }`}
              >
                {emoji}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-3 italic">
            Takes less than 30 seconds.
          </p>
        </div>
      </div>

      {/* See Your Patterns, Streaks + Voice (merged), Mood Correlation */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">

        {/* See Your Patterns */}
        <div className="group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6 sm:p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-1">
            <span className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar size={20} className="text-violet-500 dark:text-violet-400" />
            </span>
            <h3 className="font-bold text-base sm:text-lg">See Your Patterns</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            Data you can actually act on.
          </p>

          {/* Mini calendar heatmap decoration */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {[
              3, 4, 2, 5, 4, 3, 1,
              2, 5, 5, 3, 4, 2, 3,
              4, 3, 5, 4, 5, 5, 4,
              5, 4, 3, 5, 4, 5, 3,
            ].map((intensity, i) => {
              const colors = [
                "bg-slate-100 dark:bg-slate-700/30",       // 1 — low
                "bg-indigo-100 dark:bg-indigo-500/15",     // 2
                "bg-indigo-200 dark:bg-indigo-500/25",     // 3
                "bg-indigo-300 dark:bg-indigo-500/40",     // 4
                "bg-indigo-500 dark:bg-indigo-400",        // 5 — high
              ];
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-[3px] ${colors[intensity - 1]} hover:scale-110 transition-all duration-200`}
                />
              );
            })}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            You stop guessing. You see data.
          </p>
        </div>

        {/* Streaks & Voice Input — merged */}
        <div className="group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6 sm:p-8 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-red-600/20 dark:bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2 mb-2">
            <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Flame size={20} className="text-orange-500 dark:text-orange-400" />
            </span>
            <span className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Mic size={20} className="text-red-500 dark:text-red-400" />
            </span>
            <h3 className="font-bold text-base sm:text-lg">Streaks & Voice</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
            Stay consistent. Just talk—we transcribe, you reflect.
          </p>

          {/* Bullet points */}
          <ul className="space-y-2 mb-2 relative z-10">
            {[
              "Daily streak counter",
              "Voice-to-text journal in one tap",
              "Auto-save drafts as you speak",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Check size={15} className="text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {/* Sound-wave decoration */}
          <div className="flex items-end justify-start gap-1 h-14 opacity-50">
            {[40, 65, 50, 80, 55, 70, 45, 60, 35, 55, 70, 45].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-indigo-300 dark:bg-indigo-500/40"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          {/* Streak number decoration */}
          <p className="fugaz text-7xl sm:text-8xl text-indigo-100 dark:text-indigo-500/10 absolute bottom-1 right-4 select-none pointer-events-none leading-none">
            123
          </p>
        </div>

        {/* Mood Correlation Engine — replaces Theme Reveal */}
        <div className="sm:col-span-2 md:col-span-1 group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-slate-800/80 dark:to-indigo-900/30 p-6 sm:p-8 hover:shadow-xl hover:shadow-indigo-500/15 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative text-white">
          {/* Decorative glow */}
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-purple-500/20 dark:bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start gap-3 mb-4 relative z-10">
            <span className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={20} className="text-indigo-300" />
            </span>
          </div>
          <h3 className="font-bold text-base sm:text-lg relative z-10">Mood Correlation</h3>
          <p className="text-sm text-indigo-200/70 leading-relaxed mb-4 relative z-10">
            Discover hidden patterns in your emotional data.
          </p>

          {/* Mini trend line SVG */}
          <div className="relative z-10 mt-2">
            <svg
              viewBox="0 0 200 60"
              className="w-full h-auto"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 45 C 30 50, 50 35, 70 38 S 110 15, 130 22 S 160 10, 190 8"
                stroke="url(#trendGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* Data points */}
              {[
                [10, 45], [40, 42], [70, 38], [100, 25], [130, 22], [160, 14], [190, 8]
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3" className="fill-indigo-400" />
              ))}
            </svg>
          </div>

          <ul className="space-y-1.5 mt-4 relative z-10">
            {["Identify low Mondays", "Detect stress spikes", "Track improvement over time"].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-indigo-200/80">
                <Check size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

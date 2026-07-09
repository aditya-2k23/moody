"use client";

import { useMemo } from "react";
import { calculateConsistency, calculateMoodHeatmap } from "@/utils/analytics";
import { Flame } from "lucide-react";

/**
 * Displays the user's journaling consistency over the selected timeframe,
 * including current streak, completion rate, and a 28-day mood heatmap grid.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.data - The user's mood data object.
 * @param {number} [props.days=30] - The timeframe in days to evaluate completion rates against.
 * @returns {JSX.Element} The rendered JournalingConsistency component.
 */
export default function JournalingConsistency({ data, days = 30 }) {
  const consistency = useMemo(() => {
    return calculateConsistency(data, days);
  }, [data, days]);

  const heatmap = useMemo(() => {
    return calculateMoodHeatmap(data, 28);
  }, [data]);

  return (
    <div className="analytics-card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 border border-slate-200 dark:border-white/[0.05] flex flex-col h-[400px] shadow-sm">
      <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Consistency</h3>

      <div className="flex-1 flex justify-between items-center relative">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 dark:text-slate-400 font-semibold mb-2">Current Streak</span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-bold text-slate-800 dark:text-white leading-none">
              {consistency.currentStreak}
            </span>
            <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">days</span>
          </div>
        </div>
        <div className="relative p-4 flex-shrink-0">
          {/* Orange/Yellow Glow behind the purple flame */}
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/20 to-yellow-300/20 dark:from-orange-500/10 dark:to-yellow-500/10 blur-xl rounded-full scale-90" />
          <Flame size={100} strokeWidth={2} className="relative z-10 text-orange-400 dark:text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.2)] dark:drop-shadow-[0_0_10px_rgba(249,115,22,0.15)] outline-none" />
        </div>
      </div>

      <div className="h-px w-full bg-slate-200 dark:bg-white/[0.05] mb-4"></div>

      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 dark:text-slate-400 font-semibold">
            Last 28 Days
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Mood color</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {heatmap.map((day) => (
            <span
              key={day.timestamp}
              className="h-3 w-3 rounded-full ring-1 ring-black/5 dark:ring-white/10"
              style={{
                backgroundColor: day.hasEntry ? day.color : "rgba(148, 163, 184, 0.22)",
                opacity: day.hasEntry ? 1 : 0.7
              }}
              title={day.hasEntry ? `${day.date}: ${day.emoji} ${day.moodName}` : `${day.date}: no mood logged`}
              aria-label={day.hasEntry ? `${day.date}: ${day.moodName}` : `${day.date}: no mood logged`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 dark:text-slate-400 font-semibold mb-1">All time Longest</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-none">
            {consistency.longestStreak}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 dark:text-slate-400 font-semibold mb-1">Journaling</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-none">
            {consistency.percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

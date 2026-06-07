"use client";

import { useMemo } from "react";
import { calculateConsistency } from "@/utils/analytics";
import { Flame } from "lucide-react";

export default function JournalingConsistency({ data, days = 30 }) {
  const consistency = useMemo(() => {
    return calculateConsistency(data, days);
  }, [data, days]);

  return (
    <div className="bg-slate-50 dark:bg-[#1a1b26] rounded-[24px] p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm">
      <div className="mb-8">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Consistency</h3>
      </div>

      <div className="flex-1 flex justify-between items-center mb-6 relative">
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
          <Flame size={100} strokeWidth={2} className="relative z-10 text-purple-600 dark:text-purple-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.2)] dark:drop-shadow-[0_0_10px_rgba(249,115,22,0.15)] outline-none" />
        </div>
      </div>

      <div className="h-px w-full bg-slate-200 dark:bg-white/[0.05] mb-6"></div>

      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 dark:text-slate-400 font-semibold mb-1">Longest</span>
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

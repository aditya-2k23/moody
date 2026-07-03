"use client";

import { useMemo } from "react";
import {
  calculateMonthlyComparison,
  calculateMoodMomentum,
  calculateMoodRecoveryTime,
  calculateJournalLift,
  calculateEmotionalRange,
  calculateMonthOverMonth
} from "@/utils/analytics/calculateMonthlyComparison";
import { Sparkles } from "lucide-react";

export default function MonthlyComparison({ data }) {
  const { currentStats, prevStats } = useMemo(() => {
    return calculateMonthlyComparison(data);
  }, [data]);

  const momentum = useMemo(() => {
    return currentStats?.entries ? calculateMoodMomentum(currentStats.entries) : { score: 5, label: 'Neutral', direction: 'flat' };
  }, [currentStats]);

  const recovery = useMemo(() => {
    return currentStats?.entries ? calculateMoodRecoveryTime(currentStats.entries) : { avgDays: null, occurrences: 0 };
  }, [currentStats]);

  const journalLift = useMemo(() => {
    return currentStats?.monthData ? calculateJournalLift(currentStats.monthData) : { journaledAvg: 0, unjournaledAvg: 0, lift: 0, meaningful: false };
  }, [currentStats]);

  const emotionalRange = useMemo(() => {
    return currentStats?.entries ? calculateEmotionalRange(currentStats.entries) : { peak: null, trough: null };
  }, [currentStats]);

  const monthOverMonth = useMemo(() => {
    return (currentStats && prevStats && prevStats.count > 0)
      ? calculateMonthOverMonth(prevStats.average, currentStats.average)
      : null;
  }, [currentStats, prevStats]);

  if (!currentStats || currentStats.count === 0) {
    return (
      <div className="analytics-card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col w-full shadow-sm text-center items-center justify-center min-h-[160px]">
        <div className="bg-indigo-100 dark:bg-indigo-500/10 p-2.5 rounded-full mb-3">
          <Sparkles size={20} className="text-indigo-500 dark:text-indigo-400" />
        </div>
        <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
          Monthly Reflection
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Not enough data logged this month to compare. Keep tracking your moods or backdate entries using the calendar to see monthly comparisons!
        </p>
      </div>
    );
  }

  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="analytics-card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col w-full shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-500 dark:text-indigo-400" />
          <h2 className="font-medium fugaz text-slate-800 dark:text-slate-100">Monthly Reflection</h2>
        </div>
        <p className="text-lg font-bold fugaz text-slate-600 dark:text-white mt-1">
          {currentMonthName} vs {prevMonthName}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {monthOverMonth ? (
          <div className="text-slate-700 dark:text-slate-200 text-lg">
            <span className="font-medium">{monthOverMonth.fromEmoji} {monthOverMonth.fromLabel}</span>
            <span className="mx-3 text-slate-500 dark:text-slate-400">→</span>
            <span className="font-medium">{monthOverMonth.toEmoji} {monthOverMonth.toLabel}</span>
            <span className={`ml-3 font-semibold ${currentStats.average > prevStats.average ? 'text-indigo-500 dark:text-indigo-400' :
              currentStats.average < prevStats.average ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500'
              }`}>
              {currentStats.average > prevStats.average ? '+' : currentStats.average < prevStats.average ? '-' : ''}{monthOverMonth.pctChange}%
            </span>
          </div>
        ) : (
          <div className="text-slate-500 dark:text-slate-400">
            Not enough data from last month to compare. Keep journaling!
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/60 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-700/50 p-3 flex flex-col justify-center">
            <div className="text-[10px] uppercase tracking-wide text-indigo-500 dark:text-slate-400 mb-1 font-semibold">MOMENTUM</div>
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">{momentum.label}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">Month ended {momentum.direction}</div>
          </div>

          <div className="rounded-xl bg-white/60 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-700/50 p-3 flex flex-col justify-center">
            <div className="text-[10px] uppercase tracking-wide text-indigo-500 dark:text-slate-400 mb-1 font-semibold">RECOVERY</div>
            {recovery.occurrences === 0 ? (
              <>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">No low days 🌟</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">This month</div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">{recovery.avgDays}d avg</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">to bounce back ({recovery.occurrences} dip{recovery.occurrences > 1 ? 's' : ''})</div>
              </>
            )}
          </div>

          <div className="rounded-xl bg-white/60 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-700/50 p-3 flex flex-col justify-center">
            <div className="text-[10px] uppercase tracking-wide text-indigo-500 dark:text-slate-400 mb-1 font-semibold">JOURNAL LIFT</div>
            {journalLift.meaningful ? (
              <>
                <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 leading-tight truncate">+{journalLift.lift} pts</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">mood boost on journal days</div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">Keep journaling</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">Need more entries to measure</div>
              </>
            )}
          </div>

          <div className="rounded-xl bg-white/60 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-700/50 p-3 flex flex-col justify-center">
            <div className="text-[10px] uppercase tracking-wide text-indigo-500 dark:text-slate-400 mb-1 font-semibold">EMOTIONAL RANGE</div>
            {emotionalRange.peak && emotionalRange.trough ? (
              <>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">{emotionalRange.peak.emoji} → {emotionalRange.trough.emoji}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {emotionalRange.peak.label} / {emotionalRange.trough.label}
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">Not enough data</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">To calculate range</div>
              </>
            )}
          </div>
        </div>

        {monthOverMonth && (
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overall trend: <span className="font-medium text-slate-700 dark:text-slate-300">{monthOverMonth.fromLabel} → {monthOverMonth.toLabel} over the month</span>
          </div>
        )}
      </div>
    </div>
  );
}

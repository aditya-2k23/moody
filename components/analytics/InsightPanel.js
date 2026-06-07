"use client";

import { useMemo } from "react";
import { 
  calculateMoodTrends, 
  calculateDistribution, 
  calculateWeeklyPatterns,
  calculateBestWorstPeriods,
  calculateMicroInsight
} from "@/utils/analytics";
import { moods as emojiMap } from "@/utils/index";

export default function InsightPanel({ data, days = 30 }) {
  const { trends, distribution, weekly, periods, microInsight } = useMemo(() => {
    const nextTrends = calculateMoodTrends(data, days);
    const nextWeekly = calculateWeeklyPatterns(data, days);

    return {
      trends: nextTrends,
      distribution: calculateDistribution(data, days),
      weekly: nextWeekly,
      periods: days >= 30 ? calculateBestWorstPeriods(nextTrends) : null,
      microInsight: calculateMicroInsight(nextTrends, nextWeekly)
    };
  }, [data, days]);

  const { title, summary } = useMemo(() => {
    let mainTitle = `Feeling steady this ${days === 7 ? 'week' : 'period'}`;
    let summaryText = "Log a few more days to unlock a clearer trend.";

    if (trends.length >= 5) {
      const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
      const secondHalf = trends.slice(Math.floor(trends.length / 2));
      const avgFirst = firstHalf.reduce((sum, item) => sum + (item.score || 5), 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, item) => sum + (item.score || 5), 0) / secondHalf.length;
      
      if (avgSecond > avgFirst + 1.5) {
        mainTitle = `Feeling brighter this ${days === 7 ? 'week' : 'period'}`;
        summaryText = "Your recent logged moods are trending higher than earlier in this range.";
      } else if (avgSecond > avgFirst + 0.5) {
        mainTitle = `Feeling steadier this ${days === 7 ? 'week' : 'period'}`;
        summaryText = "Your recent logged moods are a little stronger than the earlier days shown.";
      } else if (avgSecond < avgFirst - 1.5) {
        mainTitle = `A challenging ${days === 7 ? 'week' : 'period'}`;
        summaryText = "Your recent logged moods are lower than earlier in this range.";
      } else if (avgSecond < avgFirst - 0.5) {
        mainTitle = `Feeling a bit lower this ${days === 7 ? 'week' : 'period'}`;
        summaryText = "Your recent logged moods have dipped slightly compared with earlier days.";
      } else {
        summaryText = "Your logged moods have stayed relatively steady across this range.";
      }
    }

    return { title: mainTitle, summary: summaryText };
  }, [trends, days]);

  const topMood = distribution[0];
  const showPeriods = days >= 30 && periods?.bestWeek && periods?.toughestPeriod;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm">
      <h3 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white leading-tight mb-8 pr-4">
        {title}
      </h3>

      <div className="flex-1 flex flex-col gap-5 text-sm sm:text-base">
        <div className="rounded-xl border border-indigo-200/70 bg-white/70 px-4 py-3 text-sm font-medium text-indigo-700 dark:border-indigo-300/10 dark:bg-white/[0.04] dark:text-indigo-200">
          {microInsight}
        </div>

        {topMood && (
          <div>
            <span className="text-slate-500 dark:text-slate-400">Most common mood: </span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              {emojiMap[topMood.moodName]} {topMood.moodName}.
            </span>
          </div>
        )}

        {weekly?.bestDay && (
          <div>
            <span className="text-slate-500 dark:text-slate-400">Best day: </span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">{weekly.bestDay}.</span>
          </div>
        )}

        {showPeriods && (
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Best week: </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{periods.bestWeek.label}.</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Toughest period: </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{periods.toughestPeriod.label}.</span>
            </div>
          </div>
        )}
        
        <div className="h-px w-full bg-slate-200 dark:bg-white/[0.05] my-2"></div>
        
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
          {summary}
        </p>
      </div>
    </div>
  );
}

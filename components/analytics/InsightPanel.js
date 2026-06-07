"use client";

import { useMemo } from "react";
import { 
  calculateMoodTrends, 
  calculateDistribution, 
  calculateWeeklyPatterns 
} from "@/utils/analytics";
import { moods as emojiMap } from "@/utils/index";

export default function InsightPanel({ data, days = 30 }) {
  const { trends, distribution, weekly } = useMemo(() => {
    return {
      trends: calculateMoodTrends(data, days),
      distribution: calculateDistribution(data, days),
      weekly: calculateWeeklyPatterns(data, days)
    };
  }, [data, days]);

  const { title, insights } = useMemo(() => {
    let mainTitle = `Feeling steady this ${days === 7 ? 'week' : 'period'}`;
    const insightsList = [];

    if (trends.length >= 5) {
      const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
      const secondHalf = trends.slice(Math.floor(trends.length / 2));
      const avgFirst = firstHalf.reduce((sum, item) => sum + (item.score || 5), 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, item) => sum + (item.score || 5), 0) / secondHalf.length;
      
      if (avgSecond > avgFirst + 1.5) mainTitle = `Feeling brighter this ${days === 7 ? 'week' : 'period'}`;
      else if (avgSecond > avgFirst + 0.5) mainTitle = `Feeling steadier this ${days === 7 ? 'week' : 'period'}`;
      else if (avgSecond < avgFirst - 1.5) mainTitle = `A challenging ${days === 7 ? 'week' : 'period'}`;
      else if (avgSecond < avgFirst - 0.5) mainTitle = `Feeling a bit lower this ${days === 7 ? 'week' : 'period'}`;
    }

    if (distribution.length > 0) {
      const topMood = distribution[0];
      insightsList.push(
        <div key="mood">
          <span className="text-slate-500 dark:text-slate-400">Most common mood: </span>
          <span className="text-slate-800 dark:text-slate-200 font-medium">
            {emojiMap[topMood.moodName]} {topMood.moodName}.
          </span>
        </div>
      );
    }

    if (weekly && weekly.bestDay) {
      insightsList.push(
        <div key="day">
          <span className="text-slate-500 dark:text-slate-400">Best day: </span>
          <span className="text-slate-800 dark:text-slate-200 font-medium">{weekly.bestDay}.</span>
        </div>
      );
    }

    insightsList.push(
      <p key="gen" className="text-slate-500 dark:text-slate-400 leading-relaxed">
        You tend to feel better on weekends and journal more consistently when attaching memories.
      </p>
    );

    return { title: mainTitle, insights: insightsList };
  }, [trends, distribution, weekly, days]);

  return (
    <div className="bg-slate-50 dark:bg-[#1a1b26] rounded-[24px] p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm">
      <h3 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white leading-tight mb-8 pr-4">
        {title}
      </h3>

      <div className="flex-1 flex flex-col gap-5 text-sm sm:text-base">
        {insights[0]}
        {insights[1]}
        
        <div className="h-px w-full bg-slate-200 dark:bg-white/[0.05] my-2"></div>
        
        {insights[2]}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { calculateMonthlyComparison } from "@/utils/analytics/calculateMonthlyComparison";
import { Sparkles } from "lucide-react";

export default function MonthlyComparison({ data }) {
  const { currentStats, prevStats } = useMemo(() => {
    return calculateMonthlyComparison(data);
  }, [data]);

  if (!currentStats || currentStats.count === 0) return null;

  let text1 = "Not enough data from last month to compare.";
  let text2 = "Keep journaling to see insights!";

  if (prevStats && prevStats.count > 0) {
    const moodDiff = currentStats.average - prevStats.average;
    const moodPercent = prevStats.average > 0 ? (Math.abs(moodDiff) / prevStats.average) * 100 : 0;
    const moodStr = moodDiff > 0 
      ? `Mood improved by ${Math.round(moodPercent)}%` 
      : moodDiff < 0 
        ? `Mood dipped by ${Math.round(moodPercent)}%` 
        : "Mood remained stable";

    const freqStr = currentStats.count > prevStats.count 
      ? "Journaling frequency increased" 
      : currentStats.count < prevStats.count 
        ? "Journaling frequency decreased" 
        : "Journaling frequency remained the same";

    const varDiff = currentStats.variability - prevStats.variability;
    const varStr = varDiff > 0 
      ? "Mood variability increased" 
      : varDiff < 0 
        ? "Mood variability decreased" 
        : "Mood variability was unchanged";

    text1 = `Compared to last month: <span class="text-indigo-500 dark:text-indigo-400 font-medium">${moodStr}</span>, ${freqStr}, ${varStr}.`;
    
    text2 = `Overall trend: <span class="font-medium text-slate-700 dark:text-slate-200">${moodDiff > 0 ? 'More positive' : 'More emotionally stable'}</span>.`;
  }

  return (
    <div className="bg-slate-50 dark:bg-[#1a1b26] rounded-[24px] p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col w-full shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={18} className="text-indigo-500 dark:text-indigo-400" />
        <h3 className="font-medium text-slate-800 dark:text-slate-100">Monthly Reflection</h3>
      </div>
      
      <div className="flex flex-col gap-6 text-slate-600 dark:text-slate-300">
        <p className="leading-relaxed" dangerouslySetInnerHTML={{ __html: text1 }}></p>
        <p className="leading-relaxed" dangerouslySetInnerHTML={{ __html: text2 }}></p>
      </div>
    </div>
  );
}

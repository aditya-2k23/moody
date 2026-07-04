"use client";

import { useMemo, useState, useEffect } from "react";
import {
  calculateMoodTrends,
  calculateDistribution,
  calculateWeeklyPatterns,
  calculateBestWorstPeriods,
  calculateMicroInsight,
  calculateConsistency
} from "@/utils/analytics";
import { moods as emojiMap } from "@/utils/index";
import { useAuth } from "@/context/authContext";
import { generateTrendsInsight } from "@/app/actions/insights";
import { Maximize2, Minimize2 } from "lucide-react";

export default function InsightPanel({ data, days = 30, isExpanded = false, isMaximized, onToggleMaximize }) {
  const { currentUser } = useAuth();
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [lastInsightHash, setLastInsightHash] = useState(null);

  const { trends, distribution, weekly, periods, microInsight, consistency } = useMemo(() => {
    const nextTrends = calculateMoodTrends(data, days);
    const nextWeekly = calculateWeeklyPatterns(data, days);

    return {
      trends: nextTrends,
      distribution: calculateDistribution(data, days),
      weekly: nextWeekly,
      periods: days >= 30 ? calculateBestWorstPeriods(nextTrends) : null,
      microInsight: calculateMicroInsight(nextTrends, nextWeekly),
      consistency: calculateConsistency(data, days)
    };
  }, [data, days]);

  const loggedCount = useMemo(() => {
    return trends.filter(item => typeof item.score === 'number').length;
  }, [trends]);

  useEffect(() => {
    const currentHash = `${days}-${consistency.totalEntries}`;
    if (aiInsight && lastInsightHash !== currentHash) {
      setAiInsight(null);
      setAiError(null);
      return;
    }

    if (isExpanded && loggedCount >= 3 && !aiInsight && !loadingAi && currentUser) {
      const cacheKey = `moody_insight_${currentUser.uid}_${days}_${consistency.totalEntries}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        setAiInsight(cached);
        setLastInsightHash(currentHash);
        return;
      }

      const fetchAiInsight = async () => {
        if (consistency.totalEntries < 5) {
          setAiInsight("Not enough data yet — keep logging to unlock your trends.");
          setLastInsightHash(currentHash);
          return;
        }

        setLoadingAi(true);
        try {
          const idToken = await currentUser.getIdToken();
          const distributionSummary = distribution.map(d => `${d.moodName}: ${d.percentage}%`).join(", ");

          let variance = "low";
          if (trends.length > 0) {
            const validScores = trends.filter(t => typeof t.score === 'number').map(t => t.score);
            if (validScores.length > 0) {
              const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
              const sqDiffs = validScores.map(s => Math.pow(s - avg, 2));
              const varVal = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / validScores.length);
              const roundedVar = Math.round(varVal * 10) / 10;
              if (roundedVar < 2) variance = "low";
              else if (roundedVar <= 3.5) variance = "medium";
              else variance = "high";
            }
          }

          let trendDirection = "stable";
          if (trends.length >= 5) {
            const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
            const secondHalf = trends.slice(Math.floor(trends.length / 2));
            const avgFirst = firstHalf.reduce((sum, item) => sum + (item.score || 5), 0) / firstHalf.length;
            const avgSecond = secondHalf.reduce((sum, item) => sum + (item.score || 5), 0) / secondHalf.length;
            if (avgSecond > avgFirst + 0.5) trendDirection = "improving";
            else if (avgSecond < avgFirst - 0.5) trendDirection = "declining";
          }

          let journalCorrelation = "neutral";
          const journaledDays = trends.filter(t => t.hasJournal && typeof t.score === 'number');
          const unjournaledDays = trends.filter(t => !t.hasJournal && typeof t.score === 'number');
          if (journaledDays.length > 0 && unjournaledDays.length > 0) {
            const jAvg = journaledDays.reduce((sum, item) => sum + item.score, 0) / journaledDays.length;
            const ujAvg = unjournaledDays.reduce((sum, item) => sum + item.score, 0) / unjournaledDays.length;
            if (jAvg > ujAvg + 1) journalCorrelation = "positive";
          }

          const stats = {
            days,
            totalEntries: consistency.totalEntries,
            topMood: distribution[0]?.moodName || "N/A",
            longestStreak: consistency.longestStreak,
            bestDay: weekly?.bestDay || "N/A",
            loggingRate: Math.round((consistency.totalEntries / days) * 100) || 0,
            distributionSummary,
            trendDirection,
            variance,
            worstDay: weekly?.lowestDay || "N/A",
            journalCorrelation,
            bestWeekAvg: periods?.bestWeek?.average || "N/A",
            bestWeekDate: periods?.bestWeek?.label || "N/A",
            worstWeekAvg: periods?.toughestPeriod?.average || "N/A",
            worstWeekDate: periods?.toughestPeriod?.label || "N/A",
          };
          const res = await generateTrendsInsight(idToken, stats);
          if (res.success) {
            setAiInsight(res.data);
            setLastInsightHash(currentHash);
            localStorage.setItem(`moody_insight_${currentUser.uid}_${days}_${consistency.totalEntries}`, res.data);
          } else {
            setAiError(res.error);
          }
        } catch (error) {
          setAiError("Failed to fetch AI insights.");
        } finally {
          setLoadingAi(false);
        }
      };
      fetchAiInsight();
    }
  }, [isExpanded, loggedCount, aiInsight, loadingAi, currentUser, consistency, distribution, weekly, days, lastInsightHash, periods, trends]);

  // Handle switching timeframes to check cache immediately
  useEffect(() => {
    if (!currentUser) return;
    const cacheKey = `moody_insight_${currentUser.uid}_${days}_${consistency.totalEntries}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setAiInsight(cached);
      setLastInsightHash(`${days}-${consistency.totalEntries}`);
    }
  }, [days, consistency.totalEntries, currentUser]);

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

  if (loggedCount < 3) {
    return (
      <div className="analytics-card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm justify-between">
        <div>
          <h3 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white leading-tight mb-6">
            Insights Await
          </h3>

          <div className="rounded-xl border border-indigo-200/70 bg-white/70 px-4 py-4 text-xs font-medium text-indigo-700 dark:border-indigo-300/10 dark:bg-white/[0.04] dark:text-indigo-200 mb-6 flex items-start gap-2.5">
            <span className="text-base leading-none">🧠</span>
            <div>
              <p className="font-semibold mb-1">AI-Powered Pattern Analysis</p>
              <p className="text-slate-500 dark:text-indigo-200/60 leading-relaxed font-normal">
                Once you log 3 or more days, we&apos;ll scan your moods to uncover your emotional cycles, best days, and weekly trends.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span>📅</span>
              <span>Weekly pattern analysis</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span>📊</span>
              <span>Long-term mood comparisons</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span>⚡</span>
              <span>Journaling-mood correlations</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 dark:border-white/[0.05] pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Please log more moods to unlock these stats. Remember, you can backdate entries using the calendar!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm">
      <div className="flex items-start justify-between mb-8 gap-4">
        <h3 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white leading-tight">
          {title}
        </h3>
        {onToggleMaximize && (
          <button 
            onClick={onToggleMaximize}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-lg transition-colors mt-1"
            title={isMaximized ? "Restore view" : "Maximize insights"}
          >
            {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-5 text-sm sm:text-base">
        {aiInsight ? (
          lastInsightHash === `${days}-${consistency.totalEntries}` ? (
            <div className="rounded-xl border border-indigo-200/70 bg-white/70 px-4 py-3 text-sm font-medium text-indigo-700 dark:border-indigo-300/10 dark:bg-white/[0.04] dark:text-indigo-200">
              {aiInsight}
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-200/70 bg-white/70 px-4 py-3 text-sm font-medium text-indigo-700 dark:border-indigo-300/10 dark:bg-white/[0.04] dark:text-indigo-200 flex flex-col gap-2 transition-all">
              <span className="opacity-60 italic leading-relaxed">{aiInsight}</span>
              <div className="flex items-center justify-between border-t border-indigo-200/50 dark:border-indigo-500/20 pt-2.5 mt-1">
                <span className="text-xs opacity-80">Timeframe or data changed</span>
                <button 
                  onClick={() => {
                    setAiInsight(null);
                    setAiError(null);
                  }}
                  className="text-xs bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                >
                  Regenerate Insight
                </button>
              </div>
            </div>
          )
        ) : loadingAi ? (
          <div className="rounded-xl border border-indigo-200/70 bg-white/70 px-4 py-3 dark:border-indigo-300/10 dark:bg-white/[0.04] animate-pulse h-16">
            <div className="h-2.5 bg-indigo-200 dark:bg-indigo-900/50 rounded w-3/4 mb-2"></div>
            <div className="h-2.5 bg-indigo-200 dark:bg-indigo-900/50 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="rounded-xl border border-indigo-200/70 bg-white/70 px-4 py-3 text-sm font-medium text-indigo-700 dark:border-indigo-300/10 dark:bg-white/[0.04] dark:text-indigo-200">
            {microInsight}
          </div>
        )}

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

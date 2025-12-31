"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { moods } from "@/utils";

/**
 * AIInsightsSection - Displays AI-generated journal insights with smooth animations
 * 
 * States:
 * - isGenerating: true while fetching AI results (shows skeleton/loading)
 * - hasResult: true when insights data is available
 * 
 * Animations:
 * - Section entrance: fade + slide up (200-300ms)
 * - Loading: blur + shimmer effect on skeleton
 * - Results: smooth blur removal + content fade-in
 */
export default function AIInsightsSection({ insights, isLoading }) {
  // Track if component should be visible (for entrance animation)
  const [isVisible, setIsVisible] = useState(false);
  // Track if content has finished loading (for blur transition)
  const [showContent, setShowContent] = useState(false);

  // Handle entrance animation
  useEffect(() => {
    if (isLoading || insights) {
      // Small delay to ensure DOM is ready for animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setShowContent(false);
    }
  }, [isLoading, insights]);

  // Handle content reveal after loading completes
  useEffect(() => {
    if (insights && !isLoading) {
      // Small delay for smooth blur-to-content transition
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else if (isLoading) {
      setShowContent(false);
    }
  }, [insights, isLoading]);

  // Don't render if neither loading nor has insights
  if (!isLoading && !insights) return null;

  return (
    <div
      className={`transition-all duration-300 ease-out ${isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2"
        }`}
    >
      {/* Section Header */}
      <h2 className="text-xl md:text-2xl flex gap-1 md:gap-2 mt-2 md:mt-4 mb-6 font-bold text-gray-800 dark:text-gray-200 fugaz">
        <Image src="/ai.svg" alt="AI Icon" width={26} height={26} />
        AI Insights
        {showContent && insights && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/40 dark:text-green-300 animate-insights-badge">
            <i className="fa-solid fa-check mr-1 text-[10px]"></i>
            Analysis Complete
          </span>
        )}
      </h2>

      {/* Emotional Triggers Card */}
      <InsightCard
        isLoading={isLoading}
        showContent={showContent}
        icon="🧩"
        iconBg="bg-purple-500/75 sm:bg-purple-500/90"
        title="emotional triggers"
        gradientPositions={{
          top: "top-0 left-10",
          topColors: "from-yellow-400/40 to-orange-400/30 dark:from-purple-400/40 dark:to-indigo-400/40"
        }}
      >
        {insights && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/75 sm:bg-purple-500/90 rounded-xl flex items-center justify-center cursor-default glow">
                  <span className="text-2xl">🧩</span>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
                  emotional triggers
                </h3>
              </div>

              <div className="flex flex-col items-center justify-between min-w-[90px]">
                <span className="text-xl md:text-2xl lg:text-3xl">{moods[insights.mood] || '😄'}</span>
                <span className="text-sm md:text-base font-semibold text-indigo-500 dark:text-indigo-400 capitalize fugaz">
                  {insights.mood}
                </span>
              </div>
            </div>

            <h4 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              What Influenced your Mood
            </h4>

            {insights.summary && (
              <p className="text-gray-600 dark:text-gray-300/90 leading-relaxed">
                {insights.summary}
              </p>
            )}

            {Array.isArray(insights.triggers) && insights.triggers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {insights.triggers.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-100 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-200 dark:border-none shadow-sm hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-all duration-150"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </InsightCard>

      {/* Personalized Insight Card */}
      <InsightCard
        isLoading={isLoading}
        showContent={showContent}
        icon="💡"
        iconBg="bg-blue-500/75 sm:bg-blue-500/90"
        title="personalized insight"
        className="mt-6"
        gradientPositions={{
          top: "top-0 left-10",
          topColors: "from-yellow-400/40 to-orange-400/30 dark:from-cyan-400/30 dark:to-sky-400/30",
          bottom: "bottom-1 right-12",
          bottomColors: "from-lime-400/50 to-green-500/40 dark:from-lime-400/30 dark:to-green-300/30"
        }}
      >
        {insights && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/75 sm:bg-blue-500/90 rounded-xl flex items-center justify-center cursor-default glow">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
                  PERSONALIZED INSIGHT
                </h3>
              </div>

              <div className="flex flex-col items-center justify-between min-w-[90px]">
                <span className="text-xl md:text-2xl lg:text-3xl">{moods[insights.mood] || '😄'}</span>
                <span className="text-sm md:text-base font-semibold text-indigo-500 dark:text-indigo-400 capitalize fugaz">
                  {insights.mood}
                </span>
              </div>
            </div>

            <h4 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              {insights.headline || "Personalized Insight"}
            </h4>

            <p className="text-gray-600 dark:text-gray-300/90 leading-relaxed mb-4">
              {insights.insight}
            </p>

            <div className="bg-lime-50/90 dark:bg-lime-400/35 border border-lime-400/70 dark:border-lime-200/70 rounded-xl p-3">
              <p className="text-sm text-lime-600 dark:text-lime-300">
                <span className="font-semibold dark:font-bold">💡 Pro tip:</span> {insights.pro_tip}
              </p>
            </div>
          </>
        )}
      </InsightCard>
    </div>
  );
}

/**
 * InsightCard - Reusable card component with loading skeleton
 */
function InsightCard({
  isLoading,
  showContent,
  children,
  className = "",
  gradientPositions = {}
}) {
  return (
    <div
      className={`bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/70 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden ${className}`}
    >
      {/* Background gradients */}
      {gradientPositions.top && (
        <div className={`absolute ${gradientPositions.top} w-28 h-28 bg-gradient-to-tr ${gradientPositions.topColors} rounded-full blur-3xl pointer-events-none`} />
      )}
      {gradientPositions.bottom && (
        <div className={`absolute ${gradientPositions.bottom} w-28 h-28 bg-gradient-to-tr ${gradientPositions.bottomColors} rounded-full blur-3xl pointer-events-none`} />
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="relative z-10 animate-insights-skeleton">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-insights-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />

          {/* Skeleton content */}
          <div className="space-y-4 opacity-70">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>

            {/* Title skeleton */}
            <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />

            {/* Content skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>

            {/* Tags skeleton */}
            <div className="flex gap-2 mt-4">
              <div className="h-6 w-16 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
              <div className="h-6 w-14 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Actual Content */}
      {!isLoading && showContent && (
        <div className="relative z-10 animate-insights-content">
          {children}
        </div>
      )}

      {/* Blur overlay during loading (applied to content area only) */}
      {isLoading && (
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/10 dark:bg-slate-900/10 rounded-2xl transition-all duration-300 pointer-events-none" />
      )}
    </div>
  );
}

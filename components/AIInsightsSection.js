"use client";

import { useState, useEffect } from "react";
import { moods } from "@/utils";
import { Check, Sparkles, Bot, MessageCircle } from "lucide-react";
import ChatContainer from "./chat/ChatContainer";

/**
 * AIInsightsSection - Displays AI-generated journal insights with smooth animations
 * and an integrated chat experience with Lumi
 */
export default function AIInsightsSection({ insights, isLoading, userId }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [chatId, setChatId] = useState("");
  const [reflectionQuestion, setReflectionQuestion] = useState(null);

  // Generate a deterministic chat ID per day so chat history persists
  useEffect(() => {
    if (insights && (insights.response || insights.insight) && !isLoading && userId) {
      const now = new Date();
      const day = now.getDate();
      const month = now.getMonth();
      const year = now.getFullYear();
      setChatId(`chat_${userId}_${year}_${month}_${day}`);
    }
  }, [insights, isLoading, userId]);

  useEffect(() => {
    if (isLoading || insights) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setShowContent(false);
    }
  }, [isLoading, insights]);

  useEffect(() => {
    if (insights && !isLoading) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else if (isLoading) {
      setShowContent(false);
    }
  }, [insights, isLoading]);

  if (!isLoading && !insights) return null;

  // Handle reflection question click → send to chat
  const handleReflectionClick = (question) => {
    setReflectionQuestion(question);
  };

  return (
    <div
      className={`transition-all duration-500 ease-out ${isVisible
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-4"
        }`}
    >
      {/* Section Header */}
      <h2 className="text-xl md:text-2xl flex items-center gap-2 mt-2 md:mt-4 mb-6 font-bold text-gray-800 dark:text-gray-200 fugaz">
        <Sparkles size={24} className="text-indigo-500" />
        Reflections with Lumi
        {showContent && insights && (
          <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 animate-insights-badge shadow-sm">
            <Check className="mr-1" size={12} />
            Lumi is ready
          </span>
        )}
      </h2>

      {/* Unified Insight Card */}
      <InsightCard
        isLoading={isLoading}
        showContent={showContent}
        gradientPositions={{
          top: "top-0 left-10",
          topColors: "from-yellow-300/35 to-orange-300/25 dark:from-purple-400/30 dark:to-indigo-400/30",
          bottom: "bottom-1 right-12",
          bottomColors: "from-lime-400/40 to-green-500/30 dark:from-lime-400/20 dark:to-green-300/20"
        }}
      >
        {insights && (
          <>
            <div className="flex flex-col xl:flex-row gap-8 md:gap-4">
              {/* Left side: Analysis & Triggers */}
              <div className="flex-1 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 glow">
                      <Bot size={20} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest dark:text-indigo-400">
                      Lumi&apos;s Thoughts
                    </h3>
                  </div>

                  <div className="flex flex-col items-center justify-between min-w-[90px]">
                    <span className="text-xl md:text-2xl lg:text-3xl">{moods[insights.mood] || '😄'}</span>
                    <span className="text-sm md:text-base font-semibold text-indigo-500 dark:text-indigo-400 capitalize fugaz">
                      {insights.mood}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 leading-tight">
                    {insights.headline || "Your Personalized Insight"}
                  </h4>

                  <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                    {insights.response || insights.insight}
                  </p>
                </div>

                {Array.isArray(insights.triggers) && insights.triggers.length > 0 && (
                  <div className="pt-2">
                    <h5 className="text-xs font-semibold text-gray-500/95 uppercase tracking-wider mb-3">Key Influences</h5>
                    <div className="flex flex-wrap gap-2">
                      {insights.triggers.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center bg-white dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-slate-700 shadow-sm transition-transform hover:-translate-y-0.5"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <span className="text-indigo-400 dark:text-indigo-500 mr-1">#</span>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reflection question — clickable to send to chat */}
                {(insights.followUpQuestion || insights.pro_tip) && (
                  <button
                    onClick={() => handleReflectionClick(insights.followUpQuestion || insights.pro_tip)}
                    className="w-full text-left bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700/60 transition-all duration-200 cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
                    <div className="flex items-start gap-3 relative z-10">
                      <span className="text-xl mt-0.5">💡</span>
                      <div className="flex-1">
                        <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                          {insights.followUpQuestion ? 'For Your Reflection' : 'Pro Tip'}
                        </h5>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                          {insights.followUpQuestion || insights.pro_tip}
                        </p>
                      </div>
                      <MessageCircle size={16} className="text-emerald-400 dark:text-emerald-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <p className="text-[10px] text-emerald-500/70 dark:text-emerald-500/50 mt-1 ml-10 opacity-65 group-hover:opacity-100 transition-opacity">
                      Click to ask Lumi about this →
                    </p>
                  </button>
                )}
              </div>

              {/* Right side: AI Chat */}
              {userId && (insights.response || insights.insight) && (
                <div className="flex-1 w-full shrink-0 flex flex-col pt-4 xl:pt-0 border-t xl:border-t-0 xl:border-l border-gray-100 dark:border-slate-800/80 xl:pl-8">
                  <ChatContainer
                    chatId={chatId}
                    userId={userId}
                    reflectionQuestion={reflectionQuestion}
                    onReflectionConsumed={() => setReflectionQuestion(null)}
                  />
                </div>
              )}
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
      className={`bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/70 rounded-[2rem] p-6 md:p-8 shadow-xl border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden ${className}`}
    >
      {/* Background gradients */}
      {gradientPositions.top && (
        <div className={`absolute ${gradientPositions.top} w-40 h-40 bg-gradient-to-tr ${gradientPositions.topColors} rounded-full blur-3xl pointer-events-none`} />
      )}
      {gradientPositions.bottom && (
        <div className={`absolute ${gradientPositions.bottom} w-40 h-40 bg-gradient-to-tr ${gradientPositions.bottomColors} rounded-full blur-3xl pointer-events-none`} />
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="relative z-10 animate-insights-skeleton space-y-8">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-insights-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent z-20" />

          <div className="flex flex-col xl:flex-row gap-8 lg:gap-10 opacity-70">
            {/* Left Skeleton */}
            <div className="flex-1 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="w-20 h-10 bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              </div>

              <div className="h-8 w-3/4 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />

              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>

              <div className="space-y-3 pt-4">
                <div className="h-3 w-24 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                  <div className="h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>

            {/* Right chat skeleton */}
            <div className="flex-1 w-full">
              <div className="h-[550px] w-full bg-gray-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
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
        <div className="absolute inset-0 backdrop-blur-[4px] bg-white/30 dark:bg-slate-900/40 rounded-[2rem] transition-all duration-300 pointer-events-none" />
      )}
    </div>
  );
}

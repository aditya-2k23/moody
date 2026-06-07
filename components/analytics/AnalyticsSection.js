"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import gsap from "gsap";
import MoodTrendChart from "./MoodTrendChart";
import InsightPanel from "./InsightPanel";
import MoodDistribution from "./MoodDistribution";
import WeeklyPatterns from "./WeeklyPatterns";
import JournalingConsistency from "./JournalingConsistency";
import MonthlyComparison from "./MonthlyComparison";

export default function AnalyticsSection({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [days, setDays] = useState(30);

  const contentRef = useRef(null);
  const gridRef = useRef(null);

  const hasAnyData = data && Object.keys(data).length > 0;

  useEffect(() => {
    if (!contentRef.current) return;

    if (isExpanded) {
      // Animate height expansion
      gsap.fromTo(
        contentRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      // Stagger animate the grid items
      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out", delay: 0.1 }
        );
      }
    } else {
      gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in"
      });
    }
  }, [isExpanded]);

  if (!hasAnyData) return null;

  return (
    <div className="w-full flex flex-col mt-2 mb-4">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 sm:p-5 bg-slate-50 dark:bg-[#1a1b26] rounded-[24px] shadow-sm border border-slate-200 dark:border-white/[0.05] transition-all duration-200 hover:shadow-md group mb-2"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 dark:bg-indigo-500/10 p-2 rounded-xl transition-colors">
            <BarChart2 size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg sm:text-xl">Your Trends</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Advanced insights and patterns</p>
          </div>
        </div>
        <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </button>

      {/* Expanded Content with overflow hidden for height animation */}
      <div
        ref={contentRef}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <div className="pt-4 pb-2">
          {/* Global Timeframe Selector */}
          <div className="flex justify-end mb-6">
            <div className="flex bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1 border border-slate-200 dark:border-white/[0.02]">
              {[7, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-1.5 text-xs sm:text-sm rounded-lg transition-all duration-200 ${days === d
                    ? "bg-white dark:bg-[#242636] text-indigo-600 dark:text-indigo-400 shadow-sm font-medium"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
            {/* Top Row */}
            <div className="md:col-span-12 lg:col-span-8 order-1">
              <MoodTrendChart data={data} days={days} />
            </div>
            <div className="md:col-span-12 lg:col-span-4 order-2">
              <InsightPanel data={data} days={days} />
            </div>

            {/* Middle Row */}
            <div className="md:col-span-12 lg:col-span-4 order-3">
              <MoodDistribution data={data} days={days} />
            </div>
            <div className="md:col-span-12 lg:col-span-4 order-4">
              <WeeklyPatterns data={data} days={days} />
            </div>
            <div className="md:col-span-12 lg:col-span-4 order-5">
              <JournalingConsistency data={data} days={days} />
            </div>

            {/* Bottom Row */}
            <div className="md:col-span-12 order-6">
              <MonthlyComparison data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

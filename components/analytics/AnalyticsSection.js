"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import MoodTrendChart from "./MoodTrendChart";
import InsightPanel from "./InsightPanel";
import MoodDistribution from "./MoodDistribution";
import JournalingConsistency from "./JournalingConsistency";
import MonthlyComparison from "./MonthlyComparison";

/**
 * A container component for the advanced analytics dashboard.
 * It manages the timeframe state (30 vs 90 days), layout animations via GSAP Flip,
 * and passes the active dataset to the individual visualization components.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.data - The user's mood data object (e.g. { year: { month: { day: value } } }).
 * @returns {JSX.Element} The rendered AnalyticsSection component.
 */
export default function AnalyticsSection({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [days, setDays] = useState(30);
  const [expandedPanel, setExpandedPanel] = useState("none");

  const contentRef = useRef(null);
  const gridRef = useRef(null);
  const flipState = useRef(null);

  if (typeof window !== "undefined") {
    gsap.registerPlugin(Flip);
  }

  const handleToggleMaximize = (panel) => {
    if (gridRef.current) {
      // Capture the parent grid AND its children to prevent height collapse when absolute: true is applied
      flipState.current = Flip.getState([gridRef.current, ...gridRef.current.children]);
    }
    setExpandedPanel((prev) => (prev === panel ? "none" : panel));
  };

  useLayoutEffect(() => {
    if (flipState.current && gridRef.current) {
      Flip.from(flipState.current, {
        duration: 0.6,
        ease: "power3.inOut",
        absolute: gridRef.current.children, // Only children become absolute, keeping parent in flow
      });
      flipState.current = null;
    }
  }, [expandedPanel]);

  const hasAnyData = data && Object.keys(data).length > 0;

  useEffect(() => {
    const gridEl = gridRef.current;
    
    if (isExpanded) {
      // Stagger animate the grid items
      if (gridEl) {
        gsap.fromTo(
          gridEl.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out", delay: 0.1 }
        );
      }
    }

    return () => {
      if (gridEl && gridEl.children) {
        gsap.killTweensOf(gridEl.children);
      }
    };
  }, [isExpanded]);

  return (
    <div className="w-full flex flex-col mt-2 mb-4">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="analytics-section-content"
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

      {/* Expanded Content with CSS Grid transition for height animation */}
      <div
        id="analytics-section-content"
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-4 pb-2">
          {/* Global Timeframe Selector */}
          <div className="flex justify-end mb-6">
            <div className="flex bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1 border border-slate-200 dark:border-white/[0.02]">
              {[7, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  aria-pressed={days === d}
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
            <div className={`md:col-span-12 ${expandedPanel !== 'none' ? 'lg:col-span-12' : 'lg:col-span-8'} order-1 transition-all duration-500`}>
              <MoodTrendChart
                data={data}
                days={days}
                isMaximized={expandedPanel !== 'none'}
                onToggleMaximize={() => handleToggleMaximize('chart')}
              />
            </div>
            <div className={`md:col-span-12 ${expandedPanel !== 'none' ? 'lg:col-span-12' : 'lg:col-span-4'} order-2 transition-all duration-500`}>
              <InsightPanel
                data={data}
                days={days}
                isExpanded={isExpanded}
                isMaximized={expandedPanel !== 'none'}
              />
            </div>

            {/* Middle Row */}
            <div className="md:col-span-12 lg:col-span-6 order-3 flex flex-col">
              <MoodDistribution data={data} days={days} />
            </div>
            <div className="md:col-span-12 lg:col-span-6 order-4 flex flex-col">
              <JournalingConsistency data={data} days={days} />
            </div>

            {/* Bottom Row */}
            <div className="md:col-span-12 order-5">
              <MonthlyComparison data={data} />
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

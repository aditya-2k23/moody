"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { calculateDistribution } from "@/utils/analytics";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieChartIcon, X } from "lucide-react";
import { gradients, moods as emojiMap } from "@/utils/index";
import gsap from "gsap";

const moodNames = Object.keys(emojiMap);

function getMoodColor(moodName) {
  const index = Math.max(0, moodNames.indexOf(moodName));
  return gradients.indigo[Math.min(gradients.indigo.length - 1, index)];
}

function CustomTooltip({ active, payload }) {
  const containerRef = useRef(null);

  const data = active && payload && payload.length ? payload[0].payload : null;
  const moodName = data ? data.moodName : null;

  useEffect(() => {
    if (active && data && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" }
      );
    }

    return () => {
      if (containerRef.current) {
        gsap.killTweensOf(containerRef.current);
      }
    };
  }, [active, moodName]);

  if (!active || !data) return null;

  return (
    <div
      ref={containerRef}
      className="opacity-0 min-w-[150px] rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-xl pointer-events-none"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold text-white">
          {data.emoji} {data.moodName}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: data.color || "#818cf8" }}
        >
          {data.percentage}%
        </span>
      </div>
      <p className="mt-1.5 text-xs text-slate-300">
        Logged {data.count} {data.count === 1 ? "time" : "times"}
      </p>
    </div>
  );
}

export default function MoodDistribution({ data, days = 30 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const distribution = useMemo(() => {
    return calculateDistribution(data, days);
  }, [data, days]);

  const totalEntries = distribution.reduce((sum, item) => sum + item.count, 0);

  const chartData = useMemo(() => {
    return distribution.map(item => {
      const moodValue = moodNames.indexOf(item.moodName) + 1;
      return {
        ...item,
        moodValue,
        emoji: emojiMap[item.moodName],
        color: getMoodColor(item.moodName)
      };
    });
  }, [distribution]);

  const accessibleBreakdown = useMemo(() => {
    const topThree = chartData.slice(0, 3).map(item => `${item.moodName} at ${item.percentage}%`).join(", ");
    return `Mood distribution chart showing: ${topThree}.`;
  }, [chartData]);

  if (distribution.length === 0 || totalEntries < 3) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-[400px] shadow-sm relative overflow-hidden justify-center items-center text-center">
        <div className="bg-indigo-100 dark:bg-indigo-500/10 p-3 rounded-full mb-3">
          <PieChartIcon size={24} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Unlock Mood Distribution
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-3 leading-relaxed">
          Log at least 3 moods to see your emotional breakdown and discover which feelings dominate your days.
        </p>
        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
          💡 Tip: You can tap dates in the past to catch up!
        </p>
      </div>
    );
  }

  const topMood = chartData[0];
  const visibleChartData = chartData.slice(0, 5);
  const variety = chartData.length;

  return (
    <div className="analytics-card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-[425px] sm:h-[400px] shadow-sm relative overflow-hidden">
      <div className="w-full text-left mb-4 shrink-0">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Mood Distribution</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {totalEntries} logged {totalEntries === 1 ? "entry" : "entries"} across {variety} {variety === 1 ? "mood" : "moods"}
        </p>
      </div>

      <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-between gap-6 min-h-0">
        {/* Left side: Chart */}
        <div
          className="relative w-full sm:w-[50%] h-[200px] sm:h-full flex items-center justify-center shrink-0"
          role="img"
          aria-label={accessibleBreakdown}
        >
          <PieChart style={{ outline: 'none' }} className="focus:outline-none" width={200} height={200}>
            <Pie
              data={visibleChartData}
              nameKey="moodName"
              cx="50%"
              cy="50%"
              innerRadius={66}
              outerRadius={94}
              paddingAngle={4}
              dataKey="count"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={2}
              cornerRadius={9}
              isAnimationActive={true}
              animationDuration={700}
            >
              {visibleChartData.map((entry) => (
                <Cell
                  key={entry.moodName}
                  fill={entry.color}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              isAnimationActive={false}
              animationDuration={0}
              wrapperStyle={{ zIndex: 100, transition: 'none' }}
              allowEscapeViewBox={{ x: true, y: true }}
            />
          </PieChart>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl leading-none" aria-hidden="true">{topMood.emoji}</span>
            <span className="mt-1 text-2xl font-bold text-slate-800 dark:text-white leading-none">
              {topMood.percentage}%
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
              {topMood.moodName}
            </span>
          </div>
        </div>

        {/* Right side: Scrollable Mood list */}
        <div className="w-full sm:w-[50%] h-[220px] sm:h-[250px] overflow-hidden sm:overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar relative">
          <div
            className="flex flex-col gap-2 h-full sm:h-auto overflow-y-auto sm:overflow-visible pb-12 sm:pb-0 cursor-pointer sm:cursor-default"
            onClick={() => {
              if (window.innerWidth < 640) setIsModalOpen(true);
            }}
          >
            {chartData.map((item) => (
              <div
                key={item.moodName}
                className="group flex items-center gap-3 rounded-xl border border-white/60 bg-white/55 px-3 py-1.5 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/75 dark:border-white/5 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm shadow-sm"
                  style={{ backgroundColor: item.color }}
                >
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{item.moodName}</span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{item.percentage}%</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {item.count}x
                </span>
              </div>
            ))}
          </div>

          {/* Mobile Overlay & Button */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-indigo-50/90 dark:from-slate-900/90 to-transparent sm:hidden pointer-events-none" />
          <button
            className="absolute bottom-0 left-0 right-0 py-2 mx-1 mb-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl border border-indigo-100 dark:border-slate-700 sm:hidden shadow-sm transition-all hover:bg-white dark:hover:bg-slate-700"
            onClick={() => setIsModalOpen(true)}
          >
            View Full Breakdown
          </button>
        </div>
      </div>

      {/* Mobile Modal for full mood list */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:hidden" onClick={() => setIsModalOpen(false)}>
          <div
            className="w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl p-6 flex flex-col shadow-2xl animate-modal-overlay"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Mood Breakdown</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar pb-6 pr-1">
              {chartData.map((item) => (
                <div
                  key={item.moodName}
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm shadow-sm"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{item.moodName}</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.percentage}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500 ml-2">
                    {item.count} entries
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

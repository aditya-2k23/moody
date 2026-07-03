"use client";

import { useMemo } from "react";
import { calculateDistribution } from "@/utils/analytics";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { gradients, moods as emojiMap } from "@/utils/index";

const moodNames = Object.keys(emojiMap);

function getMoodColor(moodName) {
  const index = Math.max(0, moodNames.indexOf(moodName));
  return gradients.indigo[Math.min(gradients.indigo.length - 1, index)];
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="min-w-[150px] rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-xl pointer-events-none">
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

const getTooltipPosition = (point) => {
  if (!point) return null;
  // Since PieChart has width 200, height 200, center is (100, 100)
  const cx = 100;
  const cy = 100;

  const dx = point.x - cx;
  const dy = point.y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return { x: point.x, y: point.y };

  const nx = dx / distance;
  const ny = dy / distance;

  // Push tooltip to a radius of 130px to keep it completely outside the donut ring
  const targetRadius = 130;
  const tooltipWidth = 150;
  const tooltipHeight = 60;

  const posX = cx + nx * targetRadius - tooltipWidth / 2;
  const posY = cy + ny * targetRadius - tooltipHeight / 2;

  return {
    x: Math.max(5, posX),
    y: posY
  };
};

export default function MoodDistribution({ data, days = 30 }) {
  const distribution = useMemo(() => {
    return calculateDistribution(data, days);
  }, [data, days]);

  const totalEntries = distribution.reduce((sum, item) => sum + item.count, 0);

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

  const chartData = distribution.map(item => {
    const moodValue = moodNames.indexOf(item.moodName) + 1;

    return {
      ...item,
      moodValue,
      emoji: emojiMap[item.moodName],
      color: getMoodColor(item.moodName)
    };
  });
  const topMood = chartData[0];
  const visibleChartData = chartData.slice(0, 5);
  const variety = chartData.length;

  return (
    <div className="analytics-card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-[400px] shadow-sm relative overflow-hidden">
      <div className="w-full text-left mb-4 shrink-0">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Mood Distribution</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {totalEntries} logged {totalEntries === 1 ? "entry" : "entries"} across {variety} {variety === 1 ? "mood" : "moods"}
        </p>
      </div>

      <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-between gap-6 min-h-0">
        {/* Left side: Chart */}
        <div className="relative w-full sm:w-[50%] h-[200px] sm:h-full flex items-center justify-center shrink-0">
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
            <Tooltip content={<CustomTooltip />} position={getTooltipPosition} allowEscapeViewBox={{ x: true, y: true }} />
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
        <div className="w-full sm:w-[50%] h-[180px] sm:h-[250px] overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
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
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { calculateMoodTrends } from "@/utils/analytics";

function formatShortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active) return null;

  const item = payload?.[0]?.payload;

  return (
    <div className="min-w-[190px] rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-slate-50">{formatFullDate(item?.timestamp || label)}</p>

      {item?.moodName ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-base font-semibold text-white">
              {item.emoji} {item.moodName}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: item.color || "#818cf8" }}
            >
              {item.moodValue} / 13
            </span>
          </div>
          <div className="flex items-center gap-2">
            {item.hasJournal ? (
              <span className="rounded-full bg-indigo-400/15 px-2 py-1 text-xs font-medium text-indigo-100">
                📓 Journaled
              </span>
            ) : (
              <span className="rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300">
                No journal
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-300">No mood logged</p>
      )}
    </div>
  );
}

function MoodDot({ cx, cy, payload }) {
  if (!payload?.moodName) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={payload.color || "#818cf8"}
      stroke="#f8fafc"
      strokeWidth={1.5}
    />
  );
}

function ActiveMoodDot({ cx, cy, payload }) {
  if (!payload?.moodName) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={7}
      fill={payload.color || "#818cf8"}
      stroke="#f8fafc"
      strokeWidth={2}
    />
  );
}

export default function MoodTrendChart({ data, days = 30 }) {
  const chartData = useMemo(() => {
    return calculateMoodTrends(data, days);
  }, [data, days]);

  const subtitle = useMemo(() => {
    if (chartData.length < 5) return "Not enough data yet.";
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
    
    const avgFirst = firstHalf.reduce((sum, item) => sum + (item.score || 5), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, item) => sum + (item.score || 5), 0) / secondHalf.length;
    
    if (avgSecond > avgFirst + 1) return "A gentle rise in overall wellbeing.";
    if (avgSecond < avgFirst - 1) return "A slight dip in your recent mood.";
    return "Your mood has been relatively steady.";
  }, [chartData]);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
        <div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Mood Trends</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-4">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            <span className="text-[10px] tracking-wider uppercase text-slate-500 dark:text-slate-400 font-medium">Average</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none" style={{ outline: 'none' }}>
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 4, bottom: 0 }} style={{ outline: 'none' }} className="focus:outline-none">
            <defs>
              <linearGradient id="colorScorePremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
              tickFormatter={formatShortDate}
              dy={10}
            />
            <YAxis
              type="number"
              domain={[1, 13]}
              ticks={[1, 7, 13]}
              width={48}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              tickFormatter={(value) => {
                if (value === 1) return "Low";
                if (value === 7) return "Neutral";
                return "High";
              }}
            />
            <Tooltip 
              cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }} 
              content={<CustomTooltip />}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="chartValue"
              name="Mood"
              stroke="#818cf8"
              strokeWidth={3}
              fill="url(#colorScorePremium)"
              connectNulls={true}
              dot={<MoodDot />}
              animationDuration={500}
              isAnimationActive={true}
              activeDot={<ActiveMoodDot />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { calculateWeeklyPatterns } from "@/utils/analytics";
import { gradients } from "@/utils/index";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, LabelList } from "recharts";

function EntryCountLabel({ x, y, width, height, payload }) {
  const count = payload?.count || 0;
  const label = `${payload?.name || ""} - ${count} ${count === 1 ? "entry" : "entries"}${payload?.lowData ? " - low data" : ""}`;

  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      dominantBaseline="middle"
      fill={payload?.lowData ? "#94a3b8" : "#64748b"}
      fontSize={11}
      fontWeight={500}
    >
      {label}
    </text>
  );
}

export default function WeeklyPatterns({ data, days = 90 }) {
  const { averages } = useMemo(() => {
    return calculateWeeklyPatterns(data, days);
  }, [data, days]);

  if (!averages || averages.length === 0 || !averages.some(a => a.score !== null)) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full justify-center items-center text-center">
        <p className="text-slate-500 dark:text-slate-400">No weekly data available yet.</p>
      </div>
    );
  }

  const orderedAverages = [
    averages[1], // Mon
    averages[2], // Tue
    averages[3], // Wed
    averages[4], // Thu
    averages[5], // Fri
    averages[6], // Sat
    averages[0], // Sun
  ].filter(Boolean);

  const fullChartData = orderedAverages.map(item => ({
    name: item.shortDay.toUpperCase(),
    score: item.score || 0,
    count: item.count,
    lowData: item.count < 3
  }));

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Weekly Rhythm</h3>
      </div>

      <div className="flex-1 w-full min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none" style={{ outline: 'none' }}>
          <BarChart 
            data={fullChartData} 
            layout="vertical" 
            margin={{ top: 0, right: 126, left: -16, bottom: 0 }}
            barCategoryGap={10}
            style={{ outline: 'none' }}
            className="focus:outline-none"
          >
            <XAxis type="number" hide domain={[0, 10]} />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
            />
            <Bar 
              dataKey="score" 
              radius={[4, 4, 4, 4]} 
              background={{ fill: 'rgba(255, 255, 255, 0.03)', radius: [4, 4, 4, 4] }}
              barSize={20}
              isAnimationActive={true}
              animationDuration={500}
            >
              {fullChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={gradients.indigo[Math.min(gradients.indigo.length - 1, Math.max(0, Math.round(entry.score)))]}
                  opacity={entry.lowData ? 0.35 : 0.95}
                />
              ))}
              <LabelList dataKey="count" content={<EntryCountLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

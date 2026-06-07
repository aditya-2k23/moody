"use client";

import { useMemo } from "react";
import { calculateWeeklyPatterns } from "@/utils/analytics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from "recharts";

export default function WeeklyPatterns({ data, days = 90 }) {
  const { averages } = useMemo(() => {
    return calculateWeeklyPatterns(data, days);
  }, [data, days]);

  if (!averages || averages.length === 0 || !averages.some(a => a.score !== null)) {
    return (
      <div className="bg-slate-50 dark:bg-[#1a1b26] rounded-[24px] p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full justify-center items-center text-center">
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

  const chartData = orderedAverages.slice(0, 5).map(item => ({
    name: item.shortDay.toUpperCase(),
    score: item.score || 0
  }));

  return (
    <div className="bg-slate-50 dark:bg-[#1a1b26] rounded-[24px] p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Weekly Rhythm</h3>
      </div>

      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none" style={{ outline: 'none' }}>
          <BarChart 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
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
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#818cf8" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

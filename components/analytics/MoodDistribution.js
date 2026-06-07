"use client";

import { useMemo } from "react";
import { calculateDistribution } from "@/utils/analytics";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { moods as emojiMap } from "@/utils/index";

export default function MoodDistribution({ data, days = 30 }) {
  const distribution = useMemo(() => {
    return calculateDistribution(data, days);
  }, [data, days]);

  if (distribution.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full justify-center items-center text-center">
        <p className="text-slate-500 dark:text-slate-400">No mood data available yet.</p>
      </div>
    );
  }

  const topMood = distribution[0];
  const chartData = distribution.slice(0, 4);

  const COLORS = ['#a78bfa', '#818cf8', '#6366f1', '#4f46e5', '#3730a3'];



  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm items-center relative overflow-hidden">
      <div className="w-full text-left mb-4">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Mood Distribution</h3>
      </div>

      <div className="flex-1 w-full relative min-h-[200px] flex items-center justify-center mt-2">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none" style={{ outline: 'none' }}>
          <PieChart style={{ outline: 'none' }} className="focus:outline-none">
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc' }}
              itemStyle={{ color: '#818cf8', fontWeight: 600 }}
              isAnimationActive={false}
            />
            <Pie
              data={chartData}
              nameKey="moodName"
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={95}
              paddingAngle={5}
              dataKey="count"
              stroke="none"
              cornerRadius={10}
              isAnimationActive={true}
              animationDuration={500}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-slate-800 dark:text-white leading-none">
            {topMood.percentage}%
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
            {topMood.moodName}
          </span>
        </div>
      </div>
    </div>
  );
}

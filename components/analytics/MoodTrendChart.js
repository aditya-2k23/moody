"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { calculateMoodTrends } from "@/utils/analytics";

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

  const formattedData = useMemo(() => {
    return chartData.map((d, i) => {
      let label = "";
      if (days === 7) {
        label = d.date;
      } else if (days === 30) {
        if (i % 6 === 0 || i === chartData.length - 1) label = d.date;
      } else if (days === 60) {
        if (i % 12 === 0 || i === chartData.length - 1) label = d.date;
      } else if (days === 90) {
        if (i % 18 === 0 || i === chartData.length - 1) label = d.date;
      }
      return { ...d, label };
    });
  }, [chartData, days]);



  return (
    <div className="bg-slate-50 dark:bg-[#1a1b26] rounded-[24px] p-6 sm:p-8 border border-slate-200 dark:border-white/[0.05] flex flex-col h-full shadow-sm">
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
          <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} style={{ outline: 'none' }} className="focus:outline-none">
            <defs>
              <linearGradient id="colorScorePremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
              interval={0}
              dy={10}
            />
            <Tooltip 
              cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }} 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc' }}
              itemStyle={{ color: '#818cf8', fontWeight: 600 }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="score"
              name="Score"
              stroke="#818cf8"
              strokeWidth={3}
              fill="url(#colorScorePremium)"
              connectNulls={false}
              animationDuration={500}
              isAnimationActive={true}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#818cf8' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

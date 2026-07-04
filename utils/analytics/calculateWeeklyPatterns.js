import { dayList } from "../index";
import { iterateDays } from "./calculateMoodTrends";

/**
 * Calculates average mood score per day of the week over the given timeframe.
 * @param {Object} dataObj - The structured mood data (year -> month -> day).
 * @param {number} days - Number of days to look back (default 90).
 * @returns {Object} { averages: Array, bestDay: string, lowestDay: string }
 */
export function calculateWeeklyPatterns(dataObj, days = 90) {
  const dayStats = Array(7).fill(null).map(() => ({ totalScore: 0, count: 0 }));

  iterateDays(dataObj, days, (d, details) => {
    if (details.hasEntry) {
      const dayOfWeek = d.getDay();
      dayStats[dayOfWeek].totalScore += details.score;
      dayStats[dayOfWeek].count += 1;
    }
  });

  const averages = dayStats.map((stat, index) => {
    return {
      day: dayList[index],
      shortDay: dayList[index].substring(0, 3),
      score: stat.count > 0 ? Number((stat.totalScore / stat.count).toFixed(1)) : null,
      count: stat.count
    };
  });

  const validAverages = averages.filter(a => a.score !== null);
  
  if (validAverages.length === 0) {
    return { averages, bestDay: null, lowestDay: null };
  }

  let bestDay = validAverages[0];
  let lowestDay = validAverages[0];

  validAverages.forEach(a => {
    if (a.score > bestDay.score) bestDay = a;
    if (a.score < lowestDay.score) lowestDay = a;
  });

  return {
    averages,
    bestDay: bestDay.day,
    lowestDay: lowestDay.day
  };
}

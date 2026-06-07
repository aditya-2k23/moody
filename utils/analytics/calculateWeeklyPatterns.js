import convertMood, { dayList } from "../index";
import { MOOD_SCORES } from "./calculateMoodTrends";

/**
 * Calculates average mood score per day of the week over the given timeframe.
 * @param {Object} dataObj - The structured mood data (year -> month -> day).
 * @param {number} days - Number of days to look back (default 90).
 * @returns {Object} { averages: Array, bestDay: string, lowestDay: string }
 */
export function calculateWeeklyPatterns(dataObj, days = 90) {
  const dayStats = Array(7).fill(null).map(() => ({ totalScore: 0, count: 0 }));
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    if (dataObj?.[year]?.[month] && typeof dataObj[year][month][day] === 'number') {
      const moodName = convertMood(dataObj[year][month][day]);
      const score = MOOD_SCORES[moodName] || 5;
      const dayOfWeek = d.getDay();
      dayStats[dayOfWeek].totalScore += score;
      dayStats[dayOfWeek].count += 1;
    }
  }

  const averages = dayStats.map((stat, index) => {
    return {
      day: dayList[index],
      shortDay: dayList[index].substring(0, 3),
      score: stat.count > 0 ? Number((stat.totalScore / stat.count).toFixed(1)) : null
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

import { MOOD_SCORES } from "./calculateMoodTrends";
import convertMood from "../index";

function getMonthStats(dataObj, targetYear, targetMonth) {
  let totalScore = 0;
  let count = 0;
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const scores = [];

  if (dataObj?.[targetYear]?.[targetMonth]) {
    const monthData = dataObj[targetYear][targetMonth];
    for (let day = 1; day <= daysInMonth; day++) {
      if (typeof monthData[day] === 'number') {
        const moodName = convertMood(monthData[day]);
        const score = MOOD_SCORES[moodName] || 5;
        totalScore += score;
        count++;
        scores.push(score);
      }
    }
  }

  const average = count > 0 ? totalScore / count : null;
  
  // Calculate variance for "mood variability"
  let variability = null;
  if (count > 1) {
    const sumSq = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0);
    variability = Math.sqrt(sumSq / (count - 1));
  }

  return { average, count, variability, scores };
}

export function calculateMonthlyComparison(dataObj) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  const currentStats = getMonthStats(dataObj, currentYear, currentMonth);
  const prevStats = getMonthStats(dataObj, prevYear, prevMonth);

  return { currentStats, prevStats };
}

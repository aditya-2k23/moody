/**
 * Generates 3-5 human-readable insights locally based on the computed analytics.
 * @param {Object} data - Analytics data including trends, distribution, consistency, and weekly patterns.
 * @returns {Array} Array of insight strings.
 */
export function generateInsights(analyticsData) {
  const insights = [];
  const { trends, distribution, consistency, weekly } = analyticsData;

  // 1. Consistency Insight
  if (consistency.percentage >= 80) {
    insights.push(`Great job! You journaled on ${consistency.percentage}% of days in this period.`);
  } else if (consistency.currentStreak > 3) {
    insights.push(`You are on a ${consistency.currentStreak}-day streak. Keep it up!`);
  } else if (consistency.percentage > 0 && consistency.percentage < 40) {
    insights.push(`You've logged ${consistency.totalEntries} entries recently. Try logging a bit more often to see clearer patterns.`);
  }

  // 2. Trend Insight (Comparing averages of two halves)
  if (trends && trends.length >= 14) {
    const half = Math.floor(trends.length / 2);
    const recentHalf = trends.slice(half); // older to newer, wait, trends is newest at the end?
    // Let's check calculateMoodTrends.js: "for (let i = days - 1; i >= 0; i--)" so oldest is index 0, newest is index length-1
    const olderHalf = trends.slice(0, half);
    
    const avgRecent = recentHalf.reduce((sum, t) => sum + (t.score || 5), 0) / recentHalf.length;
    const avgOlder = olderHalf.reduce((sum, t) => sum + (t.score || 5), 0) / olderHalf.length;
    
    if (avgRecent > avgOlder + 1) {
      insights.push("Your mood has been noticeably improving lately compared to earlier in the period.");
    } else if (avgRecent < avgOlder - 1) {
      insights.push("Your mood seems a bit lower recently. Remember to take time for yourself.");
    } else {
      insights.push("Your overall mood has been relatively stable recently.");
    }
  }

  // 3. Distribution Insight
  if (distribution && distribution.length > 0) {
    const topMood = distribution[0];
    if (topMood.percentage > 40) {
      insights.push(`Your most frequent mood is ${topMood.moodName}, making up ${topMood.percentage}% of your entries.`);
    }
  }

  // 4. Weekly Pattern Insight
  if (weekly && weekly.bestDay) {
    insights.push(`${weekly.bestDay} is typically your best day of the week.`);
  }

  // If not enough data
  if (insights.length === 0) {
    insights.push("Log a few more days to unlock personalized trend insights.");
  }

  return insights.slice(0, 5); // Max 5 insights
}

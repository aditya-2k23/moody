/**
 * Calculates consistency metrics: total entries, streak, longest streak, and completion percentage.
 * @param {Object} dataObj - The structured mood data (year -> month -> day).
 * @param {number} days - Number of days to analyze (default 30).
 * @returns {Object} Consistency metrics.
 */
export function calculateConsistency(dataObj, days = 30) {
  const now = new Date();
  let totalEntries = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Streak logic from today backwards
  let streakCurrent = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(streakCurrent);
  yesterday.setDate(yesterday.getDate() - 1);

  const hasEntry = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    return typeof dataObj?.[y]?.[m]?.[d] === 'number';
  };

  const hasTodayEntry = hasEntry(streakCurrent);
  const hasYesterdayEntry = hasEntry(yesterday);

  if (hasTodayEntry || hasYesterdayEntry) {
    if (!hasTodayEntry) streakCurrent = yesterday;
    
    while (hasEntry(streakCurrent)) {
      currentStreak++;
      streakCurrent.setDate(streakCurrent.getDate() - 1);
    }
  }

  // Calculate stats over the specific period (e.g., last 30 days)
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    if (dataObj?.[year]?.[month] && typeof dataObj[year][month][day] === 'number') {
      totalEntries++;
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  return {
    totalEntries,
    currentStreak,
    longestStreak,
    percentage: Math.round((totalEntries / days) * 100)
  };
}

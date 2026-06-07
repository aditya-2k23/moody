import convertMood from "../index";

/**
 * Calculates the distribution (count and percentage) of moods over the specified days.
 * @param {Object} dataObj - The structured mood data (year -> month -> day).
 * @param {number} days - Number of days to look back.
 * @returns {Array} Array of objects { moodName: string, count: number, percentage: number }
 * sorted by count descending.
 */
export function calculateDistribution(dataObj, days = 30) {
  const counts = {};
  let totalEntries = 0;
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    if (dataObj?.[year]?.[month] && typeof dataObj[year][month][day] === 'number') {
      const moodName = convertMood(dataObj[year][month][day]);
      counts[moodName] = (counts[moodName] || 0) + 1;
      totalEntries++;
    }
  }

  if (totalEntries === 0) return [];

  const distribution = Object.keys(counts).map(moodName => ({
    moodName,
    count: counts[moodName],
    percentage: Math.round((counts[moodName] / totalEntries) * 100)
  }));

  // Sort descending by count
  distribution.sort((a, b) => b.count - a.count);

  return distribution;
}

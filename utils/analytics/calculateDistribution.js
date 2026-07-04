import { iterateDays } from "./calculateMoodTrends";

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

  iterateDays(dataObj, days, (d, details) => {
    if (details.hasEntry) {
      counts[details.moodName] = (counts[details.moodName] || 0) + 1;
      totalEntries++;
    }
  });

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

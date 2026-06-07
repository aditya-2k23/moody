import convertMood from "../index";

export const MOOD_SCORES = {
  'Awful': 1,
  'Angry': 1,
  'Stressed': 2,
  'Sad': 2,
  'Anxious': 3,
  'Tired': 3,
  'Unsure': 4,
  'Existing': 4,
  'Neutral': 5,
  'Good': 7,
  'Grateful': 8,
  'Excited': 9,
  'Elated': 10
};

/**
 * Extracts daily mood scores for a specified number of days.
 * Fills in missing days with null to maintain chart continuity.
 * @param {Object} dataObj - The structured mood data (year -> month -> day).
 * @param {number} days - Number of days to look back (7, 30, 90).
 * @returns {Array} Array of objects { date: string, score: number | null, moodName: string | null }
 */
export function calculateMoodTrends(dataObj, days = 7) {
  const result = [];
  const now = new Date();
  
  // Create an array of the past `days` dates in chronological order
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    
    let score = null;
    let moodName = null;
    
    if (dataObj?.[year]?.[month] && typeof dataObj[year][month][day] === 'number') {
      const moodValue = dataObj[year][month][day];
      moodName = convertMood(moodValue);
      score = MOOD_SCORES[moodName] || 5;
    }
    
    result.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: d,
      score,
      moodName
    });
  }
  
  return result;
}

import convertMood, { gradients, moods as emojiMap } from "../index";

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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Gets a color from the indigo gradient based on the mood value.
 * @param {number} moodValue - The numeric value of the mood.
 * @returns {string|null} The hex color code, or null if invalid.
 */
function getMoodColor(moodValue) {
  if (typeof moodValue !== 'number') return null;
  const colorIndex = Math.max(0, Math.min(gradients.indigo.length - 1, moodValue - 1));
  return gradients.indigo[colorIndex];
}

/**
 * Formats a date object into a short date string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted short date string.
 */
function formatPeriodDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Calculates the average score for an array of items.
 * @param {Array} items - Array containing objects with a score property.
 * @returns {number|null} The average score, or null if no valid scores exist.
 */
function getAverageScore(items) {
  const logged = items.filter(item => typeof item.score === 'number');
  if (logged.length === 0) return null;
  return logged.reduce((sum, item) => sum + item.score, 0) / logged.length;
}

/**
 * Extracts daily mood scores for a specified number of days.
 * Fills in missing days with null to maintain chart continuity.
 * @param {Object} dataObj - The structured mood data (year -> month -> day).
 * @param {number} days - Number of days to look back (7, 30, 90).
 * @returns {Array} Array of objects with date, timestamp, chart value, score, mood, and journal metadata.
 */
export function getMoodDetailsForDate(dataObj, date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  let score = null;
  let moodValue = null;
  let moodName = null;
  let hasEntry = false;
  
  if (dataObj?.[year]?.[month] && typeof dataObj[year][month][day] === 'number') {
    moodValue = dataObj[year][month][day];
    moodName = convertMood(moodValue);
    score = MOOD_SCORES[moodName] || 5;
    hasEntry = true;
  }
  
  const journal = dataObj?.[year]?.[month]?.[`journal_${day}`] || "";
  const hasJournal = Boolean(journal && String(journal).trim().length > 0);
  
  return {
    year,
    month,
    day,
    score,
    moodValue,
    moodName,
    hasEntry,
    hasJournal
  };
}

export function iterateDays(dataObj, days, callback, reverse = false) {
  const now = new Date();
  const loop = (i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const details = getMoodDetailsForDate(dataObj, d);
    callback(d, details);
  };
  
  if (reverse) {
    for (let i = days - 1; i >= 0; i--) {
      loop(i);
    }
  } else {
    for (let i = 0; i < days; i++) {
      loop(i);
    }
  }
}

export function calculateMoodTrends(dataObj, days = 7) {
  const result = [];
  
  iterateDays(dataObj, days, (d, details) => {
    let chartValue = details.hasEntry ? details.score : null;
    let emoji = details.hasEntry ? emojiMap[details.moodName] : null;
    let color = details.hasEntry ? getMoodColor(details.moodValue) : null;
    
    result.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: d,
      timestamp: d.getTime(),
      score: details.score,
      chartValue,
      moodValue: details.moodValue,
      moodName: details.moodName,
      emoji,
      color,
      hasJournal: details.hasJournal
    });
  }, true);
  
  return result;
}

/**
 * Calculates data for a mood heatmap visualization, including journaling status.
 * @param {Object} dataObj - The structured mood and journal data.
 * @param {number} [days=28] - The number of days to analyze.
 * @returns {Array} An array of objects suitable for a heatmap chart.
 */
export function calculateMoodHeatmap(dataObj, days = 28) {
  return calculateMoodTrends(dataObj, days).map(item => ({
    date: item.date,
    fullDate: item.fullDate,
    timestamp: item.timestamp,
    moodValue: item.moodValue,
    moodName: item.moodName,
    emoji: item.emoji,
    color: item.color,
    hasEntry: typeof item.moodValue === 'number',
    hasJournal: item.hasJournal
  }));
}

/**
 * Determines the best and worst periods of mood based on a sliding window average.
 * @param {Array} trends - The structured time series data from calculateMoodTrends.
 * @param {number} [windowSize=7] - The number of days in the sliding window.
 * @returns {Object} An object containing the best and worst periods, including their labels, average scores, and raw scores.
 */
export function calculateBestWorstPeriods(trends, windowSize = 7) {
  if (!Array.isArray(trends) || trends.length < windowSize) {
    return { bestWeek: null, toughestPeriod: null };
  }

  const windows = [];

  for (let i = 0; i <= trends.length - windowSize; i++) {
    const windowItems = trends.slice(i, i + windowSize);
    const logged = windowItems.filter(item => typeof item.score === 'number');
    if (logged.length < 3) continue;

    windows.push({
      start: windowItems[0].fullDate,
      end: windowItems[windowItems.length - 1].fullDate,
      average: getAverageScore(logged),
      entries: logged.length
    });
  }

  if (windows.length === 0) {
    return { bestWeek: null, toughestPeriod: null };
  }

  const best = windows.reduce((currentBest, item) => item.average > currentBest.average ? item : currentBest, windows[0]);
  const toughest = windows.reduce((currentLowest, item) => item.average < currentLowest.average ? item : currentLowest, windows[0]);

  const formatWindow = (item) => ({
    label: `${formatPeriodDate(item.start)}-${formatPeriodDate(item.end)}`,
    average: Number(item.average.toFixed(1)),
    entries: item.entries
  });

  return {
    bestWeek: formatWindow(best),
    toughestPeriod: formatWindow(toughest)
  };
}

/**
 * Generates a short text insight comparing recent mood to older mood or weekly patterns.
 * @param {Array} trends - The structured time series data.
 * @param {Object} weekly - The weekly patterns data.
 * @returns {string} A short, human-readable insight.
 */
export function calculateMicroInsight(trends, weekly) {
  const loggedTrends = Array.isArray(trends)
    ? trends.filter(item => typeof item.score === 'number')
    : [];

  if (loggedTrends.length < 3) {
    return "Log a few more days to reveal a clearer pattern.";
  }

  const journaled = loggedTrends.filter(item => item.hasJournal);
  const unjournaled = loggedTrends.filter(item => !item.hasJournal);

  if (journaled.length >= 3 && unjournaled.length >= 3) {
    const journaledAverage = getAverageScore(journaled);
    const unjournaledAverage = getAverageScore(unjournaled);

    if (journaledAverage !== null && unjournaledAverage !== null && journaledAverage <= unjournaledAverage - 0.75) {
      return "You journal more on lower-mood days 📓";
    }
  }

  const validDays = weekly?.averages?.filter(day => day.score !== null && day.count >= 3) || [];
  const midWeekLow = validDays.find(day => (
    (day.day === 'Wednesday' || day.day === 'Thursday') &&
    weekly.lowestDay === day.day
  ));

  if (midWeekLow) {
    return "Your mood dips mid-week ⚠️";
  }

  const bestDay = validDays.find(day => day.day === weekly?.bestDay);
  if (bestDay) {
    return `You tend to feel better on ${bestDay.day}s 📈`;
  }

  const recent = loggedTrends.filter(item => item.timestamp >= loggedTrends[loggedTrends.length - 1].timestamp - (6 * MS_PER_DAY));
  const earlier = loggedTrends.filter(item => item.timestamp < loggedTrends[loggedTrends.length - 1].timestamp - (6 * MS_PER_DAY));

  if (recent.length >= 3 && earlier.length >= 3) {
    const recentAverage = getAverageScore(recent);
    const earlierAverage = getAverageScore(earlier);

    if (recentAverage !== null && earlierAverage !== null && recentAverage >= earlierAverage + 0.75) {
      return "Logging consistently improves your average mood 🔥";
    }
  }

  return "Your mood has been relatively steady lately.";
}

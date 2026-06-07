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

function getMoodColor(moodValue) {
  if (typeof moodValue !== 'number') return null;
  const colorIndex = Math.max(0, Math.min(gradients.indigo.length - 1, moodValue - 1));
  return gradients.indigo[colorIndex];
}

function formatPeriodDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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
    let chartValue = null;
    let moodValue = null;
    let moodName = null;
    let emoji = null;
    let color = null;
    const journal = dataObj?.[year]?.[month]?.[`journal_${day}`] || "";
    const hasJournal = Boolean(journal && String(journal).trim().length > 0);
    
    if (dataObj?.[year]?.[month] && typeof dataObj[year][month][day] === 'number') {
      moodValue = dataObj[year][month][day];
      moodName = convertMood(moodValue);
      score = MOOD_SCORES[moodName] || 5;
      chartValue = moodValue;
      emoji = emojiMap[moodName] || "";
      color = getMoodColor(moodValue);
    }
    
    result.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: d,
      timestamp: d.getTime(),
      score,
      chartValue,
      moodValue,
      moodName,
      emoji,
      color,
      hasJournal
    });
  }
  
  return result;
}

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

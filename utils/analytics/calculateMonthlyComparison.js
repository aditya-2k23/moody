import { MOOD_SCORES } from "./calculateMoodTrends";
import convertMood, { moods } from "../index";

function getMonthStats(dataObj, targetYear, targetMonth) {
  let totalScore = 0;
  let count = 0;
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const entries = [];
  const scores = [];
  let monthData = null;

  if (dataObj?.[targetYear]?.[targetMonth]) {
    monthData = dataObj[targetYear][targetMonth];
    for (let day = 1; day <= daysInMonth; day++) {
      if (typeof monthData[day] === 'number') {
        const moodName = convertMood(monthData[day]);
        const score = MOOD_SCORES[moodName] || 5;
        totalScore += score;
        count++;
        scores.push(score);
        entries.push({ day, score });
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

  return { average, count, variability, scores, entries, monthData };
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

// A. Mood Momentum Score
export function calculateMoodMomentum(entries) {
  if (!entries || entries.length === 0) return { score: 5, label: convertMood(5), direction: 'flat' };
  
  let weightedSum = 0;
  let totalWeight = 0;
  let flatSum = 0;
  
  entries.forEach((entry, i) => {
    // weight is index + 1 (later entries have higher weight)
    const weight = i + 1;
    weightedSum += entry.score * weight;
    totalWeight += weight;
    flatSum += entry.score;
  });
  
  const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 5;
  const flatAvg = entries.length > 0 ? flatSum / entries.length : 5;
  
  let direction = 'flat';
  if (weightedAvg > flatAvg + 0.5) direction = 'rising';
  else if (weightedAvg < flatAvg - 0.5) direction = 'falling';
  
  const score = weightedAvg;
  const label = convertMood(Math.round(score));
  
  return { score, label, direction };
}

// B. Mood Recovery Time
export function calculateMoodRecoveryTime(entries) {
  if (!entries || entries.length === 0) return { avgDays: null, occurrences: 0 };
  
  let occurrences = 0;
  let totalDays = 0;
  let currentLowIndex = -1;
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.score <= 3 && currentLowIndex === -1) {
      currentLowIndex = i;
      occurrences++;
    } else if (entry.score >= 6 && currentLowIndex !== -1) {
      totalDays += (i - currentLowIndex);
      currentLowIndex = -1;
    }
  }
  
  // If we end the month in a low state, count up to the end of the recorded entries
  if (currentLowIndex !== -1) {
    totalDays += (entries.length - currentLowIndex);
  }
  
  const avgDays = occurrences > 0 ? Math.round((totalDays / occurrences) * 10) / 10 : null;
  return { avgDays, occurrences };
}

// C. Journal-to-Mood Lift
export function calculateJournalLift(monthData) {
  if (!monthData) return { journaledAvg: 0, unjournaledAvg: 0, lift: 0, meaningful: false };
  
  let journaledSum = 0;
  let journaledCount = 0;
  let unjournaledSum = 0;
  let unjournaledCount = 0;
  
  Object.keys(monthData).forEach(key => {
    if (key.startsWith('journal_')) return;
    
    const day = parseInt(key);
    if (isNaN(day)) return;
    
    const moodValue = monthData[key];
    if (typeof moodValue !== 'number') return;
    
    const score = MOOD_SCORES[convertMood(moodValue)] || 5;
    const hasJournal = !!monthData[`journal_${day}`];
    
    if (hasJournal) {
      journaledSum += score;
      journaledCount++;
    } else {
      unjournaledSum += score;
      unjournaledCount++;
    }
  });
  
  const journaledAvg = journaledCount > 0 ? journaledSum / journaledCount : 0;
  const unjournaledAvg = unjournaledCount > 0 ? unjournaledSum / unjournaledCount : 0;
  const lift = Math.round((journaledAvg - unjournaledAvg) * 10) / 10;
  const meaningful = (journaledCount >= 3 && unjournaledCount >= 3 && lift >= 1.0);
  
  return { journaledAvg, unjournaledAvg, lift, meaningful };
}

// D. Emotional Range
export function calculateEmotionalRange(entries) {
  if (!entries || entries.length === 0) return { peak: null, trough: null };
  
  let peakEntry = entries[0];
  let troughEntry = entries[0];
  
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.score > peakEntry.score) peakEntry = entry;
    // Tie-breaker: keep earlier occurrence (handled by <)
    if (entry.score < troughEntry.score) troughEntry = entry;
  }
  
  const peakScore = peakEntry.score;
  const troughScore = troughEntry.score;
  
  const allMoods = Object.keys(moods);
  // scores are 1 to 13
  const peakMood = allMoods[peakScore - 1] || 'Neutral';
  const troughMood = allMoods[troughScore - 1] || 'Neutral';
  
  return {
    peak: { score: peakScore, label: peakMood, emoji: moods[peakMood] || '😐', day: peakEntry.day },
    trough: { score: troughScore, label: troughMood, emoji: moods[troughMood] || '😐', day: troughEntry.day }
  };
}

// E. Month-over-Month with Mood Labels
export function calculateMonthOverMonth(prevAvg, currAvg) {
  if (prevAvg === null || currAvg === null || currAvg === 0) {
    return { pctChange: 0, fromLabel: 'N/A', toLabel: 'N/A', fromEmoji: '😐', toEmoji: '😐' };
  }
  
  const moodDiff = currAvg - prevAvg;
  const pctChange = prevAvg > 0 ? (Math.abs(moodDiff) / prevAvg) * 100 : 0;
  
  const fromLabel = convertMood(Math.round(prevAvg));
  const toLabel = convertMood(Math.round(currAvg));
  
  return {
    pctChange: Math.round(pctChange),
    fromLabel,
    toLabel,
    fromEmoji: moods[fromLabel] || '😐',
    toEmoji: moods[toLabel] || '😐'
  };
}

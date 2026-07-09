/**
 * Main entry point for the analytics utility module.
 * Exports all calculation and aggregation functions used across the advanced analytics dashboard.
 */

export {
  calculateMoodTrends,
  calculateMoodHeatmap,
  calculateBestWorstPeriods,
  calculateMicroInsight,
  MOOD_SCORES
} from './calculateMoodTrends';
export { calculateDistribution } from './calculateDistribution';
export { calculateWeeklyPatterns } from './calculateWeeklyPatterns';
export { calculateConsistency } from './calculateConsistency';
export {
  calculateMonthlyComparison,
  calculateMoodMomentum,
  calculateMoodRecoveryTime,
  calculateJournalLift,
  calculateEmotionalRange,
  calculateMonthOverMonth
} from './calculateMonthlyComparison';
export { generateInsights } from './generateInsights';

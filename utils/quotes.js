import { quotes } from '../utils';

export function getQuoteOfTheDay() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Select 3 quotes for the day using different seeds
  const quote1Index = dayOfYear % quotes.length;
  const quote2Index = (dayOfYear * 3 + 17) % quotes.length;
  const quote3Index = (dayOfYear * 7 + 31) % quotes.length;

  return [
    quotes[quote1Index],
    quotes[quote2Index],
    quotes[quote3Index]
  ];
}

export function calculateReadingTime(text) {
  // Average reading speed: 200-250 words per minute
  // For quotes, we want slower reading + thinking time
  const wordsPerMinute = 120;
  const words = text.split(' ').length;
  const baseTime = (words / wordsPerMinute) * 60 * 1000; // Convert to milliseconds

  // Minimum 8 seconds, maximum 20 seconds
  return Math.max(8000, Math.min(20000, baseTime));
}

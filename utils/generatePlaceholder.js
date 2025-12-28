import { journalPlaceholders } from "@/utils";

/**
 * Get a random journal placeholder from the curated list.
 * Uses day-of-year for stable daily selection (same placeholder all day).
 * Falls back to random if needed.
 */
export const getJournalPlaceholder = () => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const diff = today - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Pick placeholder based on day of year for stable daily selection
  const index = dayOfYear % journalPlaceholders.length;
  return journalPlaceholders[index];
};

/**
 * Get a random placeholder (truly random, not day-based).
 * Useful for variety across sessions on the same day.
 */
export const getRandomPlaceholder = () => {
  const index = Math.floor(Math.random() * journalPlaceholders.length);
  return journalPlaceholders[index];
};

// Export the curated placeholders list for direct access
export { journalPlaceholders };

/**
 * Guest Draft Storage Utilities
 *
 * Stores mood + journal text in localStorage so unauthenticated visitors
 * can try the mood picker / journal without any Firebase calls.
 * After sign-in the draft is retrieved, hydrated into the dashboard, and cleared.
 *
 * All functions are no-op safe (try/catch) for SSR and private browsing.
 */

const STORAGE_KEY = "moody_guest_draft";

// Drafts older than 24 hours are considered stale
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Persist the guest's mood + journal text.
 * @param {{ mood: number|null, moodLabel: string|null, journalText: string }} draft
 */
export function saveGuestDraft({ mood, moodLabel, journalText }) {
  try {
    const payload = JSON.stringify({
      mood,
      moodLabel,
      journalText,
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // localStorage unavailable (SSR / private browsing) — silently ignore
  }
}

/**
 * Retrieve the guest draft, or `null` if none / expired.
 * @returns {{ mood: number|null, moodLabel: string|null, journalText: string, timestamp: number } | null}
 */
export function getGuestDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw);

    // Discard stale drafts (> 24 h)
    if (Date.now() - draft.timestamp > MAX_AGE_MS) {
      clearGuestDraft();
      return null;
    }

    return draft;
  } catch {
    return null;
  }
}

/**
 * Remove the guest draft from storage.
 */
export function clearGuestDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

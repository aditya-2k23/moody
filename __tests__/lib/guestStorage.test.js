/**
 * __tests__/lib/guestStorage.test.js
 *
 * Tests for saveGuestDraft / getGuestDraft / clearGuestDraft in lib/guestStorage.js.
 *
 * WHY THIS TEST EXISTS:
 *   Guest drafts are the only persistence layer for unauthenticated visitors.
 *   If save/retrieve/clear are broken, guests lose their mood and journal entry
 *   when they sign in — they'd see a blank dashboard despite having typed
 *   content.  The expiry logic (24 h) also needs testing to ensure stale data
 *   doesn't bleed across sessions.
 *
 * STRATEGY:
 *   jest-environment-jsdom provides a localStorage implementation.  We reset it
 *   in beforeEach so each test starts clean.  We control Date.now() via
 *   jest.spyOn to test the expiry branch without waiting 24 hours.
 *
 * COVERAGE:
 *   - saveGuestDraft → stores correct JSON in localStorage
 *   - getGuestDraft  → returns parsed draft when fresh
 *   - getGuestDraft  → returns null + clears when older than 24 h
 *   - getGuestDraft  → returns null when localStorage is empty
 *   - getGuestDraft  → returns null for corrupt JSON
 *   - clearGuestDraft → removes the item
 *   - pendingAction field round-trips correctly
 */

import {
  saveGuestDraft,
  getGuestDraft,
  clearGuestDraft,
} from "@/lib/guestStorage";

const STORAGE_KEY = "moody_guest_draft";

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

/**
 * Test suite
 */
describe("saveGuestDraft()", () => {
  it("persists the draft to localStorage", () => {
    saveGuestDraft({ mood: 3, moodLabel: "Good", journalText: "feeling great" });
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
  });

  it("serialises all provided fields", () => {
    saveGuestDraft({
      mood: 5,
      moodLabel: "Elated",
      journalText: "best day",
      pendingAction: "insights",
    });
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(parsed.mood).toBe(5);
    expect(parsed.moodLabel).toBe("Elated");
    expect(parsed.journalText).toBe("best day");
    expect(parsed.pendingAction).toBe("insights");
  });

  it("stores a timestamp", () => {
    const before = Date.now();
    saveGuestDraft({ mood: 1, moodLabel: "Awful", journalText: "" });
    const after = Date.now();
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(parsed.timestamp).toBeGreaterThanOrEqual(before);
    expect(parsed.timestamp).toBeLessThanOrEqual(after);
  });

  it("defaults pendingAction to null when not supplied", () => {
    saveGuestDraft({ mood: null, moodLabel: null, journalText: "" });
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(parsed.pendingAction).toBeNull();
  });
});

/**
 * Test suite
 */
describe("getGuestDraft()", () => {
  it("returns null when localStorage is empty", () => {
    expect(getGuestDraft()).toBeNull();
  });

  it("returns the draft when it is fresh (< 24 h)", () => {
    saveGuestDraft({ mood: 2, moodLabel: "Sad", journalText: "rough day" });
    const draft = getGuestDraft();
    expect(draft).not.toBeNull();
    expect(draft.mood).toBe(2);
    expect(draft.moodLabel).toBe("Sad");
    expect(draft.journalText).toBe("rough day");
  });

  it("returns null and clears storage when draft is older than 24 h", () => {
    // Save a draft, then fake the clock 25 hours into the future
    saveGuestDraft({ mood: 4, moodLabel: "Good", journalText: "old entry" });

    const MS_25H = 25 * 60 * 60 * 1000;
    jest.spyOn(Date, "now").mockReturnValue(Date.now() + MS_25H);

    expect(getGuestDraft()).toBeNull();
    // Should have been auto-cleared
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns null and clears storage for corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{ not valid json }}");
    expect(getGuestDraft()).toBeNull();
  });

  it("returns null and clears for a draft missing a timestamp", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mood: 1, moodLabel: "Sad", journalText: "no ts" })
    );
    expect(getGuestDraft()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

/**
 * Test suite
 */
describe("clearGuestDraft()", () => {
  it("removes the draft from localStorage", () => {
    saveGuestDraft({ mood: 3, moodLabel: "Good", journalText: "hi" });
    clearGuestDraft();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("is safe to call when no draft exists (no error thrown)", () => {
    expect(() => clearGuestDraft()).not.toThrow();
  });
});

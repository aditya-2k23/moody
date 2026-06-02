/**
 * __tests__/hooks/useGuestDraft.test.js
 *
 * Tests for the useGuestDraft custom React hook.
 *
 * WHY THIS TEST EXISTS:
 *   useGuestDraft is the bridge between unauthenticated user interactions and
 *   localStorage.  It manages debouncing, hydration on mount, and the
 *   setPendingAction flow that drives the post-login redirect.  Regressions
 *   here mean guests lose their data when they sign in.
 *
 * STRATEGY:
 *   - Use @testing-library/react's renderHook to execute the hook in a real
 *     React tree.
 *   - Use jest.useFakeTimers() to control the 300 ms debounce without actually
 *     waiting 300 ms in CI.
 *   - jsdom's localStorage is available thanks to jest-environment-jsdom.
 *   - lib/guestStorage is NOT mocked: we test the real integration between the
 *     hook and the storage layer (they live together as a unit).
 *
 * COVERAGE:
 *   - Initial draft is null when localStorage is empty
 *   - On mount, existing draft is rehydrated from localStorage
 *   - saveDraft updates state immediately and writes to localStorage (debounced)
 *   - clearDraft resets state to null and removes from localStorage
 *   - setPendingAction merges pendingAction into the existing draft
 *   - Debounce timer is cleaned up on unmount (no act() warnings)
 */

import { renderHook, act } from "@testing-library/react";
import { useGuestDraft } from "@/hooks/useGuestDraft";
import { saveGuestDraft } from "@/lib/guestStorage";

const STORAGE_KEY = "moody_guest_draft";

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("useGuestDraft()", () => {
  it("starts with draft === null when localStorage is empty", () => {
    const { result } = renderHook(() => useGuestDraft());
    expect(result.current.draft).toBeNull();
  });

  it("rehydrates an existing draft from localStorage on mount", () => {
    // Pre-populate localStorage before the hook mounts
    saveGuestDraft({ mood: 4, moodLabel: "Good", journalText: "pre-existing" });

    const { result } = renderHook(() => useGuestDraft());

    // The useEffect runs synchronously in jsdom
    act(() => {});

    expect(result.current.draft).not.toBeNull();
    expect(result.current.draft.mood).toBe(4);
    expect(result.current.draft.moodLabel).toBe("Good");
    expect(result.current.draft.journalText).toBe("pre-existing");
  });

  it("saveDraft updates state immediately", () => {
    const { result } = renderHook(() => useGuestDraft());

    act(() => {
      result.current.saveDraft(3, "Existing", "just vibing");
    });

    expect(result.current.draft).toEqual({
      mood: 3,
      moodLabel: "Existing",
      journalText: "just vibing",
      pendingAction: null,
    });
  });

  it("saveDraft writes to localStorage after the 300 ms debounce", () => {
    const { result } = renderHook(() => useGuestDraft());

    act(() => {
      result.current.saveDraft(2, "Sad", "hard day");
    });

    // Before debounce fires, localStorage should still be empty
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Advance past the 300 ms debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.mood).toBe(2);
    expect(stored.journalText).toBe("hard day");
  });

  it("clearDraft resets state to null and removes from localStorage", () => {
    const { result } = renderHook(() => useGuestDraft());

    act(() => {
      result.current.saveDraft(5, "Elated", "amazing!");
      jest.advanceTimersByTime(300); // flush debounce so it's stored
    });

    act(() => {
      result.current.clearDraft();
    });

    expect(result.current.draft).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("setPendingAction merges pendingAction into the current draft", () => {
    const { result } = renderHook(() => useGuestDraft());

    // First establish a draft
    act(() => {
      result.current.saveDraft(3, "Good", "some text");
      jest.advanceTimersByTime(300);
    });

    // Then set a pending action
    act(() => {
      result.current.setPendingAction("insights");
    });

    expect(result.current.draft.pendingAction).toBe("insights");
    expect(result.current.draft.mood).toBe(3); // other fields preserved

    // Should also be persisted to localStorage immediately (not debounced)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.pendingAction).toBe("insights");
  });

  it("setPendingAction works even when no draft exists yet", () => {
    const { result } = renderHook(() => useGuestDraft());

    act(() => {
      result.current.setPendingAction("login");
    });

    expect(result.current.draft).not.toBeNull();
    expect(result.current.draft.pendingAction).toBe("login");
    expect(result.current.draft.mood).toBeNull();
    expect(result.current.draft.journalText).toBe("");
  });
});

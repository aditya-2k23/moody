"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  saveGuestDraft,
  getGuestDraft,
  clearGuestDraft,
} from "@/lib/guestStorage";

/**
 * React hook that wraps guest localStorage utilities.
 *
 * On mount it rehydrates any existing draft and exposes helpers
 * for saving / clearing it.  Writes are debounced (300 ms) to
 * avoid thrashing localStorage on every keystroke.
 *
 * @returns {{
 *   draft: { mood: number|null, moodLabel: string|null, journalText: string } | null,
 *   saveDraft: (mood: number|null, moodLabel: string|null, journalText: string) => void,
 *   clearDraft: () => void,
 * }}
 */
export function useGuestDraft() {
  const [draft, setDraft] = useState(null);
  const debounceRef = useRef(null);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    const stored = getGuestDraft();
    if (stored) {
      setDraft(stored);
    }
  }, []);

  const saveDraft = useCallback((mood, moodLabel, journalText, pendingAction = null) => {
    const next = { mood, moodLabel, journalText, pendingAction };
    setDraft(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveGuestDraft(next);
    }, 300);
  }, []);

  /** Immediately persist a pending action (e.g. "insights") into the draft. */
  const setPendingAction = useCallback((action) => {
    setDraft((prev) => {
      const next = { ...(prev || { mood: null, moodLabel: null, journalText: "" }), pendingAction: action };
      saveGuestDraft(next);
      return next;
    });
  }, []);

  const clearDraftFn = useCallback(() => {
    setDraft(null);
    clearGuestDraft();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { draft, saveDraft, clearDraft: clearDraftFn, setPendingAction };
}

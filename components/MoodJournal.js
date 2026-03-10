"use client";

/**
 * MoodJournal — Reusable mood-picker + journal component.
 *
 * Works in two modes:
 *   mode="guest"  → No Firebase calls. Saves to localStorage. Gated actions
 *                    trigger onAuthRequired so the parent can show a login modal.
 *   mode="auth"   → Full functionality. Mood selection, journal auto-save,
 *                    image upload, AI insights — all backed by Firebase/Cloudinary.
 *
 * Props:
 *   mode            "guest" | "auth"
 *   initialMood     Pre-selected mood index (1-based) — used for draft hydration
 *   initialText     Pre-filled journal text — used for draft hydration
 *   user            Firebase currentUser object (only in auth mode)
 *   onMoodChange    Callback(moodIndex) — parent uses this to update calendar/streak
 *   onSave          Callback after explicit Save — parent side-effects
 *   onJournalSaved  Mirrors current Journal.js prop
 *   onMemoryAdded   Mirrors current Journal.js prop
 *   onAuthRequired  Called in guest mode when user tries a gated action.
 *                   Receives a reason string: "mood" | "save" | "insights" | "upload"
 *   saveDraft       Function(mood, moodLabel, text) from useGuestDraft (guest mode only)
 */

import { useState, useCallback, useEffect } from "react";
import { moods } from "@/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import Journal from "./Journal";

export default function MoodJournal({
  mode = "guest",
  initialMood = null,
  initialText = "",
  user = null,
  onMoodChange,
  onJournalSaved,
  onMemoryAdded,
  onAuthRequired,
  saveDraft,
  autoGenerateInsights,
  onInsightsAutoTriggered,
}) {
  const isGuest = mode === "guest";

  // ---------- mood state ----------
  const [selectedMood, setSelectedMood] = useState(initialMood);
  const [showAllMoods, setShowAllMoods] = useState(false);
  const [guestJournalText, setGuestJournalText] = useState(initialText);

  // Sync if parent changes initialMood / initialText (draft hydration)
  useEffect(() => {
    if (initialMood !== null) setSelectedMood(initialMood);
  }, [initialMood]);

  useEffect(() => {
    if (initialText) setGuestJournalText(initialText);
  }, [initialText]);

  // ---------- mood click handler ----------
  const handleMoodClick = useCallback(
    (moodIndex) => {
      // Toggle: if same mood, deselect
      const newMood = selectedMood === moodIndex ? null : moodIndex;
      setSelectedMood(newMood);

      const moodLabel = newMood
        ? Object.keys(moods)[newMood - 1]
        : null;

      if (isGuest) {
        // Persist to localStorage
        saveDraft?.(newMood, moodLabel, guestJournalText);
      } else {
        // Auth mode — delegate to parent (DashboardContent.handleSetMood)
        onMoodChange?.(newMood);
      }
    },
    [selectedMood, isGuest, saveDraft, guestJournalText, onMoodChange]
  );

  // Keep the mood selection in sync with parent when in auth mode
  // (parent may clear it or set it from Firestore data)
  const displayMood = isGuest ? selectedMood : initialMood;

  // ---------- mood grid (identical UI in both modes) ----------
  const moodKeys = Object.keys(moods);
  const visibleMoods = showAllMoods ? moodKeys : moodKeys.slice(0, 5);

  return (
    <>
      {/* "How do you feel?" title */}
      <h4 className="text-3xl sm:text-4xl md:text-5xl text-center fugaz">
        How do you <span className="textGradient">feel</span> today?
      </h4>

      {/* Mood grid */}
      <div className="flex items-stretch flex-wrap gap-4">
        {visibleMoods.map((mood, idx) => {
          const currentMood = idx + 1;
          const isSelected = displayMood === currentMood;
          return (
            <button
              onClick={() => handleMoodClick(currentMood)}
              key={idx}
              style={{
                outline: isSelected
                  ? "2px solid var(--outline-color)"
                  : "none",
                outlineOffset: 2,
                "--outline-color": "rgb(79 70 229)",
              }}
              className={`p-4 px-8 rounded-2xl purpleShadow duration-200 transition text-center flex flex-col items-center gap-3 flex-1
              ${isSelected
                  ? "bg-indigo-500/95 text-white scale-105 shadow-lg [--outline-color:rgb(129_140_248)]"
                  : "bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-500 dark:text-indigo-300"
                }`}
            >
              <p className="text-4xl sm:text-5xl md:text-6xl">{moods[mood]}</p>
              <p className="fugaz text-xs sm:text-sm md:text-base">{mood}</p>
            </button>
          );
        })}

        <button
          onClick={() => setShowAllMoods((prev) => !prev)}
          className="p-4 px-8 rounded-2xl border border-indigo-200 dark:border-indigo-400 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-300 font-bold hover:bg-indigo-100 dark:hover:bg-slate-700 duration-200 transition text-center flex-1 min-w-[100px] flex items-center justify-center"
        >
          {showAllMoods ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
        </button>
      </div>

      {/* Journal section */}
      <Journal
        mode={mode}
        currentUser={isGuest ? null : user}
        onMemoryAdded={onMemoryAdded}
        onJournalSaved={onJournalSaved}
        initialText={isGuest ? guestJournalText : initialText}
        autoGenerateInsights={autoGenerateInsights}
        onInsightsAutoTriggered={onInsightsAutoTriggered}
        onAuthRequired={onAuthRequired}
        onGuestTextChange={(text) => {
          setGuestJournalText(text);
          if (isGuest) {
            const moodLabel = selectedMood
              ? Object.keys(moods)[selectedMood - 1]
              : null;
            saveDraft?.(selectedMood, moodLabel, text);
          }
        }}
      />
    </>
  );
}

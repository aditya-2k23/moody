"use client";

import convertMood, { baseRating, gradients, months, dayList, moods } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import Button from "./Button";
import toast from "react-hot-toast";
import { AlertTriangle, Loader2, Pencil, Save, Trash2, X } from "lucide-react";

const monthsArr = Object.keys(months);

export default function Calender({
  demo,
  currentUser,
  completeData,
  showJournalPopup = false,
  onMonthChange,
  onUpdateEntry,
  onDeleteEntry,
}) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(monthsArr[currentMonth]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedJournal, setSelectedJournal] = useState("");
  const [selectedMood, setSelectedMood] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftJournal, setDraftJournal] = useState("");
  const [draftMood, setDraftMood] = useState(null);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const numericMonth = monthsArr.indexOf(selectedMonth);
  const data = completeData?.[selectedYear]?.[numericMonth] || {};

  const isAuthed = !!currentUser?.uid;

  const moodKeys = useMemo(() => Object.keys(moods), []);

  const hasSelectedEntry = useMemo(() => {
    if (!selectedDay) return false;
    const hasMood = typeof selectedMood === "number";
    const hasJournal = typeof selectedJournal === "string" && selectedJournal.trim().length > 0;
    return hasMood || hasJournal;
  }, [selectedDay, selectedMood, selectedJournal]);

  // Keep popup state in sync with the source of truth (completeData) when not editing.
  useEffect(() => {
    if (!selectedDay) return;
    if (isEditing) return;

    const journal = data?.[`journal_${selectedDay}`] || "";
    const mood = typeof data?.[selectedDay] === "number" ? data[selectedDay] : null;

    setSelectedJournal(journal);
    setSelectedMood(mood);
  }, [data, selectedDay, isEditing]);

  // Check if we're at the current month (can't go forward)
  const isAtCurrentMonth = selectedYear === currentYear && numericMonth === currentMonth;

  function handleIncrementMonth(val) {
    // Block navigation to future months
    if (val > 0 && isAtCurrentMonth) {
      return;
    }

    let newYear = selectedYear;
    let newMonthIndex = numericMonth + val;

    // if we hit the bounds of the months, then we can just adjust the year that is displayed instead
    if (newMonthIndex < 0) {
      // set month value to 11 and decrement the year
      newYear = selectedYear - 1;
      newMonthIndex = 11;
      setSelectedYear(newYear);
      setSelectedMonth(monthsArr[11]);
    } else if (newMonthIndex > 11) {
      // Would go to next year - check if that's in the future
      if (selectedYear + 1 > currentYear) {
        return; // Block future year navigation
      }
      newYear = selectedYear + 1;
      newMonthIndex = 0;
      setSelectedYear(newYear);
      setSelectedMonth(monthsArr[0]);
    } else {
      // Check if the new month would be in the future
      if (newYear === currentYear && newMonthIndex > currentMonth) {
        return; // Block future month navigation
      }
      setSelectedMonth(monthsArr[newMonthIndex]);
    }

    // Clear any open popup/edit state when navigating months
    setSelectedDay(null);
    setSelectedJournal("");
    setSelectedMood(null);
    setIsEditing(false);
    setConfirmDelete(false);

    // Notify parent of month change
    if (onMonthChange) {
      onMonthChange(newYear, newMonthIndex);
    }
  }

  const monthNow = new Date(selectedYear, monthsArr.indexOf(selectedMonth), 1);
  const firstDayOfMonth = monthNow.getDay();
  const daysInMonth = new Date(selectedYear, monthsArr.indexOf(selectedMonth) + 1, 0).getDate();

  const daysToDisplay = firstDayOfMonth + daysInMonth;
  const numRows = (Math.floor(daysToDisplay / 7)) + (daysToDisplay % 7 ? 1 : 0);

  const selectedMoodLabel = typeof selectedMood === "number" ? convertMood(selectedMood) : null;
  const selectedMoodEmoji = selectedMoodLabel ? moods[selectedMoodLabel] : null;

  return (
    <div className="flex flex-col gap-2 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 pb-3 md:pb-2 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
      <div className="absolute top-0 left-0 w-44 h-44 bg-gradient-to-br from-purple-300/30 to-indigo-300/30 dark:from-yellow-200/5 dark:to-orange-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/3 w-64 h-44 bg-gradient-to-br from-purple-300/30 to-indigo-300/30 dark:from-yellow-200/5 dark:to-orange-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-44 h-44 bg-gradient-to-br from-purple-300/30 to-indigo-300/30 dark:from-yellow-200/5 dark:to-orange-200/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-28 dark:w-52 dark:h-36 bg-gradient-to-tr from-yellow-300/20 to-orange-300/20 dark:from-purple-400/10 dark:to-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-28 dark:w-52 dark:h-36 bg-gradient-to-tr from-yellow-300/30 to-orange-400/30 dark:from-purple-400/10 dark:to-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      {showJournalPopup && selectedDay && (
        <div className="relative mb-0 md:mb-2 px-4 py-3 md:py-4 bg-indigo-50 dark:bg-slate-700/70 rounded-lg border border-indigo-200 dark:border-none">
          <button
            className="absolute top-2 right-2 text-indigo-500/70 dark:text-indigo-200/80 hover:text-indigo-700 dark:hover:text-indigo-200 outline-none duration-150 hover:scale-110 disabled:opacity-50"
            onClick={() => {
              if (saving || deleting) return;
              setSelectedDay(null);
              setSelectedJournal("");
              setSelectedMood(null);
              setIsEditing(false);
              setConfirmDelete(false);
            }}
            disabled={saving || deleting}
            title="Close"
            aria-label="Close journal entry"
          >
            <X size={18} />
          </button>

          <h3 className="font-bold text-indigo-600 dark:text-indigo-200/95 mb-1">{selectedDay} {selectedMonth}, {selectedYear}</h3>

          <p className="text-sm text-indigo-600/90 dark:text-indigo-200/80 mb-3 flex items-center gap-2">
            <span className="font-semibold">Mood:</span>
            {selectedMoodLabel ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-lg leading-none">{selectedMoodEmoji}</span>
                <span className="capitalize">{selectedMoodLabel}</span>
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-300">Not logged</span>
            )}
          </p>

          {!isEditing ? (
            <>
              {selectedJournal ? (
                <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{selectedJournal}</p>
              ) : (
                <p className="text-gray-500 dark:text-gray-300 italic">No journal entry for this day.</p>
              )}

              {hasSelectedEntry && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (saving || deleting) return;
                      setIsEditing(true);
                      setDraftJournal(selectedJournal || "");
                      setDraftMood(selectedMood);
                    }}
                    disabled={!isAuthed || saving || deleting}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-200 font-semibold hover:bg-white/80 dark:hover:bg-slate-800/80 transition disabled:opacity-50"
                    title="Edit"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (saving || deleting) return;
                      setConfirmDelete(true);
                    }}
                    disabled={!isAuthed || saving || deleting}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-300 font-semibold hover:bg-red-500/15 transition disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-indigo-700/80 dark:text-indigo-200/80">Mood</span>
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-slate-800/70 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500/70"
                    value={typeof draftMood === "number" ? String(draftMood) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setDraftMood(null);
                        return;
                      }
                      const val = Number(value);
                      setDraftMood(Number.isFinite(val) ? val : null);
                    }}
                  >
                    {draftMood === null && (
                      <option value="">Select mood</option>
                    )}
                    {moodKeys.map((key, idx) => (
                      <option key={key} value={String(idx + 1)}>
                        {moods[key]} {key}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-indigo-700/80 dark:text-indigo-200/80">Journal</span>
                  <textarea
                    className="w-full min-h-24 md:min-h-28 p-3 text-gray-700 dark:text-gray-100 bg-white/70 dark:bg-slate-800/70 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/70 whitespace-pre-line"
                    value={draftJournal}
                    onChange={(e) => setDraftJournal(e.target.value)}
                    disabled={saving}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (!isAuthed) {
                      toast.error("Not authenticated");
                      return;
                    }
                    if (!onUpdateEntry) return;
                    if (!selectedDay) return;
                    if (saving) return;

                    const hasMood = typeof draftMood === "number";
                    const hasJournal = typeof draftJournal === "string" && draftJournal.trim().length > 0;

                    if (!hasMood && !hasJournal) {
                      toast.error("Nothing to save — use Delete instead.");
                      return;
                    }

                    setSaving(true);
                    const opYear = selectedYear;
                    const opMonth = numericMonth;
                    const opDay = selectedDay;

                    // Optimistically update local popup state immediately.
                    setSelectedJournal(draftJournal);
                    setSelectedMood(draftMood);

                    try {
                      await onUpdateEntry({
                        year: opYear,
                        month: opMonth,
                        day: opDay,
                        mood: draftMood,
                        journal: draftJournal,
                      });
                      toast.success("Journal updated");
                      setIsEditing(false);
                    } catch (err) {
                      toast.error("Failed to update entry. Please try again.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (saving) return;
                    setIsEditing(false);
                    setDraftJournal("");
                    setDraftMood(null);
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 text-gray-700 dark:text-gray-100 font-semibold hover:bg-white/80 dark:hover:bg-slate-800/80 transition disabled:opacity-60"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && selectedDay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => {
          if (deleting) return;
          setConfirmDelete(false);
        }}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-indigo-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-300">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete entry?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">Delete mood & journal for this day? This cannot be undone.</p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-white/70 dark:bg-slate-800/70 text-gray-800 dark:text-gray-100 font-semibold hover:bg-white dark:hover:bg-slate-800 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!isAuthed) {
                    toast.error("Not authenticated");
                    return;
                  }
                  if (!onDeleteEntry) return;
                  if (deleting) return;

                  setDeleting(true);
                  const opYear = selectedYear;
                  const opMonth = numericMonth;
                  const opDay = selectedDay;

                  try {
                    await onDeleteEntry({ year: opYear, month: opMonth, day: opDay });
                    toast.success("Entry deleted");
                    setConfirmDelete(false);
                    setIsEditing(false);
                    setSelectedDay(null);
                    setSelectedJournal("");
                    setSelectedMood(null);
                  } catch (err) {
                    toast.error("Failed to delete entry. Please try again.");
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-4 text-lg sm:text-xl md:text-2xl pt-4">
        <Button
          text={<i className="fa-solid fa-circle-chevron-left"></i>}
          normal={false}
          className="mr-auto text-indigo-500 dark:text-indigo-400/70 hover:opacity-80 duration-200 hover:scale-110"
          onClick={() => handleIncrementMonth(-1)}
        />
        <p className="fugaz col-span-3 whitespace-nowrap textGradient text-center capitalize">{selectedMonth}, {selectedYear}</p>
        <Button
          className={`ml-auto duration-200 ${isAtCurrentMonth ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400/70 hover:opacity-80 hover:scale-110'}`}
          text={<i className="fa-solid fa-circle-chevron-right"></i>}
          normal={false}
          onClick={() => handleIncrementMonth(+1)}
        />
      </div>
      <div className="flex flex-col overflow-hidden gap-1 px-1 py-4 sm:py-6 md:py-10">
        {/* Day of week headings */}
        <div className="grid grid-cols-7 gap-1 text-sm font-semibold text-indigo-500 dark:text-indigo-400 ml-2 mb-1">
          {dayList.map((day) => (
            <div key={day}>{day.slice(0, 3)}</div>
          ))}
        </div>

        {[...Array(numRows).keys()].map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 gap-1">
            {dayList.map((_, dayOfWeekIndex) => {
              // Calculate the actual day number for this calendar cell
              let dayIndex = (rowIndex * 7) + dayOfWeekIndex - (firstDayOfMonth - 1);

              // Determine if this cell should display a day number
              let shouldDisplayDay = true;
              if (dayIndex > daysInMonth) {
                shouldDisplayDay = false; // Beyond the last day of the month
              } else if (row === 0 && dayOfWeekIndex < firstDayOfMonth) {
                shouldDisplayDay = false; // Before the first day of the month
              }

              // If this cell shouldn't display a day, render empty cell
              if (!shouldDisplayDay) {
                return <div className="bg-white/30 dark:bg-gray-900/0 border rounded-lg border-indigo-100/70 dark:border-slate-700/30" key={dayOfWeekIndex} />;
              }

              // Check if this day is today
              let isToday = dayIndex === now.getDate() && numericMonth === currentMonth && selectedYear === currentYear;

              // Determine the background color based on mood data
              let backgroundColor = "transparent"; // Default color
              let moodRating = null;

              if (demo) {
                // Demo mode: use baseRating data
                moodRating = baseRating[dayIndex];
                if (moodRating !== undefined && moodRating >= 0 && moodRating <= 12) {
                  backgroundColor = gradients.indigo[moodRating];
                }
              } else {
                // Real data mode: use actual user data
                if (dayIndex in data) {
                  moodRating = data[dayIndex] - 1;
                  if (moodRating >= 0 && moodRating <= 12) {
                    backgroundColor = gradients.indigo[moodRating];
                  }
                }
              }

              // Determine text color based on background darkness and theme
              let textColor = "";
              if (backgroundColor === "transparent") {
                // No mood data - use default colors
                textColor = "text-indigo-400 dark:text-indigo-200";
              } else if (moodRating !== null) {
                // Light backgrounds (ratings 0-4) - use dark text
                if (moodRating < 2) {
                  textColor = "text-indigo-500 dark:text-indigo-600";
                }
                else if (moodRating == 2) {
                  textColor = "text-indigo-600 dark:text-indigo-600";
                }
                // Medium backgrounds (ratings 5-8) - use balanced text
                else if (moodRating <= 8 && moodRating > 4) {
                  textColor = "text-white dark:text-indigo-100";
                }
                // Dark backgrounds (ratings 9-12) - use light text
                else {
                  textColor = "text-white dark:text-gray-100";
                }
              }

              let isSelected = (dayIndex === selectedDay);

              // Check if this date is in the future
              const isFutureDay = (selectedYear === currentYear && numericMonth === currentMonth && dayIndex > now.getDate()) ||
                (selectedYear === currentYear && numericMonth > currentMonth) ||
                (selectedYear > currentYear);

              return (
                <div
                  style={{ background: backgroundColor !== "transparent" ? backgroundColor : undefined }}
                  className={`
                    text-xs sm:text-sm border border-solid p-2 flex items-center gap-2 justify-between rounded-lg truncate
                    ${isFutureDay ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
                    ${isToday ? "border-indigo-500 dark:border-indigo-400" : "border-indigo-100 dark:border-slate-700"}
                    ${isSelected && !isFutureDay ? "ring-2 ring-indigo-600 dark:ring-indigo-400" : ""}
                    ${backgroundColor === "transparent" ? "bg-white dark:bg-slate-800" : backgroundColor}
                    ${textColor}
                  `}
                  key={dayOfWeekIndex}
                  onClick={() => {
                    if (isFutureDay) return; // Block click on future dates
                    if (saving || deleting) return;

                    setSelectedDay(dayIndex);
                    setSelectedJournal(data[`journal_${dayIndex}`] || "");
                    setSelectedMood(typeof data?.[dayIndex] === "number" ? data[dayIndex] : null);

                    // Avoid stale UI when switching dates rapidly
                    setIsEditing(false);
                    setConfirmDelete(false);
                  }}
                  title={isFutureDay ? "Future date" : (data[`journal_${dayIndex}`] ? "View journal entry" : undefined)}
                >
                  <p className="font-bold">{dayIndex}</p>
                  {isToday && (
                    <span title="Today"><i className="fa-solid fa-calendar-days"></i></span>
                  )}
                  {data[`journal_${dayIndex}`] && (
                    <span className={`ml-auto ${isToday ? "hidden sm:block" : ""}`} title="Journal entry"><i className="fa-solid fa-note-sticky"></i></span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

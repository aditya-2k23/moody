"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AlertTriangle, Loader2, Pencil, Save, Trash2, X, Sparkles, Bot, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import convertMood, { moods } from "@/utils";
import RadialMoodMenu from "./RadialMoodMenu";
import NewFeatureDot from "./NewFeatureDot";
import ChatContainer from "./chat/ChatContainer";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function JournalModal({
  isOpen,
  day,
  month,
  monthName,
  year,
  mood,
  journal,
  isAuthed,
  userId,
  onSave,
  onDelete,
  onClose,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftJournal, setDraftJournal] = useState("");
  const [draftMood, setDraftMood] = useState(null);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Insights panel state
  const [showInsights, setShowInsights] = useState(false);
  const [dayInsights, setDayInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [chatFullscreen, setChatFullscreen] = useState(false);

  const modalRef = useRef(null);

  // Reset state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
      setDraftJournal(journal || "");
      setDraftMood(mood);
      setConfirmDelete(false);
      setConfirmDiscard(false);
      setShowInsights(false);
      setDayInsights(null);
      setChatFullscreen(false);
    }
  }, [isOpen, day, month, year, journal, mood]);

  const selectedMoodLabel = typeof mood === "number" ? convertMood(mood) : null;
  const selectedMoodEmoji = selectedMoodLabel ? moods[selectedMoodLabel] : null;

  const hasEntry = useMemo(() => {
    const hasMood = typeof mood === "number";
    const hasJournal = typeof journal === "string" && journal.trim().length > 0;
    return hasMood || hasJournal;
  }, [mood, journal]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditing) return false;
    const moodChanged = draftMood !== mood;
    const journalChanged = draftJournal !== (journal || "");
    return moodChanged || journalChanged;
  }, [isEditing, draftMood, mood, draftJournal, journal]);

  // Mood options for radial menu (derived once)
  const moodOptions = useMemo(
    () => Object.entries(moods).map(([label, emoji]) => ({ label, emoji })),
    []
  );

  // Draft mood display values (for edit-mode radial trigger)
  const draftMoodLabel = typeof draftMood === "number" ? convertMood(draftMood) : null;
  const draftMoodEmoji = draftMoodLabel ? moods[draftMoodLabel] : null;

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (saving || deleting) return;
    if (hasUnsavedChanges) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }, [saving, deleting, hasUnsavedChanges, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        // If any confirmation dialog is open, close it instead
        if (confirmDelete) {
          setConfirmDelete(false);
          return;
        }
        if (confirmDiscard) {
          setConfirmDiscard(false);
          return;
        }
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, confirmDelete, confirmDiscard, handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position and add padding to prevent layout shift
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      // Restore scroll position and remove padding
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!isAuthed) {
      toast.error("Not authenticated");
      return;
    }
    if (!onSave) return;
    if (saving) return;

    const hasMood = typeof draftMood === "number";
    const hasJournal = typeof draftJournal === "string" && draftJournal.trim().length > 0;

    if (!hasMood && !hasJournal) {
      toast.error("Nothing to save — use Delete instead.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        year,
        month,
        day,
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
  };

  const handleDelete = async () => {
    if (!isAuthed) {
      toast.error("Not authenticated");
      return;
    }
    if (!onDelete) return;
    if (deleting) return;

    setDeleting(true);
    try {
      await onDelete({ year, month, day });
      toast.success("Entry deleted");
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      toast.error("Failed to delete entry. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Main Modal Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 animate-modal-overlay bg-black/40 backdrop-blur-sm"
        onClick={handleOverlayClick}
      >
        {/* Modal Content */}
        <div
          ref={modalRef}
          className={`relative w-full ${chatFullscreen ? 'max-w-none h-full' : showInsights ? 'max-w-4xl' : 'max-w-lg'} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-modal-content transition-all duration-300 ${chatFullscreen ? 'h-[calc(100vh-3rem)]' : 'max-h-[90vh]'} overflow-hidden flex flex-col`}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,243,255,0.98) 100%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dark mode background override */}
          <div className="absolute inset-0 rounded-2xl bg-white dark:bg-slate-900 -z-[5]" />

          {/* Close button */}
          <button
            className="absolute top-3 right-3 p-1.5 text-indigo-500/70 dark:text-indigo-300/80 hover:text-indigo-700 dark:hover:text-indigo-200 hover:bg-indigo-100/50 dark:hover:bg-slate-700/50 rounded-lg transition duration-150 disabled:opacity-50 z-10"
            onClick={handleClose}
            disabled={saving || deleting}
            title="Close"
            aria-label="Close journal entry"
          >
            <X size={20} />
          </button>

          {/* Modal body */}
          <div className={`p-5 md:p-6 ${chatFullscreen ? 'flex-1 flex flex-col overflow-hidden' : 'overflow-y-auto chat-scrollbar flex-1'}`}>
            {/* Journal content — hidden when chat is fullscreen */}
            {!chatFullscreen && (
              <>
                {/* Date header */}
                <h3 className="font-bold text-lg text-indigo-700 dark:text-indigo-200 mb-4">
                  {day} {monthName}, {year}
                </h3>

                {/* Mood display */}
                <div className="text-sm text-indigo-600/90 dark:text-indigo-200/80 mb-4 flex items-center gap-1">
                  <span className="font-semibold">You felt:</span>
                  {!isEditing ? (
                    selectedMoodLabel ? (
                      <span className="inline-flex items-center gap-1 ml-1">
                        <span className="text-xl leading-none">{selectedMoodEmoji}</span>
                        <span className="capitalize">{selectedMoodLabel}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 italic ml-1">Not logged</span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-2 ml-1">
                      <span className="relative">
                        <RadialMoodMenu
                          moods={moodOptions}
                          currentMoodEmoji={draftMoodEmoji}
                          currentMoodLabel={draftMoodLabel}
                          onMoodChange={(moodItem, index) => setDraftMood(index + 1)}
                          disabled={saving}
                        />
                        <NewFeatureDot className="-right-[-3px]" />
                      </span>
                      <span className="inline-flex flex-col leading-tight">
                        {draftMoodLabel ? (
                          <>
                            <span className="text-sm font-medium capitalize text-indigo-600 dark:text-indigo-200">
                              {draftMoodLabel}
                            </span>

                            <span className="text-[0.65rem] text-indigo-400/70 dark:text-indigo-300/80 tracking-wide animate-bounce mt-0.5">
                              hover to change
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-indigo-400/80 dark:text-indigo-300/60 italic tracking-wide animate-pulse">
                            pick a mood
                          </span>
                        )}
                      </span>
                    </span>
                  )}
                </div>

                {/* Journal content */}
                {!isEditing ? (
                  <div className="min-h-[120px] max-h-[40vh] overflow-y-auto p-4 bg-indigo-50/50 dark:bg-slate-800/50 rounded-xl border border-indigo-100 dark:border-slate-700 custom-scrollbar">
                    {journal ? (
                      <p className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {journal}
                      </p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic text-sm">
                        No journal entry for this day.
                      </p>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="w-full min-h-[140px] max-h-[40vh] p-4 text-gray-700 dark:text-gray-100 bg-indigo-50/50 dark:bg-slate-800/50 rounded-xl border border-indigo-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-transparent whitespace-pre-wrap break-words text-sm leading-relaxed resize-y custom-scrollbar"
                    value={draftJournal}
                    onChange={(e) => setDraftJournal(e.target.value)}
                    disabled={saving}
                    placeholder="Write your thoughts..."
                  />
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-2 mt-5">
                  {/* View Insights button (left side) */}
                  <div>
                    {isAuthed && userId && !isEditing && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (showInsights) {
                            setShowInsights(false);
                            return;
                          }
                          setLoadingInsights(true);
                          setShowInsights(true);
                          try {
                            const docRef = doc(db, "users", userId);
                            const snapshot = await getDoc(docRef);
                            if (snapshot.exists()) {
                              const data = snapshot.data();
                              const stored = data?.[year]?.[month]?.[`insights_${day}`];
                              if (stored && typeof stored === "object") {
                                setDayInsights(stored);
                              }
                            }
                          } catch (err) {
                            console.error("Failed to load insights:", err);
                          } finally {
                            setLoadingInsights(false);
                          }
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${showInsights
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-50 dark:bg-slate-700/80 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-600"
                          }`}
                      >
                        <Sparkles size={14} />
                        {showInsights ? "Hide Insights" : "View Insights"}
                      </button>
                    )}
                  </div>

                  {/* Edit/Delete/Save buttons (right side) */}
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      hasEntry ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (saving || deleting) return;
                              setIsEditing(true);
                              setDraftJournal(journal || "");
                              setDraftMood(mood);
                            }}
                            disabled={!isAuthed || saving || deleting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-200 font-semibold hover:bg-indigo-300 dark:hover:bg-slate-600 transition disabled:opacity-50"
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/30 text-red-600 dark:text-slate-300 border border-red-300 dark:border-red-500/70 font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (saving || deleting) return;
                            setIsEditing(true);
                            setDraftJournal("");
                            setDraftMood(mood);
                          }}
                          disabled={!isAuthed || saving || deleting}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          <Pencil size={16} />
                          Write Journal
                        </button>
                      )
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                        >
                          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (saving) return;
                            if (hasUnsavedChanges) {
                              setConfirmDiscard(true);
                              return;
                            }
                            setIsEditing(false);
                            setDraftJournal("");
                            setDraftMood(null);
                          }}
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-100 font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition disabled:opacity-60"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Insights & Chat Panel */}
            {showInsights && (
              <div className={`${chatFullscreen ? 'flex-1 flex flex-col overflow-hidden' : 'mt-5 pt-5 border-t border-indigo-100 dark:border-slate-700/50'} animate-chat-fade-in`}>
                {loadingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-indigo-400" />
                    <span className="ml-2 text-sm text-gray-400">Loading insights...</span>
                  </div>
                ) : dayInsights ? (
                  <div className="space-y-4">
                    {/* Insight summary */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                          {dayInsights.headline || "Lumi's Thoughts"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {Array.isArray(dayInsights.response)
                            ? dayInsights.response.join(" ")
                            : (dayInsights.response || dayInsights.insight)}
                        </p>
                      </div>
                    </div>

                    {/* Triggers */}
                    {Array.isArray(dayInsights.triggers) && dayInsights.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {dayInsights.triggers.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-md bg-indigo-50 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-300 border border-indigo-100/80 dark:border-slate-700/80"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Follow-up question */}
                    {dayInsights.followUpQuestion && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <MessageCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                            {dayInsights.followUpQuestion}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Chat for this day */}
                    <div className={`${chatFullscreen ? 'flex-1 flex flex-col overflow-hidden' : 'pt-2'}`}>
                      <ChatContainer
                        chatId={`chat_${userId}_${year}_${month}_${day}`}
                        userId={userId}
                        journalText={journal}
                        onFullscreenChange={setChatFullscreen}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Sparkles size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      No insights generated for this day.
                    </p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                      Write a journal entry and click &ldquo;Ask Lumi&rdquo; to get Lumi&apos;s thoughts.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 animate-modal-overlay"
          onClick={() => {
            if (deleting) return;
            setConfirmDelete(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-indigo-100 dark:border-slate-700 animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-300">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete entry?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              Delete mood & journal for this day? This cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 border border-red-300 dark:border-red-500/70 text-white font-semibold hover:bg-red-500 transition disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved changes confirmation dialog */}
      {confirmDiscard && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 animate-modal-overlay"
          onClick={() => setConfirmDiscard(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-indigo-100 dark:border-slate-700 animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-300">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Unsaved changes</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              You have unsaved changes. Do you want to discard them?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDiscard(false);
                  setIsEditing(false);
                  setDraftJournal("");
                  setDraftMood(null);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

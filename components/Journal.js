"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Button from "./Button";
import { db } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { generateInsight } from "@/app/actions/insights";
import { getJournalPlaceholder } from "@/utils/generatePlaceholder";
import { journalPlaceholders } from "@/utils";
import { uploadToCloudinary, getCloudinaryUploadSignature } from "@/utils/cloudinary";
import { saveMemory } from "@/utils/saveMemory";
import { invalidateMemoriesCache } from "@/hooks/useMemories";
import AIInsightsSection from "./AIInsightsSection";
import ImageUpload, { MAX_IMAGES_PER_DAY } from "./ImageUpload";
import StyleTools from "./StyleTools";
import RichTextEditor from "./RichTextEditor";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { CloudUpload, Mic, Square, NotebookPen, Sparkles, CloudCheck } from "lucide-react";
import { TypeAnimation } from 'react-type-animation';

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Journal({
  mode = "auth",
  currentUser,
  onMemoryAdded,
  onJournalSaved,
  initialText = "",
  onAuthRequired,
  onGuestTextChange,
  autoGenerateInsights,
  onInsightsAutoTriggered,
  imageInputId = "journal-image-upload",
}) {
  const isGuest = mode === "guest";
  const [entry, setEntry] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const insightsRef = useRef(null);
  const [editor, setEditor] = useState(null);

  // Auto-load previously generated insights for today from Firestore
  const insightsLoadedKeyRef = useRef("");
  const nowForInsightsKey = new Date();
  const insightsDateKey = getDateKey(nowForInsightsKey);
  const insightsLoadKey = currentUser?.uid
    ? `${currentUser.uid}|${insightsDateKey}`
    : "";

  useEffect(() => {
    if (isGuest || !currentUser?.uid || !insightsLoadKey) {
      insightsLoadedKeyRef.current = "";
      return;
    }

    if (insightsLoadedKeyRef.current === insightsLoadKey) return;

    const [uidFromKey, dateKeyFromKey] = insightsLoadKey.split("|");

    const loadTodaysInsights = async () => {
      try {
        const docRef = doc(db, "users", uidFromKey, "insights", dateKeyFromKey);
        const snapshot = await getDoc(docRef);

        // Success! Marker that we've attempted this key
        insightsLoadedKeyRef.current = insightsLoadKey;

        if (snapshot.exists()) {
          const storedInsights = snapshot.data();
          if (storedInsights && typeof storedInsights === "object") {
            // Fingerprint check: Only load if it matches the current text
            if (storedInsights.sourceText === entry.trim()) {
              setInsights(storedInsights);
              return;
            } else {
              console.log("[Journal] Stale insights found (text mismatch), ignoring cache.");
            }
          }
        }

        setInsights("");
      } catch (error) {
        console.error("Failed to load today's insights:", error);
      }
    };

    loadTodaysInsights();
  }, [currentUser, isGuest, insightsLoadKey, entry]);

  // Cloud save status: 'idle' | 'saving' | 'saved'
  const [cloudStatus, setCloudStatus] = useState("idle");

  // Debounce timer ref for auto-save
  const debounceTimerRef = useRef(null);

  // Track if entry has unsaved changes (for auto-save logic)
  const hasUnsavedChangesRef = useRef(false);

  // Track last saved entry to prevent duplicate Firebase writes
  const lastSavedEntryRef = useRef("");

  // Track input source: "typing" | "voice"
  const inputSourceRef = useRef("typing");

  // Track previous isListening state to detect voice stop
  const prevIsListeningRef = useRef(false);

  // Get placeholder once on component mount (stable, no re-renders)
  const [placeholder] = useState(() => getJournalPlaceholder());

  const typingSequence = useMemo(() => {
    return journalPlaceholders.flatMap(text => [text, 3000]);
  }, []);

  // Image upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Determine AI icon based on resolved theme (next-themes handles system preference)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-trigger insight generation when redirected from guest mode
  const autoInsightTriggeredRef = useRef(false);
  useEffect(() => {
    if (
      autoGenerateInsights &&
      !autoInsightTriggeredRef.current &&
      !isGuest &&
      currentUser?.uid
    ) {
      // Wait for the entry to be populated (synced from initialText)
      if (!entry.trim()) return;
      autoInsightTriggeredRef.current = true;
      onInsightsAutoTriggered?.();
      handleGenerateInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerateInsights, entry, currentUser]);

  // Voice input hook
  const {
    isListening,
    toggleVoiceInput,
    syncBaseEntry,
    getDisplayValue
  } = useVoiceInput({
    initialValue: entry,
    onTranscriptChange: (newEntry) => {
      inputSourceRef.current = "voice";
      setEntry(newEntry);
    },
  });

  // Compute display value with interim transcript
  const displayEntry = getDisplayValue(entry);

  // Store onJournalSaved in a ref to keep dependency array stable
  const onJournalSavedRef = useRef(onJournalSaved);
  useEffect(() => {
    onJournalSavedRef.current = onJournalSaved;
  }, [onJournalSaved]);

  // Sync entry when initialText changes (draft hydration)
  useEffect(() => {
    if (initialText && !entry) {
      setEntry(initialText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);

  // ========== Auto-Save Logic (Text Only) ==========
  const saveJournalText = useCallback(async () => {
    if (isGuest) return false; // Never write to Firebase in guest mode
    if (!currentUser?.uid) return false;

    // Prevent duplicate Firebase writes
    if (entry === lastSavedEntryRef.current) {
      return false;
    }

    // Use fresh date to avoid stale values if tab was left open overnight
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    try {
      const docRef = doc(db, "users", currentUser.uid);
      await setDoc(docRef, {
        [year]: {
          [month]: {
            [`journal_${day}`]: entry
          }
        }
      }, { merge: true });
      // Update last saved entry after successful save
      lastSavedEntryRef.current = entry;
      // Notify parent to update UI immediately
      onJournalSavedRef.current?.(entry);
      return true;
    } catch (error) {
      return false;
    }
  }, [entry, currentUser, isGuest]);

  // Debounce constants
  const TYPING_DEBOUNCE_MS = 3000;
  const VOICE_DEBOUNCE_MS = 2000;

  // Trigger auto-save with source-aware debounce
  const triggerAutoSave = useCallback((immediate = false) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!entry && !lastSavedEntryRef.current) {
      setCloudStatus("idle");
      return;
    }

    // Skip autosave while voice is active (will save when voice stops)
    if (isListening && !immediate) {
      hasUnsavedChangesRef.current = true;
      return;
    }

    // Skip if content hasn't changed
    if (entry === lastSavedEntryRef.current) {
      return;
    }

    hasUnsavedChangesRef.current = true;

    // Immediate save (used when voice stops or page exit)
    if (immediate) {
      setCloudStatus("saving");
      saveJournalText().then((success) => {
        if (success) {
          setCloudStatus("saved");
          hasUnsavedChangesRef.current = false;
          setTimeout(() => setCloudStatus("idle"), 2000);
        } else {
          setCloudStatus("idle");
        }
      });
      return;
    }

    // Don't show "saving" status during debounce wait, only when actually saving
    const debounceTime = inputSourceRef.current === "voice" ? VOICE_DEBOUNCE_MS : TYPING_DEBOUNCE_MS;

    debounceTimerRef.current = setTimeout(async () => {
      setCloudStatus("saving");
      const success = await saveJournalText();
      if (success) {
        setCloudStatus("saved");
        hasUnsavedChangesRef.current = false;
        setTimeout(() => setCloudStatus("idle"), 2000);
      } else {
        setCloudStatus("idle");
      }
    }, debounceTime);
  }, [entry, saveJournalText, isListening]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Trigger auto-save when entry changes (only for typing, not voice)
  useEffect(() => {
    // In guest mode, notify parent of text changes but never auto-save to Firebase
    if (isGuest) {
      onGuestTextChange?.(entry);
      return;
    }

    if (isListening) {
      // During voice input, just mark as having unsaved changes
      // The save will happen when voice stops
      hasUnsavedChangesRef.current = true;
    } else {
      triggerAutoSave();
    }
    // Reset input source to typing after processing
    if (inputSourceRef.current === "voice" && !isListening) {
      inputSourceRef.current = "typing";
    }
    // This effect triggers ONLY on entry changes to initiate auto-save.
    // Omitting triggerAutoSave prevents re-running on its internal dep changes.
    // Omitting isListening prevents double-triggering (voice stop handled in separate effect).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  // Save immediately when voice input stops (isListening: true → false)
  useEffect(() => {
    if (prevIsListeningRef.current && !isListening) {
      // Voice just stopped, trigger immediate save
      if (entry.trim() && hasUnsavedChangesRef.current) {
        triggerAutoSave(true);
      }
    }
    prevIsListeningRef.current = isListening;
  }, [isListening, entry, triggerAutoSave]);

  // Page exit safety: save on visibility change and beforeunload using sendBeacon for reliability
  // (auth mode only — guest mode has nothing to persist to Firebase)
  useEffect(() => {
    if (isGuest) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChangesRef.current && entry.trim()) {
        // Use sendBeacon for guaranteed delivery on page hide
        if (navigator.sendBeacon && currentUser?.uid) {
          // Compute fresh date values to avoid stale dates
          const now = new Date();
          const day = now.getDate();
          const month = now.getMonth();
          const year = now.getFullYear();

          // Get fresh ID token for authentication
          currentUser.getIdToken().then((idToken) => {
            const payload = JSON.stringify({
              idToken,
              year,
              month,
              day,
              entry: entry.trim()
            });
            const queued = navigator.sendBeacon('/api/journal-beacon', payload);
            if (queued) {
              hasUnsavedChangesRef.current = false;
              lastSavedEntryRef.current = entry;
            } else {
              // Fallback if beacon fails to enqueue
              saveJournalText();
            }
          }).catch(() => {
            // Fall back to async save if token retrieval fails
            saveJournalText();
          });
        } else {
          // Fall back to async save when sendBeacon unavailable
          saveJournalText();
        }
      }
    };

    const handleBeforeUnload = (e) => {
      if (hasUnsavedChangesRef.current && entry.trim()) {
        // Show browser's "are you sure?" prompt.
        // The visibilitychange handler (which fires first on tab close) handles the actual save.
        // Async saves here won't reliably complete before unload, so we just warn the user.
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveJournalText, entry, currentUser, isGuest]);

  // ========== Image Upload Handlers ==========
  const handleImagesChange = (files, previews) => {
    setSelectedImages(files);
    setImagePreviews(previews);
  };

  const clearImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
  };

  // ========== Save Handler ==========
  const handleSave = async () => {
    if (isGuest) {
      onAuthRequired?.("save");
      return;
    }
    if (!entry.trim() && selectedImages.length === 0) {
      toast.error("Add a journal entry or photos.");
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setSaving(true);
    setCloudStatus("saving");
    setUploading(selectedImages.length > 0);

    // Use fresh date to avoid stale values if tab was left open overnight
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    try {
      if (entry.trim()) {
        const docRef = doc(db, "users", currentUser.uid);
        await setDoc(docRef, {
          [year]: {
            [month]: {
              [`journal_${day}`]: entry
            }
          }
        }, { merge: true });
        hasUnsavedChangesRef.current = false;
        lastSavedEntryRef.current = entry;
        // Notify parent to update UI immediately
        onJournalSaved?.(entry);
      }

      if (selectedImages.length > 0) {
        const uploadContext = await getCloudinaryUploadSignature(currentUser);

        if (!uploadContext.success) {
          toast.error(uploadContext.error || "Failed to initialize upload");
          setUploading(false);
          setCloudStatus("error");
          return;
        }

        const uploadPromises = selectedImages.map(async (file) => {
          const uploadResult = await uploadToCloudinary(file, uploadContext);

          if (!uploadResult.success) {
            return { success: false, fileName: file.name, error: "upload" };
          }

          const saveResult = await saveMemory(currentUser.uid, day, uploadResult.url, uploadResult.publicId);

          if (!saveResult.success) {
            return { success: false, fileName: file.name, error: "save" };
          }

          return { success: true, fileName: file.name };
        });

        const results = await Promise.allSettled(uploadPromises);

        let uploadedCount = 0;
        const failedFiles = [];

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.success) {
            uploadedCount++;
          } else if (result.status === "fulfilled" && !result.value.success) {
            failedFiles.push(result.value.fileName);
          } else if (result.status === "rejected") {
            failedFiles.push("unknown");
          }
        });

        if (failedFiles.length > 0 && failedFiles.length < selectedImages.length) {
          failedFiles.forEach((fileName) => {
            if (fileName !== "unknown") {
              toast.error(`Failed to upload: ${fileName}`);
            }
          });
        }

        if (uploadedCount === 0 && selectedImages.length > 0) {
          toast.error("All uploads failed. Please try again.");
          clearImages();
        } else if (uploadedCount > 0) {
          invalidateMemoriesCache(currentUser.uid, year, month);

          if (onMemoryAdded) {
            onMemoryAdded();
          }

          clearImages();

          const photoText = uploadedCount === 1 ? "photo" : "photos";
          if (entry.trim()) {
            toast.success(`Journal and ${uploadedCount} ${photoText} saved!`);
          } else {
            toast.success(`${uploadedCount} ${photoText} saved!`);
          }
        }
      } else {
        toast.success("Journal entry saved!");
      }
    } catch (error) {
      toast.error("Failed to save. Please try again.");
      setCloudStatus("idle");
    } finally {
      setSaving(false);
      setUploading(false);
      if (entry.trim()) {
        setCloudStatus("saved");
        setTimeout(() => setCloudStatus("idle"), 2500);
      } else {
        setCloudStatus("idle");
      }
    }
  };

  // ========== Generate Insights Handler ==========
  const handleGenerateInsights = async (forceRegenerate = false) => {
    if (isGuest) {
      onAuthRequired?.("insights");
      return;
    }
    if (!currentUser || !currentUser.uid) {
      toast.error("Please log in to generate insights.");
      return;
    }

    if (!entry.trim()) {
      toast.error("Journal entry cannot be empty.");
      return;
    }

    setInsightsError("");
    setLoadingInsights(true);

    try {
      const idToken = await currentUser.getIdToken();
      // Call server action with Redis cache-first logic
      // Returns { success, data/error } to avoid Next.js production error sanitization
      const result = await generateInsight(idToken, entry, forceRegenerate);

      if (!result.success) {
        const errorMessage = result.error || "Failed to generate insights.";
        setInsightsError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      setInsights(result.data);
      setInsightsError("");

      // Scroll to insights section after a short delay to ensure DOM is updated
      setTimeout(() => {
        insightsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      // Persist insights to Firestore for the current day
      try {
        const dateKey = getDateKey(new Date());
        const docRef = doc(db, "users", currentUser.uid, "insights", dateKey);
        await setDoc(docRef, { ...result.data, sourceText: entry.trim() }, { merge: true });
      } catch (err) {
        console.error("Failed to save insights to Firestore:", err);
        // Non-blocking — insights are already in state
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsightsError("Failed to generate insights. Please try again.");
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div id="journal-section" className="py-4 flex flex-col gap-6" style={{ overflowAnchor: "none" }}>
      {/* Journal Entry Section */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
        <div className="absolute bottom-0 right-28 w-44 h-44 bg-gradient-to-br from-purple-400/30 to-indigo-400/20 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-10 w-28 h-28 bg-gradient-to-tr from-yellow-400/40 to-orange-400/30 dark:from-purple-400/30 dark:to-indigo-400/30 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Cloud Status Indicator */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-y-3">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold fugaz flex items-center gap-2">
            <NotebookPen size={24} /> Quick Journal
          </h2>

          <div className="flex items-center gap-4">
            {/* Cloud Save Status */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-500 ease-out ${cloudStatus === "idle"
                ? "opacity-0 scale-95 pointer-events-none"
                : "opacity-100 scale-100"
                }`}
            >
              {cloudStatus === "saving" ? (
                <CloudUpload className="text-indigo-400 dark:text-indigo-300 animate-pulse" size={14} />
              ) : (
                <CloudCheck className="text-green-500 dark:text-green-400" size={14} />
              )}
              <span
                className={`text-xs font-medium ${cloudStatus === "saving"
                  ? "text-indigo-500 dark:text-indigo-300"
                  : "text-green-600 dark:text-green-400"
                  }`}
              >
                {cloudStatus === "saving" ? "Saving..." : "Saved"}
              </span>
            </div>

            <StyleTools editor={editor} className="hidden lg:flex" />
          </div>
        </div>

        <div className="relative">
          {!displayEntry && (
            <div className="absolute top-4 left-4 right-20 pointer-events-none text-gray-400 dark:text-gray-500 text-sm md:text-base select-none pr-4 z-10">
              <TypeAnimation
                sequence={typingSequence}
                wrapper="span"
                cursor={true}
                repeat={Infinity}
                style={{ display: 'inline-block' }}
              />
            </div>
          )}
          <div className="journal-textarea-container w-full min-h-32 max-h-[40vh] flex flex-col overflow-auto overscroll-contain resize-y custom-scrollbar p-4 text-gray-700 dark:text-gray-100 bg-indigo-50/40 dark:bg-slate-800/50 rounded-xl border border-indigo-300/90 dark:border-indigo-300/20 focus-within:ring-2 focus-within:ring-indigo-400/50 dark:focus-within:ring-indigo-500/60 focus-within:border-transparent transition-all duration-300 break-words whitespace-pre-wrap text-sm leading-relaxed outline-none shadow-sm focus-within:shadow-[0_0_20px_rgba(99,102,241,0.4)] dark:focus-within:shadow-[0_0_23px_rgba(99,102,241,0.2)]">
            <RichTextEditor
              value={displayEntry}
              isVoiceInput={isListening}
              onChange={(newValue) => {
                setEntry(newValue);
                syncBaseEntry(newValue);
              }}
              onEditorCreated={setEditor}
              placeholder=""
              disabled={saving || uploading}
              className="flex-1 min-h-full"
            />
          </div>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={() => toggleVoiceInput(entry)}
            className={`absolute bottom-[11px] ${isGuest ? "right-4" : "right-[60px]"} w-9 h-9 rounded-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center disabled:opacity-50 hover:scale-110 active:scale-90 ring-1 hover:ring-2 ${isListening
              ? "bg-red-100 dark:bg-red-500/30 text-red-500 dark:text-red-300 ring-red-500 dark:ring-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              : "bg-indigo-100/50 dark:bg-slate-600/50 text-indigo-500 dark:text-indigo-300 ring-indigo-500 dark:ring-indigo-400/80 hover:bg-indigo-200/50 dark:hover:bg-slate-500/50"
              }`}
            title={isListening ? "Stop Voice Typing" : "Start Voice Typing"}
          >
            {isListening ? (
              <Square className="animate-pulse" size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>

          {/* Image Upload Component — hidden in guest mode (requires auth for Cloudinary) */}
          {!isGuest && (
            <ImageUpload
              selectedImages={selectedImages}
              imagePreviews={imagePreviews}
              onImagesChange={handleImagesChange}
              disabled={saving || uploading}
              className="bottom-[11px] right-3"
              inputId={imageInputId}
            />
          )}
        </div>

        <div className="flex justify-end items-center gap-2 mt-3">
          {/* Photo count indicator */}
          {imagePreviews.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {imagePreviews.length}/{MAX_IMAGES_PER_DAY} photos
            </span>
          )}

          <Button
            text={
              <span className="flex items-center gap-2 dark:text-white/85">
                <Sparkles size={20} />
                {loadingInsights ? "Asking..." : "Ask Lumi"}
              </span>
            }
            onClick={() => handleGenerateInsights()}
            disabled={loadingInsights}
          />
          <Button
            text={uploading ? "Uploading..." : saving ? "Saving..." : "Save"}
            dark
            onClick={handleSave}
            disabled={saving || uploading}
            className="hidden sm:inline-flex"
          />
        </div>
      </div>

      {/* AI Insights Section */}
      <div ref={insightsRef} className="scroll-mt-10">
        <AIInsightsSection
          insights={insights}
          isLoading={loadingInsights}
          userId={currentUser?.uid}
          journalText={entry}
          errorMessage={insightsError}
          onRetry={() => handleGenerateInsights(true)}
        />
      </div>
    </div>
  );
}

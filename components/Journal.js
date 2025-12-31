"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Button from "./Button";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { analyzeEntry } from "@/utils/analyzeJournal";
import { getJournalPlaceholder } from "@/utils/generatePlaceholder";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { saveMemory } from "@/utils/saveMemory";
import { invalidateMemoriesCache } from "@/hooks/useMemories";
import Image from "next/image";
import { useTheme } from "@/context/themeContext";
import AIInsightsSection from "./AIInsightsSection";
import ImageUpload, { MAX_IMAGES_PER_DAY } from "./ImageUpload";
import NewFeatureDot from "./NewFeatureDot";
import { useVoiceInput } from "@/hooks/useVoiceInput";

export default function Journal({ currentUser, onMemoryAdded }) {
  const { theme } = useTheme();
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Cloud save status: 'idle' | 'saving' | 'saved'
  const [cloudStatus, setCloudStatus] = useState("idle");

  // Debounce timer ref for auto-save
  const debounceTimerRef = useRef(null);

  // Track if entry has unsaved changes (for auto-save logic)
  const hasUnsavedChangesRef = useRef(false);

  // Get placeholder once on component mount (stable, no re-renders)
  const [placeholder] = useState(() => getJournalPlaceholder());

  // Image upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  // Determine if we're in dark mode (SSR-safe)
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);
      const handler = (e) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme]);

  const aiIcon = isDarkMode ? "/ai.svg" : "/ai-full.svg";

  // Voice input hook
  const {
    isListening,
    toggleVoiceInput,
    syncBaseEntry,
    getDisplayValue
  } = useVoiceInput({
    initialValue: entry,
    onTranscriptChange: (newEntry) => setEntry(newEntry),
  });

  // Compute display value with interim transcript
  const displayEntry = getDisplayValue(entry);

  // ========== Auto-Save Logic (Text Only) ==========
  const saveJournalText = useCallback(async () => {
    if (!entry.trim() || !currentUser?.uid) return false;

    try {
      const docRef = doc(db, "users", currentUser.uid);
      await setDoc(docRef, {
        [year]: {
          [month]: {
            [`journal_${day}`]: entry
          }
        }
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Auto-save error:", error);
      return false;
    }
  }, [entry, currentUser?.uid, year, month, day]);

  // Trigger auto-save with debounce (600ms)
  const triggerAutoSave = useCallback(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only proceed if there's text to save
    if (!entry.trim()) {
      setCloudStatus("idle");
      return;
    }

    // Show "saving" status while debounce timer is active
    setCloudStatus("saving");
    hasUnsavedChangesRef.current = true;

    debounceTimerRef.current = setTimeout(async () => {
      const success = await saveJournalText();
      if (success) {
        setCloudStatus("saved");
        hasUnsavedChangesRef.current = false;
        // Reset to idle after showing "saved" briefly
        setTimeout(() => setCloudStatus("idle"), 2000);
      } else {
        setCloudStatus("idle");
      }
    }, 600);
  }, [entry, saveJournalText]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Trigger auto-save when entry changes
  useEffect(() => {
    if (entry.trim()) {
      triggerAutoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

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

    try {
      // Save journal text if present
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
      }

      // Upload images if present (parallel uploads for better performance)
      if (selectedImages.length > 0) {
        // Upload all images in parallel
        const uploadPromises = selectedImages.map(async (file) => {
          const uploadResult = await uploadToCloudinary(file, currentUser.uid);

          if (!uploadResult.success) {
            return { success: false, fileName: file.name, error: "upload" };
          }

          // Save memory to Firestore with publicId for deletion support
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
            // Promise rejected (unexpected error)
            failedFiles.push("unknown");
          }
        });

        // Show individual errors for failed files
        if (failedFiles.length > 0 && failedFiles.length < selectedImages.length) {
          // Some failed, some succeeded
          failedFiles.forEach((fileName) => {
            if (fileName !== "unknown") {
              toast.error(`Failed to upload: ${fileName}`);
            }
          });
        }

        // Handle the all-failures edge case
        if (uploadedCount === 0 && selectedImages.length > 0) {
          toast.error("All uploads failed. Please try again.");
          clearImages();
        } else if (uploadedCount > 0) {
          // Invalidate cache so memories refresh
          invalidateMemoriesCache(currentUser.uid, year, month);

          // Notify parent to refetch memories
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
      console.error("Save error:", error);
      toast.error("Failed to save. Please try again.");
      setCloudStatus("idle");
    } finally {
      setSaving(false);
      setUploading(false);
      // Show saved status, then reset after delay
      if (entry.trim()) {
        setCloudStatus("saved");
        setTimeout(() => setCloudStatus("idle"), 2500);
      } else {
        setCloudStatus("idle");
      }
    }
  };

  // ========== Generate Insights Handler ==========
  const handleGenerateInsights = async () => {
    if (!entry.trim()) {
      toast.error("Journal entry cannot be empty.");
      return;
    }

    setLoadingInsights(true);
    const docRef = doc(db, "users", currentUser.uid, "insights", entry);

    try {
      const cachedDoc = await getDoc(docRef);
      if (cachedDoc.exists()) {
        setInsights(cachedDoc.data());
        console.log("Loaded cached insights.");
      } else {
        const result = await analyzeEntry(entry);
        setInsights(result);
        await setDoc(docRef, result);
        console.log("New insights generated and cached.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="py-4 flex flex-col gap-6">
      {/* Journal Entry Section */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
        <div className="absolute bottom-0 right-28 w-44 h-44 bg-gradient-to-br from-purple-400/30 to-indigo-400/20 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-10 w-28 h-28 bg-gradient-to-tr from-yellow-400/40 to-orange-400/30 dark:from-purple-400/30 dark:to-indigo-400/30 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Cloud Status Indicator */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold fugaz flex items-center gap-2">
            <i className="fa-solid fa-book"></i> Quick Journal
          </h2>

          {/* Cloud Save Status */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-500 ease-out ${cloudStatus === "idle"
              ? "opacity-0 scale-95 pointer-events-none"
              : "opacity-100 scale-100"
              }`}
          >
            <i
              className={`fa-solid text-sm ${cloudStatus === "saving"
                ? "fa-cloud-arrow-up text-indigo-400 dark:text-indigo-300 animate-pulse"
                : "fa-check text-green-500 dark:text-green-400"
                }`}
            ></i>
            <span
              className={`text-xs font-medium ${cloudStatus === "saving"
                ? "text-indigo-500 dark:text-indigo-300"
                : "text-green-600 dark:text-green-400"
                }`}
            >
              {cloudStatus === "saving" ? "Saving..." : "Saved"}
            </span>
          </div>
        </div>

        <div className="relative">
          <textarea
            name="journal"
            id="journal"
            className="journal-textarea dark:bg-slate-700/80 w-full min-h-24 md:min-h-28 p-4 pr-12 text-gray-700 text-sm md:text-base border rounded-lg shadow-sm border-none outline-none focus:ring-2 focus:ring-indigo-500/90 transition-all duration-200 dark:focus:ring-indigo-300/90 dark:text-gray-200 dark:placeholder-gray-300 placeholder-gray-500"
            placeholder={placeholder}
            value={displayEntry}
            onChange={(e) => {
              const newValue = e.target.value;
              setEntry(newValue);
              syncBaseEntry(newValue);
              // Auto-expand textarea to fit content
              e.target.style.height = 'auto';
              e.target.style.height = Math.max(e.target.scrollHeight, 96) + 'px';
            }}
          />

          {/* Listening indicator */}
          {isListening && (
            <div className="absolute top-2 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50/90 dark:bg-red-500/20 backdrop-blur-sm transition-all duration-300 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs text-red-500 dark:text-red-300 font-medium">
                Listening...
              </span>
            </div>
          )}

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={() => toggleVoiceInput(entry)}
            className={`absolute bottom-9 right-[60px] w-9 h-9 rounded-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center disabled:opacity-50 hover:scale-110 active:scale-90 ring-1 hover:ring-2 ${isListening
              ? "bg-red-100 dark:bg-red-500/30 text-red-500 dark:text-red-300 ring-red-500 dark:ring-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              : "bg-indigo-100/50 dark:bg-slate-600/50 text-indigo-500 dark:text-indigo-300 ring-indigo-500 dark:ring-indigo-400/80 hover:bg-indigo-200/50 dark:hover:bg-slate-500/50"
              }`}
            title={isListening ? "Stop Voice Typing" : "Start Voice Typing"}
          >
            <NewFeatureDot className="absolute top-[-2px] right-[-2px]" />
            <i
              className={`fa-solid ${isListening ? "fa-stop" : "fa-microphone"} text-lg ${isListening ? "animate-pulse" : ""
                }`}
            ></i>
          </button>

          {/* Image Upload Component */}
          <ImageUpload
            selectedImages={selectedImages}
            imagePreviews={imagePreviews}
            onImagesChange={handleImagesChange}
            disabled={saving || uploading}
            className="bottom-9 right-3.5"
          />
        </div>

        <div className="flex justify-end items-center gap-2 mt-3">
          {/* Photo count indicator */}
          {imagePreviews.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {imagePreviews.length}/{MAX_IMAGES_PER_DAY} photos
            </span>
          )}

          <Button
            className="self-end px-4 py-2 font-semibold shadow-md rounded-xl flex items-center gap-2"
            text={
              <span className="flex items-center gap-2 dark:text-white/85">
                <Image src={aiIcon} alt="AI Icon" width={24} height={24} />
                {loadingInsights ? "Generating..." : "Generate Insights"}
              </span>
            }
            onClick={handleGenerateInsights}
            disabled={loadingInsights}
            dark={false}
          />
          <Button
            className="self-end px-4 py-2 font-semibold shadow-md"
            text={uploading ? "Uploading..." : saving ? "Saving..." : "Save"}
            dark
            onClick={handleSave}
            disabled={saving || uploading}
          />
        </div>
      </div>

      {/* AI Insights Section */}
      <AIInsightsSection insights={insights} isLoading={loadingInsights} />
    </div>
  );
}

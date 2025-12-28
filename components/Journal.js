"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { analyzeEntry } from "@/utils/analyzeJournal";
import { generateCreativePlaceholder } from "@/utils/generatePlaceholder";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { saveMemory } from "@/utils/saveMemory";
import { invalidateMemoriesCache } from "@/hooks/useMemories";
import Loader from "./Loader";
import { moods } from "@/utils";
import Image from "next/image";
import { useTheme } from "@/context/themeContext";

export default function Journal({ currentUser, onMemoryAdded }) {
  const { theme } = useTheme();
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [placeholder, setPlaceholder] = useState("What happened today... 🫶");
  const [placeholderLoading, setPlaceholderLoading] = useState(true);
  const hasGeneratedPlaceholder = useRef(false);

  // Image upload state - supports multiple files (max 4 per day)
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_IMAGES_PER_DAY = 4;
  const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  // Determine if we're in dark mode (SSR-safe)
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

  // Ref to track preview URLs for cleanup (avoids stale closure in unmount effect)
  const previewUrlsRef = useRef([]);

  // Keep ref in sync with imagePreviews state
  useEffect(() => {
    previewUrlsRef.current = imagePreviews;
  }, [imagePreviews]);

  // Cleanup: revoke all object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

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

  useEffect(() => {
    // Prevent double-calling in React Strict Mode
    if (hasGeneratedPlaceholder.current) return;
    hasGeneratedPlaceholder.current = true;

    (async () => {
      setPlaceholderLoading(true);
      const creative = await generateCreativePlaceholder();
      setPlaceholder(creative);
      setPlaceholderLoading(false);
    })();
  }, []);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check if adding these would exceed the max
    if (selectedImages.length + files.length > MAX_IMAGES_PER_DAY) {
      toast.error(`Maximum ${MAX_IMAGES_PER_DAY} photos per day`);
      e.target.value = "";
      return;
    }

    const validFiles = [];
    const previews = [];

    for (const file of files) {
      // Validate file size (7MB max)
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 7MB limit`);
        continue;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image`);
        continue;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    if (validFiles.length) {
      setSelectedImages((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...previews]);
    }

    e.target.value = "";
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!entry.trim() && selectedImages.length === 0) {
      toast.error("Add a journal entry or photos.");
      return;
    }

    setSaving(true);
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
      }

      // Upload images if present
      if (selectedImages.length > 0) {
        let uploadedCount = 0;

        for (const file of selectedImages) {
          const uploadResult = await uploadToCloudinary(file, currentUser.uid);

          if (!uploadResult.success) {
            toast.error(`Failed to upload: ${file.name}`);
            continue;
          }

          // Save memory to Firestore with publicId for deletion support
          const saveResult = await saveMemory(currentUser.uid, day, uploadResult.url, uploadResult.publicId);

          if (!saveResult.success) {
            toast.error(`Failed to save: ${file.name}`);
            continue;
          }

          uploadedCount++;
        }

        if (uploadedCount > 0) {
          // Invalidate cache so memories refresh
          invalidateMemoriesCache(currentUser.uid, year, month);

          // Notify parent to refetch memories
          if (onMemoryAdded) {
            onMemoryAdded();
          }
        }

        clearImages();

        const photoText = uploadedCount === 1 ? "photo" : "photos";
        if (entry.trim()) {
          toast.success(`Journal and ${uploadedCount} ${photoText} saved!`);
        } else {
          toast.success(`${uploadedCount} ${photoText} saved!`);
        }
      } else {
        toast.success("Journal entry saved!");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!entry.trim()) {
      toast.error("Journal entry cannot be empty.");
      return;
    }

    setLoadingInsights(true);
    const docRef = doc(db, "users", currentUser.uid, "insights", entry);

    try {
      // Check cache first
      const cachedDoc = await getDoc(docRef);
      if (cachedDoc.exists()) {
        setInsights(cachedDoc.data());
        console.log("Loaded cached insights.");
      } else {
        // Fetch new insights
        const result = await analyzeEntry(entry);
        setInsights(result);

        // Cache the new insights
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
        <div className="absolute bottom-0 right-28 w-44 h-44 bg-gradient-to-br from-purple-400/30 to-indigo-400/20 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 left-10 w-28 h-28 bg-gradient-to-tr from-yellow-400/40 to-orange-400/30 dark:from-purple-400/30 dark:to-indigo-400/30 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="text-xl md:text-2xl font-bold fugaz mb-4 flex items-center gap-2"><i className="fa-solid fa-book"></i> Quick Journal</h2>
        {placeholderLoading ? (
          <div className="w-full h-24 md:h-28 rounded-lg bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-indigo-400 flex gap-2 text-base md:text-lg font-medium select-none animate-pulse">Generating inspiration... <Loader size="xl" /></span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <textarea
              name="journal"
              id="journal"
              className="journal-textarea dark:bg-slate-700/80 w-full min-h-24 md:min-h-28 p-4 pr-12 text-gray-700 text-sm md:text-base border rounded-lg shadow-sm border-none outline-none focus:ring-2 focus:ring-indigo-500/90 transition-all duration-200 dark:focus:ring-indigo-300/90 dark:text-gray-200 dark:placeholder-gray-300 placeholder-gray-500"
              placeholder={placeholder}
              value={entry}
              onChange={(e) => {
                setEntry(e.target.value);
                // Auto-expand textarea to fit content
                e.target.style.height = 'auto';
                e.target.style.height = Math.max(e.target.scrollHeight, 96) + 'px';
              }}
              disabled={placeholderLoading}
              style={{ opacity: placeholderLoading ? 0 : 1, transition: 'opacity 0.3s' }}
            />

            {/* Floating generic photo upload button */}
            {imagePreviews.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || uploading}
                className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-indigo-100/50 dark:bg-slate-600/50 text-indigo-500 dark:text-indigo-300 hover:bg-indigo-200/50 dark:hover:bg-slate-500/50 backdrop-blur-sm transition-all duration-200 flex items-center justify-center disabled:opacity-50 hover:scale-110 active:scale-90 ring-1 ring-indigo-500 dark:ring-indigo-400/80 hover:ring-0"
                title="Add photos"
              >
                <i className="fa-regular fa-image text-lg"></i>
              </button>
            )}
          </div>
        )}

        {/* New feature hint */}
        {imagePreviews.length === 0 && !placeholderLoading && (
          <p className="text-xs text-right text-indigo-400 dark:text-indigo-300 font-medium mt-1 flex items-center justify-end gap-1">
            <i className="fa-solid fa-sparkles text-[10px]"></i>
            <span>New! Add photos to your memories</span>
          </p>
        )}

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-indigo-300 dark:border-indigo-500 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-purple-600 transition-colors shadow-md"
                  title="Remove"
                >
                  <i className="fa-solid fa-xmark text-[10px] text-indigo-50"></i>
                </button>
              </div>
            ))}
            {imagePreviews.length < MAX_IMAGES_PER_DAY && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-500 flex items-center justify-center text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                title="Add more photos"
              >
                <i className="fa-solid fa-plus text-lg"></i>
              </button>
            )}
          </div>
        )}

        {/* Hidden file input - accepts multiple */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          multiple
          className="hidden"
        />

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

      {insights && (
        <>
          <h2 className="text-xl md:text-2xl flex gap-1 md:gap-2 mt-2 md:mt-4 font-bold text-gray-800 dark:text-gray-200 fugaz"><Image src="/ai.svg" alt="AI Icon" width={26} height={26} />AI Insights</h2>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/70 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 left-10 w-28 h-28 bg-gradient-to-tr from-yellow-400/40 to-orange-400/30 dark:from-purple-400/40 dark:to-indigo-400/40 rounded-full blur-3xl" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/75 sm:bg-purple-500/90 rounded-xl flex items-center justify-center cursor-default glow">
                  <span className="text-2xl">🧩</span>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">emotional triggers</h3>
              </div>

              <div className="flex flex-col items-center justify-between min-w-[90px]">
                <span className="text-xl md:text-2xl lg:text-3xl">{moods[insights.mood] || '😄'}</span>
                <span className="text-sm md:text-base font-semibold text-indigo-500 dark:text-indigo-400 capitalize fugaz">{insights.mood}</span>
              </div>
            </div>

            <h4 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">What Influenced your Mood</h4>
            {insights.summary}
            {Array.isArray(insights.triggers) && insights.triggers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {insights.triggers.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-100 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-200 dark:border-none shadow-sm hover:bg-indigo-200 transition-all duration-150"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/70 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 left-10 w-28 h-28 bg-gradient-to-tr from-yellow-400/40 to-orange-400/30 dark:from-cyan-400/30 dark:to-sky-400/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1 right-12 w-28 h-28 bg-gradient-to-tr from-lime-400/50 to-green-500/40 dark:from-lime-400/30 dark:to-green-300/30 rounded-full blur-3xl" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/75 sm:bg-blue-500/90 rounded-xl flex items-center justify-center cursor-default glow">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">PERSONALIZED INSIGHT</h3>
              </div>

              <div className="flex flex-col items-center justify-between min-w-[90px]">
                <span className="text-xl md:text-2xl lg:text-3xl">{moods[insights.mood] || '😄'}</span>
                <span className="text-sm md:text-base font-semibold text-indigo-500 dark:text-indigo-400 capitalize fugaz">{insights.mood}</span>
              </div>
            </div>
            <h4 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">{insights.headline || "Personalized Insight"}</h4>
            <p className="text-gray-600 dark:text-gray-300/90 leading-relaxed mb-4">{insights.insight}</p>

            <div className="bg-lime-50/90 dark:bg-lime-400/35 border border-lime-400/70 dark:border-lime-200/70 rounded-xl p-3">
              <p className="text-sm text-lime-600 dark:text-lime-300">
                <span className="font-semibold dark:font-bold">💡 Pro tip:</span> {insights.pro_tip}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

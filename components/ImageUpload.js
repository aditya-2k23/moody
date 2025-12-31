"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

const MAX_IMAGES_PER_DAY = 4;
const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB

/**
 * ImageUpload - Component for handling image selection and preview
 * 
 * @param {Object} props
 * @param {File[]} props.selectedImages - Currently selected image files
 * @param {Function} props.onImagesChange - Callback when images change (files, previews)
 * @param {boolean} props.disabled - Whether the component is disabled
 */
export default function ImageUpload({
  selectedImages = [],
  imagePreviews = [],
  onImagesChange,
  disabled = false,
  className = "",
}) {
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);

  // Keep ref in sync with imagePreviews for cleanup
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
      onImagesChange?.(
        [...selectedImages, ...validFiles],
        [...imagePreviews, ...previews]
      );
    }

    e.target.value = "";
  };

  const removeImage = (index) => {
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    onImagesChange?.(
      selectedImages.filter((_, i) => i !== index),
      imagePreviews.filter((_, i) => i !== index)
    );
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Floating photo upload button (shown when no images selected) */}
      {imagePreviews.length === 0 && (
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={disabled}
          className={`absolute w-9 h-9 rounded-lg bg-indigo-100/50 dark:bg-slate-600/50 text-indigo-500 dark:text-indigo-300 hover:bg-indigo-200/50 dark:hover:bg-slate-500/50 backdrop-blur-sm transition-all duration-200 flex items-center justify-center disabled:opacity-50 hover:scale-110 active:scale-90 ring-1 hover:ring-2 ring-indigo-500 dark:ring-indigo-400/80 ${className}`}
          title="Add photos"
        >
          <i className="fa-regular fa-image text-lg"></i>
        </button>
      )}

      {/* New feature hint */}
      {imagePreviews.length === 0 && (
        <p className="text-xs text-right text-indigo-500 dark:text-indigo-300 font-medium mt-1 flex items-center justify-end gap-1">
          <i className="fa-solid fa-sparkles text-[10px]"></i>
          <span>New! Add photos to your memories</span>
        </p>
      )}

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {imagePreviews.map((preview, index) => {
            // Security: Only render valid blob URLs to prevent XSS
            const isSafeBlobUrl = typeof preview === 'string' && preview.startsWith('blob:');
            if (!isSafeBlobUrl) return null;

            return (
              <div key={index} className="relative">
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-indigo-300 dark:border-indigo-500 shadow-md"
                  width={80}
                  height={80}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-purple-600 transition-colors shadow-md disabled:opacity-50"
                  title="Remove"
                >
                  <i className="fa-solid fa-xmark text-[10px] text-indigo-50"></i>
                </button>
              </div>
            );
          })}
          {imagePreviews.length < MAX_IMAGES_PER_DAY && (
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={disabled}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-500 flex items-center justify-center text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
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
    </>
  );
}

// Export constants for use in parent components
export { MAX_IMAGES_PER_DAY, MAX_FILE_SIZE };

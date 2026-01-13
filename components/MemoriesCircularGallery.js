"use client";

import { useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { getOptimizedUrl } from "@/utils/cloudinary";

// Dynamic import to avoid SSR issues with WebGL
const CircularGallery = dynamic(() => import("./CircularGallery"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-gray-400 dark:text-gray-500 text-sm">Loading gallery...</div>
    </div>
  ),
});

/**
 * MemoriesCircularGallery - Wrapper component for displaying memories in a circular gallery
 * 
 * @param {Object} props
 * @param {Array<{imageUrl: string, day: number, publicId?: string}>} props.images - Memory items
 * @param {function} props.onImageClick - Callback when an image is clicked (receives index)
 */
export default function MemoriesCircularGallery({
  images = [],
  onImageClick,
}) {
  // Transform memory items to gallery format with optimized URLs
  const galleryItems = useMemo(() => {
    return images.map((item, index) => ({
      image: getOptimizedUrl(item.imageUrl, 400),
      originalIndex: index,
    }));
  }, [images]);

  // Memoize click handler
  const handleImageClick = useCallback((index) => {
    if (onImageClick) {
      onImageClick(index);
    } else {
      console.log("Clicked image at index:", index);
    }
  }, [onImageClick]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="memories-circular-gallery relative w-full h-[280px] sm:h-[320px] md:h-[380px]">
      <CircularGallery
        items={galleryItems}
        bend={1.5}
        borderRadius={0.08}
        scrollSpeed={1.4}
        scrollEase={0.1}
        autoRotate={true}
        autoRotateSpeed={1}
        onImageClick={handleImageClick}
        disableWheel={true}
      />

      {/* Gradient fade edges for visual polish */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-purple-50 dark:from-slate-900 to-transparent pointer-events-none z-10 rounded-2xl" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-indigo-50 dark:from-slate-900/55 to-transparent pointer-events-none z-10 rounded-2xl" />

      {/* Interaction hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-700 dark:text-gray-300 text-semibold flex items-center gap-1.5 opacity-60">
        <i className="fa-solid fa-hand text-[10px]"></i>
        <span>Drag to explore</span>
      </div>
    </div>
  );
}

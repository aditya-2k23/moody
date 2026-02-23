"use client";

import { useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { getOptimizedUrl } from "@/utils/cloudinary";
import { Hand } from "lucide-react";
import Image from "next/image";

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
 * Static gallery for 1-3 images — no duplication, no infinite scroll
 */
function StaticGallery({ images, onImageClick }) {
  return (
    <div className="relative w-full py-8 flex items-center justify-center">
      <div className={`flex items-center justify-center gap-4 sm:gap-6 ${images.length === 1 ? "" : "px-4"}`}>
        {images.map((item, index) => {
          // Slight tilt for visual flair when multiple images
          const rotation = images.length === 1 ? 0 : (index - Math.floor(images.length / 2)) * 6;
          const yOffset = images.length === 1 ? 0 : Math.abs(index - Math.floor(images.length / 2)) * 8;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onImageClick?.(index)}
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              style={{
                transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
              }}
            >
              <div className="relative w-28 h-40 sm:w-44 sm:h-60 md:w-52 md:h-72">
                <Image
                  src={getOptimizedUrl(item.imageUrl, 400)}
                  alt={`Memory from day ${item.day || index + 1}`}
                  fill
                  sizes="(max-width: 640px) 112px, (max-width: 768px) 176px, 208px"
                  className="object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * MemoriesCircularGallery - Wrapper component for displaying memories in a circular gallery
 * Uses the animated CircularGallery for 4+ images, or a static layout for 1-3 images.
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

  // For fewer than 4 images, show a static layout instead of the infinite-scroll gallery
  if (images.length < 4) {
    return <StaticGallery images={images} onImageClick={handleImageClick} />;
  }

  return (
    <div className="memories-circular-gallery relative w-full h-[220px] sm:h-[320px] md:h-[380px]">
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
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1.5 opacity-60">
        <Hand size={14} />
        <span>Drag to explore</span>
      </div>
    </div>
  );
}

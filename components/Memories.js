"use client";

import { useState, useRef, useEffect } from "react";
import PhotoModal from "./PhotoModal";
import MemoriesCircularGallery from "./MemoriesCircularGallery";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register GSAP plugin
gsap.registerPlugin(useGSAP);

/**
 * Skeleton loader for Memories component
 */
function MemoriesSkeleton({ monthLabel }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-purple-400/30 to-indigo-400/20 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-28 bg-gradient-to-tr from-yellow-400/30 to-orange-400/20 dark:from-purple-400/20 dark:to-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-xl md:text-2xl font-bold fugaz flex items-center gap-2 relative z-10">
        <i className="fa-solid fa-images"></i> Memories {monthLabel && <span className="text-base font-normal text-gray-500 dark:text-gray-400">• {monthLabel}</span>}
      </h2>

      {/* Skeleton gallery placeholder */}
      <div className="relative z-10 h-[300px] sm:h-[400px] flex items-center justify-center gap-4 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-32 sm:w-40 h-44 sm:h-56 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 animate-pulse"
            style={{
              transform: `rotate(${(i - 1) * 5}deg) translateY(${Math.abs(i - 1) * 10}px)`,
              opacity: 1 - Math.abs(i - 1) * 0.2
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Memories component - displays a grid of memory images with modal viewer and delete support
 * Shows skeleton during loading, fades in/out content with GSAP
 * @param {{items: Array, status: 'idle'|'loading'|'loaded', monthLabel: string, yearMonth: string, onDelete: function}} props
 */
export default function Memories({ items = [], status = "idle", monthLabel = "", yearMonth = "", onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  // Track visibility for fade-out animation
  const [isVisible, setIsVisible] = useState(false);
  const prevHadItemsRef = useRef(false);

  // Preserve items during fade-out so images don't disappear
  const [displayItems, setDisplayItems] = useState([]);

  const openModal = (index) => {
    setSelectedIndex(index);
    setModalOpen(true);
  };

  const hasItems = status === "loaded" && items?.length > 0;

  // Handle fade-out when items disappear
  useEffect(() => {
    if (prevHadItemsRef.current && !hasItems && containerRef.current) {
      // Fade out then hide (keep displayItems until animation completes)
      gsap.to(containerRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          setIsVisible(false);
          setDisplayItems([]); // Clear after fade completes
        }
      });
    } else if (prevHadItemsRef.current && !hasItems && !containerRef.current) {
      // Edge case: previous had items but container not mounted (first load race)
      // Synchronously hide without animation
      setIsVisible(false);
      setDisplayItems([]);
    } else if (!prevHadItemsRef.current && !hasItems) {
      // First load with no items - ensure hidden state
      setIsVisible(false);
    } else if (hasItems && !isVisible) {
      // Update displayItems and show
      setDisplayItems(items);
      setIsVisible(true);
    } else if (hasItems) {
      // Update displayItems when items change while visible
      setDisplayItems(items);
    }
    prevHadItemsRef.current = hasItems;
  }, [hasItems, isVisible, items]);

  // Animate in when loaded with items
  useGSAP(() => {
    if (hasItems && isVisible && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [hasItems, isVisible]);

  // Show skeleton while loading
  if (status === "loading") {
    return <MemoriesSkeleton monthLabel={monthLabel} />;
  }

  // Don't render anything if not visible and no items
  if (!isVisible && !hasItems) {
    return null;
  }

  return (
    <>
      <div
        ref={containerRef}
        className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden"
        style={{ opacity: 0 }}
      >
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-purple-400/30 to-indigo-400/20 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-28 bg-gradient-to-tr from-yellow-400/30 to-orange-400/20 dark:from-purple-400/20 dark:to-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <h2 className="text-xl md:text-2xl font-bold fugaz flex items-center gap-2 relative z-10">
          <i className="fa-solid fa-images"></i> Memories {monthLabel && <span className="text-base font-normal text-gray-500 dark:text-gray-400">• {monthLabel}</span>}
        </h2>

        {/* Circular Gallery - use displayItems to preserve during fade-out */}
        <div className="relative z-10">
          <MemoriesCircularGallery
            images={displayItems}
            onImageClick={openModal}
          />
        </div>
      </div>

      {modalOpen && (
        <PhotoModal
          images={displayItems}
          initialIndex={selectedIndex}
          onClose={() => setModalOpen(false)}
          yearMonth={yearMonth}
          onDelete={onDelete}
        />
      )}
    </>);
}

"use client";

import { useState } from "react";
import PhotoModal from "./PhotoModal";
import MemoriesCircularGallery from "./MemoriesCircularGallery";

/**
 * Memories component - displays a grid of memory images with modal viewer and delete support
 * Only renders when status is 'loaded' AND items exist (no placeholders/skeletons)
 * @param {{items: Array, status: 'idle'|'loading'|'loaded', monthLabel: string, yearMonth: string, onDelete: function}} props
 */
export default function Memories({ items = [], status = "idle", monthLabel = "", yearMonth = "", onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openModal = (index) => {
    setSelectedIndex(index);
    setModalOpen(true);
  };

  // Don't render anything while loading or idle (no placeholders)
  if (status !== "loaded") {
    return null;
  }

  // Don't render if no items (no empty state UI)
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-purple-400/30 to-indigo-400/20 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-28 bg-gradient-to-tr from-yellow-400/30 to-orange-400/20 dark:from-purple-400/20 dark:to-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <h2 className="text-xl md:text-2xl font-bold fugaz flex items-center gap-2 relative z-10">
          <i className="fa-solid fa-images"></i> Memories {monthLabel && <span className="text-base font-normal text-gray-500 dark:text-gray-400">• {monthLabel}</span>}
        </h2>

        {/* Circular Gallery */}
        <div className="relative z-10">
          <MemoriesCircularGallery
            images={items}
            onImageClick={openModal}
          />
        </div>
      </div>

      {modalOpen && (
        <PhotoModal
          images={items}
          initialIndex={selectedIndex}
          onClose={() => setModalOpen(false)}
          yearMonth={yearMonth}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

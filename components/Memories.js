"use client";

import { useState } from "react";
import { getOptimizedUrl } from "@/utils/cloudinary";
import PhotoModal from "./PhotoModal";

/**
 * Memories component - displays a grid of memory images with modal viewer
 * @param {{items: Array, loading: boolean, monthLabel: string}} props
 */
export default function Memories({ items = [], loading = false, monthLabel = "" }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openModal = (index) => {
    setSelectedIndex(index);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-purple-400/30 to-indigo-400/20 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl pointer-events-none" />
        <h2 className="text-xl md:text-2xl font-bold fugaz mb-4 flex items-center gap-2">
          <i className="fa-solid fa-images"></i> Memories
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100 dark:from-slate-700 dark:to-slate-600 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-purple-400/30 to-indigo-400/20 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl pointer-events-none" />
        <h2 className="text-xl md:text-2xl font-bold fugaz mb-4 flex items-center gap-2">
          <i className="fa-solid fa-images"></i> Memories {monthLabel && <span className="text-base font-normal text-gray-500 dark:text-gray-400">• {monthLabel}</span>}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 italic text-center py-6">
          <i className="fa-regular fa-image text-2xl mb-2 block opacity-50"></i>
          No memories for this month yet. Add photos to your journal entries!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-purple-400/30 to-indigo-400/20 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-28 bg-gradient-to-tr from-yellow-400/30 to-orange-400/20 dark:from-purple-400/20 dark:to-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <h2 className="text-xl md:text-2xl font-bold fugaz mb-4 flex items-center gap-2 relative z-10">
          <i className="fa-solid fa-images"></i> Memories {monthLabel && <span className="text-base font-normal text-gray-500 dark:text-gray-400">• {monthLabel}</span>}
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 relative z-10">
          {items.map((item, index) => (
            <button
              key={`${item.day}-${index}`}
              onClick={() => openModal(index)}
              className="aspect-square rounded-xl overflow-hidden bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all duration-200 group relative cursor-pointer hover:ring-2 hover:ring-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <img
                src={getOptimizedUrl(item.imageUrl, 300)}
                alt={`Memory from day ${item.day}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-white text-xs font-semibold">Day {item.day}</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-expand text-white text-sm"></i>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Photo Modal */}
      {modalOpen && (
        <PhotoModal
          images={items}
          initialIndex={selectedIndex}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

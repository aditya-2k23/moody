"use client";

import { useState } from "react";
import { getOptimizedUrl } from "@/utils/cloudinary";
import { deleteMemory } from "@/utils/deleteMemory";
import PhotoModal from "./PhotoModal";
import toast from "react-hot-toast";

/**
 * Memories component - displays a grid of memory images with modal viewer and delete support
 * Only renders when status is 'loaded' AND items exist (no placeholders/skeletons)
 * @param {{items: Array, status: 'idle'|'loading'|'loaded', monthLabel: string, yearMonth: string, onDelete: function}} props
 */
export default function Memories({ items = [], status = "idle", monthLabel = "", yearMonth = "", onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openModal = (index) => {
    setSelectedIndex(index);
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!item.publicId) {
      toast.error("Cannot delete: missing image ID");
      return;
    }

    setDeletingId(item.publicId);
    setConfirmDelete(null);

    const result = await deleteMemory(item.publicId, yearMonth);

    if (result.success) {
      toast.success("Memory deleted");
      if (onDelete) {
        onDelete(item.publicId);
      }
    } else {
      toast.error(result.error || "Failed to delete");
    }

    setDeletingId(null);
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

        <h2 className="text-xl md:text-2xl font-bold fugaz mb-4 flex items-center gap-2 relative z-10">
          <i className="fa-solid fa-images"></i> Memories {monthLabel && <span className="text-base font-normal text-gray-500 dark:text-gray-400">• {monthLabel}</span>}
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 relative z-10">
          {items.map((item, index) => (
            <div
              key={`${item.day}-${index}`}
              className="aspect-square rounded-xl overflow-hidden bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all duration-200 group relative hover:ring-4 dark:hover:ring-2 ring-indigo-500 dark:ring-indigo-400"
            >
              {/* Image button */}
              <button
                onClick={() => openModal(index)}
                className="w-full h-full cursor-pointer hover:ring-4 dark:hover:ring-2 hover:ring-indigo-400 focus:ring-4 focus:ring-indigo-500 outline-none rounded-xl overflow-hidden"
                disabled={deletingId === item.publicId}
              >
                <img
                  src={getOptimizedUrl(item.imageUrl, 300)}
                  alt={`Memory from day ${item.day}`}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${deletingId === item.publicId ? 'opacity-50' : ''}`}
                />
              </button>

              {/* Day label overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <span className="text-white text-xs font-semibold">Day {item.day}</span>
              </div>

              {/* Expand icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="w-10 h-10 bg-white/30 backdrop-blur-xs rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-expand text-white text-sm"></i>
                </div>
              </div>

              {/* Delete button - visible on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.publicId) {
                    toast.error("Cannot delete: older memory without delete support");
                    return;
                  }
                  setConfirmDelete(item.publicId);
                }}
                disabled={deletingId === item.publicId}
                className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-200 z-20 ${deletingId === item.publicId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-500/80 hover:bg-indigo-600 opacity-0 group-hover:opacity-100'
                  } text-white shadow-md`}
                title={item.publicId ? "Delete memory" : "Cannot delete older memory"}
              >
                {deletingId === item.publicId ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-trash-can text-[12px]"></i>
                )}
              </button>

              {/* Confirmation dialog */}
              {confirmDelete === item.publicId && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-30 rounded-xl p-2">
                  <p className="text-white text-xs text-center font-medium">Delete this memory?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-full font-semibold transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(null);
                      }}
                      className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
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

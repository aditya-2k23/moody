"use client";

import { useState, useEffect, useCallback } from "react";
import { getOptimizedUrl } from "@/utils/cloudinary";
import { deleteMemory } from "@/utils/deleteMemory";
import toast from "react-hot-toast";

/**
 * PhotoModal - Full-screen image viewer with zoom, navigation, and delete
 * @param {{images: Array, initialIndex: number, onClose: function, yearMonth: string, onDelete: function}} props
 */
export default function PhotoModal({ images = [], initialIndex = 0, onClose, yearMonth = "", onDelete }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentImage = images[currentIndex];

  // Reset zoom and position when image changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Navigation handlers (wrapped in useCallback for stable references)
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  }, [images.length]);

  // Zoom handlers (wrapped in useCallback for stable references)
  const handleZoomIn = useCallback((step = 0.4) => {
    const zoomStep = typeof step === 'number' ? step : 0.4;
    setZoom((prev) => Math.min(prev + zoomStep, 4));
  }, []);

  const handleZoomOut = useCallback((step = 0.4) => {
    const zoomStep = typeof step === 'number' ? step : 0.4;
    setZoom((prev) => {
      const newZoom = Math.max(prev - zoomStep, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // Keyboard navigation (with all dependencies properly listed)
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrev();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToPrev, goToNext, handleZoomIn, handleZoomOut]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      handleZoomIn(0.2);
    } else {
      handleZoomOut(0.2);
    }
  };

  const handleDelete = async () => {
    if (!currentImage?.publicId) {
      toast.error("Cannot delete: older memory without delete support");
      setConfirmDelete(false);
      return;
    }

    setDeleting(true);
    const result = await deleteMemory(currentImage.publicId, yearMonth);

    if (result.success) {
      toast.success("Memory deleted");
      if (onDelete) {
        onDelete(currentImage.publicId);
      }

      // Compute expected length after deletion (parent hasn't re-rendered yet)
      const newLength = Math.max(0, images.length - 1);

      // If this was the last image, close the modal
      if (newLength === 0) {
        onClose();
      } else {
        // Move to previous image if we're at or beyond the new end
        if (currentIndex >= newLength) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }
    } else {
      toast.error(result.error || "Failed to delete");
    }

    setDeleting(false);
    setConfirmDelete(false);
  };

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center"
      onWheel={handleWheel}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl transition-colors"
        title="Close (Esc)"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>

      {/* Delete button */}
      <button
        onClick={() => setConfirmDelete(true)}
        disabled={deleting}
        className="absolute top-4 right-16 z-10 py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:bg-gray-500 rounded-full flex items-center justify-center text-white transition-colors text-sm"
        title="Delete memory"
      >
        {deleting ? (
          <i className="fa-solid fa-spinner fa-spin mr-1.5"></i>
        ) : (
          <i className="fa-solid fa-trash-can text-sm mr-1.5"></i>
        )}
        Delete
      </button>

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm mx-4 text-center shadow-2xl">
            <i className="fa-solid fa-trash-can text-4xl text-indigo-400 mb-4"></i>
            <h3 className="text-white text-lg font-bold mb-2">Delete this memory?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white font-semibold rounded-full transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-white/10 backdrop-blur-sm rounded-full p-1">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Zoom out (-)"
        >
          <i className="fa-solid fa-minus text-sm"></i>
        </button>
        <button
          onClick={resetZoom}
          className="px-3 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 text-sm font-medium transition-colors"
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Zoom in (+)"
        >
          <i className="fa-solid fa-plus text-sm"></i>
        </button>
      </div>

      {images.length > 1 && (
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-full flex items-center justify-center text-white text-xl transition-colors"
          title="Previous (←)"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
      )}

      {images.length > 1 && (
        <button
          onClick={goToNext}
          disabled={currentIndex === images.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-full flex items-center justify-center text-white text-xl transition-colors"
          title="Next (→)"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      )}

      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <img
          src={getOptimizedUrl(currentImage.imageUrl, 1200)}
          alt={`Memory from day ${currentImage.day}`}
          onDragStart={(e) => e.preventDefault()}
          className={`max-w-[90vw] max-h-[85vh] object-contain select-none rounded-3xl ${isDragging ? "" : "transition-transform duration-200"}`}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          }}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
        Day {currentImage.day}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-white/10 backdrop-blur-sm p-2 rounded-xl max-w-[80vw] overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${idx === currentIndex
                ? "ring-2 ring-white scale-110"
                : "opacity-60 hover:opacity-100"
                }`}
            >
              <img
                src={getOptimizedUrl(img.imageUrl, 100)}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

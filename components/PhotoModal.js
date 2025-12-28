"use client";

import { useState, useEffect, useCallback } from "react";
import { getOptimizedUrl } from "@/utils/cloudinary";

/**
 * PhotoModal - Full-screen image viewer with zoom and navigation
 * @param {{images: Array, initialIndex: number, onClose: function}} props
 */
export default function PhotoModal({ images = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentImage = images[currentIndex];

  // Reset zoom and position when image changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Keyboard navigation
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
  }, [currentIndex, images.length]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, images.length]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle drag for panning when zoomed
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

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl transition-colors"
        title="Close (Esc)"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Zoom controls */}
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

      {/* Previous button */}
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

      {/* Next button */}
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

      {/* Main image */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <img
          src={getOptimizedUrl(currentImage.imageUrl, 1200)}
          alt={`Memory from day ${currentImage.day}`}
          className="max-w-[90vw] max-h-[85vh] object-contain select-none transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          }}
          draggable={false}
        />
      </div>

      {/* Day label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
        Day {currentImage.day}
      </div>

      {/* Thumbnail strip for multiple images */}
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

"use client";

import { X, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function VideoModal({ isOpen, onClose }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleClose = useCallback(() => {
    const tl = gsap.timeline({
      onComplete: () => onClose(),
    });
    tl.to(modalRef.current, {
      scale: 0.9,
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
    }, 0);
    tl.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
    }, 0.05);
  }, [onClose]);

  // GSAP open animation
  useEffect(() => {
    if (isOpen && overlayRef.current && modalRef.current) {
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(modalRef.current, { scale: 0.85, opacity: 0, y: 30 });

      const tl = gsap.timeline();
      tl.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });
      tl.to(modalRef.current, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "back.out(1.4)",
      }, 0.1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") handleClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
      setIframeLoaded(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/90 sm:bg-transparent sm:backdrop-blur-none backdrop-blur-sm"
      onClick={handleClose}
    >
      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative w-full h-full sm:h-auto sm:max-w-5xl rounded-2xl overflow-hidden sm:border-2 sm:border-indigo-500 sm:shadow-[0_0_30px_rgba(99,102,241,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Loom Video Embed — fills screen on mobile, 16:9 aspect on sm+ */}
        <div className="w-full h-full sm:h-0 sm:pb-[56.25%] relative bg-slate-950">
          {/* Loading spinner */}
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            </div>
          )}
          <iframe
            src="https://www.loom.com/embed/cacc77fecccc414292f1bc618514239c?autoplay=1"
            frameBorder="0"
            allowFullScreen
            allow="autoplay"
            className="absolute inset-0 w-full h-full z-20"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}

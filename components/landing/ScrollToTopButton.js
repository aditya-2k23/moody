"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";

/**
 * ScrollToTopButton — floats in the bottom-right corner of the landing page
 * and appears only after the user has scrolled past the hero section height.
 * Clicking it smoothly returns the page to the top.
 */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [heroHeight, setHeroHeight] = useState(0);

  /* Measure hero once it mounts (hero is the first <section> in main) */
  useEffect(() => {
    const hero = document.querySelector("main section");
    if (hero) {
      setHeroHeight(hero.offsetHeight);
    }
  }, []);

  /* Show/hide based on scroll position */
  useEffect(() => {
    if (!heroHeight) return;

    const handleScroll = () => {
      setVisible(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [heroHeight]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
      className={[
        /* Positioning */
        "fixed bottom-6 right-6 z-50",
        /* Size & shape */
        "w-11 h-11 rounded-full",
        /* Colours */
        "bg-indigo-500 text-white",
        /* Border glow ring */
        "ring-2 ring-indigo-400/40 dark:ring-indigo-300/30",
        /* Shadow */
        "shadow-lg shadow-indigo-500/50 dark:shadow-indigo-400/35",
        /* Flex centering */
        "flex items-center justify-center",
        /* Hover / active states */
        "hover:bg-indigo-400",
        "hover:scale-110 active:scale-95",
        "hover:shadow-indigo-500/40",
        /* Transitions */
        "transition-all duration-300 ease-out",
        /* Visibility — translate + opacity so the animation is smooth */
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none",
      ].join(" ")}
    >
      <ArrowUp size={18} strokeWidth={2.5} />
    </button>
  );
}

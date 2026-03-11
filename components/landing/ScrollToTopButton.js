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

  /* Measure hero height initially and on resize */
  useEffect(() => {
    const hero = document.querySelector("main section");
    if (!hero) return;

    const measureHeight = () => {
      const height = hero.offsetHeight;
      setHeroHeight(height);
      // Determine visibility instantly against new height
      setVisible(window.scrollY > height);
    };

    // Measure initially
    measureHeight();

    // Use ResizeObserver for accurate sizing on DOM or layout changes
    const resizeObserver = new ResizeObserver(() => measureHeight());
    resizeObserver.observe(hero);

    // Fallback listeners for window resize/orientation out of caution 
    window.addEventListener("resize", measureHeight, { passive: true });
    window.addEventListener("orientationchange", measureHeight, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureHeight);
      window.removeEventListener("orientationchange", measureHeight);
    };
  }, []);

  /* Show/hide dynamically on scroll events targeting the stateful height */
  useEffect(() => {
    if (!heroHeight) return;

    const handleScroll = () => {
      setVisible(window.scrollY > heroHeight);
    };

    // Call once to establish sync during any late mount shifts
    handleScroll();

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
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      disabled={!visible}
      className={[
        /* Positioning */
        "fixed bottom-6 right-6 z-50",
        /* Size & shape */
        "w-11 h-11 rounded-full",
        /* Colors */
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

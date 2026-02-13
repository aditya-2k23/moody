"use client";
import { useState, useEffect, useRef } from "react";

/**
 * StreakIndicator - A visually dynamic streak display component
 * 
 * Visual States:
 * - Grayscale (inactive): When today's mood is NOT logged
 * - Colorful (active): When today's mood IS logged
 * 
 * Features:
 * - Tooltip on hover when inactive
 * - Celebratory animation when streak becomes active
 * - Smooth transitions between states
 */
export default function StreakIndicator({ streak, hasLoggedToday }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevHasLoggedTodayRef = useRef(hasLoggedToday);

  // Detect when user logs mood today and trigger animation
  // Animation triggers every time user transitions from not-logged to logged
  useEffect(() => {
    const prevLogged = prevHasLoggedTodayRef.current;
    // Always update the ref so transitions are tracked accurately
    prevHasLoggedTodayRef.current = hasLoggedToday;

    let timer;

    // Trigger animation when transitioning from not-logged to logged
    if (!prevLogged && hasLoggedToday) {
      setShouldAnimate(true);

      // Reset animation state after animation completes
      timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 1000); // Match animation duration
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [hasLoggedToday]);

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-2">
      <p className="font-bold dark:font-semibold capitalize text-xs sm:text-base">
        Streak
      </p>

      <div
        className="relative"
        onMouseEnter={() => !hasLoggedToday && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => !hasLoggedToday && setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        tabIndex={0}
        role="status"
        aria-label={`Current streak: ${streak} days${!hasLoggedToday ? ". You haven't logged your mood today yet" : ""}`}
      >
        {/* Streak Value Display */}
        <p
          className={`fugaz text-base sm:text-xl truncate flex items-center gap-1 transition-all duration-300 ${hasLoggedToday
            ? "dark:text-white text-indigo-500"
            : "grayscale text-slate-400 dark:text-slate-500"
            } ${shouldAnimate ? "animate-streak-celebrate" : ""}`}
        >
          {/* Streak Number */}
          <span
            className={`transition-all duration-300 ${shouldAnimate ? "animate-streak-number" : ""
              }`}
          >
            {streak}
          </span>

          {/* Fire Emoji */}
          <span
            className={`text-lg sm:text-xl transition-all duration-300 ${hasLoggedToday
              ? ""
              : "grayscale opacity-60"
              } ${shouldAnimate ? "animate-streak-fire" : ""}`}
          >
            🔥
          </span>
        </p>

        {/* Sparkle Effect Container - Positioned outside text for proper overflow */}
        {shouldAnimate && (
          <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
            <span className="animate-sparkle-1 absolute -top-2 -right-2 text-lg drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]">🔥</span>
            <span className="animate-sparkle-2 absolute -top-3 left-1/2 text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]">✨</span>
            <span className="animate-sparkle-3 absolute top-1/2 -right-3 text-lg drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]">🔥</span>
          </div>
        )}

        {/* Subtle glow effect when active */}
        {hasLoggedToday && (
          <div
            className={`absolute inset-0 -z-10 rounded-lg transition-opacity duration-500 ${shouldAnimate ? "animate-streak-glow" : "opacity-0"
              }`}
            style={{
              background: "radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)",
              filter: "blur(8px)",
              transform: "scale(1.5)"
            }}
          />
        )}

        {/* Tooltip - Only shown when not logged today */}
        {showTooltip && !hasLoggedToday && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 
              bg-white dark:bg-slate-800 
              text-slate-600 dark:text-slate-300 
              text-xs sm:text-sm 
              rounded-lg shadow-lg dark:shadow-slate-900/50
              whitespace-nowrap z-50
              animate-tooltip-fade-in
              border border-slate-200 dark:border-slate-700"
            role="tooltip"
          >
            <span>You haven&apos;t logged your mood today yet</span>
            {/* Tooltip Arrow */}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 -mt-px
                border-4 border-transparent border-t-white dark:border-t-slate-800"
            />
            <div
              className="absolute top-full left-1/2 -translate-x-1/2
                border-4 border-transparent border-t-slate-200 dark:border-t-slate-700"
              style={{ marginTop: "-1px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { moodTips } from "../utils";
import ThemeToggle from "./ThemeToggle";
import gsap from "gsap";

// Fallback tip for SSR (must be deterministic to avoid hydration mismatch)
const DEFAULT_TIP = moodTips?.[0] ?? "Taking small breaks can boost your productivity.";

// Floating emoji pool
const FLOATING_EMOJIS = ["😊", "😢", "😍", "😐", "😭", "🧠", "✨", "💜"];

export default function Splashscreen({
  message = "✨ Fetching your insights...",
  progress = null,
}) {
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const progressRef = useRef(null);
  const messageRef = useRef(null);
  const tipRef = useRef(null);
  const orbRefs = useRef([]);
  const emojiRefs = useRef([]);

  // Random tip — deterministic for SSR, random after hydration
  const [randomTip, setRandomTip] = useState(DEFAULT_TIP);

  // Indeterminate progress animation
  const [animatedProgress, setAnimatedProgress] = useState(0);
  useEffect(() => {
    if (progress !== null) return;
    const interval = setInterval(() => {
      setAnimatedProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        const increment = Math.max(0.5, (90 - prev) * 0.05);
        return Math.min(90, prev + increment);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [progress]);

  const displayProgress = progress !== null ? progress : animatedProgress;

  useEffect(() => {
    if (moodTips?.length) {
      const randomIndex = Math.floor(Math.random() * moodTips.length);
      setRandomTip(moodTips[randomIndex]);
    }
  }, []);

  // Stable emoji positions (computed once, no hydration mismatch)
  const emojiPositions = useMemo(() => {
    return FLOATING_EMOJIS.map((emoji, i) => ({
      emoji,
      left: `${12 + (i * 11.5) % 80}%`,
      top: `${10 + ((i * 17 + 5) % 75)}%`,
      size: 28 + (i % 3) * 8,
    }));
  }, []);

  // GSAP entrance + floating animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // --- Entrance timeline (fast — splash can disappear quickly) ---
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // Logo: quick scale + fade
      tl.fromTo(
        logoRef.current,
        { opacity: 0, y: 15, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35 }
      );

      // Progress bar + message + tip: all stagger in rapidly
      tl.fromTo(
        progressRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.25 },
        "-=0.2"
      );

      tl.fromTo(
        messageRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.2 },
        "-=0.15"
      );

      tl.fromTo(
        tipRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.2)" },
        "-=0.1"
      );

      // --- Glow orbs: appear instantly + float ---
      orbRefs.current.forEach((orb, i) => {
        if (!orb) return;
        gsap.set(orb, { opacity: 1, scale: 1 });
        gsap.to(orb, {
          y: `+=${15 + i * 8}`,
          x: `+=${8 + i * 5}`,
          scale: 1 + (i % 2 === 0 ? 0.08 : -0.06),
          duration: 5 + i * 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      // --- Floating emojis: appear fast + drift ---
      emojiRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, { opacity: 0.12 + (i % 3) * 0.04, scale: 1 });
        gsap.to(el, {
          y: `+=${10 + (i % 4) * 6}`,
          x: `+=${5 + (i % 3) * 4}`,
          rotation: i % 2 === 0 ? 8 : -8,
          duration: 4 + (i % 3) * 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-white to-indigo-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/90 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      {/* ── Glow Orbs ── */}
      {/* Primary — indigo */}
      <div
        ref={(el) => (orbRefs.current[0] = el)}
        className="fixed pointer-events-none"
        style={{
          top: "35%",
          left: "55%",
          transform: "translate(-50%, -50%)",
          width: "min(60vw, 500px)",
          height: "min(60vw, 500px)",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(129,140,248,0.08) 40%, transparent 70%)",
          filter: "blur(60px)",
          borderRadius: "50%",
        }}
        aria-hidden="true"
      />
      {/* Secondary — purple */}
      <div
        ref={(el) => (orbRefs.current[1] = el)}
        className="fixed pointer-events-none"
        style={{
          top: "55%",
          left: "35%",
          transform: "translate(-50%, -50%)",
          width: "min(45vw, 400px)",
          height: "min(45vw, 400px)",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.10) 0%, rgba(99,102,241,0.06) 50%, transparent 75%)",
          filter: "blur(80px)",
          borderRadius: "50%",
        }}
        aria-hidden="true"
      />
      {/* Tertiary — warm accent */}
      <div
        ref={(el) => (orbRefs.current[2] = el)}
        className="fixed pointer-events-none"
        style={{
          top: "45%",
          left: "70%",
          transform: "translate(-50%, -50%)",
          width: "min(35vw, 300px)",
          height: "min(35vw, 300px)",
          background:
            "radial-gradient(circle, rgba(244,114,182,0.08) 0%, rgba(251,146,60,0.05) 50%, transparent 75%)",
          filter: "blur(70px)",
          borderRadius: "50%",
        }}
        aria-hidden="true"
      />

      {/* ── Floating Mood Emojis ── */}
      {emojiPositions.map((ej, i) => (
        <span
          key={i}
          ref={(el) => (emojiRefs.current[i] = el)}
          className="fixed pointer-events-none select-none opacity-0"
          style={{
            top: ej.top,
            left: ej.left,
            fontSize: ej.size,
            zIndex: 1,
          }}
          aria-hidden="true"
        >
          {ej.emoji}
        </span>
      ))}

      {/* ── Main Content ── */}
      <div className="flex flex-col items-center gap-5 relative z-10 px-6">
        {/* Logo */}
        <h1 ref={logoRef} className="fugaz text-6xl sm:text-7xl md:text-8xl textGradient opacity-0">
          Moody
        </h1>

        {/* Progress bar */}
        <div ref={progressRef} className="w-64 sm:w-72 md:w-80 opacity-0">
          <div className="h-2 bg-slate-200/70 dark:bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${displayProgress}%` }}
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-insights-shimmer" />
            </div>
          </div>
          {/* Percentage */}
          <p className="text-indigo-500 dark:text-indigo-300 text-sm font-semibold tabular-nums fugaz text-center mt-2">
            {Math.round(displayProgress)}%
          </p>
        </div>

        {/* Loading message */}
        <p
          ref={messageRef}
          role="status"
          aria-live="polite"
          className="text-slate-500 dark:text-slate-400 text-sm sm:text-base italic opacity-0"
        >
          {message}
        </p>

        {/* Mood Tip Card */}
        <div ref={tipRef} className="mt-4 sm:mt-6 max-w-sm mx-auto opacity-0">
          {/* Badge */}
          <div className="flex items-center justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-500/15 border border-indigo-200/60 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Mood Tip
            </span>
          </div>

          {/* Glassmorphism tip card */}
          <div className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/40 rounded-2xl px-6 py-5 shadow-lg shadow-indigo-500/5 border border-white/40 dark:border-slate-700/50">
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base text-center leading-relaxed">
              &ldquo;Did you know? {randomTip}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

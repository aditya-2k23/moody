"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import "./RadialMoodMenu.css";

/**
 * RadialMoodMenu – GTA-5-style weapon-wheel for mood selection.
 *
 * @param {Array<{emoji:string, label:string}>} moods   – mood options
 * @param {string|null} currentMoodEmoji                 – emoji shown in the center trigger
 * @param {string|null} currentMoodLabel                 – accessible label for the current mood
 * @param {(mood:{emoji:string,label:string}, index:number) => void} onMoodChange
 * @param {boolean}     [disabled=false]
 */
export default function RadialMoodMenu({
  moods,
  currentMoodEmoji,
  currentMoodLabel,
  onMoodChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const total = moods.length;

  /* ── Delayed hover open (lets the tooltip show first) ── */
  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    hoverTimerRef.current = setTimeout(() => setIsOpen(true), 300);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    return () => clearTimeout(hoverTimerRef.current);
  }, []);

  /* ── Close on outside click / tap (mobile) ── */
  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [isOpen]);

  /* ── Close on Escape ── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  /* ── Select handler ── */
  const handleSelect = useCallback(
    (mood, index) => {
      if (disabled) return;
      onMoodChange(mood, index);
      setIsOpen(false);
    },
    [disabled, onMoodChange],
  );

  const hasMood = !!currentMoodEmoji;

  return (
    <div
      ref={containerRef}
      className={`radial-mood-menu ${isOpen ? "active" : ""}`}
      style={{ "--total": total }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Center trigger ── */}
      <button
        className={`radial-trigger ${!hasMood ? "radial-trigger--empty" : ""}`}
        onClick={() => {
          if (disabled) return;
          clearTimeout(hoverTimerRef.current);
          setIsOpen((prev) => !prev);
        }}
        aria-label={
          hasMood
            ? `Current mood: ${currentMoodLabel}. Click to change.`
            : "No mood set. Click to choose a mood."
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={disabled}
      >
        <span className="radial-trigger-emoji">{currentMoodEmoji || "+"}</span>
      </button>

      {/* ── Radial mood items ── */}
      <div role="menu" style={{ display: "contents" }}>
        {moods.map((mood, index) => (
          <div
            key={mood.label}
            className="radial-mood-item"
            style={{ "--i": index }}
            role="none"
          >
            <button
              className="radial-mood-item-inner"
              onClick={() => handleSelect(mood, index)}
              title={mood.label}
              aria-label={`Select mood: ${mood.label}`}
              tabIndex={isOpen ? 0 : -1}
              role="menuitemradio"
              aria-checked={currentMoodLabel === mood.label}
            >
              {mood.emoji}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

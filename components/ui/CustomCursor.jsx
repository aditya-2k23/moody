"use client";

import React, { useEffect, useState } from "react";
import { useCursor } from "../../hooks/useCursor";
import "../../styles/cursor.css";

export default function CustomCursor() {
  const {
    position,
    target,
    isHovering,
    isClicking,
    isIdle,
    isHidden,
    cursorType,
    rotation,
  } = useCursor();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isHidden) return null;

  const cursorMap = {
    default: "/cursor.svg",
    pointer: "/cursor-pointer.svg",
    text: "/cursor-text-caret.svg",
  };

  const cursorSrc = cursorMap[cursorType] || "/cursor.svg";

  return (
    <>
      <div
        className={`custom-cursor-glow ${isHovering ? "hover" : ""} ${isClicking ? "click" : ""} ${isIdle ? "idle" : ""}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
      />
      <div
        className={`custom-cursor-svg type-${cursorType} ${isClicking ? "click" : ""} ${isIdle ? "idle" : ""}`}
        style={{
          transform: `translate3d(${target.x}px, ${target.y}px, 0) rotate(${rotation}deg)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cursorSrc} alt="custom cursor" className="cursor-image" />
      </div>
    </>
  );
}

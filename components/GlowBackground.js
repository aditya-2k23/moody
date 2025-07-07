"use client";
import { useEffect, useRef, useState } from "react";

export default function GlowBackground() {
  const [scrollY, setScrollY] = useState(0);
  const glowRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const glowTop = `calc(40vh + ${scrollY * 0.2}px)`;

  return (
    <div
      ref={glowRef}
      style={{
        top: glowTop,
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: -10,
        position: "fixed",
        width: "30vw",
        height: "30vw",
        minWidth: 300,
        minHeight: 300,
        maxWidth: 600,
        maxHeight: 600,
        background:
          "radial-gradient(circle at 60% 40%, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.13) 40%, rgba(236,72,153,0.10) 80%, transparent 100%)",
        filter: "blur(48px)",
        opacity: 0.65,
        transition: "top 0.3s cubic-bezier(.4,2,.6,1)",
      }}
      aria-hidden="true"
    />
  );
}

"use client";
import { useEffect, useRef, useState } from "react";

export default function GlowBackground() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const glowRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const glowTop = `calc(40vh + ${scrollY * 0.2}px)`;
  const glowLeft = `calc(50% + ${(mousePosition.x - 0.5) * 50}px)`;

  return (
    <>
      {/* Primary glow */}
      <div
        ref={glowRef}
        style={{
          top: glowTop,
          left: glowLeft,
          transform: "translate(-50%, -50%)",
          zIndex: -10,
          position: "fixed",
          width: "80vw",
          height: "80vw",
          minWidth: 350,
          minHeight: 350,
          maxWidth: 700,
          maxHeight: 700,
          background:
            "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 35%, rgba(236,72,153,0.05) 70%, transparent 100%)",
          filter: "blur(60px)",
          opacity: 0.5,
          transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
          pointerEvents: "none",
          borderRadius: "50%",
        }}
        aria-hidden="true"
      />

      {/* Secondary accent glow */}
      <div
        style={{
          top: `calc(45vh + ${scrollY * 0.15}px)`,
          left: `calc(55% + ${(mousePosition.x - 0.5) * 30}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: -11,
          position: "fixed",
          width: "45vw",
          height: "45vw",
          minWidth: 250,
          minHeight: 250,
          maxWidth: 500,
          maxHeight: 500,
          background:
            "radial-gradient(circle at 30% 70%, rgba(139,92,246,0.05) 0%, rgba(236,72,153,0.04) 50%, transparent 100%)",
          filter: "blur(80px)",
          opacity: 0.4,
          transition: "all 0.5s cubic-bezier(.4,0,.2,1)",
          pointerEvents: "none",
          borderRadius: "50%",
        }}
        aria-hidden="true"
      />

      {/* Tertiary subtle glow */}
      <div
        style={{
          top: `calc(35vh + ${scrollY * 0.25}px)`,
          left: `calc(45% + ${(mousePosition.x - 0.5) * 40}px)`,
          transform: "translate(-50%, -50%) rotate(45deg)",
          zIndex: -12,
          position: "fixed",
          width: "60vw",
          height: "40vw",
          minWidth: 400,
          minHeight: 200,
          maxWidth: 800,
          maxHeight: 400,
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.09) 0%, rgba(139,92,246,0.065) 40%, rgba(236,72,153,0.045) 100%)",
          filter: "blur(100px)",
          opacity: 0.3,
          transition: "all 0.6s cubic-bezier(.4,0,.2,1)",
          pointerEvents: "none",
          borderRadius: "50%",
        }}
        aria-hidden="true"
      />
    </>
  );
}

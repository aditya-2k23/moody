"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { moodTips } from "../utils";
import ThemeToggle from "./ThemeToggle";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);
import {
  Sparkles,
  Brain,
  Cloud,
  Sun,
  Heart,
  Zap,
  Smile,
  Info,
  Stars,
  CheckCircle
} from "lucide-react";

// Fallback tip for SSR
const DEFAULT_TIP = moodTips?.[0] ?? "Taking small breaks can boost your productivity.";

// Floating icon pool (Replacing emojis)
const FLOATING_ICONS = [
  { icon: Smile, color: "text-yellow-500/80 dark:text-yellow-400/60" },
  { icon: Heart, color: "text-rose-500/80 dark:text-rose-400/60" },
  { icon: Sparkles, color: "text-indigo-500/80 dark:text-indigo-400/60" },
  { icon: Brain, color: "text-purple-500/80 dark:text-purple-400/60" },
  { icon: Zap, color: "text-amber-500/80 dark:text-amber-400/60" },
  { icon: Stars, color: "text-blue-500/80 dark:text-blue-400/60" },
  { icon: Cloud, color: "text-slate-500/80 dark:text-slate-400/60" },
  { icon: Sun, color: "text-orange-500/80 dark:text-orange-400/60" }
];

const glowVariants = [
  {
    top: "30%",
    left: "50%",
    size: "min(120vw, 1000px)",
    blur: 130,
    opacity: "opacity-60 dark:opacity-20",
    gradient: "radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, rgba(99, 102, 241, 0.2) 45%, transparent 70%)",
  },
  {
    top: "60%",
    left: "20%",
    size: "min(90vw, 800px)",
    blur: 150,
    opacity: "opacity-50 dark:opacity-15",
    gradient: "radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 75%)",
  },
  {
    top: "50%",
    left: "85%",
    size: "min(80vw, 700px)",
    blur: 140,
    opacity: "opacity-40 dark:opacity-10",
    gradient: "radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 75%)",
  },
];

export default function Splashscreen({
  message = "Syncing your digital sanctuary...",
  progress = null,
}) {
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const progressRef = useRef(null);
  const messageRef = useRef(null);
  const tipRef = useRef(null);
  const orbRefs = useRef([]);
  const iconRefs = useRef([]);

  const [randomTip, setRandomTip] = useState(DEFAULT_TIP);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Smoothly animate from 0 to 100% over the splash screen's ~2.5s visible time using GSAP
  useEffect(() => {
    const progressObj = { value: 0 };

    // Animate the progress object
    const tween = gsap.to(progressObj, {
      value: 100,
      duration: 4.2,
      ease: "power3.out", // A smoother ease that slows down nicely at the end
      onUpdate: () => {
        setAnimatedProgress(progressObj.value);
      }
    });

    return () => {
      tween.kill(); // Cleanup
    };
  }, []);

  // Use the smoothly animated tracking number entirely
  const displayProgress = animatedProgress;

  useEffect(() => {
    if (moodTips?.length) {
      const randomIndex = Math.floor(Math.random() * moodTips.length);
      setRandomTip(moodTips[randomIndex]);
    }
  }, []);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const iconPositions = useMemo(() => {
    // Explicit non-overlapping coordinates to avoid the center content
    const safeCoords = [
      { left: 10, top: 15 },  // Top Left
      { left: 90, top: 12 },  // Top Right
      { left: 8, top: 45 },   // Mid Left
      { left: 92, top: 50 },  // Mid Right
      { left: 15, top: 82 },  // Bottom Left
      { left: 85, top: 85 },  // Bottom Right
      { left: 40, top: 8 },   // Top Center-ish
      { left: 60, top: 92 }   // Bottom Center-ish
    ];

    return FLOATING_ICONS.map((item, i) => ({
      ...item,
      left: `${safeCoords[i].left}%`,
      top: `${safeCoords[i].top}%`,
      size: (isMobile ? 32 : 40) + (i % 3) * (isMobile ? 12 : 20),
    }));
  }, [isMobile]);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    // 1. SplitText Entrance
    const split = new SplitText(logoRef.current, {
      type: "chars",
      charsClass: "textGradient inline-block" // Apply gradient to chars to ensure visibility
    });
    const chars = split.chars;

    tl.from(chars, {
      duration: 1.2, // Increased for a more cinematic feel
      opacity: 0,
      y: 60,
      stagger: 0.08,
      ease: "back.out(1.3)"
    });

    // Subtle floating loop
    gsap.to(chars, {
      y: -6,
      stagger: 0.04,
      duration: 1.8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });

    // 2. Progress Section - scale in from center
    tl.fromTo(
      progressRef.current,
      { opacity: 0.4, scaleX: 0, transformOrigin: "center" },
      { opacity: 1, scaleX: 1, duration: 0.2, ease: "expo.out" },
      "-=0.5"
    );

    // 3. Message & Tip Card - staggered pop with bounce
    tl.fromTo(
      [messageRef.current, tipRef.current],
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        stagger: 0.2,
        ease: "elastic.out(1, 0.75)"
      },
      "-=0.6"
    );

    // 4. Background Glow Orbs - expansive entrance & floating motion
    orbRefs.current.forEach((orb, i) => {
      if (!orb) return;
      gsap.fromTo(orb,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 2, delay: i * 0.2, ease: "power2.out" }
      );

      gsap.to(orb, {
        y: `+=${30 + i * 20}`,
        x: `+=${20 + i * 15}`,
        duration: 8 + i * 2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });

    // 5. Floating Icons - directional pop-in
    iconRefs.current.forEach((el, i) => {
      if (!el) return;

      gsap.fromTo(el,
        { opacity: 0, scale: 0, x: (i % 2 === 0 ? -30 : 30), y: (i % 3 === 0 ? -30 : 30) },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          duration: 1,
          delay: 0.6 + i * 0.06,
          ease: "back.out(2)"
        }
      );

      gsap.to(el, {
        y: `+=${15 + (i % 4) * 8}`,
        rotation: i % 2 === 0 ? 10 : -10,
        duration: 4 + (i % 3) * 1.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 2
      });
    });

    // Cleanup: Revert SplitText to avoid duplicated spans on re-render
    return () => {
      split.revert();
    };
  }, { scope: containerRef, dependencies: [iconPositions] });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-primary-500) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Glow Orbs */}
      {glowVariants.map((orb, index) => (
        <div
          key={index}
          ref={(el) => (orbRefs.current[index] = el)}
          className={`fixed pointer-events-none ${orb.opacity}`}
          style={{
            top: orb.top,
            left: orb.left,
            transform: "translate(-50%, -50%)",
            width: orb.size,
            height: orb.size,
            background: orb.gradient,
            filter: `blur(${orb.blur}px)`,
            borderRadius: "50%",
          }}
        />
      ))}

      {/* Floating Icons */}
      {iconPositions.map((item, i) => (
        <div
          key={i}
          ref={(el) => (iconRefs.current[i] = el)}
          className={`fixed pointer-events-none select-none ${item.color}`}
          style={{
            top: item.top,
            left: item.left,
            transform: "translate(-50%, -50%)",
            zIndex: 1,
          }}
        >
          <item.icon size={item.size} strokeWidth={1.5} />
        </div>
      ))}

      {/* Main Content */}
      <div className="flex flex-col items-center gap-8 relative z-10 px-6 max-w-2xl w-full text-center">
        {/* Logo Section */}
        <div className="space-y-2">
          <h1
            ref={logoRef}
            id="logo-text"
            className="fugaz text-6xl sm:text-7xl md:text-8xl tracking-tighter flex justify-center overflow-visible"
          >
            Moody
          </h1>
        </div>

        {/* Progress Section */}
        <div ref={progressRef} className="w-56 md:w-full md:max-w-md space-y-4">
          <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
              style={{ width: `${displayProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between px-1">
            <div ref={messageRef} className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold uppercase">
              {message === "Ready!" && <CheckCircle size={18} className="text-emerald-500" />}
              {message}
            </div>
            <span className="fugaz text-indigo-500 dark:text-indigo-400 text-sm">
              {Math.round(displayProgress)}%
            </span>
          </div>
        </div>

        {/* Mood Tip Section */}
        <div ref={tipRef} className="space-y-4">
          <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-indigo-100/60 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-500/80 dark:text-indigo-300/80 text-xs font-bold">
            <Info size={16} />
            Did you know?
          </div>

          <div className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/40 rounded-2xl px-5 py-4 shadow-lg shadow-indigo-500/5 border border-white/40 dark:border-slate-700/50">
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm text-center leading-relaxed">
              &ldquo;{randomTip}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

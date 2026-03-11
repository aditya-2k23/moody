"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function GlowBackground() {
  const primaryRef = useRef(null);
  const secondaryRef = useRef(null);
  const tertiaryRef = useRef(null);
  const leftRef = useRef(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const primary = primaryRef.current;
    const secondary = secondaryRef.current;
    const tertiary = tertiaryRef.current;
    const left = leftRef.current;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      gsap.set([primary, secondary, tertiary, left], { opacity: 1, scale: 1 });
      return;
    }

    // Gentle floating animation for primary glow
    gsap.to(primary, {
      y: "+=30",
      x: "+=15",
      scale: 1.08,
      duration: 6,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Secondary glow drifts in opposite phase
    gsap.to(secondary, {
      y: "-=25",
      x: "-=20",
      scale: 0.92,
      duration: 8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Tertiary glow slow rotation + drift
    gsap.to(tertiary, {
      rotation: "+=25",
      y: "+=20",
      x: "+=10",
      scale: 1.05,
      duration: 10,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Left glow gentle bob
    gsap.to(left, {
      y: "-=20",
      x: "+=12",
      scale: 1.06,
      duration: 7,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Mouse-following with smooth GSAP interpolation
    const handleMouseMove = (e) => {
      mousePos.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };

      const offsetX = (mousePos.current.x - 0.5) * 60;
      const offsetY = (mousePos.current.y - 0.5) * 40;

      gsap.to(primary, {
        xPercent: offsetX * 0.8,
        yPercent: offsetY * 0.6,
        duration: 1.2,
        ease: "power2.out",
        overwrite: "auto",
      });

      gsap.to(secondary, {
        xPercent: offsetX * 0.5,
        yPercent: offsetY * 0.4,
        duration: 1.6,
        ease: "power2.out",
        overwrite: "auto",
      });

      gsap.to(tertiary, {
        xPercent: offsetX * 0.3,
        yPercent: offsetY * 0.3,
        duration: 2,
        ease: "power2.out",
        overwrite: "auto",
      });

      gsap.to(left, {
        xPercent: offsetX * 0.4,
        yPercent: offsetY * 0.5,
        duration: 1.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    // Parallax on scroll
    const handleScroll = () => {
      const scrollY = window.scrollY;
      gsap.to(primary, {
        top: `calc(40vh + ${scrollY * 0.15}px)`,
        duration: 0.6,
        ease: "power1.out",
        overwrite: "auto",
      });
      gsap.to(secondary, {
        top: `calc(45vh + ${scrollY * 0.1}px)`,
        duration: 0.8,
        ease: "power1.out",
        overwrite: "auto",
      });
      gsap.to(tertiary, {
        top: `calc(35vh + ${scrollY * 0.2}px)`,
        duration: 1,
        ease: "power1.out",
        overwrite: "auto",
      });
      gsap.to(left, {
        top: `calc(55vh + ${scrollY * 0.12}px)`,
        duration: 0.9,
        ease: "power1.out",
        overwrite: "auto",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      gsap.killTweensOf([primary, secondary, tertiary, left]);
    };
  }, []);

  // Fade in on mount
  useEffect(() => {
    const nodes = [primaryRef.current, secondaryRef.current, tertiaryRef.current, leftRef.current];
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      gsap.set(nodes, { opacity: 1, scale: 1 });
      return;
    }

    gsap.fromTo(
      nodes,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out", stagger: 0.2 }
    );
  }, []);

  return (
    <>
      <div className="glow-background-container opacity-85 dark:opacity-65">
        {/* Primary glow — indigo/violet core */}
        <div
          ref={primaryRef}
          className="glow-element fixed pointer-events-none -z-10"
          style={{
            top: "40vh",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80vw",
            height: "80vw",
            minWidth: 350,
            minHeight: 350,
            maxWidth: 700,
            maxHeight: 700,
            background:
              "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.16) 0%, rgba(129,140,248,0.13) 30%, rgba(139,92,246,0.1) 60%, transparent 100%)",
            filter: "blur(60px)",
            borderRadius: "50%",
            willChange: "transform, top",
          }}
          aria-hidden="true"
        />

        {/* Secondary accent — pink/violet shift */}
        <div
          ref={secondaryRef}
          className="glow-element fixed pointer-events-none -z-[11]"
          style={{
            top: "45vh",
            left: "55%",
            transform: "translate(-50%, -50%)",
            width: "45vw",
            height: "45vw",
            minWidth: 250,
            minHeight: 250,
            maxWidth: 500,
            maxHeight: 500,
            background:
              "radial-gradient(circle at 30% 70%, rgba(139,92,246,0.14) 0%, rgba(99,102,241,0.11) 45%, rgba(129,140,248,0.12) 75%, transparent 100%)",
            filter: "blur(80px)",
            borderRadius: "50%",
            willChange: "transform, top",
          }}
          aria-hidden="true"
        />

        {/* Tertiary — wide indigo wash */}
        <div
          ref={tertiaryRef}
          className="glow-element fixed pointer-events-none -z-[12]"
          style={{
            top: "35vh",
            left: "45%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            width: "60vw",
            height: "40vw",
            minWidth: 400,
            minHeight: 200,
            maxWidth: 800,
            maxHeight: 400,
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.11) 35%, rgba(129,140,248,0.12) 70%, rgba(109,82,226,0.08) 100%)",
            filter: "blur(100px)",
            borderRadius: "50%",
            willChange: "transform, top",
          }}
          aria-hidden="true"
        />

        {/* Left-side glow — violet/indigo accent */}
        <div
          ref={leftRef}
          className="glow-element fixed pointer-events-none -z-[13]"
          style={{
            top: "55vh",
            left: "8%",
            transform: "translate(-50%, -50%)",
            width: "50vw",
            height: "50vw",
            minWidth: 280,
            minHeight: 280,
            maxWidth: 550,
            maxHeight: 550,
            background:
              "radial-gradient(circle at 60% 40%, rgba(139,92,246,0.14) 0%, rgba(99,102,241,0.11) 40%, rgba(129,140,248,0.06) 70%, transparent 100%)",
            filter: "blur(70px)",
            borderRadius: "50%",
            willChange: "transform, top",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Dark mode overrides — keep existing subtle look */}
      <style jsx>{`
        :global(.dark) .glow-element {
          opacity: 0.30 !important;
        }
      `}</style>
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import Logout from "@/components/Logout";
import ThemeToggle from "@/components/ThemeToggle";
import NavbarLinks from "@/components/NavbarLinks";

export default function Header() {
  const headerRef = useRef(null);
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);
  const THRESHOLD = 80; // px scrolled before we start hiding

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (currentY < THRESHOLD) {
        // Always show near the top
        if (isHidden.current) {
          gsap.to(headerRef.current, { y: 0, duration: 0.4, ease: "power3.out" });
          isHidden.current = false;
        }
      } else if (diff > 4 && !isHidden.current) {
        // Scrolling down — hide
        gsap.to(headerRef.current, {
          y: "-110%",
          duration: 0.4,
          ease: "power3.inOut",
        });
        isHidden.current = true;
      } else if (diff < -4 && isHidden.current) {
        // Scrolling up — reveal
        gsap.to(headerRef.current, {
          y: 0,
          duration: 0.4,
          ease: "power3.out",
        });
        isHidden.current = false;
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className="p-4 sm:px-8 sm:py-6 sticky top-0 z-20 flex items-center justify-between gap-4 backdrop-blur-sm bg-white/10 dark:bg-transparent"
    >
      {/* Logo — left */}
      <Link
        href="/?ref=internal"
        className="flex items-center fugaz hover:scale-105 duration-200 shrink-0"
      >
        <h1 className="text-2xl sm:text-4xl textGradient" title="Moody v2.5">
          Moody
        </h1>
        <span className="text-xs self-end text-indigo-500 dark:text-indigo-300">
          v2.5
        </span>
      </Link>

      {/* Desktop Nav — absolutely centered */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
        <NavbarLinks />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Logout />
        <ThemeToggle />
        <div className="md:hidden">
          <NavbarLinks />
        </div>
      </div>
    </header>
  );
}

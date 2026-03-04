"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/authContext";

gsap.registerPlugin(ScrollToPlugin);

export default function NavbarLinks() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);
  const overlayRef = useRef(null);
  const linksRef = useRef([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";

      const tl = gsap.timeline({
        onComplete: () => setIsAnimating(false)
      });

      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .fromTo(menuRef.current, { x: "100%" }, { x: "0%", duration: 0.4, ease: "power3.out" }, "-=0.2")
        .fromTo(linksRef.current, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.1 }, "-=0.2");
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Only show links on the home page
  if (pathname !== "/") return null;

  const handleScroll = (e, targetId, isMobile = false) => {
    e.preventDefault();
    if (isMobile) {
      closeMenu();
    }
    const target = document.getElementById(targetId);
    if (target) {
      const headerHeight = document.querySelector("header")?.offsetHeight - 100 ?? 72;
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: target, offsetY: headerHeight },
        ease: "power3.inOut",
        delay: isMobile ? 0.4 : 0
      });
    }
  };

  const openMenu = () => {
    if (isAnimating) return;
    setIsOpen(true);
  };

  const closeMenu = () => {
    if (isAnimating || !isOpen) return;
    setIsAnimating(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setIsOpen(false);
        setIsAnimating(false);
      }
    });

    tl.to(linksRef.current, { x: 20, opacity: 0, duration: 0.2, stagger: 0.05 })
      .to(menuRef.current, { x: "100%", duration: 0.4, ease: "power3.inOut" }, "-=0.1")
      .to(overlayRef.current, { opacity: 0, duration: 0.3 }, "-=0.3");
  };

  const navLinks = [
    { name: "Try Now", id: "guest-mood" },
    { name: "Features", id: "features" },
    { name: "Comparison", id: "comparison" },
    { name: "Tech Stack", id: "tech-stack" }
  ].filter(link => !(currentUser && link.id === "guest-mood"));

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-10">
        {navLinks.map((link) => (
          <Link
            key={link.id}
            href={`#${link.id}`}
            scroll={false}
            onClick={(e) => handleScroll(e, link.id)}
            className="text-sm lg:text-base font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-sans whitespace-nowrap fugaz"
          >
            {link.name}
          </Link>
        ))}
      </nav>

      {/* Mobile Hamburger Button */}
      <button
        className="md:hidden flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        onClick={openMenu}
        aria-label="Open Menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Menu Modal — portaled to document.body to escape header's backdrop-filter containing block */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay */}
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeMenu}
          />

          {/* Drawer */}
          <div
            ref={menuRef}
            className="relative w-64 h-full bg-slate-200/90 dark:bg-slate-900 shadow-2xl shadow-indigo-300 flex flex-col border-l border-indigo-500 dark:border-slate-800"
          >
            <div className="p-4 flex justify-end">
              <button
                onClick={closeMenu}
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                aria-label="Close Menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col px-6 py-4 gap-6">
              {navLinks.map((link, i) => (
                <Link
                  key={link.id}
                  ref={el => linksRef.current[i] = el}
                  href={`#${link.id}`}
                  scroll={false}
                  onClick={(e) => handleScroll(e, link.id, true)}
                  className="text-lg font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors fugaz"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

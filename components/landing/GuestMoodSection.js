"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { useGuestDraft } from "@/hooks/useGuestDraft";
import MoodJournal from "../MoodJournal";
import Login from "../Login";
import { MousePointerClick, X } from "lucide-react";
import gsap from "gsap";

/**
 * GuestMoodSection — Embeds the MoodJournal in guest mode on the landing page.
 *
 * When the user interacts with a gated action (mood, save, insights) an
 * inline auth modal appears. After successful sign-in the user is redirected
 * to /dashboard where the guest draft is hydrated automatically.
 *
 * If the user is already authenticated, nothing is shown (HeroSection already
 * links them to the dashboard).
 */
export default function GuestMoodSection() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { draft, saveDraft } = useGuestDraft();
  const [showAuth, setShowAuth] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  const handleAuthRequired = () => {
    setShowAuth(true);
  };

  const handleCloseAuth = useCallback(() => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setShowAuth(false);
        setIsAnimatingOut(false);
      }
    });

    tl.to(modalRef.current, {
      y: 100,
      scaleY: 1.1,
      scaleX: 0.9,
      opacity: 0,
      duration: 0.5,
      ease: "back.in(1.7)"
    }, 0)
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut"
      }, 0);
  }, [isAnimatingOut]);

  const handleAuthSuccess = () => {
    // After sign-in, redirect to dashboard.
    // The guest draft in localStorage will be hydrated by DashboardContent.
    router.push("/dashboard");
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showAuth) {
        handleCloseAuth();
      }
    };

    if (showAuth) {
      window.addEventListener("keydown", handleKeyDown);
      // Prevent background scrolling
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [showAuth, handleCloseAuth]);

  // Animate in when modal opens
  useEffect(() => {
    if (showAuth && modalRef.current && overlayRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      gsap.fromTo(modalRef.current,
        { y: 100, scaleY: 1.2, scaleX: 0.8, opacity: 0 },
        { y: 0, scaleY: 1, scaleX: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
      );
    }
  }, [showAuth]);

  // Already signed in → don't render the guest section
  // (The HeroSection CTA handles authenticated users)
  if (currentUser) return null;

  return (
    <section className="py-12 md:py-20" id="guest-mood">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-2">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-4">
            <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">
              <MousePointerClick className="inline-block mr-1" size={20} /> Try it now!
            </span>
          </span>
        </div>

        {/* Guest MoodJournal */}
        <div className="flex flex-col gap-6 sm:gap-10">
          <MoodJournal
            mode="guest"
            initialMood={draft?.mood ?? null}
            initialText={draft?.journalText ?? ""}
            onAuthRequired={handleAuthRequired}
            saveDraft={saveDraft}
          />
        </div>

        {/* Inline auth modal */}
        {showAuth && typeof document !== "undefined" && createPortal(
          <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseAuth();
            }}
          >
            <div
              ref={modalRef}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-indigo-500/40 dark:shadow-indigo-600/20 p-6 sm:p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-indigo-600"
            >
              {/* Close button */}
              <button
                onClick={handleCloseAuth}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                aria-label="Close"
              >
                <X />
              </button>

              <Login
                initialRegister
                onAuthSuccess={handleAuthSuccess}
              />
            </div>
          </div>,
          document.body
        )}
      </div>
    </section>
  );
}

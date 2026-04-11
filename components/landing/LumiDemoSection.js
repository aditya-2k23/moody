"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import gsap from "gsap";
import { X } from "lucide-react";
import ChatContainer from "../chat/ChatContainer";
import Button from "../Button";
import Login from "../Login";
import Image from "next/image";

export default function LumiDemoSection() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  const handleStartChatting = () => {
    if (currentUser) {
      router.push("/dashboard");
    } else {
      setShowAuthModal(true);
    }
  };

  const handleCloseAuth = useCallback(() => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setShowAuthModal(false);
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
    router.push("/dashboard");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showAuthModal) {
        handleCloseAuth();
      }
    };

    if (showAuthModal) {
      window.addEventListener("keydown", handleKeyDown);
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
  }, [showAuthModal, handleCloseAuth]);

  useEffect(() => {
    if (showAuthModal && modalRef.current && overlayRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      gsap.fromTo(modalRef.current,
        { y: 100, scaleY: 1.2, scaleX: 0.8, opacity: 0 },
        { y: 0, scaleY: 1, scaleX: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
      );
    }
  }, [showAuthModal]);

  return (
    <section id="lumi-demo" className="py-20 flex flex-col items-center justify-center bg-transparent w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row w-full gap-12 items-center lg:items-start">
        {/* Left Side: Lumi Intro */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          <div className="w-48 h-48 rounded-full p-[3px] bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_30px_rgba(79,70,229,0.3)] relative overflow-hidden">
            <div className="w-full h-full rounded-full overflow-hidden relative">
              <Image
                src="/lumi-avatar.png"
                alt="Lumi"
                width={192}
                height={192}
                className="w-full h-full object-cover bg-[#0a0c16]"
              />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-800 dark:text-white">
            Meet <span className="fugaz textGradient">&apos;Lumi&apos;</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
            Lumi is always here to listen. Whether you need a moment of reflection, someone to share your thoughts with, or just a quiet space to unwind, Lumi provides a warm, judgment-free presence.
          </p>
          <div className="pt-2">
            <Button
              text="Start Chatting"
              dark
              onClick={handleStartChatting}
            />
          </div>
        </div>

        {/* Right Side: Demo Chat Container */}
        <div className="flex-1 w-full max-w-md relative flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 dark:from-indigo-500/20 dark:to-purple-500/20 blur-3xl -z-10 rounded-[3rem]" />
          <ChatContainer isDemo={true} />
        </div>
      </div>

      {/* Inline auth modal */}
      {showAuthModal && typeof document !== "undefined" && createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseAuth();
          }}
        >
          <div
            ref={modalRef}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-indigo-500/40 dark:shadow-indigo-600/20 p-6 sm:p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-hidden border border-indigo-600"
            role="dialog"
            aria-modal="true"
            aria-label="Authentication dialog"
          >
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
    </section>
  );
}

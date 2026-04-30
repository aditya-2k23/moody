"use client";

import { useEffect, useRef } from "react";
import { Toaster, toast, resolveValue } from "react-hot-toast";
import { X, CheckCircle } from "lucide-react";
import gsap from "gsap";

const ToastItem = ({ t }) => {
  const elRef = useRef(null);
  const isError = t.type === "error";
  const isSuccess = t.type === "success";

  useEffect(() => {
    if (t.visible) {
      gsap.fromTo(elRef.current,
        { y: -30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
    } else {
      gsap.to(elRef.current, {
        y: -20, opacity: 0, scale: 0.9, duration: 0.3, ease: "power2.in"
      });
    }
  }, [t.visible]);

  return (
    <div
      ref={elRef}
      className="max-w-md w-full bg-slate-50 dark:bg-[#0f1624] smooth-transition shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(79,70,229,0.15)] rounded-xl pointer-events-auto flex items-center relative overflow-hidden ring-1 ring-slate-200/50 dark:ring-indigo-500/10"
      style={{ opacity: 0 }} // Initial state before gsap takes over
    >
      {/* Left accented border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSuccess ? "bg-emerald-500" : "bg-gradient-to-b from-[#d946ef] to-[#9333ea]"
          }`}
      />

      <div className="flex-1 w-0 p-3 lg:p-4 pl-5 lg:pl-6">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="flex-shrink-0">
            <div
              className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center ${isSuccess
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-[#fee2e2] dark:bg-[#2d1b4e] text-red-400 dark:text-[#a78bfa]"
                }`}
            >
              {isSuccess ? <CheckCircle className="w-5 h-5" /> : <span className="text-xl font-bold pb-0.5">!</span>}
            </div>
          </div>
          <div className="w-px h-8 lg:h-10 border-l border-slate-200 dark:border-indigo-500/20" />
          <div className="flex-1">
            <p className="text-[14px] lg:text-[15px] font-medium text-slate-800 dark:text-slate-100 leading-snug">
              {resolveValue(t.message, t)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-slate-200 dark:border-slate-700 h-full">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full h-full border border-transparent rounded-none rounded-r-xl p-3 lg:p-4 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-indigo-400/60 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <X className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
      </div>
    </div>
  );
};

export default function CustomToaster() {
  return (
    <Toaster position="top-center" containerStyle={{ zIndex: 999999 }}>
      {(t) => <ToastItem t={t} />}
    </Toaster>
  );
}
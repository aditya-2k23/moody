"use client";
import React from "react";
import ChatContainer from "../chat/ChatContainer";

export default function LumiDemoSection() {
  return (
    <section className="py-20 flex flex-col items-center justify-center bg-transparent w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row w-full gap-12 items-center lg:items-start">
        {/* Left Side: Lumi Intro */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-indigo-200/50 shadow-lg relative">
            {/* Using a placeholder for Lumi's image */}
            <img
              src="/lumi-avatar.png"
              alt="Lumi"
              className="w-full h-full object-cover bg-indigo-50"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://ui-avatars.com/api/?name=Lumi&background=e0e7ff&color=4f46e5&rounded=true&size=200";
              }}
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-slate-100">
            Meet Lumi
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
            Lumi is always here to listen. Whether you need a moment of reflection, someone to share your thoughts with, or just a quiet space to unwind, Lumi provides a warm, judgment-free presence.
          </p>
          <div className="inline-flex items-center space-x-2 text-indigo-500 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span>Lumi is ready to talk</span>
          </div>
        </div>

        {/* Right Side: Demo Chat Container */}
        <div className="flex-1 w-full max-w-md h-[500px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-slate-900 relative flex flex-col">
          <ChatContainer isDemo={true} />
        </div>
      </div>
    </section>
  );
}

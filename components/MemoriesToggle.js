"use client";
import { Images } from "lucide-react";

export default function MemoriesToggle({ showMemories, onToggle, hasMemories = true, onUploadPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <p className="text-xs sm:text-sm text-indigo-500 dark:text-indigo-400 mb-2 fugaz">
        {!hasMemories ? "Upload some photos for this month!" : showMemories ? "Hide Memories" : "Show Memories"}
      </p>
      <div className="flex items-center justify-center w-full">
        {/* Left Decorative Line */}
        <div className="h-[4px] flex-1 bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-600 to-transparent animate-pulse" />

        <button
          onClick={!hasMemories ? onUploadPrompt : onToggle}
          className={`mx-4 p-2.5 rounded-full shadow-sm border transition-all duration-300
            ${!hasMemories
              ? "bg-indigo-50 dark:bg-slate-800 text-indigo-400 dark:text-indigo-300 border-indigo-200 dark:border-slate-600 hover:bg-indigo-100/80 hover:scale-110"
              : "bg-indigo-100/80 dark:bg-slate-800/90 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-slate-700 scale-110 hover:scale-125 border-indigo-200/50 dark:border-slate-600/50"
            }`}
          title={!hasMemories ? "Upload photos" : showMemories ? "Hide Memories" : "Show Memories"}
        >
          <Images size={22} className={`transition-all duration-300 ${hasMemories && showMemories ? "opacity-100 scale-110 text-indigo-600 dark:text-indigo-300" : ""}`} />
        </button>

        {/* Right Decorative Line */}
        <div className="h-[4px] flex-1 bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-600 to-transparent animate-pulse" />
      </div>
    </div>
  );
}

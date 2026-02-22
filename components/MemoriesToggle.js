import { BookImageIcon } from "lucide-react";

export default function MemoriesToggle({ showMemories, onToggle }) {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <p className="text-xs sm:text-sm text-indigo-500 dark:text-indigo-400 mb-2 fugaz">
        {showMemories ? "Hide Memories" : "Show Memories"}
      </p>
      <div className="flex items-center justify-center w-full">
        {/* Left Decorative Line */}
        <div className="h-[4px] flex-1 bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-600 to-transparent animate-pulse" />

        <button
          onClick={onToggle}
          className="mx-4 p-2.5 rounded-full bg-indigo-100/80 dark:bg-slate-800/90 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 scale-110 hover:scale-125 shadow-sm border border-indigo-200/50 dark:border-slate-600/50"
          title={showMemories ? "Hide Memories" : "Show Memories"}
        >
          <BookImageIcon size={22} className={`transition-all duration-300 ${showMemories ? "opacity-100 scale-110 text-indigo-600 dark:text-indigo-300" : ""}`} />
        </button>

        {/* Right Decorative Line */}
        <div className="h-[4px] flex-1 bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-600 to-transparent animate-pulse" />
      </div>
    </div>
  );
}

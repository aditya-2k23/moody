"use client";

import { useState } from "react";
import { Maximize2, Minimize2, Trash2, X } from "lucide-react";
import Image from "next/image";

/**
 * ChatHeader — Lumi identity bar with status + action buttons
 * Actions: fullscreen toggle, clear chat (with inline confirmation)
 */
export default function ChatHeader({
  isFullscreen,
  onToggleFullscreen,
  onClearChat,
  hasMessages,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearClick = () => {
    if (showClearConfirm) {
      onClearChat();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      // Auto-dismiss confirmation after 3s
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-100/80 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between">
      {/* Left: Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md overflow-hidden">
            <Image
              src="/lumi-avatar.png"
              alt="Lumi"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight">
            Lumi
          </h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Online
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Clear chat */}
        {hasMessages && (
          <button
            onClick={handleClearClick}
            className={`p-2 rounded-lg transition-all duration-200 ${showClearConfirm
                ? "bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400 scale-105"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
            title={showClearConfirm ? "Click again to confirm" : "Clear chat"}
            aria-label={
              showClearConfirm ? "Confirm clear chat" : "Clear chat"
            }
          >
            {showClearConfirm ? (
              <Trash2 size={16} className="animate-pulse" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        )}

        {/* Fullscreen toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200"
          title={isFullscreen ? "Exit fullscreen (ESC)" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 size={16} />
          ) : (
            <Maximize2 size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Maximize2, Minimize2, Trash2, X, History, PlusCircle } from "lucide-react";
import Image from "next/image";
import { APP_RELEASE_TAG } from "@/lib/release";

/**
 * ChatHeader — Lumi identity bar with status + action buttons
 * Actions: fullscreen toggle, clear chat (with inline confirmation)
 */
export default function ChatHeader({
  isFullscreen,
  onToggleFullscreen,
  onClearChat,
  hasMessages,
  onShowHistory,
  hasHistory,
  onNewChat,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Close modal on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showClearConfirm) {
        setShowClearConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showClearConfirm]);

  return (
    <>
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
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Online
              </p>
              <span className="text-[9px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {APP_RELEASE_TAG}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 min-w-max">
          {/* New Chat */}
          <button
            onClick={onNewChat}
            disabled={!hasMessages}
            className={`p-2 rounded-lg transition-all duration-200 ${!hasMessages
              ? "text-gray-300 dark:text-slate-600 cursor-not-allowed"
              : "text-emerald-600 hover:bg-emerald-100/50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 cursor-pointer"
              }`}
            title={!hasMessages ? "Start chatting to create a new session" : "Start a new chat session"}
            aria-label="New Chat"
          >
            <PlusCircle size={18} />
          </button>

          {/* Chat History */}
          <button
            onClick={onShowHistory}
            disabled={!hasHistory}
            className={`p-2 rounded-lg transition-all duration-200 ${hasHistory
              ? "text-indigo-500 hover:bg-indigo-100/50 dark:text-indigo-400 dark:hover:bg-slate-800 cursor-pointer"
              : "text-gray-300 dark:text-slate-600 cursor-not-allowed"
              }`}
            title={hasHistory ? "View today's chat history" : "No previous chats today"}
            aria-label={hasHistory ? "View today's chat history" : "No previous chats today"}
          >
            <History size={18} />
          </button>

          {/* Clear chat */}
          {hasMessages && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/20"
              title="Delete chat session"
              aria-label="Clear chat"
            >
              <Trash2 size={16} />
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

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 rounded-[2rem]"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Delete Session?</h3>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              This action cannot be undone. All messages in this specific session will be permanently deleted from your history.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearChat();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

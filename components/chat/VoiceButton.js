"use client";

import { Mic, Square } from "lucide-react";

/**
 * VoiceButton — Microphone toggle for voice input in chat
 * States: idle (mic icon), listening (pulsing red square), processing
 */
export default function VoiceButton({ isListening, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`w-9 h-9 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-40 hover:scale-110 active:scale-90 ring-1 hover:ring-2 ${
        isListening
          ? "bg-red-100 dark:bg-red-500/30 text-red-500 dark:text-red-300 ring-red-400 shadow-[0_0_12px_rgba(239,68,68,0.35)]"
          : "bg-white/60 dark:bg-slate-700/60 text-gray-400 dark:text-gray-400 ring-gray-200 dark:ring-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:ring-indigo-300 dark:hover:ring-indigo-500/50"
      }`}
      title={isListening ? "Stop listening" : "Voice input"}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
    >
      {isListening ? (
        <Square className="animate-pulse" size={14} />
      ) : (
        <Mic size={16} />
      )}
    </button>
  );
}

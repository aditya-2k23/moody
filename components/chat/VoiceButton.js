"use client";

import { Mic, Square } from "lucide-react";

export default function VoiceButton({ isListening, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`h-10 w-10 rounded-[14px] flex items-center justify-center transition-all ${isListening
          ? "bg-[#3b4267] text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          : "bg-[#eef2ff] dark:bg-[#2f3555] text-indigo-500 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-[#3b4267] disabled:bg-gray-100 dark:disabled:bg-[#262b45]"
        }`}
      title={isListening ? "Stop listening" : "Voice input"}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
    >
      {isListening ? (
        <Square className="animate-pulse" size={16} />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
}

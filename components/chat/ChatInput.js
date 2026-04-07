"use client";

import { useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import VoiceButton from "./VoiceButton";
import { useVoiceInput } from "@/hooks/useVoiceInput";

/**
 * ChatInput — Chat textarea with voice button, auto-resize,
 * Enter to send, Shift+Enter for newline
 */
export default function ChatInput({
  input,
  setInput,
  onSend,
  isTyping,
  isFullscreen,
}) {
  const textareaRef = useRef(null);

  // Voice input integration
  const { isListening, toggleVoiceInput, syncBaseEntry, getDisplayValue } =
    useVoiceInput({
      initialValue: input,
      onTranscriptChange: (newText) => {
        setInput(newText);
      },
    });

  // Display value shows interim transcript while listening
  const displayValue = getDisplayValue(input);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [displayValue, adjustHeight]);

  // Focus input when fullscreen toggles
  useEffect(() => {
    if (isFullscreen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isFullscreen]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    onSend(input.trim());
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-gray-100 dark:border-slate-800/80">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="relative flex-1 bg-gray-50 dark:bg-slate-800/70 rounded-2xl border border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-500/40 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all overflow-hidden">
          <div className="flex items-end">
            <textarea
              ref={textareaRef}
              rows={1}
              value={displayValue}
              onChange={(e) => {
                setInput(e.target.value);
                syncBaseEntry(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message Lumi..."
              className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none leading-relaxed max-h-[120px]"
              disabled={isTyping}
              aria-label="Chat message input"
            />
            <div className="flex items-center gap-1 pr-2 pb-2">
              <VoiceButton
                isListening={isListening}
                onToggle={() => toggleVoiceInput(input)}
                disabled={isTyping}
              />
            </div>
          </div>

          {/* Listening indicator bar */}
          {isListening && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 via-red-500 to-red-400 animate-pulse rounded-full" />
          )}
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-slate-700 text-white disabled:text-gray-400 dark:disabled:text-gray-500 transition-all flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 disabled:shadow-none hover:shadow-lg hover:shadow-indigo-600/30 hover:scale-105 active:scale-95 disabled:hover:scale-100"
          aria-label={isTyping ? "Waiting for response" : "Send message"}
        >
          {isTyping ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} className="ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
}

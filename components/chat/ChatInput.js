"use client";

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { Send, Loader2 } from "lucide-react";
import VoiceButton from "./VoiceButton";
import { useVoiceInput } from "@/hooks/useVoiceInput";

/**
 * ChatInput — Chat textarea with voice button, auto-resize,
 * Enter to send, Shift+Enter for newline
 */
const ChatInput = forwardRef(function ChatInput({
  input,
  setInput,
  onSend,
  isTyping,
  isFullscreen,
}, ref) {
  const textareaRef = useRef(null);
  const [isComposing, setIsComposing] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus({ preventScroll: true });
    },
  }), []);

  // Voice input integration
  const { isListening, toggleVoiceInput, stopVoiceInput, syncBaseEntry, getDisplayValue } =
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
    if (isTyping) return;

    let finalInput = input;
    if (isListening) {
      finalInput = stopVoiceInput();
    }

    const trimmed = finalInput.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    const nativeComposing = e.nativeEvent && e.nativeEvent.isComposing;
    if (e.key === "Enter" && !e.shiftKey && !(nativeComposing || e.nativeEvent.keyCode === 229 || isComposing)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 bg-transparent backdrop-blur-md border-t border-gray-100/50 dark:border-white/5">
      <form onSubmit={handleSubmit} className="flex">
        <div className="flex-1 flex items-center bg-slate-50 dark:bg-[#1f233b] rounded-[2rem] border border-indigo-100/50 dark:border-[#333857] focus-within:border-indigo-300 dark:focus-within:border-[#4f5682] focus-within:bg-white dark:focus-within:bg-[#252945] focus-within:shadow-[0_0_15px_rgba(79,70,229,0.1)] transition-all overflow-hidden relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={displayValue}
            onChange={(e) => {
              setInput(e.target.value);
              syncBaseEntry(e.target.value);
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleKeyDown}
            placeholder="Message Lumi..."
            className="flex-1 bg-transparent pl-5 pr-2 py-3.5 text-[15px] focus:outline-none dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none leading-relaxed max-h-[120px] overflow-y-auto chat-scrollbar"
            disabled={isTyping}
            aria-label="Chat message input"
          />

          <div className="flex items-center gap-2 pr-3 py-2 shrink-0">
            <VoiceButton
              isListening={isListening}
              onToggle={() => toggleVoiceInput(input)}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="h-10 w-10 text-indigo-500 dark:text-gray-400 disabled:text-gray-400 dark:disabled:text-[#4b5175] flex items-center justify-center transition-all bg-[#eef2ff] dark:bg-[#2f3555] hover:bg-indigo-100 dark:hover:bg-[#3b4267] disabled:bg-gray-100 dark:disabled:bg-[#262b45] disabled:cursor-not-allowed group rounded-[14px]"
              aria-label={isTyping ? "Waiting for response" : "Send message"}
            >
              {isTyping ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className="ml-0.5" />
              )}
            </button>
          </div>

          {/* Listening indicator bar */}
          {isListening && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 via-red-500 to-red-400 animate-pulse rounded-full" />
          )}
        </div>
      </form>
    </div>
  );
});

export default ChatInput;

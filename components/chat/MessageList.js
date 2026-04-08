"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import MessageBubble from "./MessageBubble";

/**
 * MessageList — Scrollable message area with auto-scroll, typing indicator,
 * custom scrollbar, and empty state
 */
export default function MessageList({ messages, isTyping, isFullscreen }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    // Only scroll if there are actually messages or we are typing
    if (messages.length > 0 || isTyping) {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [messages, isTyping]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-50/80 to-white/60 dark:from-[#0b1120] dark:to-[#0f172a]/80 scroll-smooth chat-scrollbar ${isFullscreen ? "max-h-full" : "h-full"
        }`}
      style={{ scrollbarGutter: "stable" }}
      onScroll={(e) => e.stopPropagation()}
    >
      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[calc(100%-20px)] text-center space-y-2 py-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/30 flex items-center justify-center shadow-sm overflow-hidden">
            <Image
              src="/lumi-avatar.png"
              alt="Lumi"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            I&apos;m Lumi. I&apos;m here to listen and help you reflect.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[70%]">
            Ask me anything, share how you&apos;re feeling, or
            just chat. I&apos;m all ears.
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id || idx}
          message={msg}
          isLatest={idx === messages.length - 1}
        />
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex items-end gap-2.5 flex-row animate-chat-fade-in">
          <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm mb-1 overflow-hidden">
            <Image
              src="/lumi-avatar.png"
              alt="Lumi"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <div className="bg-white dark:bg-slate-800/90 border border-gray-100 dark:border-slate-700/80 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 dark:text-gray-500 mr-1.5 font-medium">
                Lumi is typing
              </span>
              <span
                className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

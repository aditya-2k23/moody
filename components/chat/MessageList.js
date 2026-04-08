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
      className={`flex-1 flex flex-col overflow-y-auto px-5 py-2 space-y-4 bg-transparent scroll-smooth chat-scrollbar ${isFullscreen ? "max-h-full" : ""
        }`}
      onScroll={(e) => e.stopPropagation()}
    >
      {/* Empty state */}
      {messages.length === 0 && (
        <div className="m-auto flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.15)] overflow-hidden mb-2">
            <div className="w-full h-full rounded-full overflow-hidden relative">
              <Image
                src="/lumi-avatar.png"
                alt="Lumi"
                width={80}
                height={80}
                className="w-full h-full object-cover bg-[#0a0c16]"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          </div>
          <p className="text-base font-medium text-slate-800 dark:text-gray-100 tracking-wide">
            I&apos;m Lumi. I&apos;m here to listen and help you reflect.
          </p>
          <p className="text-sm font-normal text-slate-500 dark:text-gray-500 max-w-[80%] leading-relaxed">
            Ask me anything, share how you&apos;re feeling, or<br />just chat. I&apos;m all ears.
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

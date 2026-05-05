"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

/**
 * MessageBubble — Single chat message with GSAP entry animation
 * AI messages show Lumi avatar on the left, user messages align right
 */
export default function MessageBubble({ message, isLatest }) {
  const bubbleRef = useRef(null);

  useEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;

    // GSAP animation for message entry
    let cancelled = false;

    (async () => {
      const gsapModule = (await import("gsap")).default;
      if (cancelled || !bubbleRef.current) return;

      gsapModule.fromTo(
        el,
        { opacity: 0, y: 16, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isUser = message.role === "user";

  return (
    <div
      ref={bubbleRef}
      className={`flex items-end gap-2 opacity-0 ${isUser ? "flex-row-reverse" : "flex-row"
        } relative group`}
    >
      {/* Avatar — only for assistant */}
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm overflow-hidden mb-0.5">
          <Image
            src="/lumi-avatar.png"
            alt="Lumi"
            width={28}
            height={28}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient icon if avatar not found
              e.target.style.display = "none";
            }}
          />
        </div>
      )}
      {isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center shadow-sm overflow-hidden mb-0.5 text-xs font-bold text-gray-500 dark:text-gray-400">
          Me
        </div>
      )}

      <div
        className={`flex flex-col max-w-[78%] ${isUser ? "items-end" : "items-start"
          }`}
      >
        <div
          className={`relative px-3.5 py-2 text-[14px] leading-relaxed break-words smooth-transition ${isUser
            ? "bg-indigo-600 text-white rounded-[1.25rem] rounded-br-[4px] shadow-sm"
            : "bg-white dark:bg-slate-800/90 text-gray-700 dark:text-gray-200 rounded-[1.25rem] rounded-bl-[4px] border border-gray-100 dark:border-slate-700/80 shadow-sm"
            }`}
        >
          <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : "dark:prose-invert"}`}>
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => <a className={`${isUser ? "text-white" : "text-indigo-500"} underline underline-offset-2 font-medium`} target="_blank" rel="noopener noreferrer" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        {message.timestamp && (
          <div className={`flex items-center gap-1 mt-1 mx-1 select-none transition-opacity duration-200 ${isLatest ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {message.timestamp}
            </span>
            {isUser && (
              <span className="text-[10px] text-indigo-400/80 dark:text-indigo-400/70 ml-0.5">
                ✓✓
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

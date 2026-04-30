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
      className={`flex items-end gap-2.5 opacity-0 ${isUser ? "flex-row-reverse" : "flex-row"
        }`}
    >
      {/* Avatar — only for assistant */}
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm mb-1 overflow-hidden">
          <Image
            src="/lumi-avatar.png"
            alt="Lumi"
            width={32}
            height={32}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient icon if avatar not found
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      <div
        className={`flex flex-col max-w-[78%] ${isUser ? "items-end" : "items-start"
          }`}
      >
        <div
          className={`relative px-4 py-2.5 text-sm leading-relaxed break-words smooth-transition ${isUser
            ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-indigo-600/20"
            : "bg-white dark:bg-slate-800/90 text-gray-700 dark:text-gray-200 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-slate-700/80 shadow-sm"
            } ${isLatest ? "message-bubble--latest ring-1 ring-indigo-300/70 dark:ring-indigo-400/50" : ""}`}
        >
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              a: ({ node, ...props }) => <a className="underline underline-offset-2 decoration-indigo-400 font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
              ul: ({ node, ...props }) => <ul className="my-2 ml-4 list-disc space-y-1" {...props} />,
              ol: ({ node, ...props }) => <ol className="my-2 ml-4 list-decimal space-y-1" {...props} />,
              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
              em: ({ node, ...props }) => <em className="italic" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.timestamp && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 mx-1.5 select-none">
            {message.timestamp}
          </span>
        )}
      </div>
    </div>
  );
}

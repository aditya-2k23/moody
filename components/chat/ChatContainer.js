"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

/**
 * ChatContainer — Root chat component managing fullscreen state,
 * message history, and API communication with Gemini via /api/chat
 */
export default function ChatContainer({
  chatId,
  userId,
  journalText,
  reflectionQuestion,
  onReflectionConsumed,
  onFullscreenChange,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // ─── Fullscreen Toggle ──────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      onFullscreenChange?.(next);
      return next;
    });
  }, [onFullscreenChange]);

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        onFullscreenChange?.(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, onFullscreenChange]);

  // Lock body scroll when fullscreen (only in standalone mode, not modal)
  useEffect(() => {
    if (isFullscreen && !onFullscreenChange) {
      document.body.style.overflow = "hidden";
    } else if (!onFullscreenChange) {
      document.body.style.overflow = "";
    }
    return () => {
      if (!onFullscreenChange) {
        document.body.style.overflow = "";
      }
    };
  }, [isFullscreen, onFullscreenChange]);

  // ─── GSAP fullscreen transition ─────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let gsapModule;
    (async () => {
      gsapModule = (await import("gsap")).default;
      if (isFullscreen) {
        gsapModule.fromTo(
          el,
          { scale: 0.95, opacity: 0.8 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      }
    })();
  }, [isFullscreen]);

  // ─── Send Message ───────────────────────────────────────────────
  const sendMessage = useCallback(
    async (messageText) => {
      if (!messageText.trim() || !userId) return;

      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: messageText,
        timestamp: now,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            userId,
            message: messageText,
            journalText,
          }),
        });

        if (!res.ok) throw new Error("Failed to send message");

        const data = await res.json();
        const replyTime = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply,
            timestamp: replyTime,
          },
        ]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to get a response from Lumi");
      } finally {
        setIsTyping(false);
      }
    },
    [chatId, userId]
  );

  // ─── Reflection Question Integration ────────────────────────────
  useEffect(() => {
    if (reflectionQuestion && !isTyping) {
      setMessages((prev) => {
        // Prevent duplicate reflection questions from being injected twice in a row
        const isDuplicate = prev.length > 0 && prev[prev.length - 1].content === reflectionQuestion;

        if (!isDuplicate) {
          const now = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: reflectionQuestion,
              timestamp: now,
            },
          ];
        }
        return prev;
      });

      // Auto-focus chat input right after clicking the follow-up wrapper
      setTimeout(() => {
        if (containerRef.current) {
          const textarea = containerRef.current.querySelector("textarea");
          if (textarea) {
            textarea.focus({ preventScroll: true });
          }
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflectionQuestion]);

  // ─── Clear Chat ─────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    setMessages([]);
    setInput("");
    toast.success("Chat cleared");
  }, []);

  // ─── Container Classes ──────────────────────────────────────────
  // When onFullscreenChange is set, we're inside a modal — fill parent via flex
  // Otherwise, use a fixed overlay for standalone fullscreen
  const containerClasses = isFullscreen
    ? onFullscreenChange
      ? "flex-1 flex flex-col bg-gradient-to-br from-purple-50/95 to-indigo-50/95 dark:from-[#0a0f1e] dark:to-[#0f172a] rounded-2xl overflow-hidden"
      : "fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-purple-50/95 to-indigo-50/95 dark:from-[#0a0f1e] dark:to-[#0f172a] backdrop-blur-sm"
    : "flex flex-col mt-4 bg-white/90 dark:bg-[#0f172a]/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/60 shadow-xl overflow-hidden relative z-10 backdrop-blur-sm h-[550px] w-full transform transition-all duration-300";

  return (
    <div ref={containerRef} className={containerClasses} onScroll={(e) => e.stopPropagation()}>
      <ChatHeader
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onClearChat={clearChat}
        hasMessages={messages.length > 0}
      />

      <MessageList
        messages={messages}
        isTyping={isTyping}
        isFullscreen={isFullscreen}
      />

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        isTyping={isTyping}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}

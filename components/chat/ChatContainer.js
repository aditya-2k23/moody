"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { X } from "lucide-react";

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
  isDemo = false,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [historySessions, setHistorySessions] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [demoCount, setDemoCount] = useState(0);
  const containerRef = useRef(null);
  const chatContentRef = useRef(null);
  const historyModalBackdropRef = useRef(null);
  const historyModalContentRef = useRef(null);

  // GSAP for Modal Open
  useEffect(() => {
    if (showHistoryModal) {
      import("gsap").then(({ default: gsap }) => {
        if (historyModalBackdropRef.current && historyModalContentRef.current) {
          gsap.fromTo(
            historyModalBackdropRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: "power2.out" }
          );
          gsap.fromTo(
            historyModalContentRef.current,
            { opacity: 0, scale: 0.9, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.2)", delay: 0.1 }
          );
        }
      });
    }
  }, [showHistoryModal]);

  const closeHistoryModal = useCallback(() => {
    import("gsap").then(({ default: gsap }) => {
      if (historyModalBackdropRef.current && historyModalContentRef.current) {
        gsap.to(historyModalContentRef.current, {
          opacity: 0,
          scale: 0.95,
          y: -10,
          duration: 0.2,
          ease: "power2.in"
        });
        gsap.to(historyModalBackdropRef.current, {
          opacity: 0,
          duration: 0.2,
          delay: 0.1,
          onComplete: () => setShowHistoryModal(false)
        });
      } else {
        setShowHistoryModal(false);
      }
    });
  }, []);

  // Load demo count on mount
  useEffect(() => {
    if (isDemo) {
      try {
        const saved = localStorage.getItem("lumi-demo-count");
        if (saved) {
          setDemoCount(parseInt(saved, 10));
        }
      } catch (e) {
        console.error("Failed to parse demo count", e);
      }
    }
  }, [isDemo]);

  const isDemoLimitReached = isDemo && demoCount >= 3;

  const getBubbleDelayMs = useCallback((bubbleText) => {
    const normalized = (bubbleText || "").trim();
    if (!normalized) return 320;

    const wordCount = normalized.split(/\s+/).length;
    const charCount = normalized.length;
    const punctuationPause = /[?!.]$/.test(normalized) ? 120 : 0;

    const delay = 220 + (wordCount * 90) + Math.floor(charCount * 8) + punctuationPause;
    return Math.min(1800, Math.max(260, delay));
  }, []);

  // ─── Fetch Today's History ───────────────────────────────────────
  useEffect(() => {
    if (!userId || isDemo) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/chat/history?chatId=${chatId}&userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.historySessions) {
            setHistorySessions(data.historySessions);
          }
        }
      } catch (error) {
        console.error("Failed to fetch today's chat history", error);
      }
    };

    fetchHistory();
  }, [chatId, userId, isDemo, messages.length]); // Refresh if messages are sent/cleared

  // ─── Fullscreen Toggle ──────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    import("gsap").then(({ default: gsap }) => {
      if (containerRef.current) {
        // A fun "squish" effect
        gsap.timeline()
          .to(containerRef.current, {
            scaleX: 1.05,
            scaleY: 0.95,
            duration: 0.3,
            ease: "power1.inOut"
          })
          .to(containerRef.current, {
            scaleX: 1,
            scaleY: 1,
            duration: 0.8,
            ease: "elastic.out(1, 0.4)",
            onComplete: () => {
              gsap.set(containerRef.current, { clearProps: "transform" });
            }
          });
      }
    });

    setIsFullscreen((prev) => {
      const next = !prev;
      onFullscreenChange?.(next);
      return next;
    });
  }, [onFullscreenChange]);

  // ESC key to exit fullscreen or modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showHistoryModal) {
          closeHistoryModal();
        } else if (isFullscreen) {
          toggleFullscreen();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, showHistoryModal, closeHistoryModal, toggleFullscreen]);

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
      if (!messageText.trim() || (!userId && !isDemo)) return;
      if (isDemo && demoCount >= 3) return;

      if (isDemo) {
        setDemoCount((prev) => {
          const nextCount = prev + 1;
          localStorage.setItem("lumi-demo-count", nextCount.toString());
          return nextCount;
        });
      }

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
            chatId: isDemo ? "demo-chat" : chatId,
            userId: isDemo ? "demo-user" : userId,
            message: messageText,
            journalText,
            sessionId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send message");
        }

        const data = await res.json();
        const replyBubbles = Array.isArray(data.reply)
          ? data.reply
            .map((bubble) => (typeof bubble === "string" ? bubble.trim() : ""))
            .filter(Boolean)
          : [typeof data.reply === "string" ? data.reply.trim() : ""];

        const normalizedBubbles = replyBubbles.length > 0
          ? replyBubbles
          : ["I am here with you."];

        for (let i = 0; i < normalizedBubbles.length; i++) {
          const bubble = normalizedBubbles[i];
          const replyTime = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: bubble,
              timestamp: replyTime,
            },
          ]);

          if (i < normalizedBubbles.length - 1) {
            const bubbleDelay = getBubbleDelayMs(bubble);
            await new Promise((resolve) => setTimeout(resolve, bubbleDelay));
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Lumi is busy! Try again later.");
      } finally {
        setIsTyping(false);
      }
    },
    [chatId, userId, isDemo, demoCount, journalText, sessionId, getBubbleDelayMs]
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
  const clearChat = useCallback(async () => {
    setMessages([]);
    setInput("");

    if (isDemo) {
      return;
    }

    try {
      const res = await fetch("/api/chat/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          userId,
          sessionId,
        }),
      });

      if (!res.ok) throw new Error("Failed to clear chat cache");
      toast.success("Chat cleared");
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear chat memory completely");
    }
  }, [chatId, userId, isDemo, sessionId]);

  // ─── Handle New Chat Button ─────────────────────────────────────
  const startNewChat = useCallback(() => {
    import("gsap").then(({ default: gsap }) => {
      if (chatContentRef.current) {
        gsap.fromTo(chatContentRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        );
      }
    });
    setMessages([]);
    setInput("");
    setSessionId(crypto.randomUUID());
  }, []);

  // ─── Container Classes ──────────────────────────────────────────
  // When onFullscreenChange is set, we're inside a modal — fill parent via flex
  // Otherwise, use a fixed overlay for standalone fullscreen
  const containerClasses = isFullscreen
    ? onFullscreenChange
      ? `flex-1 flex flex-col bg-gradient-to-b from-slate-50 to-indigo-50 dark:from-[#0b1021] dark:to-[#161c31] rounded-[2rem] overflow-hidden`
      : `fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-slate-50 to-indigo-50 dark:from-[#0b1021] dark:to-[#161c31] overflow-hidden rounded-3xl`
    : `flex flex-col mt-4 bg-white/80 dark:bg-gradient-to-b dark:from-[#0b1021] dark:to-[#111526] rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-2xl overflow-hidden relative z-10 backdrop-blur-xl h-[550px] w-full transition-colors duration-300`;

  return (
    <div ref={containerRef} className={containerClasses} onScroll={(e) => e.stopPropagation()}>
      {isDemo ? (
        <div className="flex flex-col items-center justify-center p-3 border-b border-gray-100/80 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0 mb-2 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-1 text-sm leading-tight">
            Lumi is
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              ONLINE</span>
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Sign in to unlock full memory, daily history, and more
          </p>
        </div>
      ) : (
        <ChatHeader
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onClearChat={clearChat}
          hasMessages={messages.length > 0}
          onShowHistory={() => setShowHistoryModal(true)}
          hasHistory={historySessions.length > 0}
          onNewChat={startNewChat}
        />
      )}

      {/* History Modal Overlay */}
      {showHistoryModal && (
        <div
          ref={historyModalBackdropRef}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl p-4 opacity-0"
          onClick={closeHistoryModal}
        >
          <div
            ref={historyModalContentRef}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 max-h-[80vh] flex flex-col opacity-0 scale-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-semibold text-lg dark:text-white">Chat History</h3>
              <button
                onClick={closeHistoryModal}
                className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 space-y-2 custom-scrollbar">
              {historySessions.length > 0 ? (
                historySessions.map((session) => (
                  <button
                    key={session.sessionId}
                    onClick={() => {
                      setSessionId(session.sessionId);
                      setMessages(session.messages);
                      closeHistoryModal();
                    }}
                    className="w-full text-left p-3 sm:p-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800/80 transition-all duration-200 border border-gray-100 dark:border-slate-700/60 shadow-sm hover:shadow group focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-indigo-600 dark:text-indigo-400">
                        {session.messages.length} messages
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {session.messages[0]?.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic group-hover:text-gray-900 dark:group-hover:text-gray-100 line-clamp-2">
                      &quot;{session.preview}&quot;
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No Previous Chats Today</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={chatContentRef} className="flex flex-col flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isTyping={isTyping}
          isFullscreen={isFullscreen}
        />

        {isDemoLimitReached ? (
          <div className="p-4 border-t border-gray-200/80 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur text-center w-full">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              You&apos;ve reached the end of the demo! Sign in to continue chatting with Lumi.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-medium transition-colors"
            >
              Create Free Account
            </button>
          </div>
        ) : (
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={sendMessage}
            isTyping={isTyping}
            isFullscreen={isFullscreen}
          />
        )}
      </div>
    </div>
  );
}

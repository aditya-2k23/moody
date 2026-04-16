"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import toast from "react-hot-toast";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { X } from "lucide-react";
import { APP_RELEASE_TAG } from "@/lib/release";
import { DEMO_CHAT_LIMIT } from "@/utils";

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
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [demoCount, setDemoCount] = useState(0);
  const router = useRouter();
  const containerRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatContentRef = useRef(null);
  const historyModalBackdropRef = useRef(null);
  const historyModalContentRef = useRef(null);
  const historyTriggerRef = useRef(null);
  const historyTitleId = "chat-history-modal-title";
  const sessionRequestIdRef = useRef(0);
  const demoLimitToastShownRef = useRef(false);

  const demoCountStorageKey = useMemo(() => {
    if (!isDemo) return null;
    const scopedChatId = chatId || "demo-chat";
    return `lumi-demo-count:${scopedChatId}:${sessionId}`;
  }, [isDemo, chatId, sessionId]);

  const requestHistoryRefresh = useCallback(() => {
    setHistoryRefreshKey((prev) => prev + 1);
  }, []);

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
          onComplete: () => {
            setShowHistoryModal(false);
            historyTriggerRef.current?.focus();
          }
        });
      } else {
        setShowHistoryModal(false);
        historyTriggerRef.current?.focus();
      }
    });
  }, []);

  const openHistoryModal = useCallback((event) => {
    historyTriggerRef.current = event?.currentTarget || document.activeElement;
    requestHistoryRefresh();
    setShowHistoryModal(true);
  }, [requestHistoryRefresh]);

  useEffect(() => {
    if (!showHistoryModal) return;

    const focusFirstInteractive = () => {
      const root = historyModalContentRef.current;
      if (!root) return;

      const firstFocusable = root.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable && typeof firstFocusable.focus === "function") {
        firstFocusable.focus();
      }
    };

    const timer = setTimeout(focusFirstInteractive, 50);

    const handleTrap = (e) => {
      if (e.key !== "Tab") return;

      const root = historyModalContentRef.current;
      if (!root) return;

      const focusable = Array.from(
        root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTrap);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleTrap);
    };
  }, [showHistoryModal]);

  useEffect(() => {
    if (!showHistoryModal) return;

    const focusFirstInteractive = () => {
      const root = historyModalContentRef.current;
      if (!root) return;

      const firstFocusable = root.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable && typeof firstFocusable.focus === "function") {
        firstFocusable.focus();
      }
    };

    const timer = setTimeout(focusFirstInteractive, 50);

    const handleTrap = (e) => {
      if (e.key !== "Tab") return;

      const root = historyModalContentRef.current;
      if (!root) return;

      const focusable = Array.from(
        root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTrap);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleTrap);
    };
  }, [showHistoryModal]);

  // Load demo count per demo session key
  useEffect(() => {
    if (!isDemo || !demoCountStorageKey) return;

    try {
      const saved = localStorage.getItem(demoCountStorageKey);
      if (!saved) {
        setDemoCount(0);
        return;
      }

      const parsedCount = Number.parseInt(saved, 10);
      if (Number.isInteger(parsedCount) && parsedCount >= 0) {
        setDemoCount(parsedCount);
      } else {
        setDemoCount(0);
        localStorage.setItem(demoCountStorageKey, "0");
      }
    } catch (e) {
      console.error("Failed to parse demo count", e);
      setDemoCount(0);
    }
  }, [isDemo, demoCountStorageKey]);

  useEffect(() => {
    if (!isDemo) return;

    // Reset per-session UI lock state immediately when session scope changes.
    demoLimitToastShownRef.current = false;
  }, [isDemo, chatId, sessionId]);

  const isDemoLimitReached = isDemo && demoCount >= DEMO_CHAT_LIMIT;

  useEffect(() => {
    if (isDemoLimitReached && !demoLimitToastShownRef.current) {
      toast.error("You have reached the demo chat limit. Sign in to continue chatting with Lumi.");
      demoLimitToastShownRef.current = true;
      return;
    }

    if (!isDemoLimitReached) {
      demoLimitToastShownRef.current = false;
    }
  }, [isDemoLimitReached]);

  const getBubbleDelayMs = useCallback((bubbleText) => {
    const normalized = (bubbleText || "").trim();
    if (!normalized) return 320;

    const wordCount = normalized.split(/\s+/).length;
    const charCount = normalized.length;
    const punctuationPause = /[?!.]$/.test(normalized) ? 120 : 0;

    const delay = 220 + (wordCount * 90) + Math.floor(charCount * 8) + punctuationPause;
    return Math.min(1800, Math.max(260, delay));
  }, []);

  const getFriendlyChatError = useCallback((error, fallbackMessage) => {
    const status = Number(error?.status);
    const code = typeof error?.code === "string" ? error.code : "";
    const retryAfter = Number(error?.retryAfter);

    if (status === 401 || status === 403 || code === "UNAUTHORIZED" || code === "INVALID_TOKEN") {
      return "Your session expired. Please refresh and try again.";
    }

    if (status === 413 || code === "MESSAGE_TOO_LARGE") {
      return "Message too long. Please keep it shorter and try again.";
    }

    if (status === 429 || code === "RATE_LIMITED" || code === "AI_QUOTA_EXCEEDED") {
      if (Number.isFinite(retryAfter) && retryAfter > 0) {
        return `Lumi is busy right now. Please try again in about ${Math.ceil(retryAfter)}s.`;
      }
      return "Lumi is busy right now. Please try again shortly.";
    }

    if (status === 503 || code === "AI_CAPACITY_HIGH" || code === "AI_TEMPORARILY_UNAVAILABLE") {
      return "Lumi is experiencing high demand. Please try again in a moment.";
    }

    return fallbackMessage;
  }, []);

  const formatTimestampIST = useCallback((value) => {
    if (value === null || value === undefined || value === "") return "";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return typeof value === "string" ? value : "";
    }

    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }, []);

  // ─── Fetch Today's History ───────────────────────────────────────
  useEffect(() => {
    if (!userId || isDemo) return;

    let isCancelled = false;

    const fetchHistory = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const idToken = await currentUser.getIdToken();
        const res = await fetch(`/api/chat/history?chatId=${encodeURIComponent(chatId)}&userId=${encodeURIComponent(userId)}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.historySessions) {
            const normalizedSessions = data.historySessions.map((session) => ({
              ...session,
              messages: Array.isArray(session.messages)
                ? session.messages.map((message) => ({
                  ...message,
                  timestamp: formatTimestampIST(message.timestamp),
                }))
                : [],
            }));

            setHistorySessions(normalizedSessions);
          }
        }
      } catch (error) {
        console.error("Failed to fetch today's chat history", error);
      }
    };

    fetchHistory();

    return () => {
      isCancelled = true;
    };
  }, [chatId, userId, isDemo, historyRefreshKey, formatTimestampIST]);

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
      if (isDemo && demoCount >= DEMO_CHAT_LIMIT) return;

      const capturedToken = ++sessionRequestIdRef.current;


      const now = formatTimestampIST(Date.now());

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: messageText,
        timestamp: now,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const currentUser = auth.currentUser;
        const idToken = !isDemo && currentUser ? await currentUser.getIdToken() : null;

        const headers = {
          "Content-Type": "application/json",
        };

        if (idToken && !isDemo) {
          headers.Authorization = `Bearer ${idToken}`;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            chatId: isDemo ? "demo-chat" : chatId,
            ...(isDemo ? { userId: "demo-user" } : {}),
            message: messageText,
            journalText,
            sessionId,
          }),
        });

        if (capturedToken !== sessionRequestIdRef.current) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const apiError = data.error || data.message || data.retry || "Failed to send message";
          const apiCode = data.code || null;

          if (isDemo && res.status === 403 && apiCode === "DEMO_LIMIT_REACHED") {
            setDemoCount(DEMO_CHAT_LIMIT);
            if (demoCountStorageKey) {
              localStorage.setItem(demoCountStorageKey, String(DEMO_CHAT_LIMIT));
            }
          }

          throw new Error(apiError);
        }

        if (isDemo && capturedToken === sessionRequestIdRef.current) {
          setDemoCount((prev) => {
            const nextCount = prev + 1;
            if (demoCountStorageKey) {
              localStorage.setItem(demoCountStorageKey, nextCount.toString());
            }
            return nextCount;
          });
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
          const replyTime = formatTimestampIST(Date.now());

          const bubbleDelay = getBubbleDelayMs(bubble);
          // Keep first bubble responsive, but still scale by content length.
          const appearanceDelay = i === 0
            ? Math.min(550, Math.max(120, Math.floor(bubbleDelay * 0.45)))
            : bubbleDelay;

          await new Promise((resolve) => setTimeout(resolve, appearanceDelay));
          if (capturedToken !== sessionRequestIdRef.current) return;

          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: bubble,
              timestamp: replyTime,
            },
          ]);
        }
      } catch (error) {
        if (capturedToken !== sessionRequestIdRef.current) return;
        console.error(error);
        toast.error(getFriendlyChatError(error, "Lumi is busy! Try again later."));
      } finally {
        if (capturedToken === sessionRequestIdRef.current) {
          setIsTyping(false);
        }
      }
    },
    [chatId, userId, isDemo, demoCount, demoCountStorageKey, journalText, sessionId, getBubbleDelayMs, formatTimestampIST, getFriendlyChatError]
  );

  // ─── Reflection Question Integration ────────────────────────────
  useEffect(() => {
    if (!reflectionQuestion || isTyping) return;

    // Prevent duplicate reflection questions from being injected twice in a row
    const isDuplicate =
      messages.length > 0 && messages[messages.length - 1].content === reflectionQuestion;
    if (isDuplicate) return;

    const now = formatTimestampIST(Date.now());
    const capturedToken = ++sessionRequestIdRef.current;
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reflectionQuestion,
        timestamp: now,
      },
    ]);

    // Persist to backend memory so subsequent turns have this context
    const persistReflection = async () => {
      try {
        const currentUser = auth.currentUser;
        const idToken = !isDemo && currentUser ? await currentUser.getIdToken() : null;

        await fetch("/api/chat/persist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(!isDemo && idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            chatId: isDemo ? "demo-chat" : chatId,
            sessionId,
            role: "assistant",
            content: reflectionQuestion,
          }),
        });
      } catch (e) {
        console.warn("Failed to persist reflection turn to memory", e);
      }
    };

    if (!isDemo) {
      persistReflection();
    }

    onReflectionConsumed?.();

    // Auto-focus chat input right after clicking the follow-up wrapper.
    const focusTimer = setTimeout(() => {
      if (capturedToken === sessionRequestIdRef.current) {
        chatInputRef.current?.focus();
      }
    }, 100);

    return () => clearTimeout(focusTimer);
  }, [reflectionQuestion, isTyping, messages, onReflectionConsumed, formatTimestampIST, chatId, isDemo, sessionId, sessionRequestIdRef]);

  // ─── Clear Chat ─────────────────────────────────────────────────
  const clearChat = useCallback(async () => {
    setMessages([]);
    setInput("");
    sessionRequestIdRef.current++;

    if (isDemo) {
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/chat/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          chatId,
          sessionId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const apiError = new Error(data.error || "Failed to clear chat cache");
        apiError.status = res.status;
        apiError.code = data.code;
        apiError.retryAfter = data.retryAfter;
        throw apiError;
      }
      requestHistoryRefresh();
      toast.success("Chat cleared");
    } catch (error) {
      console.error(error);
      toast.error(getFriendlyChatError(error, "Failed to clear chat memory completely"));
    }
  }, [chatId, isDemo, sessionId, requestHistoryRefresh, getFriendlyChatError]);

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
    sessionRequestIdRef.current++;
    requestHistoryRefresh();
  }, [requestHistoryRefresh]);

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
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 uppercase">
              {APP_RELEASE_TAG}</span>
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
          onShowHistory={openHistoryModal}
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
            role="dialog"
            aria-modal="true"
            aria-labelledby={historyTitleId}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 max-h-[80vh] flex flex-col opacity-0 scale-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 id={historyTitleId} className="font-semibold text-lg dark:text-white">Today&apos;s Chat History</h3>
              <button
                onClick={closeHistoryModal}
                className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                title="Close"
                aria-label="Close chat history dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 max-h-[22rem] space-y-2 custom-scrollbar">
              {historySessions.length > 0 ? (
                historySessions.map((session) => (
                  <button
                    key={session.sessionId}
                    onClick={() => {
                      setSessionId(session.sessionId);
                      setMessages(session.messages);
                      sessionRequestIdRef.current++;
                      closeHistoryModal();
                    }}
                    className="w-full min-h-[84px] text-left p-3 sm:p-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800/80 transition-all duration-200 border border-gray-100 dark:border-slate-700/60 shadow-sm hover:shadow group focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-medium transition-colors"
            >
              Create Free Account
            </button>
          </div>
        ) : (
          <ChatInput
            ref={chatInputRef}
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

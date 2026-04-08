"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, MoreHorizontal, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function AIChatBox({ chatId, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = () => {
    if (messages.length > 0 || isTyping) {
      // explicitly scroll the container to prevent page jump
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !userId) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message with timestamp
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: "user", content: userMessage, time: now }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          userId,
          message: userMessage,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, time: replyTime }]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to get response");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col mt-4 bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl overflow-hidden relative z-10" onScroll={(e) => e.stopPropagation()}>
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Lumi</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto max-h-[400px] min-h-[250px] p-5 space-y-5 bg-slate-50/50 dark:bg-[#0b1120] scroll-smooth"
        style={{ scrollbarGutter: "stable" }}
        onScroll={(e) => e.stopPropagation()}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 mt-8">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
              <Bot size={28} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              I&apos;m Lumi. I&apos;m here to listen and help you reflect.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[80%]">
              Feel free to ask questions about your journal entry or share more about your day.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
          >
            {/* Avatar only for assistant */}
            {msg.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm mb-1">
                <Bot size={14} />
              </div>
            )}

            <div className={`flex flex-col max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`relative px-4 py-2.5 text-sm shadow-sm ${msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                  : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-slate-700"
                  }`}
              >
                {msg.content}
              </div>
              {msg.time && (
                <span className="text-[10px] text-gray-400 mt-1 mx-1">
                  {msg.time}
                </span>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-2 flex-row">
            <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm mb-1">
              <Bot size={14} />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="relative flex-1 bg-gray-100 dark:bg-slate-800 rounded-2xl border border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all overflow-hidden flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Lumi..."
              className="w-full bg-transparent px-4 py-3.5 text-sm focus:outline-none dark:text-white placeholder-gray-400"
              disabled={isTyping}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white transition-all flex items-center justify-center shrink-0 shadow-md disabled:shadow-none hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

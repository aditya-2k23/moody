"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import toast from "react-hot-toast";

export default function AIChatBox({ chatId, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !userId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
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
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to get response");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col mt-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-indigo-100 dark:border-slate-700/50 overflow-hidden shadow-inner">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto max-h-[300px] min-h-[150px] p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10">
            Say something to start the conversation...
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === "user" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300" : "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300"
            }`}>
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`p-3 rounded-2xl text-sm ${
              msg.role === "user" 
                ? "bg-indigo-600 text-white rounded-tr-sm" 
                : "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-200 rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-2 max-w-[85%] mr-auto">
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
               <Bot size={16} />
            </div>
            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-800 rounded-tl-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-800/80 border-t border-indigo-50 dark:border-slate-700/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow up question..."
          className="flex-1 bg-transparent border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow dark:text-white"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center shrink-0"
        >
          {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}

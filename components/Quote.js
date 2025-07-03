"use client";
import { useState, useEffect } from "react";
import { getQuoteOfTheDay } from "@/utils/quotes";

export default function Quote() {
  const [quote, setQuote] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const todayQuote = getQuoteOfTheDay();
    setQuote(todayQuote);

    setTimeout(() => setFadeIn(true), 100);

    const checkNewDay = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);

      const timeToMidnight = midnight.getTime() - now.getTime();

      setTimeout(() => {
        const newQuote = getQuoteOfTheDay();
        setQuote(newQuote);

        setInterval(() => {
          const updatedQuote = getQuoteOfTheDay();
          setQuote(updatedQuote);
        }, 24 * 60 * 60 * 1000);
      }, timeToMidnight);
    };

    checkNewDay();
  }, []);

  if (!quote) return null;

  return (
    <div className={`w-full max-w-4xl mx-auto transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 sm:p-10 md:p-12 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>

        <div className="flex items-center justify-center gap-1 mb-6">
          <span className="text-3xl animate-pulse">✨</span>
          <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-purple-600">
            Quote of the Day
          </h3>
        </div>

        <div className="relative z-10 text-center">
          <blockquote className="flex items-start justify-center gap-2 text-base sm:text-lg md:text-xl font-medium text-gray-800 leading-relaxed mb-4 px-4 italic">
            <span className="text-4xl text-purple-400/80 font-serif leading-none -mt-2 flex-shrink-0">&quot;</span>
            <span>{quote.text}</span>
            <span className="text-4xl text-purple-400/80 font-serif leading-none -mt-2 flex-shrink-0 self-end">&quot;</span>
          </blockquote>

          {quote.author && (
            <cite className="block mt-4 text-sm sm:text-base text-gray-600 font-medium not-italic">
              — {quote.author}
            </cite>
          )}
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

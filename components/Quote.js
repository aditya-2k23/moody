"use client";
import { useState, useEffect } from "react";
import { getQuoteOfTheDay, calculateReadingTime } from "@/utils/quotes";

export default function Quote() {
  const [quotes, setQuotes] = useState([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const [quoteTransition, setQuoteTransition] = useState(false);

  useEffect(() => {
    const todayQuotes = getQuoteOfTheDay();
    setQuotes(todayQuotes);
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  useEffect(() => {
    if (quotes.length === 0) return;

    const rotateQuotes = () => {
      const currentQuote = quotes[currentQuoteIndex];
      const readingTime = calculateReadingTime(currentQuote.text);

      const timer = setTimeout(() => {
        // Start transition animation
        setQuoteTransition(true);

        // After transition, change quote and reset animation
        setTimeout(() => {
          setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
          setQuoteTransition(false);
        }, 300); // 300ms transition duration
      }, readingTime);

      return timer;
    };

    const timer = rotateQuotes();
    return () => clearTimeout(timer);
  }, [quotes, currentQuoteIndex]);

  if (!quotes.length) return null;

  const currentQuote = quotes[currentQuoteIndex];

  return (
    <div className={`w-full max-w-4xl mx-auto transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 sm:p-10 md:p-12 shadow-lg relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 dark:from-yellow-300/10 dark:to-orange-300/5 rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-5 w-64 h-40 bg-gradient-to-tr from-purple-400/30 to-indigo-400/20 dark:from-purple-400/20 dark:to-indigo-400/10 rounded-full blur-3xl"></div>

        <div className="flex items-center justify-center gap-1 mb-6">
          <span className="text-3xl animate-pulse">✨</span>
          <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-purple-600 dark:text-purple-300">
            Quote of the Day
          </h3>
        </div>

        <div className="relative z-10 text-center">
          <div className={`transition-all duration-300 ${quoteTransition ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
            <blockquote className="flex items-start justify-center gap-2 text-base sm:text-lg md:text-xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed mb-4 px-4 italic">
              <span className="text-4xl text-purple-400/90 dark:text-purple-300/80 font-serif leading-none -mt-2 flex-shrink-0">&quot;</span>
              <span className="text-black dark:text-gray-100">{currentQuote.text}</span>
              <span className="text-4xl text-purple-400/90 dark:text-purple-300/80 font-serif leading-none -mt-2 flex-shrink-0 self-end">&quot;</span>
            </blockquote>

            {currentQuote.author && (
              <cite className="block mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium not-italic">
                — {currentQuote.author}
              </cite>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {quotes.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full animate-bounce transition-all duration-300
                ${index === currentQuoteIndex
                  ? 'bg-purple-400 dark:bg-purple-300 scale-110'
                  : 'border-2 border-purple-500 dark:border-purple-400 bg-transparent hover:bg-purple-200 dark:hover:bg-purple-400'
                } ${index < currentQuoteIndex
                  ? 'opacity-60'
                  : index === currentQuoteIndex
                    ? 'opacity-100'
                    : 'opacity-40'
                }`}
              style={{
                animationDelay: index === currentQuoteIndex ? '0s' : `${index * 0.4}s`,
                animationDuration: index === currentQuoteIndex ? '1s' : '2s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

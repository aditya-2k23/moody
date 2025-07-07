"use client"
import { useEffect, useState } from 'react';

export default function AnimatedDivider() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-20 flex items-center justify-center overflow-hidden">
      {/* Main animated line */}
      <div
        className={`absolute h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent transition-all duration-1000 ease-out ${isVisible ? 'w-full opacity-100' : 'w-0 opacity-0'
          }`}
      />

      {/* Glowing orb in the center */}
      <div
        className={`absolute transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`}
      >
        <div className="relative">
          <div className="relative w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-spin-slow">
            <div className="absolute inset-1 bg-white dark:bg-gray-900 rounded-full" />
            <div className="absolute inset-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className={`absolute w-full h-full transition-opacity duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute left-1/4 top-1/2 w-1 h-1 bg-purple-400 rounded-full animate-float-up" />
        <div className="absolute left-1/3 top-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full animate-float-up animation-delay-200" />
        <div className="absolute left-2/3 top-1/2 w-1 h-1 bg-purple-400 rounded-full animate-float-up animation-delay-400" />
        <div className="absolute left-3/4 top-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full animate-float-up animation-delay-600" />
      </div>
    </div>
  );
}

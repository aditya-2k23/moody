'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useCursor } from '@/hooks/useCursor';
import '@/styles/cursor.css';

export function CustomCursor() {
  const { theme } = useTheme();
  const {
    innerRef,
    outerRef,
    isVisible,
    isIdle,
    shouldEnable,
  } = useCursor();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('[v0] CustomCursor mounted. shouldEnable:', shouldEnable, 'theme:', theme);
  }, [shouldEnable, theme]);

  if (!mounted) {
    console.log('[v0] CustomCursor not mounted yet');
    return null;
  }

  if (!shouldEnable) {
    console.log('[v0] CustomCursor disabled - shouldEnable is false');
    return null;
  }

  const isDark = theme === 'dark';
  const cursorTheme = isDark ? 'dark' : 'light';

  console.log('[v0] Rendering CustomCursor with theme:', cursorTheme);

  return (
    <>
      {/* Outer cursor - glow/blob effect */}
      <div
        ref={outerRef}
        className={`cursor-outer cursor-outer--${cursorTheme} ${
          isIdle ? 'cursor-idle' : ''
        } ${isVisible ? 'cursor-visible' : ''}`}
        aria-hidden="true"
      />

      {/* Inner cursor - small dot */}
      <div
        ref={innerRef}
        className={`cursor-inner cursor-inner--${cursorTheme} ${
          isVisible ? 'cursor-visible' : ''
        }`}
        aria-hidden="true"
      />
    </>
  );
}

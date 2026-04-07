'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

export function useCursor() {
  const innerRef = useRef(null);
  const outerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldEnable, setShouldEnable] = useState(false);

  const mousePos = useRef({ x: 0, y: 0 });
  const innerPos = useRef({ x: 0, y: 0 });
  const outerPos = useRef({ x: 0, y: 0 });

  // Check if cursor should be enabled (desktop, no touch)
  useEffect(() => {
    const checkCursorSupport = () => {
      const isTouchDevice = () => {
        return (
          (typeof window !== 'undefined' &&
            ('ontouchstart' in window ||
              navigator.maxTouchPoints > 0 ||
              navigator.msMaxTouchPoints > 0)) ||
          false
        );
      };

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;

      setShouldEnable(isDesktop && !isTouchDevice() && !prefersReducedMotion);
    };

    checkCursorSupport();
    window.addEventListener('resize', checkCursorSupport);
    return () => window.removeEventListener('resize', checkCursorSupport);
  }, []);

  // Initialize cursor and hide default cursor
  useEffect(() => {
    if (!shouldEnable) return;

    document.documentElement.style.cursor = 'none';

    return () => {
      document.documentElement.style.cursor = 'auto';
    };
  }, [shouldEnable]);

  // Pointer move handler with smooth interpolation
  const handlePointerMove = useCallback((e) => {
    if (!shouldEnable || !innerRef.current || !outerRef.current) return;

    const { clientX, clientY } = e;
    mousePos.current = { x: clientX, y: clientY };
    setIsVisible(true);

    // Immediate position for inner cursor
    gsap.to(innerPos.current, {
      x: clientX,
      y: clientY,
      duration: 0,
      overwrite: 'auto',
    });

    // Smooth interpolation for outer cursor (trailing effect)
    gsap.to(outerPos.current, {
      x: clientX,
      y: clientY,
      duration: 0.4,
      ease: 'sine.out',
      onUpdate: () => {
        if (outerRef.current) {
          outerRef.current.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0)`;
        }
      },
      overwrite: 'auto',
    });

    // Update inner cursor position
    if (innerRef.current) {
      innerRef.current.style.transform = `translate3d(${innerPos.current.x}px, ${innerPos.current.y}px, 0)`;
    }
  }, [shouldEnable]);

  // Handle hover state for interactive elements
  const handleMouseEnter = useCallback((e) => {
    if (!shouldEnable) return;
    
    const target = e.target;
    const isInteractive =
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.classList.contains('cursor-interactive') ||
      target.closest('button') ||
      target.closest('a');

    if (isInteractive) {
      setIsHovering(true);
      if (outerRef.current) {
        gsap.to(outerRef.current, {
          scale: 1.8,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    }
  }, [shouldEnable]);

  const handleMouseLeave = useCallback(() => {
    if (!shouldEnable) return;
    
    setIsHovering(false);
    if (outerRef.current) {
      gsap.to(outerRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [shouldEnable]);

  // Handle click animation
  const handlePointerDown = useCallback(() => {
    if (!shouldEnable || !outerRef.current) return;

    setIsClicking(true);

    gsap.to(outerRef.current, {
      scale: 0.6,
      duration: 0.1,
      ease: 'power2.in',
    });
  }, [shouldEnable]);

  const handlePointerUp = useCallback(() => {
    if (!shouldEnable || !outerRef.current) return;

    setIsClicking(false);
    const targetScale = isHovering ? 1.8 : 1;

    gsap.to(outerRef.current, {
      scale: targetScale,
      duration: 0.2,
      ease: 'power2.out',
    });
  }, [shouldEnable, isHovering]);

  // Detect idle state for breathing animation
  const idleTimeoutRef = useRef(null);
  const [isIdle, setIsIdle] = useState(false);

  const handleActivity = useCallback(() => {
    setIsIdle(false);

    clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 3000);
  }, []);

  useEffect(() => {
    if (!shouldEnable) return;

    window.addEventListener('pointermove', (e) => {
      handlePointerMove(e);
      handleActivity();
    });
    window.addEventListener('pointerenter', handleMouseEnter);
    window.addEventListener('pointerleave', handleMouseLeave);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerenter', handleMouseEnter);
      window.removeEventListener('pointerleave', handleMouseLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      clearTimeout(idleTimeoutRef.current);
    };
  }, [shouldEnable, handlePointerMove, handleMouseEnter, handleMouseLeave, handlePointerDown, handlePointerUp, handleActivity]);

  // Event delegation for hover detection
  useEffect(() => {
    if (!shouldEnable) return;

    const handleMouseEnterEvent = (e) => {
      handleMouseEnter(e);
    };

    const handleMouseLeaveEvent = () => {
      handleMouseLeave();
    };

    document.addEventListener('mouseover', handleMouseEnterEvent, true);
    document.addEventListener('mouseleave', handleMouseLeaveEvent, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseEnterEvent, true);
      document.removeEventListener('mouseleave', handleMouseLeaveEvent, true);
    };
  }, [shouldEnable, handleMouseEnter, handleMouseLeave]);

  return {
    innerRef,
    outerRef,
    isVisible,
    isHovering,
    isClicking,
    isIdle,
    shouldEnable,
  };
}

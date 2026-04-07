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
      onUpdate: () => {
        if (innerRef.current) {
          innerRef.current.style.left = `${innerPos.current.x}px`;
          innerRef.current.style.top = `${innerPos.current.y}px`;
        }
      },
    });

    // Smooth interpolation for outer cursor (trailing effect)
    gsap.to(outerPos.current, {
      x: clientX,
      y: clientY,
      duration: 0.4,
      ease: 'sine.out',
      onUpdate: () => {
        if (outerRef.current) {
          outerRef.current.style.left = `${outerPos.current.x}px`;
          outerRef.current.style.top = `${outerPos.current.y}px`;
        }
      },
      overwrite: 'auto',
    });
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

    const handlePointerMoveWithActivity = (e) => {
      handlePointerMove(e);
      handleActivity();
    };

    window.addEventListener('pointermove', handlePointerMoveWithActivity);
    window.addEventListener('mouseover', handleMouseEnter, true);
    window.addEventListener('mouseleave', handleMouseLeave, true);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMoveWithActivity);
      window.removeEventListener('mouseover', handleMouseEnter, true);
      window.removeEventListener('mouseleave', handleMouseLeave, true);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      clearTimeout(idleTimeoutRef.current);
    };
  }, [shouldEnable, handlePointerMove, handleMouseEnter, handleMouseLeave, handlePointerDown, handlePointerUp, handleActivity]);

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

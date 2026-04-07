"use client";

import { useState, useEffect, useRef } from 'react';

export function useCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isIdle, setIsIdle] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [cursorType, setCursorType] = useState('default');
  const [rotation, setRotation] = useState(0);

  const idleTimeout = useRef(null);
  const requestRef = useRef(null);
  const lastTarget = useRef({ x: 0, y: 0 });

  // Touch device detection
  const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0));
  };

  useEffect(() => {
    if (typeof window === 'undefined' || isTouchDevice()) {
      setIsHidden(true);
      return;
    }

    const mouseMove = (e) => {
      const prevX = lastTarget.current.x;
      // Calculate rotation based on movement direction
      const dx = e.clientX - prevX;

      const newTarget = { x: e.clientX, y: e.clientY };
      lastTarget.current = newTarget;
      setTarget(newTarget);

      // Only update rotation if there's significant movement
      if (Math.abs(dx) > 2) {
        // Map X velocity to a slight rotation (-15 to 15 degrees)
        const targetRot = Math.max(-15, Math.min(15, dx * 0.4));
        setRotation(prev => prev + (targetRot - prev) * 0.15);
      } else {
        // Slowly return to 0 when moving slows
        setRotation(prev => prev + (0 - prev) * 0.1);
      }

      setIsHidden(false);
      setIsIdle(false);

      clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => {
        setIsIdle(true);
        setRotation(0); // Reset rotation entirely when idle
      }, 1500);

      checkHover(e.clientX, e.clientY);
    };

    const mouseDown = () => setIsClicking(true);
    const mouseUp = () => setIsClicking(false);

    const mouseEnter = () => setIsHidden(false);
    const mouseLeave = () => setIsHidden(true);

    const checkHover = (x, y) => {
      const elem = document.elementFromPoint(x, y);
      if (elem) {
        const isText = elem.matches('textarea, input[type="text"], input[type="email"], input[type="password"], [role="textbox"], [contenteditable="true"]') ||
          elem.closest('textarea, input[type="text"], [contenteditable="true"]');
        const isInteractive = elem.matches('button, a, input, select, [role="button"], .cursor-pointer, .blob-btn, .hand-drawn-btn, .radial-trigger') ||
          elem.closest('button, a, input, select, [role="button"], .cursor-pointer, .blob-btn, .hand-drawn-btn, .radial-trigger');

        if (isText) {
          setCursorType('text');
          setIsHovering(true);
        } else if (isInteractive) {
          setCursorType('pointer');
          setIsHovering(true);
        } else {
          setCursorType('default');
          setIsHovering(false);
        }
      }
    };

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mousedown', mouseDown);
    window.addEventListener('mouseup', mouseUp);
    document.addEventListener('mouseenter', mouseEnter);
    document.addEventListener('mouseleave', mouseLeave);

    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mousedown', mouseDown);
      window.removeEventListener('mouseup', mouseUp);
      document.removeEventListener('mouseenter', mouseEnter);
      document.removeEventListener('mouseleave', mouseLeave);
      clearTimeout(idleTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (isHidden) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lerp = (start, end, factor) => {
      return start + (end - start) * factor;
    };

    let prevPos = { x: lastTarget.current.x, y: lastTarget.current.y };

    const animate = () => {
      const currentTarget = lastTarget.current;

      if (prefersReducedMotion) {
        setPosition({ x: currentTarget.x, y: currentTarget.y });
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      prevPos.x = lerp(prevPos.x, currentTarget.x, 0.12);
      prevPos.y = lerp(prevPos.y, currentTarget.y, 0.12);

      setPosition({ x: prevPos.x, y: prevPos.y });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isHidden]);

  return { position, target, isHovering, isClicking, isIdle, isHidden, cursorType, rotation };
}

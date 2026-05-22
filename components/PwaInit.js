"use client";

import { useEffect } from "react";

/**
 * Component to initialize and register the Progressive Web App (PWA) service worker.
 * Must be rendered within a client boundary.
 *
 * @returns {null} Renders nothing to the DOM
 */
export default function PwaInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    register();
  }, []);

  return null;
}

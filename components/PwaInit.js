"use client";

import { useEffect } from "react";

/**
 * Initializes the Progressive Web App (PWA) by registering the service worker.
 *
 * @returns {null} This component does not render any UI.
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

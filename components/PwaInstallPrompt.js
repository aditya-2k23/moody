"use client";

import { useEffect, useMemo, useState } from "react";

const DISMISS_KEY = "moody_pwa_install_dismissed_at";
const DISMISS_DAYS = 7;

const getDismissed = () => {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.time !== "number") return false;
    const ageMs = Date.now() - parsed.time;
    return ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch (error) {
    console.error("Failed to read PWA dismissal:", error);
    return false;
  }
};

const setDismissedNow = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DISMISS_KEY,
      JSON.stringify({ time: Date.now() })
    );
  } catch (error) {
    console.error("Failed to store PWA dismissal:", error);
  }
};

const detectIos = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(ua);
  const isIpadDesktop = ua.includes("mac") && window.navigator.maxTouchPoints > 1;
  return isIosDevice || isIpadDesktop;
};

const detectStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
};

const detectCoarsePointer = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
};

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isCoarse, setIsCoarse] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsIos(detectIos());
    setIsStandalone(detectStandalone());
    setIsCoarse(detectCoarsePointer());
    setDismissed(getDismissed());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const shouldShow = useMemo(() => {
    if (isStandalone || dismissed || !isCoarse) return false;
    return Boolean(deferredPrompt || isIos);
  }, [isStandalone, dismissed, isCoarse, deferredPrompt, isIos]);

  if (!shouldShow) return null;

  const dismiss = () => {
    setDismissed(true);
    setDismissedNow();
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      dismiss();
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choiceResult && choiceResult.outcome !== "accepted") {
      dismiss();
    }
  };

  const isManualInstall = isIos && !deferredPrompt;
  const primaryLabel = isManualInstall ? "Got it" : "Install";
  const primaryAction = isManualInstall ? dismiss : handleInstall;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] w-[min(92vw,420px)] rounded-2xl border border-indigo-200/70 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-indigo-300/40 dark:shadow-slate-900/60 backdrop-blur-md p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Install Moody</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Get the app-like experience with offline support and quick access.
          </p>
          {isIos && !deferredPrompt && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              On iOS: tap Share, then choose Add to Home Screen.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="px-3 py-2 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={primaryAction}
            className="px-3 py-2 text-xs font-semibold rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

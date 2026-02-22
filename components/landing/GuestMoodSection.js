"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { useGuestDraft } from "@/hooks/useGuestDraft";
import MoodJournal from "../MoodJournal";
import Login from "../Login";

/**
 * GuestMoodSection — Embeds the MoodJournal in guest mode on the landing page.
 *
 * When the user interacts with a gated action (mood, save, insights) an
 * inline auth modal appears. After successful sign-in the user is redirected
 * to /dashboard where the guest draft is hydrated automatically.
 *
 * If the user is already authenticated, nothing is shown (HeroSection already
 * links them to the dashboard).
 */
export default function GuestMoodSection() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { draft, saveDraft } = useGuestDraft();
  const [showAuth, setShowAuth] = useState(false);

  // Already signed in → don't render the guest section
  // (The HeroSection CTA handles authenticated users)
  if (currentUser) return null;

  const handleAuthRequired = () => {
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    // After sign-in, redirect to dashboard.
    // The guest draft in localStorage will be hydrated by DashboardContent.
    router.push("/dashboard");
  };

  return (
    <section className="py-12 md:py-20">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-4">
            <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">
              🎯 Try it now — no sign-up needed
            </span>
          </span>
        </div>

        {/* Guest MoodJournal */}
        <div className="flex flex-col gap-6 sm:gap-10">
          <MoodJournal
            mode="guest"
            initialMood={draft?.mood ?? null}
            initialText={draft?.journalText ?? ""}
            onAuthRequired={handleAuthRequired}
            saveDraft={saveDraft}
          />
        </div>

        {/* Inline auth modal */}
        {showAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => setShowAuth(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Info text */}
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                Sign in to save your mood and journal entry
              </p>

              <Login
                initialRegister
                onAuthSuccess={handleAuthSuccess}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

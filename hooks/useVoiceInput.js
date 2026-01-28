"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Custom hook for voice input using Web Speech API
 * 
 * @param {Object} options
 * @param {string} options.initialValue - Initial text value
 * @param {function} options.onTranscriptChange - Callback when transcript changes
 * @param {string} options.lang - Speech recognition language (default: "en-US")
 * @returns {Object} Voice input state and controls
 */
export function useVoiceInput({ initialValue = "", onTranscriptChange, lang = "en-US" }) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef(null);
  const baseEntryRef = useRef(initialValue);
  const lastProcessedIndexRef = useRef(-1);

  // 5-minute voice timeout to limit mic usage
  const VOICE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const voiceTimeoutRef = useRef(null);

  // Error flag to prevent restart loops - this is checked in onend
  const errorOccurredRef = useRef(false);

  // Smart punctuation cleanup for voice-generated text only
  const cleanupVoiceText = useCallback((text) => {
    if (!text.trim()) return text;

    let cleaned = text.trim();

    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

    // Detect question patterns and add ? if missing punctuation at end
    const questionPatterns = /^(why|how|what|when|where|who|which|is it|do you|does|did|can|could|would|should|are you|will|have you|has|was|were)/i;
    const hasPunctuation = /[.!?]$/.test(cleaned);

    if (!hasPunctuation) {
      if (questionPatterns.test(cleaned)) {
        cleaned += "?";
      } else {
        // Add period for statements
        cleaned += ".";
      }
    }

    // Clean up excessive spaces
    cleaned = cleaned.replace(/\s+/g, " ");

    return cleaned;
  }, []);

  // Store cleanupVoiceText in a ref so onresult handler always has latest version
  const cleanupVoiceTextRef = useRef(cleanupVoiceText);
  useEffect(() => {
    cleanupVoiceTextRef.current = cleanupVoiceText;
  }, [cleanupVoiceText]);

  // Store onTranscriptChange in a ref to avoid stale closures
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let currentInterim = "";

        const lastResultIndex = event.results.length - 1;
        const lastResult = event.results[lastResultIndex];

        if (lastResult.isFinal) {
          if (lastResultIndex > lastProcessedIndexRef.current) {
            finalTranscript = lastResult[0].transcript;
            lastProcessedIndexRef.current = lastResultIndex;
          }
        } else {
          currentInterim = lastResult[0].transcript;
        }

        setInterimTranscript(currentInterim);

        if (finalTranscript) {
          const cleanedText = cleanupVoiceTextRef.current(finalTranscript);
          const base = baseEntryRef.current;
          const separator = base && !base.endsWith(" ") && !base.endsWith("\n") ? " " : "";
          const newEntry = base + separator + cleanedText;

          baseEntryRef.current = newEntry;
          onTranscriptChangeRef.current?.(newEntry);
          setInterimTranscript("");
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        // CRITICAL: Set error flag FIRST to prevent onend from restarting
        errorOccurredRef.current = true;

        // Clear the shouldRestart flag
        if (recognitionRef.current) {
          recognitionRef.current.shouldRestart = false;
        }

        // Clear the voice timeout
        if (voiceTimeoutRef.current) {
          clearTimeout(voiceTimeoutRef.current);
          voiceTimeoutRef.current = null;
        }

        // Force abort the recognition to stop it immediately
        try {
          recognition.abort();
        } catch (e) {
          // Already stopped, ignore
        }

        // Handle specific error types with user-friendly messages
        // Only show toast once per error (errorOccurredRef prevents duplicate handling)
        switch (event.error) {
          case "no-speech":
            // This is usually just a timeout, not a real error - don't show toast
            break;

          case "aborted":
            // User or system aborted - no need to show error
            break;

          case "audio-capture":
            // Microphone not available or not working
            toast.error(
              "Microphone not found or not working. Please check if your microphone is connected and working properly.",
              { duration: 5000, id: "voice-error" }
            );
            break;

          case "not-allowed":
            // Permission denied - could be browser or system level
            toast.error(
              "Microphone access denied. Please allow microphone permissions in your browser settings and ensure your device settings allow microphone access.",
              { duration: 6000, id: "voice-error" }
            );
            break;

          case "network":
            // Network error during speech recognition
            toast.error(
              "Network error during voice recognition. Please check your internet connection and try again.",
              { duration: 5000, id: "voice-error" }
            );
            break;

          case "service-not-allowed":
            // Service not allowed by browser or system policy
            toast.error(
              "Voice input is blocked by your browser or system settings. Please check your privacy settings.",
              { duration: 5000, id: "voice-error" }
            );
            break;

          case "bad-grammar":
          case "language-not-supported":
            // Language or grammar issues - silently ignore, users can speak freely
            break;

          default:
            // Unknown error - provide generic message with the error type for debugging
            toast.error(
              `Voice input error: ${event.error || "Unknown error"}. Please try again.`,
              { duration: 4000, id: "voice-error" }
            );
        }

        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        // Check error flag FIRST - if an error occurred, never restart
        if (errorOccurredRef.current) {
          errorOccurredRef.current = false; // Reset for next time
          setIsListening(false);
          setInterimTranscript("");
          return;
        }

        if (recognitionRef.current?.shouldRestart) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or error - stop completely
            setIsListening(false);
            setInterimTranscript("");
          }
        } else {
          setIsListening(false);
          setInterimTranscript("");
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      // Clear voice timeout to prevent memory leak
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.shouldRestart = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Already stopped, ignore
        }
      }
    };
  }, []);

  // Toggle voice input
  const toggleVoiceInput = useCallback((currentEntry = "") => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Voice input is not supported in this browser. Please try using Chrome, Edge, or Safari.",
        { duration: 5000, id: "voice-not-supported" }
      );
      return;
    }

    if (isListening) {
      // Stop listening - clear timeout first (safe even if recognitionRef is null)
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }

      // Guard against null recognitionRef
      if (!recognitionRef.current) {
        setIsListening(false);
        setInterimTranscript("");
        return;
      }

      recognitionRef.current.shouldRestart = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped or unavailable, ignore
      }
      setIsListening(false);
      setInterimTranscript("");
    } else {
      // Start listening - guard against null recognitionRef
      if (!recognitionRef.current) {
        toast.error(
          "Voice input is not available. Please refresh the page and try again.",
          { duration: 4000, id: "voice-unavailable" }
        );
        return;
      }

      baseEntryRef.current = currentEntry;
      lastProcessedIndexRef.current = -1;
      try {
        recognitionRef.current.shouldRestart = true;
        recognitionRef.current.start();
        setIsListening(true);

        // Set 5-minute timeout to auto-stop
        voiceTimeoutRef.current = setTimeout(() => {
          toast("Voice input stopped after 5 minutes", { icon: "⏱️" });
          // Guard against null ref in timeout callback
          if (recognitionRef.current) {
            recognitionRef.current.shouldRestart = false;
            try {
              recognitionRef.current.stop();
            } catch (e) {
              // Already stopped, ignore
            }
          }
          setIsListening(false);
          setInterimTranscript("");
          voiceTimeoutRef.current = null;
        }, VOICE_TIMEOUT_MS);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);

        // Clear the timeout since we failed to start
        if (voiceTimeoutRef.current) {
          clearTimeout(voiceTimeoutRef.current);
          voiceTimeoutRef.current = null;
        }

        // Provide specific error messages based on exception
        if (e.name === "NotAllowedError") {
          toast.error(
            "Microphone access denied. Please allow microphone permissions in your browser and device settings.",
            { duration: 5000, id: "voice-start-error" }
          );
        } else if (e.name === "NotFoundError") {
          toast.error(
            "No microphone found. Please connect a microphone and try again.",
            { duration: 5000, id: "voice-start-error" }
          );
        } else if (e.name === "InvalidStateError") {
          toast.error(
            "Voice input is already active. Please wait a moment and try again.",
            { duration: 4000, id: "voice-start-error" }
          );
        } else {
          toast.error(
            "Could not start voice input. Please check your microphone and try again.",
            { duration: 4000, id: "voice-start-error" }
          );
        }

        setIsListening(false);
      }
    }
  }, [isListening]);

  // Sync base entry ref when entry changes externally (e.g., user typing)
  const syncBaseEntry = useCallback((value) => {
    if (!interimTranscript) {
      baseEntryRef.current = value;
    }
  }, [interimTranscript]);

  // Compute display value with interim transcript
  const getDisplayValue = useCallback((currentEntry) => {
    if (interimTranscript) {
      const base = baseEntryRef.current;
      const separator = base && !base.endsWith(" ") && !base.endsWith("\n") ? " " : "";
      return base + separator + interimTranscript;
    }
    return currentEntry;
  }, [interimTranscript]);

  // Check if voice input is supported
  const isSupported = typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  return {
    isListening,
    interimTranscript,
    toggleVoiceInput,
    syncBaseEntry,
    getDisplayValue,
    isSupported,
  };
}

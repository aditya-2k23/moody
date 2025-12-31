"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Custom hook for voice input using Web Speech API
 * 
 * @param {Object} options
 * @param {string} options.initialValue - Initial text value
 * @param {function} options.onTranscriptChange - Callback when transcript changes
 * @returns {Object} Voice input state and controls
 */
export function useVoiceInput({ initialValue = "", onTranscriptChange }) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef(null);
  const baseEntryRef = useRef(initialValue);
  const lastProcessedIndexRef = useRef(-1);

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
      recognition.lang = "en-US";

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
        if (event.error !== "no-speech" && event.error !== "aborted") {
          toast.error("Voice input error. Please try again.");
        }
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        if (recognitionRef.current?.shouldRestart) {
          try {
            recognition.start();
          } catch (e) {
            // Already started, ignore
          }
        } else {
          setIsListening(false);
          setInterimTranscript("");
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
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
      toast.error("Voice input not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.shouldRestart = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript("");
    } else {
      baseEntryRef.current = currentEntry;
      lastProcessedIndexRef.current = -1;
      try {
        recognitionRef.current.shouldRestart = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
        toast.error("Could not start voice input.");
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

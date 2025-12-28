"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

const CACHE_KEY_PREFIX = "moody_memories_";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Get cached memories from localStorage
 * @param {string} cacheKey 
 * @returns {Array|null}
 */
function getCachedMemories(cacheKey) {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    localStorage.removeItem(cacheKey);
    return null;
  } catch {
    return null;
  }
}

/**
 * Set memories in localStorage cache
 * @param {string} cacheKey 
 * @param {Array} data 
 */
function setCachedMemories(cacheKey, data) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // localStorage might be full or unavailable
  }
}

/**
 * Invalidate cache for a specific month
 * @param {string} uid 
 * @param {number} year 
 * @param {number} month 
 */
export function invalidateMemoriesCache(uid, year, month) {
  if (typeof window === "undefined") return;

  const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const cacheKey = `${CACHE_KEY_PREFIX}${uid}_${yearMonth}`;
  localStorage.removeItem(cacheKey);
}

/**
 * Check if a given year/month is in the future
 * @param {number} year 
 * @param {number} month - Month index (0-11)
 * @returns {boolean}
 */
function isFutureMonth(year, month) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  if (year > currentYear) return true;
  if (year === currentYear && month > currentMonth) return true;
  return false;
}

/**
 * Custom hook to fetch memories for a specific month
 * @param {string} uid - User's UID
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month index (0-11)
 * @returns {{memories: Array, status: 'idle'|'loading'|'loaded', error: string|null, refetch: Function}}
 */
export function useMemories(uid, year, month) {
  const [memories, setMemories] = useState([]);
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'loaded'
  const [error, setError] = useState(null);

  const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const cacheKey = `${CACHE_KEY_PREFIX}${uid}_${yearMonth}`;

  const fetchMemories = async () => {
    // Guard: Skip fetch for future months
    if (isFutureMonth(year, month)) {
      setMemories([]);
      setStatus("loaded");
      return;
    }

    if (!uid) {
      setMemories([]);
      setStatus("loaded");
      return;
    }

    // Clear previous memories immediately on month change
    setMemories([]);
    setStatus("loading");
    setError(null);

    // Check cache first
    const cached = getCachedMemories(cacheKey);
    if (cached !== null) {
      setMemories(cached);
      setStatus("loaded");
      return;
    }

    try {
      const docRef = doc(db, "users", uid, "memories", yearMonth);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const items = data.items || [];
        setMemories(items);
        setCachedMemories(cacheKey, items);
      } else {
        setMemories([]);
        setCachedMemories(cacheKey, []);
      }
    } catch (err) {
      console.error("Error fetching memories:", err);
      setError(err.message);
      setMemories([]);
    } finally {
      setStatus("loaded");
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [uid, year, month]);

  // Remove a memory from local state (for optimistic updates after deletion)
  const removeMemory = (publicId) => {
    setMemories((prev) => {
      const updated = prev.filter((item) => item.publicId !== publicId);
      // Also update the cache
      setCachedMemories(cacheKey, updated);
      return updated;
    });
  };

  // For backwards compatibility, expose loading as derived state
  const loading = status === "loading";

  return { memories, status, loading, error, refetch: fetchMemories, removeMemory, yearMonth };
}

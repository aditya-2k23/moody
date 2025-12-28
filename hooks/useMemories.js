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

    // Check if cache is still valid (7 days)
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expired, remove it
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
 * Custom hook to fetch memories for a specific month
 * @param {string} uid - User's UID
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month index (0-11)
 * @returns {{memories: Array, loading: boolean, error: string|null, refetch: Function}}
 */
export function useMemories(uid, year, month) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const cacheKey = `${CACHE_KEY_PREFIX}${uid}_${yearMonth}`;

  const fetchMemories = async () => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Check cache first
    const cached = getCachedMemories(cacheKey);
    if (cached !== null) {
      setMemories(cached);
      setLoading(false);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [uid, year, month]);

  return { memories, loading, error, refetch: fetchMemories };
}

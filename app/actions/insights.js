"use server";

import { redis } from "@/lib/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const AI_TIMEOUT_MS = 25_000; // 25s timeout for Gemini API (well within Netlify's function limit)

// Cache for the Gemini model instance
let cachedModel = null;

/**
 * Lazily initialize and return the Gemini model.
 * Validates GEMINI_API_KEY at request time, not module load time.
 */
function getGeminiModel() {
  if (cachedModel) {
    return cachedModel;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    const errorMsg = "[Gemini] GEMINI_API_KEY environment variable is missing or empty. " +
      "Please set it to your Google Gemini API key.";
    console.error(errorMsg);
    throw new Error("AI service is not configured. Please contact support.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  cachedModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  return cachedModel;
}

/**
 * Generate SHA-256 hash of journal text for cache key.
 */
function hashText(text) {
  return crypto.createHash("sha256").update(text.trim()).digest("hex").slice(0, 16);
}

/**
 * Generate cache key for insights.
 * Format: insight:{userId}:{YYYY-MM-DD}:{hash}
 * Uses local date to align with Firestore's client-local daily entry logic.
 */
function generateCacheKey(userId, journalText) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localDate = `${year}-${month}-${day}`;
  const contentHash = hashText(journalText);
  return `insight:${userId}:${localDate}:${contentHash}`;
}

/**
 * AI prompt for journal analysis.
 */
function buildPrompt(journalEntry) {
  return `
You are an AI journal assistant designed to help users reflect on their mental and emotional well-being in a calm, supportive way.

A user has written a personal journal entry. Analyze the text carefully and generate structured insights that feel human, thoughtful, and grounded in what the user actually wrote.

### Your tasks:

1. **Mood**
  - Identify the dominant emotional tone of the entry.
  - Choose **exactly one** mood from the following list:
  [Elated, Good, Existing, Sad, Awful, Angry, Anxious, Unsure, Excited, Grateful, Tired, Stressed, Neutral]

2. **Triggers**
  - Extract specific words, events, or themes from the entry that influenced the mood.
  - Keep them short, concrete, and directly tied to the text (e.g., deadlines, friends, uncertainty, rest).

3. **Insight**
  - Write a kind, empathetic reflection that acknowledges the user's experience.
  - Avoid clichés, therapy-speak, or judgment.
  - The tone should be reassuring, natural, and supportive.

4. **Pro Tip**
  - Provide one short, actionable, and realistic suggestion tailored to the user's mood.
  - It should feel achievable today, not overwhelming.

5. **Headline**
  - Write a short, creative, mood-appropriate headline for an insight card.
  - It should feel personal and encouraging.
  - Avoid generic motivational phrases or platitudes.

---

### User's journal entry:
"""
${journalEntry}
"""

---

### Response format (STRICT JSON ONLY — no explanations, no markdown):
{
  "mood": "one of Elated, Good, Existing, Sad, Awful, Angry, Anxious, Unsure, Excited, Grateful, Tired, Stressed, Neutral",
  "triggers": ["keywords or events influencing the mood"],
  "insight": "empathetic reflection based on the journal entry",
  "pro_tip": "short, actionable suggestion",
  "headline": "short, creative, mood-appropriate headline"
}
`;
}

/**
 * Generate AI insight with Redis cache-first strategy.
 * 
 * CONTROL FLOW:
 * - Phase 1: Cache read (EARLY RETURN on hit)
 * - Phase 2: AI generation (ONLY on miss or forceRegenerate)
 * These phases are mutually exclusive.
 * 
 * @param {string} userId - Firebase user ID
 * @param {string} journalText - Journal entry text
 * @param {boolean} forceRegenerate - Skip cache and regenerate
 * @returns {Promise<object>} - AI insight object
 */
export async function generateInsight(userId, journalText, forceRegenerate = false) {
  // ===== VALIDATION =====
  if (!userId || !journalText?.trim()) {
    return { success: false, error: "User ID and journal text are required." };
  }

  const cacheKey = generateCacheKey(userId, journalText);

  // ===== PHASE 1: CACHE READ (EARLY RETURN) =====
  // If forceRegenerate is false, check cache and return immediately if found
  if (!forceRegenerate) {
    try {
      const cached = await redis.get(cacheKey);

      if (cached && typeof cached === "object" && cached.mood) {
        return { success: true, data: cached };
      }
    } catch (error) {
      console.error("[Insights] Cache read error (proceeding to AI generation):", error);
      // Fall through to AI generation
    }
  }

  // ===== PHASE 2: AI GENERATION (ONLY REACHED ON MISS OR FORCE) =====
  let insight;
  try {
    const model = getGeminiModel();
    const prompt = buildPrompt(journalText);

    // Abort controller to prevent Netlify 504 Gateway Timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let result;
    try {
      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    let text = result.response.text();

    // Clean up response
    text = text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```[a-zA-Z]*\n/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(text);

    if (!validateInsight(parsed)) {
      throw new Error("Validation Failed");
    }

    insight = parsed;
    console.log("[Insights] 🤖 AI response received, parsed, and validated");
  } catch (error) {
    console.error("[Insights] AI generation error:", error.message);

    // User-friendly error messages returned as values (not thrown)
    // so they survive Next.js production error sanitization
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return { success: false, error: "AI Rate Limit. Please try again after some time" };
    }
    if (error.message?.includes("403") || error.message?.includes("Forbidden")) {
      return { success: false, error: "AI service unavailable. Please try again later." };
    }
    if (error.message?.includes("not configured")) {
      return { success: false, error: "AI service is not configured. Please contact support." };
    }
    if (error.name === "AbortError" || error.message?.includes("abort")) {
      return { success: false, error: "AI request timed out. Please try again." };
    }
    if (error.message?.includes("JSON")) {
      return { success: false, error: "Failed to parse AI response. Please try again." };
    }
    if (error.message?.includes("Validation Failed")) {
      return { success: false, error: "AI response validation failed. Please try again." };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }

  // ===== PHASE 3: CACHE WRITE =====
  try {
    await redis.set(cacheKey, insight, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error("[Insights] ⚠️ Cache write error (returning AI result anyway):", error);
  }

  return { success: true, data: insight };
}

function validateInsight(data) {
  if (!data || typeof data !== "object") return false;

  const requiredFields = ["mood", "triggers", "insight", "pro_tip", "headline"];

  for (const field of requiredFields) {
    if (!(field in data)) return false;
  }

  if (typeof data.mood !== "string") return false;
  if (!Array.isArray(data.triggers)) return false;
  if (typeof data.insight !== "string") return false;
  if (typeof data.pro_tip !== "string") return false;
  if (typeof data.headline !== "string") return false;

  return true;
}

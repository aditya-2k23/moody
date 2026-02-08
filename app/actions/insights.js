"use server";

import { redis } from "@/lib/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Initialize Gemini for server-side usage
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Generate SHA-256 hash of journal text for cache key.
 */
function hashText(text) {
  return crypto.createHash("sha256").update(text.trim()).digest("hex").slice(0, 16);
}

/**
 * Generate cache key for insights.
 * Format: insight:{userId}:{YYYY-MM-DD}:{hash}
 */
function generateCacheKey(userId, journalText) {
  const today = new Date().toISOString().split("T")[0];
  const contentHash = hashText(journalText);
  return `insight:${userId}:${today}:${contentHash}`;
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
    throw new Error("User ID and journal text are required.");
  }

  const cacheKey = generateCacheKey(userId, journalText);
  console.log("[Insights] Cache key:", cacheKey, "| forceRegenerate:", forceRegenerate);

  // ===== PHASE 1: CACHE READ (EARLY RETURN) =====
  // If forceRegenerate is false, check cache and return immediately if found
  if (!forceRegenerate) {
    const cached = await redis.get(cacheKey);

    if (cached !== null && cached !== undefined) {
      console.log("[Insights] ✅ Cache HIT - returning cached insight, NO AI call");
      return cached;
    }

    console.log("[Insights] ❌ Cache MISS - no cached value found");
  } else {
    console.log("[Insights] ⚠️ Force regenerate - skipping cache read");
  }

  // ===== PHASE 2: AI GENERATION (ONLY REACHED ON MISS OR FORCE) =====
  console.log("[Insights] 🤖 Calling AI API...");

  let insight;
  try {
    const prompt = buildPrompt(journalText);
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Clean up response
    text = text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```[a-zA-Z]*\n/, "").replace(/```$/, "").trim();
    }

    insight = JSON.parse(text);
    console.log("[Insights] 🤖 AI response received and parsed");
  } catch (error) {
    console.error("[Insights] AI generation error:", error.message);

    // User-friendly error messages
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("AI is busy right now. Please try again in a minute.");
    }
    if (error.message?.includes("403") || error.message?.includes("Forbidden")) {
      throw new Error("AI service unavailable. Please try again later.");
    }
    if (error.message?.includes("JSON")) {
      throw new Error("Failed to parse AI response. Please try again.");
    }
    throw new Error("Something went wrong. Please try again.");
  }

  // ===== PHASE 3: CACHE WRITE =====
  await redis.set(cacheKey, insight, { ex: CACHE_TTL_SECONDS });
  console.log("[Insights] 💾 Cached in Redis with TTL:", CACHE_TTL_SECONDS, "seconds");

  return insight;
}

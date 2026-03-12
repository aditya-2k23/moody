"use server";

import { redis } from "@/lib/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const GLOBAL_TIMEOUT_MS = 50_000; // 50s total deadline
const AI_TIMEOUT_MS = 15_000; // 15s timeout per model attempt

// ===== MODEL FALLBACK CHAIN =====
// Ordered by preference: newest first, highest-capacity last as safety net.
// Daily free-tier limits: 3-Flash ~20 RPD, 2.5-Flash ~20 RPD, 2.0-Flash ~1500 RPD.
// Total effective capacity: ~1540 requests/day.
const MODEL_CHAIN = [
  { id: "gemini-3-flash-preview", label: "3-Flash" },
  { id: "gemini-2.5-flash", label: "2.5-Flash" },
  { id: "gemini-2.0-flash", label: "2.0-Flash" },
];

// ===== MODEL INSTANCE HELPERS =====

/**
 * Validate that the GEMINI_API_KEY is present.
 * Throws a user-friendly error if missing.
 */
function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.error(
      "[Gemini] GEMINI_API_KEY environment variable is missing or empty. " +
      "Please set it to your Google Gemini API key."
    );
    throw new Error("AI service is not configured. Please contact support.");
  }

  return apiKey;
}

/**
 * Create a Gemini model instance for the given model ID.
 * Instances are lightweight, so we create fresh ones per request
 * to allow seamless fallback between models.
 */
function getModelInstance(modelId) {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelId });
}

// ===== REDIS-BASED MODEL EXHAUSTION TRACKING =====

/**
 * Calculate seconds remaining until the next midnight in Pacific Time (America/Los_Angeles).
 * Used as TTL so exhaustion flags auto-reset when Google's daily quotas reset.
 */
function secondsUntilMidnight() {
  const now = new Date();
  const options = { timeZone: "America/Los_Angeles", hour12: false };
  const ptTime = new Date(now.toLocaleString("en-US", options));
  const ptMidnight = new Date(ptTime);
  ptMidnight.setHours(24, 0, 0, 0);
  return Math.max(Math.ceil((ptMidnight - ptTime) / 1000), 60); // minimum 60s to avoid edge cases
}

/**
 * Mark a model as exhausted in Redis. The key expires at midnight
 * so the model becomes available again when Google resets daily quotas.
 */
async function markModelExhausted(modelId) {
  try {
    const ttl = secondsUntilMidnight();
    await redis.set(`model:exhausted:${modelId}`, "1", { ex: ttl });
    console.warn(`[Insights] Marked ${modelId} as exhausted (TTL: ${ttl}s until midnight)`);
  } catch (error) {
    // Non-critical: if Redis fails, we'll just retry the model next time
    console.error("[Insights] Failed to mark model exhausted in Redis:", error.message);
  }
}

/**
 * Return the ordered list of models that are NOT currently marked as exhausted.
 * Uses a single redis.mget() call for efficiency.
 */
async function getAvailableModels() {
  try {
    const keys = MODEL_CHAIN.map((m) => `model:exhausted:${m.id}`);
    const results = await redis.mget(...keys);

    return MODEL_CHAIN.filter((_, index) => !results[index]);
  } catch (error) {
    // If Redis is down, return the full chain — we'll discover exhaustion via API errors
    console.error("[Insights] Failed to check model exhaustion (using full chain):", error.message);
    return [...MODEL_CHAIN];
  }
}

/**
 * Determine if an error is retryable (model-specific issue that another model may not have).
 * Includes: quota/rate limits, access errors, and timeouts.
 * A timeout on one model doesn't mean the next one will also timeout.
 */
function isRetryableError(error) {
  const msg = error.message || "";
  const isQuotaOrAccess =
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("403") ||
    msg.includes("Forbidden") ||
    msg.includes("Resource has been exhausted") ||
    msg.includes("rate limit");
  const isTimeout =
    error.name === "AbortError" || msg.includes("abort") || msg.includes("timeout");
  const isFormat = msg.includes("JSON") || msg.includes("Validation Failed");

  return isQuotaOrAccess || isTimeout || isFormat;
}

/**
 * Determine if a retryable error is specifically a quota error
 * (should mark the model as exhausted) vs a transient error like a timeout
 * (should try next model but NOT mark as exhausted since it may work later).
 */
function isQuotaError(error) {
  const msg = error.message || "";
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("Resource has been exhausted") ||
    msg.includes("rate limit")
  );
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
  return `You are an empathetic AI journal assistant analyzing emotional well-being.

JOURNAL ENTRY:
"""
${journalEntry}
"""

ANALYSIS REQUIREMENTS:

1. MOOD (select exactly one):
${["Elated", "Good", "Existing", "Sad", "Awful", "Angry", "Anxious",
      "Unsure", "Excited", "Grateful", "Tired", "Stressed", "Neutral"].join(", ")}

2. TRIGGERS:
- Extract 2-4 specific words/events/themes from the entry
- Must be directly referenced in the text
- Keep concise (1-3 words each)
- Examples: "work deadline", "friend conflict", "poor sleep"

3. INSIGHT (2-3 sentences):
- Reflect on what the user expressed
- Use warm, non-clinical language
- Acknowledge their experience without judgment
- Avoid: "It's okay to feel...", "Remember that...", generic therapy phrases

4. PRO TIP (1 sentence):
- Actionable and achievable today
- Tailored to their specific mood/situation
- Practical, not aspirational

5. HEADLINE (4-8 words):
- Creative and personal
- Match the emotional tone
- Avoid: "You've Got This", "Stay Strong", generic motivational phrases

CONSTRAINTS:
- Base analysis ONLY on explicit content in the entry
- If entry is vague, acknowledge uncertainty in insight
- Maintain supportive but honest tone
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

  // ===== PHASE 2: AI GENERATION WITH CASCADING MODEL FALLBACK =====
  // Try each model in the chain until one succeeds.
  // Retryable errors (429/403/timeout) fall through to the next model.
  // Quota errors (429/403) also mark the model as exhausted.
  // Non-retryable errors (parse, validation) return immediately.

  const availableModels = await getAvailableModels();

  if (availableModels.length === 0) {
    console.error("[Insights] All models are exhausted for today");
    return {
      success: false,
      error: "All AI models are currently at capacity. Please try again tomorrow.",
    };
  }

  const prompt = buildPrompt(journalText);
  let insight;
  let modelUsed = null;
  const startTime = Date.now();

  for (let i = 0; i < availableModels.length; i++) {
    // Check global deadline
    if (Date.now() - startTime >= GLOBAL_TIMEOUT_MS) {
      console.error("[Insights] Global timeout exceeded across fallback loop.");
      return { success: false, error: "AI request timed out due to slow models. Please try again." };
    }

    const { id: modelId, label: modelLabel } = availableModels[i];
    const isLastModel = i === availableModels.length - 1;

    try {
      const model = getModelInstance(modelId);

      // Abort controller to prevent Netlify 504 Gateway Timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      let result;
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                mood: {
                  type: "string",
                  enum: [
                    "Elated", "Good", "Existing", "Sad", "Awful", "Angry",
                    "Anxious", "Unsure", "Excited", "Grateful", "Tired",
                    "Stressed", "Neutral",
                  ],
                },
                triggers: { type: "array", items: { type: "string" } },
                insight: { type: "string" },
                pro_tip: { type: "string" },
                headline: { type: "string" },
              },
              required: ["mood", "triggers", "insight", "pro_tip", "headline"],
            },
          },
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
      modelUsed = modelId;
      break; // Success — exit the fallback loop

    } catch (error) {
      console.error(`[Insights] ${modelLabel} error:`, error.message);

      // --- RETRYABLE ERRORS: try next model ---
      if (isRetryableError(error)) {
        // Only mark as exhausted for quota/access errors, not timeouts
        if (isQuotaError(error)) {
          await markModelExhausted(modelId);
        }

        if (!isLastModel) {
          const nextLabel = availableModels[i + 1].label;
          let reason = "timed out";
          if (isQuotaError(error)) reason = "exhausted";
          else if (error.message?.includes("JSON") || error.message?.includes("Validation Failed")) reason = "format error";

          console.warn(`[Insights] ${modelLabel} ${reason}, falling through to ${nextLabel}...`);
          continue; // Try next model
        }

        // Last model also failed
        if (isQuotaError(error)) {
          return { success: false, error: "All AI models are currently at capacity. Please try again tomorrow." };
        }
        if (error.message?.includes("JSON")) {
          return { success: false, error: "Failed to parse AI response. Please try again." };
        }
        if (error.message?.includes("Validation Failed")) {
          return { success: false, error: "AI response validation failed. Please try again." };
        }
        return { success: false, error: "AI request timed out across all models. Please try again." };
      }

      // --- NON-RETRYABLE ERRORS: return immediately (no point trying another model) ---
      if (error.message?.includes("not configured")) {
        return { success: false, error: "AI service is not configured. Please contact support." };
      }
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }

  // ===== PHASE 3: CACHE WRITE =====
  try {
    await redis.set(cacheKey, insight, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error("[Insights] ⚠️ Cache write error (returning AI result anyway):", error);
  }

  return { success: true, data: insight, modelUsed };
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

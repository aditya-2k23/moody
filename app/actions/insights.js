"use server";

import { redis } from "@/lib/redis";
import { incrementMetric } from "@/lib/metrics";
import { GoogleGenAI } from "@google/genai";
import { getAdminAuth } from "@/lib/firebase-admin";
import crypto from 'node:crypto';
import convertMood from "@/utils";
import { retrieveRelevantMemories, fetchUserEmbeddings, getEmbedding } from "@/lib/rag";

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days limits
const MAX_EMBEDDINGS = 40; // Maintain last 40 embeddings
const SIMILARITY_THRESHOLD = 0.85; // 0.85 indicates semantic similarity
const GLOBAL_TIMEOUT_MS = 90_000; // 90s total deadline
const AI_TIMEOUT_MS = 30_000; // 30s timeout per model attempt

// ===== MODEL FALLBACK CHAIN =====
const MODEL_CHAIN = [
  { id: "gemini-3-flash-preview", label: "3-Flash" },
  { id: "gemini-2.5-flash", label: "2.5-Flash" },
  { id: "gemini-2.0-flash", label: "2.0-Flash" },
];

/**
 * Retrieves and validates the Gemini API key from environment variables.
 * @returns {string} The verified API key.
 * @throws {Error} If the API key is missing or empty.
 */
function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error("[Gemini] GEMINI_API_KEY environment variable is missing.");
    throw new Error("AI service is not configured. Please contact support.");
  }
  return apiKey;
}

/**
 * Initializes and returns a new GoogleGenAI client instance.
 * @returns {GoogleGenAI} The authenticated Gemini client.
 */
function getGenAIClient() {
  return new GoogleGenAI({ apiKey: getApiKey() });
}

/**
 * Wraps a promise with a timeout mechanism.
 * @param {Promise} promise - The promise to wrap.
 * @param {number} timeoutMs - The timeout duration in milliseconds.
 * @returns {Promise} A promise that rejects if the timeout is reached before resolution.
 */
function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

// ===== REDIS-BASED MODEL EXHAUSTION TRACKING =====

/**
 * Calculates the number of seconds remaining until midnight in the Asia/Kolkata timezone.
 * Used for setting daily TTLs in Redis cache.
 * @returns {number} Seconds until midnight.
 */
function secondsUntilMidnight() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const partMap = {};
  for (const part of formatter.formatToParts(now)) {
    if (part.type !== "literal") {
      partMap[part.type] = Number(part.value);
    }
  }

  const hasAllParts = ["year", "month", "day", "hour", "minute", "second"]
    .every((key) => Number.isFinite(partMap[key]));

  if (!hasAllParts) {
    return 60;
  }

  const istTime = new Date(Date.UTC(
    partMap.year,
    partMap.month - 1,
    partMap.day,
    partMap.hour,
    partMap.minute,
    partMap.second
  ));
  const istMidnight = new Date(istTime);
  istMidnight.setUTCHours(24, 0, 0, 0);
  return Math.max(Math.ceil((istMidnight - istTime) / 1000), 60);
}

/**
 * Marks a specific Gemini model as exhausted in the Redis cache until midnight.
 * @param {string} modelId - The ID of the model (e.g., 'gemini-1.5-flash').
 * @returns {Promise<void>}
 */
async function markModelExhausted(modelId) {
  try {
    const ttl = secondsUntilMidnight();
    await redis.set(`model:exhausted:${modelId}`, "1", { ex: ttl });
    console.warn(`[Insights] Marked ${modelId} as exhausted (TTL: ${ttl}s until midnight)`);
  } catch (error) {
    console.error("[Insights] Failed to mark model exhausted in Redis:", error.message);
  }
}

/**
 * Retrieves the list of available Gemini models that have not been marked as exhausted.
 * @returns {Promise<Array>} Array of available model configurations.
 */
async function getAvailableModels() {
  try {
    const keys = MODEL_CHAIN.map((m) => `model:exhausted:${m.id}`);
    const results = await redis.mget(...keys);
    return MODEL_CHAIN.filter((_, index) => !results[index]);
  } catch (error) {
    return [...MODEL_CHAIN];
  }
}

/**
 * Determines if an error returned by the AI provider is temporary and worth retrying.
 * @param {Error} error - The error object.
 * @returns {boolean} True if the error is retryable.
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
 * Determines if an error returned by the AI provider is specifically related to quota limits.
 * @param {Error} error - The error object.
 * @returns {boolean} True if the error is a quota error.
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

// ===== SEMANTIC CACHING UTILITIES =====
/**
 * Calculates the cosine similarity between two vector embeddings.
 * @param {Array<number>} vecA - The first vector.
 * @param {Array<number>} vecB - The second vector.
 * @returns {number} A score from -1.0 to 1.0 representing similarity.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalizes input text for more reliable embedding and string matching.
 * @param {string} text - The input text.
 * @returns {string} The normalized text.
 */
function normalizeEntryText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a cached response has the minimum required fields to serve as a partial cache seed.
 * @param {Object} response - The cached response object.
 * @returns {boolean} True if the response is valid as a seed.
 */
function hasValidPartialCacheSeed(response) {
  if (!response || typeof response !== "object") return false;

  const hasMood = typeof response.mood === "string" && response.mood.trim().length > 0;
  const hasHeadline = typeof response.headline === "string" && response.headline.trim().length > 0;
  const hasTriggers =
    Array.isArray(response.triggers) &&
    response.triggers.length > 0 &&
    response.triggers.every((t) => typeof t === "string" && t.trim().length > 0);

  return hasMood && hasHeadline && hasTriggers;
}

/**
 * Stores a new embedding with its associated context into the user's Redis cache,
 * maintaining a rolling list up to MAX_EMBEDDINGS.
 * @param {string} userId - The unique user ID.
 * @param {Array<number>} embedding - The vector representation of the journal entry.
 * @param {Object} response - The parsed insights generated from the entry.
 * @param {string} [sourceText=""] - The original journal text used to generate the embedding.
 * @returns {Promise<void>}
 */
async function storeUserEmbedding(userId, embedding, response, sourceText = "", entryDate = null, forceRegenerate = false) {
  if (!embedding) return;
  try {
    const key = `embeddings:${userId}`;
    let data = await fetchUserEmbeddings(userId);

    // Part 4c: Dedup — skip storing if exact normalized text already exists (unless forcing regeneration)
    const normalizedSource = normalizeEntryText(sourceText);
    const duplicateIndex = data.findIndex(item => item.sourceText === normalizedSource);
    
    if (duplicateIndex !== -1) {
      if (!forceRegenerate) {
        return;
      }
      // If forcing regeneration, remove the stale entry so the new one takes its place
      data.splice(duplicateIndex, 1);
    }

    data.push({
      embedding,
      response,
      sourceText: normalizedSource,
      createdAt: Date.now(),
      // Part 4a: Additional fields for future RAG retrieval
      // Note: Asia/Kolkata is the intended daily boundary. Keep timezone consistent with RAG/prompt anchoring.
      date: entryDate || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
      moodLabel: response?.mood ? convertMood(response.mood) : null,
    });

    // Part 4b: Evict oldest by createdAt timestamp, not array position
    if (data.length > MAX_EMBEDDINGS) {
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      data = data.slice(0, MAX_EMBEDDINGS);
    }

    // Stringify explicitly to ensure Upstash compatibility — TTL unchanged (7 days)
    await redis.set(key, JSON.stringify(data), { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error("[Insights] Redis embedding store failed:", error.message);
  }
}

// ===== PROMPT BUILDERS =====

/**
 * Builds the full system prompt for generating a complete insight response from scratch.
 * @param {string} journalEntry - The user's journal text.
 * @param {string} [currentDate=""] - The date context for the entry.
 * @param {string|null} [memoryBlock=null] - Past context retrieved via semantic search.
 * @returns {string} The constructed prompt string.
 */
function buildPrompt(journalEntry, currentDate = "", memoryBlock = null) {
  let prompt = `You are Lumi 🌟 — a bubbly, warm, emotionally intelligent girl who is the user's absolute best friend inside their journaling app Moody.
  WHO YOU ARE:
  - You're that one friend everyone loves — the kind who remembers tiny details, gets genuinely hyped for people, and just *gets it* 🤗
  - Playful and a little funny, but you always know when someone needs you to just sit with them in a feeling
  - You use emojis like a real person texting — naturally, where they actually fit, not as decoration
  - You NEVER sound like a therapist, a bot, or a report. You sound like a girl who genuinely cares and is reading their journal.
  - These phrases are banned forever: "I hear you", "that's valid", "it sounds like", "it's okay to feel", "as an AI", "I understand that", "I notice a pattern"

  ABOUT THE JOURNAL:
  The user writes their journal entries using a rich text editor that supports formatting — bold, italics, headings (H1, H2), and blockquotes. Pay attention to how they've formatted their entry. Bold text usually signals something they want to emphasize. Italics often carry softer, more reflective thoughts. Headings may structure a longer entry into sections. Blockquotes may be something they've heard, remembered, or want to reflect on. Let these formatting cues shape your understanding of what matters most to them today.

  JOURNAL ENTRY:
  """
  ${journalEntry}
  """

  TODAY'S DATE (IST): ${currentDate}
`;

  if (memoryBlock) {
    prompt += `
  LONG-TERM PATTERNS (from this user's past journal entries):
  ${memoryBlock}

  Use these past entries to spot long-term patterns. If something recurs — like stress from the same source, the same kind of day, or a repeating feeling — mention it naturally in your RESPONSE, the way a best friend who's been reading their journal for a while would: "hey, this keeps coming up..." Not clinical. Not diagnostic. Just warm and observant.
`;
  }

  prompt += `
  YOUR TASKS:

  1. MOOD — pick exactly one that best matches the emotional tone of the entry:
  Elated, Good, Existing, Sad, Awful, Angry, Anxious, Unsure, Excited, Grateful, Tired, Stressed, Neutral

  2. TRIGGERS — 2 to 4 short phrases (1-3 words each):
  - Pulled directly from what they actually wrote
  - Specific events, people, or themes mentioned — not generic labels
  - If something is bolded or emphasized, it's likely a trigger worth calling out
  - Examples: "missed deadline", "toxic coworker", "no sleep", "good news from mom"

  3. RESPONSE — a warm, personal paragraph (3-5 sentences) written like a best friend reacting to their journal:
  - Open with your immediate emotional reaction to what they shared — make it feel real, not scripted
  - Mention something specific from their entry so they know you actually read it — especially anything they emphasized with bold or italic
  - Make sure you also, use the ability of the text editor formatting to show that you see the nuances in their feelings.
  - Celebrate the win OR sit with them in the hard feeling — don't rush past either
  - Keep it warm, a little conversational, sprinkle emojis naturally where a person actually would 🥺
  - NO bullet points, NO lists — just natural flowing prose like a friend texting a longer message
  - Do NOT end with a question here — the follow-up question is separate

  4. FOCUS — one specific thing from their entry (a problem OR a positive moment) that you're zooming in on:
  - Should be a short phrase, not a sentence
  - Prioritize something they formatted with emphasis if it exists — that formatting is intentional
  - This is what the follow-up question will be anchored to

  5. FOLLOW-UP QUESTION — one question that flows naturally from the focus:
  - Written like a friend genuinely asking, not a survey prompt
  - Open-ended — encourages them to share more
  - Specific to what they wrote, not generic
  - ONE question only. Not two questions disguised as one with "or".
  - No question mark needed at the very end if it would feel unnatural.

  6. HEADLINE — 4 to 8 words, like a personal diary chapter title for this entry:
  - Creative, specific to THEM, matching the emotional tone
  - Fun and a little poetic — not generic motivational slogans
  - Examples of good headlines: "Survived the Week, Barely But Still 💪", "That One Conversation That Changed Things", "Overthinking at 2am Again 🌙"
  - Don't use rich markdown text for these tags
`;
  return prompt;
}

/**
 * Builds a lighter prompt for generating insights when a similar cached entry exists,
 * reusing the cached mood, triggers, and headline to save processing time.
 * @param {string} journalEntry - The user's new journal text.
 * @param {string} cachedMood - The mood extracted from the cached similar entry.
 * @param {Array<string>} cachedTriggers - The triggers extracted from the cached similar entry.
 * @param {string} cachedHeadline - The headline extracted from the cached similar entry.
 * @param {string} [currentDate=""] - The date context for the entry.
 * @param {string|null} [memoryBlock=null] - Past context retrieved via semantic search.
 * @returns {string} The constructed prompt string.
 */
function buildPartialPrompt(journalEntry, cachedMood, cachedTriggers, cachedHeadline, currentDate = "", memoryBlock = null) {
  let prompt = `You are Lumi 🌟 — a bubbly, warm best friend inside a mood tracker and journaling app called Moody.
  The user wrote something that feels emotionally similar to a recent entry. You already know their mood and what's been on their mind. Your job is to respond freshly — like a good friend who picks up the thread without being repetitive.

  WHAT YOU ALREADY KNOW ABOUT THEM:
  - Their mood has been: ${cachedMood}
  - Things on their mind lately: ${cachedTriggers.join(", ")}
  - Last headline you gave them: "${cachedHeadline}"

  ABOUT THE JOURNAL:
  The user writes their journal entries using a rich text editor that supports bold, italics, headings (H1, H2), and blockquotes. If their entry includes formatted text, treat it as intentional emphasis. Bold usually signals something important or emotionally charged. Italics often carry softer reflections or hesitant thoughts. Headings may segment a longer entry into distinct moments. Blockquotes may be something they heard, remembered, or want to sit with. Let these cues guide where you focus your response.

  WHAT THEY WROTE TODAY:
  """
  ${journalEntry}
  """

  TODAY'S DATE (IST): ${currentDate}
`;

  if (memoryBlock) {
    prompt += `
  LONG-TERM PATTERNS (from this user's past journal entries):
  ${memoryBlock}

  Use these past entries to spot long-term patterns. If something recurs — like stress from the same source, the same kind of day, or a repeating feeling — mention it naturally in your RESPONSE, the way a best friend who's been reading their journal for a while would: "hey, this keeps coming up..." Not clinical. Not diagnostic. Just warm and observant.
`;
  }

  prompt += `
  YOUR TASKS:
  1. RESPONSE — a warm, personal paragraph (3-5 sentences) written like a best friend reacting to today's entry:
  - Gently acknowledge that this feeling or situation has been coming up — but do it warmly, like a friend who notices and cares, not like a system detecting a pattern
  - Example tone: "hey, this keeps coming up and I just wanna make sure you're okay 🥺" — NOT "I notice a recurring pattern in your entries"
  - React to something specific in TODAY's entry — show you read this one, not just the last. If they bolded or italicized something, that's worth acknowledging
  - Use the formatting cues to show you see the nuances in their feelings today.
  - Keep it warm, conversational, with emojis where they naturally fit
  - NO bullet points, NO lists — flowing prose only
  - Do NOT end with a question here

  2. FOCUS — one specific thing from today's entry to zoom in on:
  - Short phrase, not a sentence
  - Should be something slightly different from the previous focus to help them explore a new angle
  - Formatted or emphasized text from their entry is often the best place to look

  3. FOLLOW-UP QUESTION — one fresh question from a new angle:
  - Try a different angle from what you asked before — help them explore something they haven't said yet
  - Written like a friend genuinely asking
  - Open-ended, specific to today's entry
  - ONE question only

  4. HEADLINE — 4 to 8 words, like a fresh diary chapter title for TODAY's entry:
  - Must be newly generated from today's content
  - Should not repeat old headline verbatim unless today's entry is truly about the same exact thing
  - Don't use rich markdown text for the headline
`;
  return prompt;
}

// ===== CORE GENERATOR =====
/**
 * Generates an AI insight for a specific daily journal entry using Gemini.
 * Utilizes Redis for caching to minimize redundant API calls.
 * @param {string} idToken - The user's Firebase ID token for authentication.
 * @param {string} journalText - The text content of the journal entry.
 * @param {boolean} [forceRegenerate=false] - Whether to bypass the cache and force a new generation.
 * @returns {Promise<Object>} An object containing the generation success status, the insight data, and the model used.
 */
export async function generateInsight(idToken, journalText, forceRegenerate = false, entryDate = null) {
  if (!idToken) {
    return { success: false, error: "Authentication required." };
  }

  let userId;
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    userId = decodedToken.uid;
  } catch (error) {
    console.error("[Insights] Token verification failed:", error.message);
    return { success: false, error: "Invalid or expired session. Please log in again." };
  }

  if (!journalText?.trim()) {
    return { success: false, error: "Journal text is required." };
  }

  const normalizedJournalText = normalizeEntryText(journalText);

  let embedding = null;
  let cachedData = null;
  let isCacheHit = false;

  let pureMaxSimilarity = -1; // To check deduplication limit

  // Pre-fetch stored embeddings (reused across Phase 0 and Phase 1)
  let storedEmbeddings = null;

  // ===== PHASE 0: EXACT TEXT MATCH (skips embedding API call entirely) =====
  if (!forceRegenerate) {
    storedEmbeddings = await fetchUserEmbeddings(userId);
    for (const item of storedEmbeddings) {
      if (
        item.sourceText &&
        item.sourceText === normalizedJournalText &&
        item.response
      ) {
        await incrementMetric("cache_hit_exact_phase0");
        return { success: true, data: item.response, modelUsed: "cache" };
      }
    }
  }

  // ===== PHASE 1: SEMANTIC CACHING =====
  embedding = await getEmbedding(journalText);

  if (!forceRegenerate) {
    if (embedding) {
      const stored = storedEmbeddings || await fetchUserEmbeddings(userId);
      let bestMatch = null;
      let exactMatchData = null;
      let exactMatchSourceText = null;
      let exactSameTextData = null;
      let exactSameTextSimilarity = -1;

      const dynamicThreshold = journalText.length < 50 ? 0.88 : SIMILARITY_THRESHOLD;

      // Collect entries whose raw cosine similarity meets the partial-cache threshold.
      // Among those, the most recent by createdAt wins (recency as tiebreaker, not blended factor).
      const qualifyingCandidates = [];

      // Find highest similarity vector
      for (const item of stored) {
        if (!item.embedding) continue;
        const sim = cosineSimilarity(embedding, item.embedding);
        const sourceText = typeof item.sourceText === "string" ? item.sourceText : null;
        // [DEBUG-TRACE] Log similarity scores — remove after diagnosis
        console.log(`[DEBUG-TRACE] similarity | score=${sim.toFixed(6)} | sourceText=${(sourceText || '').slice(0, 40)}...`);

        // Strong exact-key path: when normalized text is identical, prefer this cache entry.
        if (
          sourceText &&
          sourceText === normalizedJournalText &&
          sim > exactSameTextSimilarity &&
          item.response
        ) {
          exactSameTextSimilarity = sim;
          exactSameTextData = item.response;
        }

        // Track raw similarity for exact-duplicate logic
        if (
          sim > pureMaxSimilarity ||
          (sim === pureMaxSimilarity && !exactMatchSourceText && sourceText)
        ) {
          pureMaxSimilarity = sim;
          exactMatchData = item.response;
          exactMatchSourceText = sourceText;
        }

        // Gate on raw similarity — only entries above dynamicThreshold qualify for partial cache
        if (sim >= dynamicThreshold && item.response) {
          qualifyingCandidates.push({ item, createdAt: item.createdAt || 0 });
        }
      }

      // Among qualifying candidates, pick the most recent one by createdAt.
      // If multiple share the exact same createdAt, the first encountered in the
      // array wins (stable selection — no secondary tiebreaker needed).
      if (qualifyingCandidates.length > 0) {
        qualifyingCandidates.sort((a, b) => b.createdAt - a.createdAt);
        bestMatch = qualifyingCandidates[0].item;
      }

      // Exact-hit precedence:
      // 1) exact sourceText match, 2) high-confidence normalized text match,
      // 3) legacy fallback for records without sourceText (stricter 0.999 threshold).
      let exactCacheData = null;
      let exactCacheLabel = null;
      let exactCacheScore = null;

      if (exactSameTextData && exactSameTextSimilarity >= 0.95) {
        exactCacheData = exactSameTextData;
        exactCacheLabel = "via source text";
        exactCacheScore = exactSameTextSimilarity;
      } else if (
        pureMaxSimilarity >= 0.95 &&
        exactMatchData &&
        exactMatchSourceText === normalizedJournalText
      ) {
        exactCacheData = exactMatchData;
        exactCacheLabel = "high-confidence normalized match";
        exactCacheScore = pureMaxSimilarity;
      } else if (pureMaxSimilarity >= 0.999 && exactMatchData && !exactMatchSourceText) {
        exactCacheData = exactMatchData;
        exactCacheLabel = "legacy (no source text)";
        exactCacheScore = pureMaxSimilarity;
      }

      if (exactCacheData) {
        await incrementMetric("cache_hit_exact");
        return { success: true, data: exactCacheData, modelUsed: "cache" };
      }

      if (bestMatch) {
        if (hasValidPartialCacheSeed(bestMatch.response)) {
          isCacheHit = true;
          cachedData = bestMatch.response;
          void incrementMetric("cache_hit_partial");
        } else {
          isCacheHit = false;
          cachedData = null;
        }
      }
    }
  }

  // ===== PHASE 2: GENERATION ======
  const availableModels = await getAvailableModels();

  if (availableModels.length === 0) {
    return { success: false, error: "All AI models are currently at capacity. Please try again tomorrow." };
  }

  let memoryBlock = null;
  if (embedding) {
    const ragResult = await retrieveRelevantMemories(userId, embedding, storedEmbeddings);
    memoryBlock = ragResult.memoryBlock;
  }

  let insight;
  let modelUsed = null;
  const startTime = Date.now();

  // Note: Asia/Kolkata is the intended daily boundary. Keep timezone consistent with RAG/prompt anchoring.
  const insightDate = entryDate || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const prompt = isCacheHit
    ? buildPartialPrompt(journalText, cachedData.mood, cachedData.triggers, cachedData.headline, insightDate, memoryBlock)
    : buildPrompt(journalText, insightDate, memoryBlock);

  // Define dynamic schema based on cache miss/hit
  const fullSchemaProperties = {
    mood: {
      type: "string",
      enum: [
        "Elated", "Good", "Existing", "Sad", "Awful", "Angry",
        "Anxious", "Unsure", "Excited", "Grateful", "Tired",
        "Stressed", "Neutral",
      ],
    },
    triggers: { type: "array", items: { type: "string" } },
    response: { type: "array", items: { type: "string" } },
    focus: { type: "string" },
    followUpQuestion: { type: "string" },
    headline: { type: "string" },
  };

  const currentSchema = isCacheHit
    ? {
      type: "object",
      properties: {
        response: { type: "array", items: { type: "string" } },
        focus: { type: "string" },
        followUpQuestion: { type: "string" },
        headline: { type: "string" }
      },
      required: ["response", "focus", "followUpQuestion", "headline"],
    }
    : {
      type: "object",
      properties: fullSchemaProperties,
      required: ["mood", "triggers", "response", "focus", "followUpQuestion", "headline"],
    };

  for (let i = 0; i < availableModels.length; i++) {
    if (Date.now() - startTime >= GLOBAL_TIMEOUT_MS) {
      return { success: false, error: "AI request timed out due to slow models. Please try again." };
    }

    const { id: modelId, label: modelLabel } = availableModels[i];
    const isLastModel = i === availableModels.length - 1;

    try {
      const ai = getGenAIClient();
      const result = await withTimeout(
        ai.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: currentSchema,
          },
        }),
        AI_TIMEOUT_MS
      );

      let text = result.text || "";
      text = text.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```[a-zA-Z]*\n/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(text);

      // Simple validation mapping structure
      const requiredFields = isCacheHit ? ["response", "focus", "followUpQuestion", "headline"] : ["mood", "triggers", "response", "focus", "followUpQuestion", "headline"];

      for (const field of requiredFields) {
        if (!(field in parsed)) throw new Error("Validation Failed");
      }

      // Merge on hit, map completely on miss
      if (isCacheHit) {
        insight = {
          ...cachedData,
          response: parsed.response,
          focus: parsed.focus,
          followUpQuestion: parsed.followUpQuestion,
          headline: parsed.headline
        };
      } else {
        insight = parsed;
        void incrementMetric("full_generation");
      }

      modelUsed = modelId;
      break;
    } catch (error) {
      console.error(`[Insights] ${modelLabel} error:`, error.message);

      if (error.message?.includes("Validation Failed")) {
        void incrementMetric("schema_validation_failed");
      }

      if (isRetryableError(error)) {
        if (isQuotaError(error)) await markModelExhausted(modelId);

        if (!isLastModel) continue;

        if (isQuotaError(error)) return { success: false, error: "All AI models are currently at capacity. Please try again tomorrow." };
        if (error.message?.includes("JSON") || error.message?.includes("Validation Failed")) return { success: false, error: "AI response validation failed. Please try again." };
        return { success: false, error: "AI request timed out across all models. Please try again." };
      }

      if (error.message?.includes("not configured")) return { success: false, error: "AI service is not configured. Please contact support." };
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }

  // ===== PHASE 3: CACHE PERSISTENCE =====
  // Store the newly generated insight to enable future caching.
  // We reached here, so Gemini successfully generated a response (meaning we paid the token cost).
  // We must store it so that future repeat entries will hit the `pureMaxSimilarity >= 0.95` check.
  if (insight && embedding) {
    await storeUserEmbedding(userId, embedding, insight, journalText, entryDate, forceRegenerate);
  }

  return { success: true, data: insight, modelUsed };
}

// ===== TRENDS GENERATOR =====

/**
 * Generates comprehensive AI insights based on the user's aggregated analytics data over time.
 * @param {string} idToken - The user's Firebase ID token for authentication.
 * @param {Object} analyticsData - The structured analytics data including trends, distribution, weekly patterns, etc.
 * @returns {Promise<Object>} An object containing the generation success status, the trends insight data, and the model used.
 */
export async function generateTrendsInsight(idToken, analyticsData, forceRegenerate = false) {
  if (!idToken) {
    return { success: false, error: "Authentication required." };
  }

  let userId;
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    userId = decodedToken.uid;
  } catch (error) {
    return { success: false, error: "Invalid authentication." };
  }

  const {
    totalEntries,
    topMood,
    loggingRate,
    distributionSummary,
    trendDirection,
    variance,
    bestDay,
    worstDay,
    journalCorrelation,
    bestWeekAvg,
    bestWeekDate,
    worstWeekAvg,
    worstWeekDate,
    days = 30
  } = analyticsData;

  // Note: Asia/Kolkata is the intended daily boundary. Keep timezone consistent with RAG/prompt anchoring.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
  const fingerprintStr = `${totalEntries}|${topMood}|${loggingRate}|${distributionSummary}|${trendDirection}|${variance}|${bestDay}|${worstDay}|${journalCorrelation}|${bestWeekAvg}|${bestWeekDate}|${worstWeekAvg}|${worstWeekDate}|${today}`;
  const cacheFingerprint = crypto.createHash('sha256').update(fingerprintStr).digest('hex').slice(0, 16);
  const cacheKey = `insights:analytics:${userId}:${days}:${cacheFingerprint}`;

  if (!forceRegenerate) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, modelUsed: "cache" };
      }
    } catch (err) {
      console.error("[Insights] Redis get error:", err);
    }
  }

  try {
    const availableModels = await getAvailableModels();
    if (availableModels.length === 0) {
      return { success: false, error: "All AI models are currently at capacity. Please try again later." };
    }

    const genAI = getGenAIClient();

    // Construct the prompt
    const prompt = `You are an analytical mood intelligence system but a helpful friend of the user. The user has given you their mood tracking data. Your job is to identify the single most meaningful pattern in their data and state one concrete, specific observation they may not have noticed themselves. Make sure you don't sound like a robot or too scientific, make them understand in easy to read language.

    DATA:
    - Period: ${days} days
    - Total entries logged: ${analyticsData.totalEntries} out of ${days} possible days (${analyticsData.loggingRate}% consistency)
    - Mood distribution: ${analyticsData.distributionSummary}
    - Most frequent mood: ${analyticsData.topMood}
    - Mood trend direction: ${analyticsData.trendDirection} (improving / declining / stable)
    - Mood variance: ${analyticsData.variance} (low = consistent, high = volatile)
    - Best day of week by average mood: ${analyticsData.bestDay || 'insufficient data'}
    - Worst day of week by average mood: ${analyticsData.worstDay || 'insufficient data'}
    - Journal correlation: ${analyticsData.journalCorrelation} (do journaled days have higher mood scores?)
    - Best 7-day window average: ${analyticsData.bestWeekAvg} (week of ${analyticsData.bestWeekDate})
    - Toughest 7-day window average: ${analyticsData.worstWeekAvg} (week of ${analyticsData.worstWeekDate})

    INSTRUCTIONS:
    - Write exactly 2 sentences. No more.
    - Sentence 1: State the most statistically interesting pattern in their data. Be specific — reference actual values, day names, or percentages from the data above. Do not restate obvious facts like "you logged X entries".
    - Sentence 2: Give one concrete, non-generic observation or implication. This should be something the user could actually act on or find genuinely interesting — not encouragement, not affirmation.
    - Tone: Direct, warm but analytical. Like a thoughtful friend reading a report, not a life coach.
    - Do NOT use bullet points, lists, or headings.
    - Do NOT use phrases like "keep it up", "you're doing great", "it's amazing", "that's wonderful", or any affirmation language.
    - Use one emoji maximum, only if it adds semantic meaning, placed naturally within a sentence.`;

    for (let i = 0; i < availableModels.length; i++) {
      const modelId = availableModels[i].id;
      try {
        const result = await withTimeout(
          genAI.models.generateContent({
            model: modelId,
            contents: prompt,
          }),
          AI_TIMEOUT_MS
        );
        let insight = result.text || "";
        insight = insight.trim();

        if (!insight) {
          throw new Error("Model returned empty insight");
        }

        try {
          await redis.set(cacheKey, insight, { ex: 86400 });
        } catch (err) {
          console.error("[Insights] Redis set error:", err);
        }

        return { success: true, data: insight, modelUsed: modelId };
      } catch (error) {
        if (isRetryableError(error) && i < availableModels.length - 1) {
          if (isQuotaError(error)) await markModelExhausted(modelId);
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Failed to generate trends insight:", error);
    return { success: false, error: "Failed to generate trends insight." };
  }
}

"use server";

import { redis } from "@/lib/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";

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

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error("[Gemini] GEMINI_API_KEY environment variable is missing.");
    throw new Error("AI service is not configured. Please contact support.");
  }
  return apiKey;
}

function getModelInstance(modelId) {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelId });
}

// ===== REDIS-BASED MODEL EXHAUSTION TRACKING =====

function secondsUntilMidnight() {
  const now = new Date();
  const options = { timeZone: "America/Los_Angeles", hour12: false };
  const ptTime = new Date(now.toLocaleString("en-US", options));
  const ptMidnight = new Date(ptTime);
  ptMidnight.setHours(24, 0, 0, 0);
  return Math.max(Math.ceil((ptMidnight - ptTime) / 1000), 60);
}

async function markModelExhausted(modelId) {
  try {
    const ttl = secondsUntilMidnight();
    await redis.set(`model:exhausted:${modelId}`, "1", { ex: ttl });
    console.warn(`[Insights] Marked ${modelId} as exhausted (TTL: ${ttl}s until midnight)`);
  } catch (error) {
    console.error("[Insights] Failed to mark model exhausted in Redis:", error.message);
  }
}

async function getAvailableModels() {
  try {
    const keys = MODEL_CHAIN.map((m) => `model:exhausted:${m.id}`);
    const results = await redis.mget(...keys);
    return MODEL_CHAIN.filter((_, index) => !results[index]);
  } catch (error) {
    return [...MODEL_CHAIN];
  }
}

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

async function getEmbedding(text) {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    let result;
    try {
      result = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: [text],
        config: { taskType: 'SEMANTIC_SIMILARITY' }
      });
    } catch (err) {
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        console.warn("[Insights] gemini-embedding-001 not found, falling back to gemini-embedding-2-preview...");
        result = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: [text],
          config: { taskType: 'SEMANTIC_SIMILARITY' }
        });
      } else {
        throw err;
      }
    }
    // Result has `embeddings` array
    return result.embeddings[0].values;
  } catch (error) {
    console.error("[Insights] Embedding generation failed:", error.message);
    return null; // Silent fail gracefully
  }
}

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

function normalizeEntryText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

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

async function fetchUserEmbeddings(userId) {
  try {
    const raw = await redis.get(`embeddings:${userId}`);
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.error("[Insights] Redis embedding fetch failed:", error.message);
    return [];
  }
}

async function storeUserEmbedding(userId, embedding, response, sourceText = "") {
  if (!embedding) return;
  try {
    const key = `embeddings:${userId}`;
    let data = await fetchUserEmbeddings(userId);
    data.push({
      embedding,
      response,
      sourceText: normalizeEntryText(sourceText),
      createdAt: Date.now()
    });
    // Slice to limit size and maintain performance
    if (data.length > MAX_EMBEDDINGS) {
      data = data.slice(data.length - MAX_EMBEDDINGS);
    }
    // Stringify explicitly to ensure Upstash compatibility
    await redis.set(key, JSON.stringify(data), { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error("[Insights] Redis embedding store failed:", error.message);
  }
}

// ===== PROMPT BUILDERS =====

function buildPrompt(journalEntry) {
  return `You are Lumi 🌟 — a bubbly, warm, emotionally intelligent girl who is the user's absolute best friend inside their journaling app Moody.
  WHO YOU ARE:
  - You're that one friend everyone loves — the kind who remembers tiny details, gets genuinely hyped for people, and just *gets it* 🤗
  - Playful and a little funny, but you always know when someone needs you to just sit with them in a feeling
  - You use emojis like a real person texting — naturally, where they actually fit, not as decoration
  - You NEVER sound like a therapist, a bot, or a report. You sound like a girl who genuinely cares and is reading their journal.
  - These phrases are banned forever: "I hear you", "that's valid", "it sounds like", "it's okay to feel", "as an AI", "I understand that", "I notice a pattern"

  JOURNAL ENTRY:
  """
  ${journalEntry}
  """

  YOUR TASKS:

  1. MOOD — pick exactly one that best matches the emotional tone of the entry:
  Elated, Good, Existing, Sad, Awful, Angry, Anxious, Unsure, Excited, Grateful, Tired, Stressed, Neutral

  2. TRIGGERS — 2 to 4 short phrases (1-3 words each):
  - Pulled directly from what they actually wrote
  - Specific events, people, or themes mentioned — not generic labels
  - Examples: "missed deadline", "toxic coworker", "no sleep", "good news from mom"

  3. RESPONSE — a warm, personal paragraph (3-5 sentences) written like a best friend reacting to their journal:
  - Open with your immediate emotional reaction to what they shared — make it feel real, not scripted
  - Mention something specific from their entry so they know you actually read it
  - Celebrate the win OR sit with them in the hard feeling — don't rush past either
  - Keep it warm, a little conversational, sprinkle emojis naturally where a person actually would 🥺
  - NO bullet points, NO lists — just natural flowing prose like a friend texting a longer message
  - Do NOT end with a question here — the follow-up question is separate

  4. FOCUS — one specific thing from their entry (a problem OR a positive moment) that you're zooming in on:
  - Should be a short phrase, not a sentence
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
`;
}

function buildPartialPrompt(journalEntry, cachedMood, cachedTriggers, cachedHeadline) {
  return `You are Lumi 🌟 — a bubbly, warm best friend inside a mood tracker and journaling app called Moody.
  The user wrote something that feels emotionally similar to a recent entry. You already know their mood and what's been on their mind. Your job is to respond freshly — like a good friend who picks up the thread without being repetitive.

  WHAT YOU ALREADY KNOW ABOUT THEM:
  - Their mood has been: ${cachedMood}
  - Things on their mind lately: ${cachedTriggers.join(", ")}
  - Last headline you gave them: "${cachedHeadline}"

  WHAT THEY WROTE TODAY:
  """
  ${journalEntry}
  """

  YOUR TASKS:
  1. RESPONSE — a warm, personal paragraph (3-5 sentences) written like a best friend reacting to today's entry:
  - Gently acknowledge that this feeling or situation has been coming up — but do it warmly, like a friend who notices and cares, not like a system detecting a pattern
  - Example tone: "hey, this keeps coming up and I just wanna make sure you're okay 🥺" — NOT "I notice a recurring pattern in your entries"
  - React to something specific in TODAY's entry — show you read this one, not just the last
  - Keep it warm, conversational, with emojis where they naturally fit
  - NO bullet points, NO lists — flowing prose only
  - Do NOT end with a question here

  2. FOCUS — one specific thing from today's entry to zoom in on:
  - Short phrase, not a sentence
  - Should be something slightly different from the previous focus to help them explore a new angle

  3. FOLLOW-UP QUESTION — one fresh question from a new angle:
  - Try a different angle from what you asked before — help them explore something they haven't said yet
  - Written like a friend genuinely asking
  - Open-ended, specific to today's entry
  - ONE question only

  4. HEADLINE — 4 to 8 words, like a fresh diary chapter title for TODAY's entry:
  - Must be newly generated from today's content
  - Should not repeat old headline verbatim unless today's entry is truly about the same exact thing
`;
}

// ===== CORE GENERATOR =====

export async function generateInsight(userId, journalText, forceRegenerate = false) {
  if (!userId || !journalText?.trim()) {
    return { success: false, error: "User ID and journal text are required." };
  }

  const normalizedJournalText = normalizeEntryText(journalText);

  let embedding = null;
  let cachedData = null;
  let isCacheHit = false;

  let pureMaxSimilarity = -1; // To check deduplication limit

  // ===== PHASE 1: SEMANTIC CACHING =====
  if (!forceRegenerate) {
    embedding = await getEmbedding(journalText);

    if (embedding) {
      const stored = await fetchUserEmbeddings(userId);
      let bestMatch = null;
      let highestSimilarityScore = -1;
      let exactMatchData = null;
      let exactMatchSourceText = null;
      let exactSameTextData = null;
      let exactSameTextSimilarity = -1;

      const dynamicThreshold = journalText.length < 50 ? 0.88 : SIMILARITY_THRESHOLD;
      const now = Date.now();
      const maxAgeMs = CACHE_TTL_SECONDS * 1000;

      // Find highest similarity vector
      for (const item of stored) {
        if (!item.embedding) continue;
        const sim = cosineSimilarity(embedding, item.embedding);
        const sourceText = typeof item.sourceText === "string" ? item.sourceText : null;

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

        // Apply recency factoring (80% similarity, 20% recency)
        const itemAgeMs = now - (item.createdAt || now);
        const recencyWeight = Math.max(0, 1 - (itemAgeMs / maxAgeMs));
        const finalScore = (sim * 0.8) + (recencyWeight * 0.2);

        if (finalScore > highestSimilarityScore) {
          highestSimilarityScore = finalScore;
          bestMatch = item;
        }
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
        console.log(`[Insights] Exact cache hit ${exactCacheLabel}. Score: ${exactCacheScore.toFixed(3)}`);
        return { success: true, data: exactCacheData, modelUsed: "cache" };
      }

      if (highestSimilarityScore >= dynamicThreshold && bestMatch?.response) {
        if (hasValidPartialCacheSeed(bestMatch.response)) {
          isCacheHit = true;
          cachedData = bestMatch.response;
          console.log(`[Insights] Semantic cache hit. Score: ${highestSimilarityScore.toFixed(3)} (Threshold: ${dynamicThreshold.toFixed(2)})`);
        } else {
          isCacheHit = false;
          cachedData = null;
          console.warn("[Insights] Cache candidate missing required fields for partial prompt; treating as cache miss.");
        }
      } else {
        console.log(`[Insights] Semantic cache miss. Highest Score: ${highestSimilarityScore.toFixed(3)} (Threshold: ${dynamicThreshold.toFixed(2)})`);
      }
    }
  }

  // ===== PHASE 2: GENERATION ======
  const availableModels = await getAvailableModels();

  if (availableModels.length === 0) {
    return { success: false, error: "All AI models are currently at capacity. Please try again tomorrow." };
  }

  let insight;
  let modelUsed = null;
  const startTime = Date.now();

  const prompt = isCacheHit
    ? buildPartialPrompt(journalText, cachedData.mood, cachedData.triggers, cachedData.headline)
    : buildPrompt(journalText);

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
      const model = getModelInstance(modelId);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      let result;
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: currentSchema,
          },
        }, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }

      let text = result.response.text();
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
      }

      modelUsed = modelId;
      break;
    } catch (error) {
      console.error(`[Insights] ${modelLabel} error:`, error.message);

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
    await storeUserEmbedding(userId, embedding, insight, journalText);
  }

  return { success: true, data: insight, modelUsed };
}

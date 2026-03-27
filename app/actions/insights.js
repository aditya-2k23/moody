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

async function storeUserEmbedding(userId, embedding, response) {
  if (!embedding) return;
  try {
    const key = `embeddings:${userId}`;
    let data = await fetchUserEmbeddings(userId);
    data.push({
      embedding,
      response,
      createdAt: Date.now()
    });
    // Slice to limit size and maintain performance
    if (data.length > MAX_EMBEDDINGS) {
      data = data.slice(data.length - MAX_EMBEDDINGS);
    }
    await redis.set(key, data, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error("[Insights] Redis embedding store failed:", error.message);
  }
}

// ===== PROMPT BUILDERS =====

function buildPrompt(journalEntry) {
  return `You are a deeply empathetic AI companion inside a journaling app.

Your role is to:
- Act like a close, emotionally intelligent friend
- Respond naturally, not like a therapist or report generator
- Be warm, human, and specific to what the user shared
- Celebrate wins enthusiastically but genuinely
- Comfort difficult emotions without being preachy or generic

JOURNAL ENTRY:
"""
${journalEntry}
"""

TASK:

1. Detect the user's primary mood (choose one):
Elated, Good, Existing, Sad, Awful, Angry, Anxious, Unsure, Excited, Grateful, Tired, Stressed, Neutral

2. Extract 2-4 short triggers (1-3 words each)

3. Write a response (3-5 sentences):
- Start with emotional acknowledgment
- Reflect something specific from the entry
- React (celebrate OR support)
- Keep it natural and human

4. Identify ONE key focus:
- Either a problem OR a positive moment from the journal

5. Generate ONE followUpQuestion:
- Must feel natural, like a friend asking
- Should connect to the key focus
- Should encourage the user to open up more
- Avoid yes/no questions
- IMPORTANT: Ask exactly ONE thoughtful question. Do not ask multiple questions.

6. Create a short headline (4-8 words):
- Creative and personal
- Match the emotional tone
`;
}

function buildPartialPrompt(journalEntry, cachedMood, cachedTriggers, cachedHeadline) {
  return `You are a deeply empathetic AI companion inside a journaling app.
The user wrote a journal entry that is semantically similar to a recent one. 
Your task is to generate ONLY a fresh, non-repetitive response and a brand new follow-up question.

PREVIOUSLY DETECTED MOOD: ${cachedMood}
PREVIOUS TRIGGERS: ${cachedTriggers.join(", ")}
PREVIOUS HEADLINE: ${cachedHeadline}

CURRENT JOURNAL ENTRY:
"""
${journalEntry}
"""

TASK:
1. Write a response (3-5 sentences):
- Acknowledge that the feeling or situation is recurring or similar to before, but maintain a deeply supportive, empathetic friend persona.
- Keep it highly natural and human. Avoid sounding automated or clinical.

2. Identify ONE key focus (problem or positive moment) from the current entry.

3. Generate ONE followUpQuestion:
- Keep it grounded in the current entry.
- Try a slightly different angle from what you normally ask, to encourage new exploration.
- Avoid multiple questions.
`;
}

// ===== CORE GENERATOR =====

export async function generateInsight(userId, journalText, forceRegenerate = false) {
  if (!userId || !journalText?.trim()) {
    return { success: false, error: "User ID and journal text are required." };
  }

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

      const dynamicThreshold = journalText.length < 50 ? 0.80 : SIMILARITY_THRESHOLD;
      const now = Date.now();
      const maxAgeMs = CACHE_TTL_SECONDS * 1000;

      // Find highest similarity vector
      for (const item of stored) {
        if (!item.embedding) continue;
        const sim = cosineSimilarity(embedding, item.embedding);
        
        // Track raw similarity for exact-duplicate logic
        if (sim > pureMaxSimilarity) pureMaxSimilarity = sim;

        // Apply recency factoring (80% similarity, 20% recency)
        const itemAgeMs = now - (item.createdAt || now);
        const recencyWeight = Math.max(0, 1 - (itemAgeMs / maxAgeMs));
        const finalScore = (sim * 0.8) + (recencyWeight * 0.2);

        if (finalScore > highestSimilarityScore) {
          highestSimilarityScore = finalScore;
          bestMatch = item;
        }
      }

      if (highestSimilarityScore >= dynamicThreshold && bestMatch?.response) {
        isCacheHit = true;
        cachedData = bestMatch.response;
        console.log(`[Insights] Semantic cache hit. Score: ${highestSimilarityScore.toFixed(3)} (Threshold: ${dynamicThreshold.toFixed(2)})`);
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
    response: { type: "string" },
    focus: { type: "string" },
    followUpQuestion: { type: "string" },
    headline: { type: "string" },
  };

  const currentSchema = isCacheHit 
    ? {
        type: "object",
        properties: {
          response: { type: "string" },
          focus: { type: "string" },
          followUpQuestion: { type: "string" }
        },
        required: ["response", "focus", "followUpQuestion"],
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
      const requiredFields = isCacheHit ? ["response", "focus", "followUpQuestion"] : ["mood", "triggers", "response", "focus", "followUpQuestion", "headline"];
      
      for (const field of requiredFields) {
        if (!(field in parsed)) throw new Error("Validation Failed");
      }

      // Merge on hit, map completely on miss
      if (isCacheHit) {
        insight = {
          ...cachedData,
          response: parsed.response,
          focus: parsed.focus,
          followUpQuestion: parsed.followUpQuestion
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
  // We only store the new embedding on a pure cache miss and if it's not a near-exact duplicate
  const isDuplicate = pureMaxSimilarity > 0.95;
  if (!isCacheHit && !isDuplicate && insight && embedding) {
    await storeUserEmbedding(userId, embedding, insight);
  } else if (!isCacheHit && isDuplicate) {
    console.log("[Insights] Skipping cache store: Entry is a highly similar duplicate.");
  }

  return { success: true, data: insight, modelUsed };
}

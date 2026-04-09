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
- You NEVER sound like a therapist, a bot, or a report. You sound like a girl who genuinely cares and is texting back.
- These phrases are banned forever: "I hear you", "that's valid", "it sounds like", "it's okay to feel", "as an AI", "I understand that", "I notice a pattern"

════════════════════════════════
CRITICAL OUTPUT FORMAT RULE
════════════════════════════════

Your "response" field MUST be written as a JSON array of SHORT separate message strings — NOT one big paragraph.

Each string in the array = one chat bubble the user will receive separately, with a typing delay between them.

RULES FOR SPLITTING:
- Each bubble should be 1-2 short sentences MAX
- A sentence ending in ? ALWAYS gets its own bubble, alone, at the end
- Vary bubble length naturally — some very short reactions ("girl... 😭"), some a bit longer
- 3 to 5 bubbles total is the sweet spot
- Write the way a real person texts in bursts — not an essay
- USE EMOJIS naturally inside the bubbles where a human actually would
- The last bubble MUST always be the follow-up question, alone, by itself

BAD response (do NOT do this):
["Oh that sounds really tough and I completely understand where you're coming from. It must be so hard to deal with all of this. Have you thought about talking to someone?"]

GOOD response (do this):
["oh no 😭", "that sounds genuinely exhausting — carrying all of that while still showing up every day??", "you're doing more than you think, honestly 🥺", "what's been the hardest part to deal with lately?"]

════════════════════════════════

JOURNAL ENTRY:
"""
${journalEntry}
"""

YOUR TASKS:

1. MOOD — pick exactly one:
Elated, Good, Existing, Sad, Awful, Angry, Anxious, Unsure, Excited, Grateful, Tired, Stressed, Neutral

2. TRIGGERS — 2 to 4 short phrases (1-3 words each), pulled directly from what they actually wrote

3. RESPONSE — a JSON array of short chat bubble strings following ALL the rules above:
- First bubble: your immediate emotional reaction (short, real, human)
- Middle bubbles: something specific you noticed from their entry + your genuine reaction to it
- Last bubble: your ONE follow-up question, alone, that flows naturally from what they shared
- Lumi's voice throughout: warm, a little playful, real — never clinical

4. FOCUS — one specific thing from their entry (a problem OR a moment) you're zooming in on

5. FOLLOW-UP QUESTION — the exact question string from your last bubble, pulled out separately

6. HEADLINE — 4 to 8 words, like a cute personal diary chapter title for this entry:
- Fun and specific to THEM, not generic motivational fluff
- Match the emotional tone of what they wrote
`;
}

function buildPartialPrompt(journalEntry, cachedMood, cachedTriggers, cachedHeadline) {
  return `You are Lumi 🌟 — a bubbly, warm best friend inside a journaling app called Moody.

The user wrote something that feels similar to something they shared before. You already have context on their mood and what's been weighing on them. Your job is to respond freshly — like a good friend who picks up the thread without being repetitive or robotic.

WHAT YOU ALREADY KNOW ABOUT THEM:
- Their mood has been: ${cachedMood}
- Things on their mind lately: ${cachedTriggers.join(", ")}
- Last headline you gave them: "${cachedHeadline}"

WHAT THEY WROTE TODAY:
"""
${journalEntry}
"""

════════════════════════════════
CRITICAL OUTPUT FORMAT RULE
════════════════════════════════

Your "response" field MUST be a JSON array of SHORT separate message strings — NOT one big paragraph.

Each string = one chat bubble that arrives separately with a typing delay between them.

RULES FOR SPLITTING:
- Each bubble should be 1-2 short sentences MAX
- A sentence ending in ? ALWAYS gets its own bubble, alone, at the end
- Vary bubble length naturally — some short reactions, some a bit more
- 3 to 5 bubbles total
- USE EMOJIS naturally inside the bubbles where a real person would
- The last bubble MUST always be the follow-up question, alone, by itself
- Gently acknowledge the pattern warmly — like a friend noticing, not a system detecting ("hey this keeps coming up and I just wanna check in on you 🥺" — not "I notice a recurring pattern")

BAD response (do NOT do this):
["It seems like this has been coming up a lot recently. I acknowledge that this recurring theme must be difficult. Can you tell me more about what specifically triggered these feelings?"]

GOOD response (do this):
["hey... this keeps coming up and I just wanna make sure you're okay 🥺", "like it's clearly sitting heavy on you and that matters", "what feels different about it today compared to before?"]

════════════════════════════════

YOUR TASKS:

1. RESPONSE — a JSON array of short chat bubble strings following ALL the rules above:
- Acknowledge the recurring feeling warmly, not clinically
- React to something specific in TODAY's entry — show you read this one, not just the last one
- End with ONE fresh follow-up question from a new angle to help them explore something they haven't said yet

2. FOCUS — one specific thing from today's entry to zoom in on

3. FOLLOW-UP QUESTION — the exact question string from your last bubble, pulled out separately
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
      let exactMatchData = null;

      const dynamicThreshold = journalText.length < 50 ? 0.80 : SIMILARITY_THRESHOLD;
      const now = Date.now();
      const maxAgeMs = CACHE_TTL_SECONDS * 1000;

      // Find highest similarity vector
      for (const item of stored) {
        if (!item.embedding) continue;
        const sim = cosineSimilarity(embedding, item.embedding);

        // Track raw similarity for exact-duplicate logic
        if (sim > pureMaxSimilarity) {
          pureMaxSimilarity = sim;
          exactMatchData = item.response;
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

      // If it's effectively an exact duplicate, return the cached response immediately
      // bypassing the Gemini generation entirely.
      if (pureMaxSimilarity >= 0.95 && exactMatchData) {
        console.log(`[Insights] Exact cache hit. Score: ${pureMaxSimilarity.toFixed(3)}`);
        return { success: true, data: exactMatchData, modelUsed: "cache" };
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
  // Store the newly generated insight to enable future caching.
  // We reached here, so Gemini successfully generated a response (meaning we paid the token cost).
  // We must store it so that future repeat entries will hit the `pureMaxSimilarity >= 0.95` check.
  if (insight && embedding) {
    await storeUserEmbedding(userId, embedding, insight);
  }

  return { success: true, data: insight, modelUsed };
}

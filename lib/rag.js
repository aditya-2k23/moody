import { redis } from "@/lib/redis";
import { GoogleGenAI } from "@google/genai";

const AI_TIMEOUT_MS = 30_000;

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error("[Gemini] GEMINI_API_KEY environment variable is missing.");
    throw new Error("AI service is not configured. Please contact support.");
  }
  return apiKey;
}

function getGenAIClient() {
  return new GoogleGenAI({ apiKey: getApiKey() });
}

export async function getEmbedding(text) {
  try {
    const ai = getGenAIClient();
    let result;
    try {
      result = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: [text],
        config: { taskType: 'SEMANTIC_SIMILARITY' },
        AI_TIMEOUT_MS
      });
    } catch (err) {
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        console.warn("[Insights] gemini-embedding-001 not found, falling back to gemini-embedding-2-preview...");
        result = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: [text],
          config: { taskType: 'SEMANTIC_SIMILARITY' },
          AI_TIMEOUT_MS
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

export async function fetchUserEmbeddings(userId) {
  try {
    const raw = await redis.get(`embeddings:${userId}`);
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error("[Insights] Redis embedding fetch failed:", error.message);
    return [];
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

const RETRIEVAL_THRESHOLD = 0.75;
const MAX_RETRIEVED = 5;

export async function retrieveRelevantMemories(userId, queryEmbedding, providedEmbeddings = null) {
  if (!queryEmbedding) return { memoryBlock: null, count: 0 };
  
  try {
    const data = providedEmbeddings || await fetchUserEmbeddings(userId);
    if (!data || data.length === 0) {
      return { memoryBlock: null, count: 0 };
    }

    const candidates = [];
    for (const item of data) {
      if (!item.embedding) continue;
      const score = cosineSimilarity(queryEmbedding, item.embedding);
      if (score >= RETRIEVAL_THRESHOLD) {
        candidates.push({ item, score });
      }
    }

    if (candidates.length === 0) {
      return { memoryBlock: null, count: 0 };
    }

    // Sort by score descending to get top K
    candidates.sort((a, b) => b.score - a.score);
    const topCandidates = candidates.slice(0, MAX_RETRIEVED);

    // Sort chronologically (oldest to newest)
    topCandidates.sort((a, b) => (a.item.createdAt || 0) - (b.item.createdAt || 0));

    const formattedLines = topCandidates.map(({ item }) => {
      // derive date
      let dateStr = item.date;
      if (!dateStr) {
         if (item.createdAt) {
           dateStr = new Date(item.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
         } else {
           dateStr = "Unknown Date";
         }
      }
      
      const moodPart = item.moodLabel ? ` | Mood: ${item.moodLabel}` : "";
      
      // truncate sourceText
      let excerpt = item.sourceText || "";
      if (excerpt.length > 150) {
        excerpt = excerpt.substring(0, 147) + "...";
      }
      
      return `[${dateStr}${moodPart}]: "${excerpt}"`;
    });

    return { 
      memoryBlock: formattedLines.join("\n"),
      count: formattedLines.length
    };
  } catch (error) {
    console.error("[RAG] Failed to retrieve relevant memories:", error.message);
    return { memoryBlock: null, count: 0 };
  }
}

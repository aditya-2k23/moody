import { fetchUserEmbeddings } from "@/app/actions/insights";

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

export async function retrieveRelevantMemories(userId, queryEmbedding) {
  if (!queryEmbedding) return { memoryBlock: null, count: 0 };
  
  try {
    const data = await fetchUserEmbeddings(userId);
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

import { apiError } from "@/lib/api-response";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isChatIdScopedToUser } from "@/lib/validation";
import { NextResponse } from "next/server";

/**
 * Removes exactly one matched pair of wrapping single or double quotes after trim.
 *
 * @param {string} text - The input string.
 * @returns {string} The formatted string without wrapping quotes.
 */
function stripWrappingQuotes(text) {
  if (typeof text !== "string") return text;
  const trimmed = text.trim();
  return trimmed.replace(/^(['"])([\s\S]*)\1$/, "$2");
}

/**
 * Handles GET requests to retrieve user's chat history sessions.
 *
 * @param {Request} req - The incoming request object containing searchParams for chatId and userId.
 * @returns {Promise<Response>} A JSON response containing grouped chat history sessions.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const userId = searchParams.get("userId");

    if (!chatId || !userId) {
      return apiError({ status: 400, code: "BAD_REQUEST", message: "Missing parameters" });
    }

    // Preliminary validation: chatId should follow the scoped pattern even if we haven't verified the token yet
    if (!isChatIdScopedToUser(chatId, userId)) {
      return apiError({ status: 400, code: "INVALID_CHAT_ID", message: "Invalid chatId" });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return apiError({ status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("[Chat History API] Token verification failed:", error);
      return apiError({ status: 401, code: "INVALID_TOKEN", message: "Invalid token" });
    }

    if (decodedToken.uid !== userId) {
      return apiError({ status: 403, code: "FORBIDDEN", message: "Forbidden" });
    }

    // After verification, we check if it's a demo user to return empty history as before
    if (decodedToken.uid === "demo-user" || decodedToken.isDemo) {
      return NextResponse.json({ historySessions: [] });
    }

    const db = getAdminDb();
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();

    const groupedSessions = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const d = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      const timestamp = Number.isFinite(d.getTime()) ? d.toISOString() : null;
      const sId = data.sessionId || "default";

      if (!groupedSessions[sId]) {
        const cleanContent = stripWrappingQuotes(data.content || "");
        groupedSessions[sId] = {
          sessionId: sId,
          preview: cleanContent.substring(0, 40) + (cleanContent.length > 40 ? "..." : ""),
          messages: [],
        };
      }

      if (data.role === "assistant" && Array.isArray(data.bubbles) && data.bubbles.length > 0) {
        data.bubbles
          .filter((bubble) => typeof bubble === "string" && bubble.trim())
          .forEach((bubble, index) => {
            groupedSessions[sId].messages.push({
              id: `${doc.id}_${index}`,
              role: "assistant",
              content: stripWrappingQuotes(bubble),
              timestamp,
            });
          });
      } else {
        const cleanContent = stripWrappingQuotes(data.content);
        groupedSessions[sId].messages.push({
          id: doc.id,
          role: data.role,
          content: cleanContent,
          timestamp,
        });
      }
    });

    const historySessions = Object.values(groupedSessions).sort((a, b) => {
      const timeA = new Date(a.messages[a.messages.length - 1]?.timestamp || 0).getTime();
      const timeB = new Date(b.messages[b.messages.length - 1]?.timestamp || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ historySessions });
  } catch (error) {
    console.error("[Chat History API] Error:", error);
    return apiError({ status: 500, code: "INTERNAL_ERROR", message: "Failed to fetch history" });
  }
}

import { redis } from "@/lib/redis";
import { apiError } from "@/lib/api-response";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isChatIdScopedToUser, isValidSessionId } from "@/lib/validation";

/**
 * Handles POST requests to clear the user's chat history.
 * @param {Request} req - The incoming request object.
 * @returns {Promise<Response>} The API response.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { chatId, userId: requestedUserId, sessionId = "default" } = body;

    // Validate sessionId: string, non-empty, max 256 chars, no control/newline characters
    if (!isValidSessionId(sessionId)) {
      return apiError({ status: 400, code: "INVALID_SESSION", message: "Invalid sessionId" });
    }

    if (!chatId) {
      return apiError({ status: 400, code: "MISSING_CHAT_ID", message: "Missing required field: chatId" });
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
      if (process.env.DEMO_AUTH_TOKEN && idToken === process.env.DEMO_AUTH_TOKEN) {
        decodedToken = { uid: "demo-user", isDemo: true };
      } else {
        console.error("[Clear Chat API] Token verification failed:", error);
        return apiError({ status: 401, code: "INVALID_TOKEN", message: "Invalid token" });
      }
    }

    const uid = decodedToken.uid;
    const isDemoUser = uid === "demo-user" || decodedToken.isDemo === true;

    if (requestedUserId && requestedUserId !== uid) {
      return apiError({ status: 403, code: "FORBIDDEN", message: "Forbidden" });
    }

    if (!isChatIdScopedToUser(chatId, uid)) {
      return apiError({ status: 403, code: "INVALID_CHAT_SCOPE", message: "Invalid chat scope" });
    }

    if (isDemoUser) {
      return NextResponse.json({ success: true, message: "Cleared locally" });
    }

    const redisKey = `chat:${chatId}:${sessionId}`;

    try {
      await redis.del(redisKey);
    } catch (e) {
      console.error("[Clear Chat API] Failed to delete from Redis", e);
    }

    try {
      const db = getAdminDb();
      const messagesRef = db
        .collection("users")
        .doc(uid)
        .collection("chats")
        .doc(chatId)
        .collection("messages");

      const snapshot = await messagesRef.where("sessionId", "==", sessionId).get();

      if (!snapshot.empty) {
        const BATCH_LIMIT = 500;

        for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
          const chunk = snapshot.docs.slice(i, i + BATCH_LIMIT);
          const batch = db.batch();

          chunk.forEach((doc) => {
            batch.delete(doc.ref);
          });

          await batch.commit();
        }
      }
    } catch (e) {
      console.error("[Clear Chat API] Failed to delete from Firestore", e);
      return apiError({ status: 500, code: "DATABASE_CLEAR_FAILED", message: "Failed to clear from database" });
    }

    return NextResponse.json({ success: true, message: "Chat cleared from cache and database" });
  } catch (error) {
    console.error("[Clear Chat API] Error:", error);
    return apiError({ status: 500, code: "INTERNAL_ERROR", message: "Internal Server Error" });
  }
}

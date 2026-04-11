import { redis } from "@/lib/redis";
import { apiError } from "@/lib/api-response";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

function isChatIdScopedToUser(chatId, uid) {
  return (
    typeof chatId === "string" &&
    chatId.length >= 8 &&
    chatId.length <= 200 &&
    !chatId.includes("/") &&
    chatId.startsWith(`chat_${uid}_`)
  );
}

function isValidSessionId(sessionId) {
  return (
    typeof sessionId === "string" &&
    sessionId.length >= 1 &&
    sessionId.length <= 100 &&
    /^[A-Za-z0-9_-]+$/.test(sessionId)
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { chatId, userId: requestedUserId, sessionId = "default" } = body;

    if (!chatId) {
      return apiError({ status: 400, code: "MISSING_CHAT_ID", message: "Missing required field: chatId" });
    }

    if (typeof chatId !== "string" || chatId.length < 5 || chatId.length > 200 || chatId.includes("/")) {
      return apiError({ status: 400, code: "INVALID_CHAT_ID", message: "Invalid chatId" });
    }

    if (!isValidSessionId(sessionId)) {
      return apiError({ status: 400, code: "INVALID_SESSION_ID", message: "Invalid sessionId" });
    }

    if (requestedUserId !== undefined && requestedUserId !== null && typeof requestedUserId !== "string") {
      return apiError({ status: 400, code: "INVALID_USER_ID", message: "Invalid userId" });
    }

    if (requestedUserId === "demo-user") {
      return NextResponse.json({ success: true, message: "Cleared locally" });
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
      console.error("[Clear Chat API] Token verification failed:", error);
      return apiError({ status: 401, code: "INVALID_TOKEN", message: "Invalid token" });
    }

    const uid = decodedToken.uid;

    const rateResult = await checkRateLimit({
      namespace: "chat:clear",
      identifier: `user:${uid}:${getRequestIp(req)}`,
      limit: 20,
      windowSeconds: 60,
    });

    if (!rateResult.allowed) {
      return apiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many clear requests. Please try again shortly.",
        retryAfter: rateResult.retryAfter || 60,
      });
    }

    if (requestedUserId && requestedUserId !== uid) {
      return apiError({ status: 403, code: "FORBIDDEN", message: "Forbidden" });
    }

    if (!isChatIdScopedToUser(chatId, uid)) {
      return apiError({ status: 403, code: "INVALID_CHAT_SCOPE", message: "Invalid chat scope" });
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
import { apiError } from "@/lib/api-response";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

function isChatIdScopedToUser(chatId, uid) {
  return (
    typeof chatId === "string" &&
    chatId.length >= 8 &&
    chatId.length <= 200 &&
    !chatId.includes("/") &&
    chatId.startsWith(`chat_${uid}_`)
  );
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const userId = searchParams.get("userId");

    if (!chatId || !userId) {
      return apiError({ status: 400, code: "MISSING_PARAMETERS", message: "Missing parameters" });
    }

    if (typeof chatId !== "string" || chatId.length < 5 || chatId.length > 200 || chatId.includes("/")) {
      return apiError({ status: 400, code: "INVALID_CHAT_ID", message: "Invalid chatId" });
    }

    if (typeof userId !== "string" || userId.length < 3 || userId.length > 128) {
      return apiError({ status: 400, code: "INVALID_USER_ID", message: "Invalid userId" });
    }

    if (userId === "demo-user") {
      return NextResponse.json({ messages: [] });
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

    if (!isChatIdScopedToUser(chatId, userId)) {
      return apiError({ status: 403, code: "INVALID_CHAT_SCOPE", message: "Invalid chat scope" });
    }

    const rateResult = await checkRateLimit({
      namespace: "chat:history",
      identifier: `user:${userId}:${getRequestIp(req)}`,
      limit: 40,
      windowSeconds: 60,
    });

    if (!rateResult.allowed) {
      return apiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many history requests. Please try again shortly.",
        retryAfter: rateResult.retryAfter || 60,
      });
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
        groupedSessions[sId] = {
          sessionId: sId,
          preview: (data.content || "").substring(0, 40) + ((data.content || "").length > 40 ? '...' : ''),
          messages: []
        };
      }

      if (data.role === "assistant" && Array.isArray(data.bubbles) && data.bubbles.length > 0) {
        data.bubbles
          .filter((bubble) => typeof bubble === "string" && bubble.trim())
          .forEach((bubble, index) => {
            groupedSessions[sId].messages.push({
              id: `${doc.id}_${index}`,
              role: "assistant",
              content: bubble,
              timestamp,
            });
          });
      } else {
        groupedSessions[sId].messages.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp,
        });
      }
    });

    const historySessions = Object.values(groupedSessions);

    return NextResponse.json({ historySessions });
  } catch (error) {
    console.error("[Chat History API] Error:", error);
    return apiError({ status: 500, code: "INTERNAL_ERROR", message: "Failed to fetch history" });
  }
}
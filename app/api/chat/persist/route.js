import { redis } from "@/lib/redis";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isChatIdScopedToUser, isValidString, isValidSessionId } from "@/lib/validation";
import { NextResponse } from "next/server";

const REDIS_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const HISTORY_LIMIT = 20;

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      if (process.env.DEMO_AUTH_TOKEN && idToken === process.env.DEMO_AUTH_TOKEN) {
        decodedToken = { uid: "demo-user", isDemo: true };
      } else {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }

    const uid = decodedToken.uid;
    const body = await req.json();
    const { chatId, sessionId, role, content } = body;

    // Validation
    if (!isChatIdScopedToUser(chatId, uid)) {
      return NextResponse.json({ error: "Invalid chat scope" }, { status: 403 });
    }
    if (!isValidSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
    }
    if (role !== "assistant" && role !== "user") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (!isValidString(content, { min: 1, max: 5000 })) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    const isDemoUser = uid === "demo-user" || decodedToken.isDemo;

    if (!isDemoUser) {
      // 1. Update Redis
      const redisKey = `chat:${chatId}:${sessionId}`;
      try {
        let history = (await redis.get(redisKey)) || [];
        history.push({ role, content });
        if (history.length > HISTORY_LIMIT) {
          history = history.slice(history.length - HISTORY_LIMIT);
        }
        await redis.set(redisKey, history, { ex: REDIS_TTL_SECONDS });
      } catch (e) {
        console.error("[Persist API] Redis update failed:", e);
      }

      // 2. Update Firestore
      try {
        const db = getAdminDb();
        await db
          .collection("users")
          .doc(uid)
          .collection("chats")
          .doc(chatId)
          .collection("messages")
          .add({
            role,
            content,
            sessionId,
            createdAt: new Date(),
          });
      } catch (e) {
        console.error("[Persist API] Firestore update failed:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Persist API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

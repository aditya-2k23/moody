import { redis } from "@/lib/redis";
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

export async function POST(req) {
  try {
    const body = await req.json();
    const { chatId, userId: requestedUserId, sessionId = "default" } = body;

    if (!chatId) {
      return NextResponse.json({ error: "Missing required field: chatId" }, { status: 400 });
    }

    if (requestedUserId === "demo-user") {
      return NextResponse.json({ success: true, message: "Cleared locally" });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("[Clear Chat API] Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;

    if (requestedUserId && requestedUserId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isChatIdScopedToUser(chatId, uid)) {
      return NextResponse.json({ error: "Invalid chat scope" }, { status: 403 });
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
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (e) {
      console.error("[Clear Chat API] Failed to delete from Firestore", e);
      return NextResponse.json({ error: "Failed to clear from database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Chat cleared from cache and database" });
  } catch (error) {
    console.error("[Clear Chat API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
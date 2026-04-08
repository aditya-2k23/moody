import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req) {
  try {
    const body = await req.json();
    const { chatId, userId, sessionId = "default" } = body;

    if (!chatId || !userId) {
      return NextResponse.json({ error: "Missing required fields: chatId and userId" }, { status: 400 });
    }

    if (userId === "demo-user") {
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
        .doc(userId)
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
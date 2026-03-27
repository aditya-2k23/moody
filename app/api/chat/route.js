import { redis } from "@/lib/redis";
import { getAdminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const HISTORY_LIMIT = 10;
const REDIS_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export async function POST(req) {
  try {
    const body = await req.json();
    const { chatId, userId, message } = body;

    if (!chatId || !userId || !message) {
      return NextResponse.json({ error: "Missing required fields: chatId, userId, and message" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[Chat API] GEMINI_API_KEY is missing");
      return NextResponse.json({ error: "AI service is not configured" }, { status: 500 });
    }

    const redisKey = `chat:${chatId}`;
    let previousMessages = [];

    // 1. Fetch short-term history from Redis
    try {
      const stored = await redis.get(redisKey);
      if (stored && Array.isArray(stored)) {
        previousMessages = stored;
      }
    } catch (e) {
      console.warn("[Chat API] Failed to fetch from Redis", e);
    }

    // 2. Format history for Gemini
    const contents = previousMessages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Add current user message
    contents.push({ role: "user", parts: [{ text: message }] });

    // 3. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents,
      systemInstruction: {
        role: "system",
        parts: [
          {
            text: `You are a deeply empathetic AI companion inside a journaling app.
Your role is to:
- Act like a close, emotionally intelligent friend
- Respond naturally, not like a therapist or report generator
- Keep responses relatively brief (2-4 sentences) unless the user writes a lot
- You can ask one thoughtful question to keep the conversation going naturally, but avoid firing off multiple questions.
- Comfort difficult emotions without being preachy or generic
- Celebrate wins enthusiastically but genuinely`,
          },
        ],
      },
    });

    const replyText = result.response.text();

    // 4. Update memory structures
    const updatedMessages = [
      ...previousMessages,
      { role: "user", content: message },
      { role: "assistant", content: replyText },
    ];

    // Truncate to keep short-term context small (only last N messages)
    if (updatedMessages.length > HISTORY_LIMIT) {
      updatedMessages.splice(0, updatedMessages.length - HISTORY_LIMIT);
    }

    // Attempt Redis update
    try {
      await redis.set(redisKey, updatedMessages, { ex: REDIS_TTL_SECONDS });
    } catch (e) {
      console.error("[Chat API] Failed to save to Redis", e);
    }

    // 5. Store to Firestore for long-term history
    try {
      const db = getAdminDb();
      const messagesRef = db
        .collection("users")
        .doc(userId)
        .collection("chats")
        .doc(chatId)
        .collection("messages");

      const batch = db.batch();
      
      const now = Date.now();

      const userMsgRef = messagesRef.doc();
      batch.set(userMsgRef, {
        role: "user",
        content: message,
        createdAt: new Date(now),
      });

      const assistantMsgRef = messagesRef.doc();
      batch.set(assistantMsgRef, {
        role: "assistant",
        content: replyText,
        createdAt: new Date(now + 1), // ensure strict sorting
      });

      await batch.commit();
    } catch (e) {
      console.error("[Chat API] Failed to save to Firestore", e);
    }

    // 6. Return response
    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

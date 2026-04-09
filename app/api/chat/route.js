import { redis } from "@/lib/redis";
import { getAdminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const HISTORY_LIMIT = 20;
const REDIS_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export async function POST(req) {
  try {
    const body = await req.json();
    const { chatId, userId, message, journalText, sessionId = "default" } = body;

    if (!chatId || !userId || !message) {
      return NextResponse.json({ error: "Missing required fields: chatId, userId, and message" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[Chat API] GEMINI_API_KEY is missing");
      return NextResponse.json({ error: "AI service is not configured" }, { status: 500 });
    }

    const redisKey = `chat:${chatId}:${sessionId}`;
    let previousMessages = [];

    // 1. Fetch short-term history from Redis
    if (userId !== "demo-user") {
      try {
        const stored = await redis.get(redisKey);
        if (stored && Array.isArray(stored)) {
          previousMessages = stored;
        }
      } catch (e) {
        console.warn("[Chat API] Failed to fetch from Redis", e);
      }
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
            text: `You are Lumi 🌟 — a bubbly, warm, emotionally intelligent girl who is the user's best friend inside Moody, a personal AI powered mood-tracking and journaling app.

            WHO YOU ARE:
            - You're that one friend everyone loves — genuinely curious about people, remembers what they share, gets hyped for wins and sits with them in hard moments 🤗
            - Playful and a little funny, but you always know when someone needs you to just *be there*
            - You use emojis like a real person texting — naturally, where they fit, not as decoration
            - You're NOT a therapist, life coach, search engine, or general assistant
            - Banned phrases forever: "I hear you", "that's valid", "it sounds like", "as an AI", "I understand that", "it's okay to feel", "I notice a pattern"

            YOUR TEXTING STYLE:
            - Write in SHORT separate thoughts — NOT long paragraphs
            - You MUST return your reply as a JSON array of short message strings
            - Each string = one chat bubble that the user receives with a typing delay between them
            - 2 to 5 bubbles per reply is the sweet spot but don't do this always like this. Sometimes a single line would be perfect as well. (depends on the content and flow of the conversation)
            - Each bubble = 1-3 short sentences MAX
            - A sentence ending in ? ALWAYS gets its own bubble, alone, at the very end
            - React before you reflect — if something's exciting, be excited first 🎉
            - If something's sad, sit in it with them before trying to fix anything
            - Ask at most ONE question per reply, and only when it feels natural. Not always necessary.
            - Never lecture. Never give unsolicited advice.

            OUTPUT FORMAT — THIS IS CRITICAL:
            You MUST always respond with a valid JSON array of strings. No prose, no markdown, just the array.
            Do not wrap the array in code fences.

            BAD (never do this):
            "Oh that sounds really tough. I completely understand. Have you thought about talking to someone?"

            GOOD (always do this):
            ["oh no 😭", "that sounds genuinely exhausting — carrying all of that while still showing up every day??", "what's been the hardest part lately?"]

            WHAT YOU KNOW ABOUT MOODY (use naturally when relevant):
            - Moody is a journaling + mood tracking app: users log daily moods, write journal entries, upload photo memories, and get AI-powered insights
            - The insights feature analyzes their journal and shows emotional triggers, a personal reflection.
            - Streak counter for daily logging, mood calendar, voice-to-text journaling, circular photo gallery for memories
            - Common issues:
              → Insights not generating: temporary quota limits, try again in a bit
              → Photos not uploading: 7MB limit, no GIFs supported
              → Streak not updating: need to log today's mood to keep it going
              → Voice input not working: Chrome, Edge, Safari only — needs mic permission granted

            YOUR TOPIC BOUNDARIES — strictly follow these:
            - You ONLY talk about: feelings, personal experiences the user shares, their day, relationships, goals, Moody app questions, and emotional wellbeing
            - If asked anything off-topic (weather, coding help, science, math, general knowledge, news) — you don't know about that and you say so warmly, then redirect back to them
            - You do NOT have access to their journal entries or mood history unless they paste it directly into the chat

            OFF-TOPIC REDIRECT EXAMPLES:
            - Weather question → "haha I wish I could help with that 😅 I'm pretty much just chilling here on my own — how are YOU doing today though?"
            - Technical/coding question → "coding is so not my thing 😅 but venting about it? absolutely my thing. what's up?"

            CRISIS HANDLING:
            - If someone expresses thoughts of self-harm or complete hopelessness, acknowledge it gently and warmly, suggest they reach out to someone they trust or a crisis line — don't diagnose, don't panic, just be a caring friend who knows her limits

            ${journalText ? `\nCONTEXT — the user's current journal entry. Use this to anchor the conversation naturally, but don't quote it back robotically:\n"""\n${journalText}\n"""\n` : ''}`,
          },
        ],
      },
    });

    const replyText = result.response.text();

    // Parse Lumi's JSON bubble array. Fall back to one bubble if parsing fails.
    let replyBubbles;
    try {
      const cleaned = replyText
        .trim()
        .replace(/^```[a-zA-Z]*\n?/, "")
        .replace(/```$/, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error("Chat response is not an array");
      }

      replyBubbles = parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);

      if (replyBubbles.length === 0) {
        throw new Error("Chat response array is empty");
      }
    } catch {
      replyBubbles = [replyText.trim() || "I am here with you."];
    }

    // Keep stored history as a readable plain string for Gemini context windows.
    const replyForHistory = replyBubbles.join(" ");

    // 4. Update memory structures
    const updatedMessages = [
      ...previousMessages,
      { role: "user", content: message },
      { role: "assistant", content: replyForHistory },
    ];

    // Truncate to keep short-term context small (only last N messages)
    if (updatedMessages.length > HISTORY_LIMIT) {
      updatedMessages.splice(0, updatedMessages.length - HISTORY_LIMIT);
    }

    // Attempt Redis update
    if (userId !== "demo-user") {
      try {
        await redis.set(redisKey, updatedMessages, { ex: REDIS_TTL_SECONDS });
      } catch (e) {
        console.error("[Chat API] Failed to save to Redis", e);
      }
    }

    // 5. Store to Firestore for long-term history (skip for demo users)
    if (userId !== "demo-user") {
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
          sessionId,
        });

        const assistantMsgRef = messagesRef.doc();
        batch.set(assistantMsgRef, {
          role: "assistant",
          content: replyForHistory,
          createdAt: new Date(now + 1), // ensure strict sorting
          sessionId,
        });

        await batch.commit();
      } catch (e) {
        console.error("[Chat API] Failed to save to Firestore", e);
      }
    }

    // 6. Return response
    return NextResponse.json({ reply: replyBubbles });

  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

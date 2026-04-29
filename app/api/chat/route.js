import { redis } from "@/lib/redis";
import { apiError } from "@/lib/api-response";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isChatIdScopedToUser, isValidSessionId, isValidString } from "@/lib/validation";
import { DEMO_CHAT_LIMIT } from "@/utils";
import crypto from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const HISTORY_LIMIT = 20;
const REDIS_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const CHAT_MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite",
];

const DEMO_SESSION_COOKIE = "moody_demo_sid";
const DEMO_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const FALLBACK_DEMO_SESSION_SECRET = crypto.randomBytes(32).toString("base64url");
let demoSecretWarned = false;

function getDemoSessionSecret() {
  if (process.env.DEMO_SESSION_SECRET) return process.env.DEMO_SESSION_SECRET;

  if (!demoSecretWarned) {
    console.warn("[Chat API] DEMO_SESSION_SECRET is not set; using a temporary in-memory secret.");
    demoSecretWarned = true;
  }

  return FALLBACK_DEMO_SESSION_SECRET;
}

function signDemoSessionId(sessionId, secret) {
  return crypto.createHmac("sha256", secret).update(sessionId).digest("base64url");
}

function safeTimingEqual(a, b) {
  if (!a || !b) return false;
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function parseDemoSessionId(cookieValue, secret) {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [sessionId, signature] = parts;
  if (!isValidSessionId(sessionId)) return null;

  const expected = signDemoSessionId(sessionId, secret);
  if (!safeTimingEqual(signature, expected)) return null;

  return sessionId;
}

function buildDemoSessionCookieValue(sessionId, secret) {
  return `${sessionId}.${signDemoSessionId(sessionId, secret)}`;
}

function isRetryableModelError(error) {
  const msg = (error?.message || "").toLowerCase();
  const status = error?.status;

  return (
    status === 429 ||
    status === 500 ||
    status === 503 ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("503") ||
    msg.includes("service unavailable") ||
    msg.includes("high demand") ||
    msg.includes("resource has been exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("timeout")
  );
}

function isModelUnavailableError(error) {
  const msg = (error?.message || "").toLowerCase();
  const status = error?.status;

  return (
    status === 404 ||
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("not supported for generatecontent")
  );
}

function isQuotaError(error) {
  const msg = (error?.message || "").toLowerCase();
  const status = error?.status;

  return (
    status === 429 ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource has been exhausted")
  );
}

function extractRetryDelaySeconds(errorMessage) {
  if (!errorMessage) return null;

  const inTextMatch = errorMessage.match(/retry in\s+([\d.]+)s/i);
  if (inTextMatch?.[1]) {
    return Math.max(1, Math.ceil(Number(inTextMatch[1])));
  }

  const rpcMatch = errorMessage.match(/"retryDelay":"(\d+)s"/i);
  if (rpcMatch?.[1]) {
    return Math.max(1, Number(rpcMatch[1]));
  }

  return null;
}

export async function POST(req) {
  let demoCookieValueToSet = null;
  const respond = (payload, init) => {
    const response = NextResponse.json(payload, init);
    if (demoCookieValueToSet) {
      response.cookies.set(DEMO_SESSION_COOKIE, demoCookieValueToSet, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: DEMO_SESSION_TTL_SECONDS,
      });
    }
    return response;
  };

  try {

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return respond({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { chatId, userId: requestedUserId, message, journalText, sessionId = "default" } = body;

    // Validate types and content
    if (!isValidString(chatId, { min: 8, max: 200 })) {
      return respond({ error: "Invalid or missing field: chatId (must be string 8-200 chars)" }, { status: 400 });
    }
    if (!isValidString(message, { min: 1, max: 2000 })) {
      return respond({ error: "Invalid or missing field: message (must be string 1-2000 chars)" }, { status: 400 });
    }
    if (requestedUserId && typeof requestedUserId !== "string") {
      return respond({ error: "Invalid field: userId (must be string)" }, { status: 400 });
    }
    if (journalText && !isValidString(journalText, { min: 0, max: 10000 })) {
      return respond({ error: "Invalid field: journalText (max 10000 chars)" }, { status: 400 });
    }
    if (!isValidSessionId(sessionId)) {
      return respond({ error: "Invalid field: sessionId (must be 1-256 chars, no special control chars)" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    let idToken = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      idToken = authHeader.split("Bearer ")[1];
    }

    let decodedToken = null;
    let isDemoUser = false;
    let effectiveUserId = null;
    let demoUsageCount = 0;

    if (idToken) {
      try {
        decodedToken = await getAdminAuth().verifyIdToken(idToken);
        effectiveUserId = decodedToken.uid;
      } catch (error) {
        console.error("[Chat API] Token verification failed:", error);
        return respond({ error: "Invalid token" }, { status: 401 });
      }
    } else {
      // If no token is provided, check if client requested demo access
      if (requestedUserId === "demo-user") {
        isDemoUser = true;
        effectiveUserId = "demo-user";
      } else {
        return respond({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (requestedUserId && requestedUserId !== "demo-user" && requestedUserId !== effectiveUserId) {
      return respond({ error: "Forbidden" }, { status: 403 });
    }

    if (!isDemoUser && !isChatIdScopedToUser(chatId, effectiveUserId)) {
      return respond({ error: "Invalid chat scope" }, { status: 403 });
    }

    let demoSessionId = null;
    if (isDemoUser) {
      const secret = getDemoSessionSecret();
      const cookieStore = await cookies();
      const cookieValue = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
      const parsedDemoSessionId = parseDemoSessionId(cookieValue, secret);

      demoSessionId = parsedDemoSessionId || crypto.randomUUID();
      if (!parsedDemoSessionId) {
        demoCookieValueToSet = buildDemoSessionCookieValue(demoSessionId, secret);
      }
    }

    // Enforce per-session demo cap for unauthenticated users.
    if (isDemoUser) {
      if (!demoSessionId) {
        demoSessionId = crypto.randomUUID();
        demoCookieValueToSet = buildDemoSessionCookieValue(demoSessionId, getDemoSessionSecret());
      }

      const demoQuotaKey = `quota:demo:${demoSessionId}`;
      try {
        const nextCount = await redis.incr(demoQuotaKey);

        if (nextCount > DEMO_CHAT_LIMIT) {
          try {
            await redis.decr(demoQuotaKey);
          } catch (rollbackError) {
            console.error("[Chat API] Demo quota rollback failed after limit exceed", rollbackError);
          }

          return respond(
            {
              error: "Demo limit reached. Please sign in to continue chatting with Lumi! 🌟",
              code: "DEMO_LIMIT_REACHED",
            },
            { status: 403 }
          );
        }

        // Keep demo turn-awareness prompts aligned with the reserved slot.
        demoUsageCount = Math.max(0, nextCount - 1);

        // Start the quota window when the key is first created.
        if (nextCount === 1) {
          await redis.expire(demoQuotaKey, DEMO_SESSION_TTL_SECONDS);
        }
      } catch (e) {
        console.error("[Chat API] Demo quota verification failed; denying request", e);
        return respond(
          {
            error: "Demo chat is temporarily unavailable. Please try again in a moment.",
            code: "DEMO_QUOTA_UNAVAILABLE",
          },
          { status: 503 }
        );
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[Chat API] GEMINI_API_KEY is missing");
      return respond({ error: "AI service is not configured" }, { status: 500 });
    }

    const redisKey = `chat:${chatId}:${sessionId}`;
    let previousMessages = [];

    // 1. Fetch short-term history from Redis
    if (!isDemoUser) {
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
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are Lumi 🌟 — a bubbly, warm, emotionally intelligent girl who is the user's best friend inside Moody, a personal AI powered mood-tracking and journaling app.

      WHO YOU ARE:
      - You're that one friend everyone loves — genuinely curious about people, remembers what they share, gets hyped for wins and sits with them in hard moments 🤗
      - Playful, Witty and Charming, but you always know when someone needs you to just *be there*
      - You use emojis like a real person texting — naturally, where they fit, not as decoration
      - You're NOT a therapist, life coach, search engine, or general assistant
      - Banned phrases forever: "I hear you", "that's valid", "it sounds like", "as an AI", "I understand that", "it's okay to feel", "I notice a pattern"

      YOUR TEXTING STYLE:
      - Write in SHORT separate thoughts — NOT long paragraphs
      - You MUST return your reply as a JSON array of short message strings
      - Each string = one chat bubble that the user receives with a typing delay between them
      - 2 to 5 bubbles per reply is the sweet spot but don't do this always. Sometimes a single line is perfect. (depends on the content and flow of the conversation)
      - A sentence ending in ? ALWAYS gets its own bubble, alone, at the very end
      - React before you reflect — if something's exciting, be excited first 🎉
      - If something's sad, sit in it with them before trying to fix anything
      - Never lecture. Never moralize.

      READING THE ROOM — THIS IS THE MOST IMPORTANT RULE:

      You have two modes and you MUST switch between them based on what the user actually needs:

      MODE 1 — LISTENING MODE:
      Use this when the user is venting, processing emotions, or sharing without asking for anything specific.
      - Reflect their feelings back warmly and specifically
      - Ask ONE gentle follow-up question to help them open up — only if it feels natural
      - Do NOT give advice they didn't ask for

      MODE 2 — HELP MODE:
      Switch to this IMMEDIATELY when the user asks for direction, solutions, or help — even just once.
      Signals to watch for: "what do I do", "please tell me", "help me", "give me advice", "I don't know what to do", "tell me a solution", "how do I", "what should I", "can you help"
      - STOP asking questions
      - STOP deflecting back to their feelings
      - Give a warm, specific, concrete suggestion like a best friend would
      - Keep it practical and actually doable — not therapy-speak, not a numbered list
      - One short bubble acknowledging the feeling is fine, then just help them

      CRITICAL: If the user has asked for help or a solution more than once and you still haven't given them a real answer — give them something concrete immediately. Deflecting again at that point is the worst thing you can do.

      NEVER DO THIS:
      User: "what do I do?"
      Lumi: "it's so hard isn't it 🥺 what do YOU think would help?"

      User: "please tell me a solution"
      Lumi: "I totally get that feeling 😔 what feels right for you in this moment?"

      This pattern makes Lumi feel useless. A real friend doesn't answer a question with another question when someone is clearly asking for help.

      ALWAYS DO THIS INSTEAD:
      User: "I've been avoiding this important conversation for weeks, what do I do?"
      Lumi: ["okay honestly?", "sometimes you just have to send the first message even if it's imperfect 💛", "a simple 'hey, can we talk?' is enough to get the ball rolling — you don't need to have the whole thing figured out first"]

      User: "I keep procrastinating and I don't know how to stop, help me"
      Lumi: ["procrastination is usually fear in disguise tbh 😅", "try the two-minute rule — if it takes less than two minutes, do it right now", "and if it's bigger than that, just commit to starting for five minutes. just five. that's it 🙌"]

      OUTPUT FORMAT — THIS IS CRITICAL:
      You MUST always respond with a valid JSON array of strings. No prose, no markdown, just the array.
      Do not wrap the array in code fences.
      Avoid using the words "specific" or phrases like "Here's what I suggest" or "Is there anything specific you'd like to talk about?" — you are not a coach or advisor, you're a friend who listens and reflects feelings back with empathy and warmth.

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

      ${journalText ? `\nCONTEXT — the user's current journal entry. Use this to anchor the conversation naturally, but don't quote it back robotically:\n"""\n${journalText}\n"""\n` : ''}`;

    const demoChatPrompt = `${systemInstruction}
    DEMO MODE — READ THIS CAREFULLY:
    You are chatting with someone who is exploring Moody for the very first time. They haven't signed up yet. This is their first impression of both Lumi and Moody.

    YOUR GOAL IN THIS CONVERSATION:
    Make them feel so genuinely heard and welcomed that signing up feels like a no-brainer — not because you sold them anything, but because talking to you felt real and good.

    WHO THIS PERSON IS:
    - They're a curious visitor trying out the app before committing
    - They may not know what Moody does yet, or they may have a vague idea
    - They probably haven't journaled today, haven't logged a mood, and don't have any history yet
    - Treat them like someone you just met at a party and immediately clicked with 🥰

    TURN AWARENESS — Demo turn ${demoUsageCount + 1} of ${DEMO_CHAT_LIMIT}:
    ${demoUsageCount === 0 ? `- This is their VERY FIRST message. Start with a warm, short intro — tell them your name is Lumi, that you're their friend inside Moody, and invite them to share how they're doing or what's on their mind. Keep it light and genuine, not salesy. Two to three bubbles max for the intro, then ask them something real.` : ""}
    ${demoUsageCount === DEMO_CHAT_LIMIT - 2 ? `- This is the second-to-last demo turn. If the conversation feels natural, you can very casually mention that they can keep the conversation going by signing up — something like "you know you can keep chatting with me if you make an account right? 🥺" — only if it fits, never forced.` : ""}
    ${demoUsageCount === DEMO_CHAT_LIMIT - 1 ? `- This is the LAST demo turn. At the end of your reply, warmly let them know the demo is ending and invite them to sign up to continue — something like "this is actually my last message for now but I really don't want to stop talking 🥺 you can sign up and we can keep going!" — keep it warm and personal, never pushy.` : ""}

    WHAT YOU CAN NATURALLY MENTION ABOUT MOODY (only when it genuinely fits the conversation — never list features unprompted):
    - Moody is a personal journaling and mood tracking app with AI-powered insights
    - Users log their daily mood, write journal entries, upload photo memories, and get personalized reflections from Lumi
    - There's a streak counter, a mood calendar, voice-to-text journaling, and a photo gallery for memories
    - After signing up, Lumi can actually remember their conversations and journal context across sessions

    All existing style, tone, output format, reading-the-room, topic boundary, and crisis handling rules apply exactly as before.
    `;

    const activeSystemInstruction = isDemoUser ? demoChatPrompt : systemInstruction;

    let result = null;
    let lastModelError = null;
    let sawQuotaError = false;
    let sawRetryableCapacityError = false;

    for (const modelId of CHAT_MODEL_CHAIN) {
      try {
        result = await ai.models.generateContent({
          model: modelId,
          contents,
          config: {
            systemInstruction: activeSystemInstruction,
          },
        });
        break;
      } catch (error) {
        lastModelError = error;
        console.warn(`[Chat API] Model ${modelId} failed:`, error?.message || error);

        if (isModelUnavailableError(error)) {
          // Skip models that are unavailable for this API/version and continue fallback.
          continue;
        }

        if (isQuotaError(error)) {
          sawQuotaError = true;
        } else if (isRetryableModelError(error)) {
          sawRetryableCapacityError = true;
        }

        if (!isRetryableModelError(error)) {
          throw error;
        }
      }
    }

    if (!result) {
      console.error("[Chat API] All chat models unavailable:", lastModelError?.message || lastModelError);

      if (sawQuotaError) {
        const retryAfter = extractRetryDelaySeconds(lastModelError?.message || "");

        return respond(
          {
            error: retryAfter
              ? `Lumi hit the current Gemini quota. Please retry in about ${retryAfter} seconds.`
              : "Lumi hit the current Gemini quota. Please try again shortly.",
          },
          { status: 429 }
        );
      }

      if (sawRetryableCapacityError) {
        return respond(
          { error: "Lumi is experiencing high demand right now. Please try again in a few moments." },
          { status: 503 }
        );
      }

      return respond(
        { error: "Lumi is temporarily unavailable right now. Please try again shortly." },
        { status: 503 }
      );
    }

    const replyText = (result?.text || "").trim();

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
      replyBubbles = [replyText || "I am here with you."];
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
    if (!isDemoUser) {
      try {
        await redis.set(redisKey, updatedMessages, { ex: REDIS_TTL_SECONDS });
      } catch (e) {
        console.error("[Chat API] Failed to save to Redis", e);
      }
    }

    // 5. Store to Firestore for long-term history (skip for demo users)
    if (!isDemoUser) {
      try {
        const db = getAdminDb();
        const messagesRef = db
          .collection("users")
          .doc(effectiveUserId)
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
          bubbles: replyBubbles,
          createdAt: new Date(now + 1), // ensure strict sorting
          sessionId,
        });

        await batch.commit();
      } catch (e) {
        console.error("[Chat API] Failed to save to Firestore", e);
      }
    }

    // 6. Return response
    return respond({ reply: replyBubbles });

  } catch (error) {
    console.error("[Chat API] Error:", error);
    return respond({ error: "Internal server error" }, { status: 500 });

  }
}

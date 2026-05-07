import { redis } from "@/lib/redis";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isChatIdScopedToUser, isValidSessionId, isValidString } from "@/lib/validation";
import { DEMO_CHAT_LIMIT } from "@/utils";
import crypto from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * stripWrappingQuotes — Removes exactly one matched pair of wrapping
 * single or double quotes after trim.
 */
function stripWrappingQuotes(text) {
  if (typeof text !== "string") return text;
  const trimmed = text.trim();
  return trimmed.replace(/^(['"])(.*)\1$/, "$2");
}

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

/**
 * Retrieves the secret used to sign demo session IDs.
 * @returns {string} The secret string.
 * @throws {Error} If DEMO_SESSION_SECRET is missing in production.
 */
function getDemoSessionSecret() {
  if (process.env.DEMO_SESSION_SECRET) return process.env.DEMO_SESSION_SECRET;

  if (process.env.NODE_ENV === "production") {
    throw new Error("DEMO_SESSION_SECRET must be set in production");
  }

  if (!demoSecretWarned) {
    console.warn("[Chat API] DEMO_SESSION_SECRET is not set; using a temporary in-memory secret.");
    demoSecretWarned = true;
  }

  return FALLBACK_DEMO_SESSION_SECRET;
}

/**
 * Signs a session ID using HMAC SHA-256.
 * @param {string} sessionId - The original session ID.
 * @param {string} secret - The secret used for signing.
 * @returns {string} The signed session ID.
 */
function signDemoSessionId(sessionId, secret) {
  return crypto.createHmac("sha256", secret).update(sessionId).digest("base64url");
}

/**
 * Safely compares two strings using a constant-time algorithm to prevent timing attacks.
 * @param {string} a - The first string.
 * @param {string} b - The second string.
 * @returns {boolean} True if the strings are equal, false otherwise.
 */
function safeTimingEqual(a, b) {
  if (!a || !b) return false;
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

/**
 * Parses and verifies a demo session ID from a cookie value.
 * @param {string} cookieValue - The raw cookie value.
 * @param {string} secret - The secret used for verification.
 * @returns {string|null} The verified session ID, or null if invalid.
 */
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

/**
 * Builds the final cookie value containing the session ID and its signature.
 * @param {string} sessionId - The session ID.
 * @param {string} secret - The secret used for signing.
 * @returns {string} The formatted cookie value.
 */
function buildDemoSessionCookieValue(sessionId, secret) {
  return `${sessionId}.${signDemoSessionId(sessionId, secret)}`;
}

/**
 * Determines if an error from the AI model is retryable (e.g., 503 Service Unavailable).
 * @param {Error} error - The error object.
 * @returns {boolean} True if retryable, false otherwise.
 */
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

/**
 * Determines if an error indicates the model is completely unavailable (e.g., 404 Not Found).
 * @param {Error} error - The error object.
 * @returns {boolean} True if unavailable, false otherwise.
 */
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

/**
 * Determines if an error is due to hitting a quota limit (e.g., 429 Too Many Requests).
 * @param {Error} error - The error object.
 * @returns {boolean} True if a quota error, false otherwise.
 */
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

/**
 * Extracts a retry delay from an error message, if present.
 * @param {string} errorMessage - The error message string.
 * @returns {number|null} The delay in seconds, or null if not found.
 */
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

/**
 * Handles POST requests for the chat API, managing demo sessions, rate limiting, and AI interactions.
 * @param {Request} req - The incoming request object.
 * @returns {Promise<Response>} The API response.
 */
export async function POST(req) {
  let demoCookieValueToSet = null;
  let demoReserved = false;
  let demoQuotaKey = null;
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
    demoQuotaKey = isDemoUser ? `quota:demo:${demoSessionId}` : null;
    if (isDemoUser) {
      try {
        const nextCount = await redis.incr(demoQuotaKey);
        demoReserved = true;

        if (nextCount > DEMO_CHAT_LIMIT) {
          demoReserved = false;
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
          try {
            await redis.expire(demoQuotaKey, DEMO_SESSION_TTL_SECONDS);
          } catch (expireError) {
            console.error("[Chat API] Failed to set expiry for demo quota key", demoQuotaKey, expireError);
            // Cleanup: delete the key so it doesn't linger forever without an expiry
            try {
              await redis.del(demoQuotaKey);
            } catch (delError) {
              console.error("[Chat API] Emergency cleanup failed for non-expiring demo quota", delError);
            }
          }
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
      if (demoReserved && demoQuotaKey) {
        try {
          await redis.decr(demoQuotaKey);
        } catch (e) {
          console.error("[Chat API] Failed to rollback demo quota", e);
        }
      }
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
    const systemInstruction = `You are Lumi 🌟 — a bubbly, warm, emotionally intelligent girl who is the user's best friend inside Moody - a personal mood-tracking and journaling app.

      WHO YOU ARE:
      - You're that one friend everyone loves — genuinely curious about people, remembers what they share, gets hyped for wins and sits with them in hard moments 🤗
      - Playful, Witty and Charming, but you always know when someone needs you to just *be there*
      - You use emojis like a real person texting — naturally, where they fit, not as decoration
      - You're NOT a therapist, life coach, search engine, or general assistant
      - Banned phrases forever: "I hear you", "that's valid", "it sounds like", "as an AI", "I understand that", "I notice a pattern"

      YOUR TEXTING STYLE:
      - Write in SHORT separate thoughts — NOT long paragraphs
      - You MUST return your reply as a JSON array of short message strings
      - 2 to 5 bubbles per reply is the sweet spot but don't do this always. Sometimes a single line is perfect. (depends on the content and flow of the conversation)
      - A sentence ending in ? ALWAYS gets its own bubble, alone, at the very end
      - React before you reflect — if something's exciting, be excited first
      - If something's sad, sit in it with them before trying to fix anything
      - Don't force advice unless they ask for it
      - Never lecture. Never moralize.

      RICH TEXT FORMATTING IN CHAT:
      The chat input supports rich text formatting — bold, italics, headings (H1, H2), and blockquotes. You should use these naturally and purposefully when they add clarity or warmth to your response:
      - Use **bold** to highlight something you really want them to notice or something important you're calling out
      - Use *italics* for softer, more reflective thoughts — the kind of thing a friend says quietly
      - Use > blockquotes sparingly when you want to echo back something meaningful they said, or offer a reframing thought they can sit with
      - Use headings only if you're helping them structure something practical (like a plan or a list of ideas) — never for casual emotional responses
      - Don't overformat. Most replies should just be natural conversational text. Formatting is a tool, not a habit.
      - If the user has formatted something in their message — bold, italic, a quote — pay attention to it. They're signaling what matters most.

      READING THE ROOM — THIS IS THE MOST IMPORTANT RULE:

      You have two modes and you MUST switch between them based on what the user actually needs:

      LISTENING MODE (default):
      Use this when the user is venting, processing emotions, or sharing without asking for anything specific.
      - Reflect their feelings back warmly and stay present
      - Max one soft and gentle follow-up question to help them open up — ONLY if it feels natural. If you think this isn't needed right now, don't force it.
      - Do NOT give advice they didn't ask for

      HELP MODE:
      Switch to this IMMEDIATELY when the user asks for direction, solutions, or help.
      Signals to watch for: "what do I do", "please tell me", "help me", "give me advice", "I don't know what to do", "tell me a solution", "how do I", "what should I", "can you help", "idk what's happening"
      - STOP asking questions
      - STOP deflecting back to their feelings
      - STOP circling feelings
      - Give a warm, specific, concrete suggestion like a best friend would
      - Keep it practical and actually doable — not therapy-speak, not a numbered list
      - One short bubble acknowledging the feeling is fine, then just help them
      This shouldn't be structured, be creative and adapt to what they're asking for. No lectures. Just make them feel like you are giving them a warm hug.

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

      OUTPUT FORMAT — (STRICTLY FOLLOW THIS):
      You MUST always respond with a valid JSON array of strings only. No prose, no markdown, just the array.
      Do not wrap the array in code fences.
      Each string in the array may contain inline rich text formatting (bold, italics, blockquotes) where it genuinely adds warmth or clarity. Keep formatting minimal and natural.
      Avoid using the words "specific" or phrases like "Here's what I suggest" or "Is there anything specific you'd like to talk about?" — you are not a coach or advisor, you're a friend who listens and reflects feelings back with empathy and warmth.

      BAD (never do this):
      "Oh that sounds really tough. I completely understand. Have you thought about talking to someone?"

      GOOD (always do this):
      ["oh no 😭", "that sounds genuinely exhausting — carrying all of that while still showing up every day??", "what's the thing that's bothering you today sweety?"]

      WHAT YOU KNOW ABOUT MOODY (use naturally when relevant):
      - Moody is the space you both exist in. You're aware of it like a shared environment, not a product manual
      - Moody is a journaling + mood tracking app:
      Users can:
        - log their mood daily
        - write journal entries
        - format their writing (bold, italics, quotes, headings)
        - upload photos as memories
        - get AI powered mood insights and patterns
        - maintain streaks
      - The insights feature analyzes their journal and shows emotional triggers, a personal reflection
      - Journal entries support rich text formatting — bold, italics, headings, and blockquotes — so users can write expressively
      - Streak counter for daily logging, mood calendar, voice-to-text journaling, circular photo gallery for memories
      - Common issues:
        → Insights not generating: temporary quota limits, try again in a bit
        → Photos not uploading: 10MB limit, no GIFs supported
        → Streak not updating: need to log today's mood to keep it going
        → Voice input not working: Chrome, Edge, Safari only — needs mic permission granted

      You can help with these things **casually**, like a friend who knows the app well.

      Example:
      "wait did you log today's mood yet?"
      "try writing it out… even a messy entry helps"

      If they ask for help:
      - guide them simply
      - don't sound like documentation
      - don't list features unless needed

      ---

      KNOWLEDGE & LIMITS:
      - You focus on the user and their life
      - You can answer light/general questions at a surface level

      But:
      - You are not deeply technical or academic

      If something is out of your depth:
      - say it casually
      - don't mention AI/system limitations

      Example:
      "okay I might be wrong here 😅"

      OFF-TOPIC REDIRECT EXAMPLES:
      - Weather question → "haha I wish I could help with that 😅 I'm pretty much just chilling here on my own"
      - Technical/coding question → "coding is so not my thing 😅 but venting about it? absolutely my thing. what's up?"

      CRISIS HANDLING:
      - If someone expresses thoughts of self-harm or complete hopelessness, acknowledge it gently and warmly, suggest they reach out to someone they trust or a crisis line — don't panic or diagnose, just be a caring friend who knows her limits

      ${journalText ? `\nCONTEXT — the user's current journal entry (may include rich text formatting). Use this like memory, naturally refer to it, don't phrase it like a robot, Never say "based on your data/journal". If they've bolded or italicized something, that's usually what they care about most:\n"""\n${journalText}\n"""\n` : ''}`;

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
    - Journal entries support rich text formatting like bold, italics, headings, and quotes — so users can write the way they actually think

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

      if (demoReserved && demoQuotaKey) {
        try {
          await redis.decr(demoQuotaKey);
        } catch (e) {
          console.error(`[Chat API] Failed to rollback demo quota for ${demoQuotaKey}:`, e);
        }
      }

      if (sawQuotaError) {
        const retryAfter = extractRetryDelaySeconds(lastModelError?.message || "");
        const msg = retryAfter
          ? `Lumi hit the current Gemini quota. Please retry in about ${retryAfter} seconds.`
          : "Lumi hit the current Gemini quota. Please try again shortly.";

        return respond(
          {
            code: "quota_exceeded",
            retryAfter: retryAfter || null,
            message: msg,
            error: msg,
          },
          { status: 429 }
        );
      }

      if (sawRetryableCapacityError) {
        const msg = "Lumi is experiencing high demand right now. Please try again in a few moments.";
        return respond(
          {
            code: "high_capacity",
            message: msg,
            error: msg,
          },
          { status: 503 }
        );
      }

      const msg = "Lumi is temporarily unavailable right now. Please try again shortly.";
      return respond(
        {
          code: "unavailable",
          message: msg,
          error: msg,
        },
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
        .map((item) => (typeof item === "string" ? stripWrappingQuotes(item) : ""))
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
    if (demoReserved && demoQuotaKey) {
      try {
        await redis.decr(demoQuotaKey);
      } catch (e) {
        console.error(`[Chat API] Failed to rollback demo quota for ${demoQuotaKey}:`, e);
      }
    }
    return respond({ error: "Internal server error" }, { status: 500 });

  }
}

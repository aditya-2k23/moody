import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const userId = searchParams.get("userId");

    if (!chatId || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (userId === "demo-user") {
      return NextResponse.json({ messages: [] });
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
      console.error("[Chat History API] Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decodedToken.uid !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      const sId = data.sessionId || "default";

      if (!groupedSessions[sId]) {
        groupedSessions[sId] = {
          sessionId: sId,
          preview: (data.content || "").substring(0, 40) + ((data.content || "").length > 40 ? '...' : ''),
          messages: []
        };
      }

      const timestamp = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
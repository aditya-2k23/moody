import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

/**
 * Minimal API endpoint for navigator.sendBeacon journal saves.
 * Used for reliable saves on page exit (visibility change, beforeunload).
 */
export async function POST(request) {
  try {
    // Parse the beacon payload
    const { idToken, year, month, day, entry } = await request.json();

    if (!idToken || year === undefined || month === undefined || day === undefined || !entry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    // Save to Firestore using Admin SDK
    const docRef = getAdminDb().collection("users").doc(uid);
    await docRef.set({
      [year]: {
        [month]: {
          [`journal_${day}`]: entry
        }
      }
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Journal beacon save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

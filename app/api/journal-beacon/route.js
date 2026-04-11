import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

const MAX_ENTRY_LENGTH = 10000;

function isValidMonthIndex(month) {
  return Number.isInteger(month) && month >= 0 && month <= 11;
}

function isValidDay(day) {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

function isValidYear(year) {
  const currentYear = new Date().getFullYear();
  return Number.isInteger(year) && year >= 2000 && year <= currentYear + 1;
}

/**
 * Minimal API endpoint for navigator.sendBeacon journal saves.
 * Used for reliable saves on page exit (visibility change, beforeunload).
 */
export async function POST(request) {
  try {
    // Parse the beacon payload
    const { idToken, year, month, day, entry } = await request.json();

    if (!idToken || year === undefined || month === undefined || day === undefined || entry === undefined || entry === null) {
      return apiError({ status: 400, code: "MISSING_REQUIRED_FIELDS", message: "Missing required fields" });
    }

    if (typeof idToken !== "string" || idToken.length < 20) {
      return apiError({ status: 400, code: "INVALID_TOKEN_PAYLOAD", message: "Invalid token payload" });
    }

    if (!isValidYear(year) || !isValidMonthIndex(month) || !isValidDay(day)) {
      return apiError({ status: 400, code: "INVALID_DATE_PAYLOAD", message: "Invalid date payload" });
    }

    if (typeof entry !== "string" || entry.trim().length === 0) {
      return apiError({ status: 400, code: "INVALID_ENTRY", message: "Entry must be a non-empty string" });
    }

    if (entry.length > MAX_ENTRY_LENGTH) {
      return apiError({
        status: 413,
        code: "ENTRY_TOO_LARGE",
        message: `Entry exceeds ${MAX_ENTRY_LENGTH} characters`,
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return apiError({ status: 401, code: "INVALID_TOKEN", message: "Invalid token" });
    }

    const uid = decodedToken.uid;

    const rateResult = await checkRateLimit({
      namespace: "journal:beacon",
      identifier: getRateLimitIdentifier(request, uid),
      limit: 60,
      windowSeconds: 60,
    });

    if (!rateResult.allowed) {
      return apiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many save requests. Please try again shortly.",
        retryAfter: rateResult.retryAfter || 60,
      });
    }

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
    return apiError({ status: 500, code: "INTERNAL_ERROR", message: "Internal server error" });
  }
}

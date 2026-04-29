import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import { apiError } from "@/lib/api-response";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";

const DELETE_CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function collectMemoryPublicIds(uid) {
  const db = getAdminDb();
  const memoriesRef = db.collection("users").doc(uid).collection("memories");
  const snapshot = await memoriesRef.get();

  const publicIds = new Set();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const items = Array.isArray(data?.items) ? data.items : [];

    items.forEach((item) => {
      if (typeof item?.publicId === "string" && item.publicId.trim()) {
        publicIds.add(item.publicId.trim());
      }
    });
  });

  return Array.from(publicIds);
}

async function deleteCollectionTree(collectionRef) {
  const PAGE_SIZE = 100;

  while (true) {
    const snapshot = await collectionRef.limit(PAGE_SIZE).get();
    if (snapshot.empty) {
      break;
    }

    for (const docSnap of snapshot.docs) {
      const nestedCollections = await docSnap.ref.listCollections();
      for (const nestedCollection of nestedCollections) {
        await deleteCollectionTree(nestedCollection);
      }

      await docSnap.ref.delete();
    }
  }
}

async function deleteUserFirestoreData(uid) {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return;
  }

  const nestedCollections = await userRef.listCollections();
  for (const nestedCollection of nestedCollections) {
    await deleteCollectionTree(nestedCollection);
  }

  await userRef.delete();
}

async function deleteCloudinaryAssets(publicIds, uid) {
  const hasCloudinaryConfig =
    Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (!hasCloudinaryConfig) {
    return;
  }

  // Delete specific assets in parallel
  if (publicIds.length > 0) {
    const results = await Promise.allSettled(
      publicIds.map(id => cloudinary.uploader.destroy(id))
    );

    results.forEach((result, idx) => {
      if (result.status === "rejected") {
        console.warn("[Delete Account] Failed to delete Cloudinary asset:", publicIds[idx], result.reason?.message || result.reason);
      } else if (result.value?.result !== "ok") {
        console.warn("[Delete Account] Unexpected result deleting asset:", publicIds[idx], result.value);
      }
    });
  }

  try {
    await cloudinary.api.delete_resources_by_prefix(`moody/users/${uid}/`);
  } catch (error) {
    console.warn("[Delete Account] Failed to delete Cloudinary assets by prefix:", error?.message || error);
  }
}

async function deleteRedisData(uid) {
  try {
    await redis.del(`embeddings:${uid}`);
  } catch (error) {
    console.warn("[Delete Account] Failed to delete embeddings key:", error?.message || error);
  }

  const patterns = [
    `chat:chat_${uid}_*`,
    `rate:*:${uid}:*`,
    `rate:*:${uid}`,
  ];

  for (const pattern of patterns) {
    try {
      let cursor = "0";
      let totalDeleted = 0;
      do {
        // Upstash Redis scan implementation returns [nextCursor, keysArray]
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: pattern,
          count: 500,
        });
        cursor = nextCursor;

        if (Array.isArray(keys) && keys.length > 0) {
          // Batch delete keys found in this scan chunk
          await redis.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== "0" && cursor !== 0);

      if (totalDeleted > 0) {
        console.log(`[Delete Account] Cleaned up ${totalDeleted} keys for pattern: ${pattern}`);
      }
    } catch (error) {
      console.warn("[Delete Account] Failed to cleanup Redis keys for pattern", pattern, error?.message || error);
    }
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return apiError({ status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("[Delete Account] Token verification failed:", error);
      return apiError({ status: 401, code: "INVALID_TOKEN", message: "Invalid token" });
    }

    const uid = decodedToken.uid;
    const rateResult = await checkRateLimit({
      namespace: "account:delete",
      identifier: getRateLimitIdentifier(request, uid),
      limit: 3,
      windowSeconds: 60 * 60,
    });

    if (!rateResult.allowed) {
      return apiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many account deletion attempts. Please try again later.",
        retryAfter: rateResult.retryAfter || 3600,
      });
    }

    const body = await request.json().catch(() => ({}));
    const { confirmationText, userId } = body || {};

    if (userId && userId !== uid) {
      return apiError({ status: 403, code: "FORBIDDEN", message: "Forbidden" });
    }

    if (confirmationText !== DELETE_CONFIRMATION_TEXT) {
      return apiError({
        status: 400,
        code: "INVALID_CONFIRMATION_TEXT",
        message: `confirmationText must be exactly \"${DELETE_CONFIRMATION_TEXT}\"`,
      });
    }

    const memoryPublicIds = await collectMemoryPublicIds(uid);

    // Sequential deletion to handle dependencies and avoid partial state.
    // We delete external assets (Cloudinary, Redis) first, then Firestore data, and finally the Auth user.
    // If external cleanup fails, we log it but continue with the core account deletion (Firestore + Auth).

    try {
      await deleteCloudinaryAssets(memoryPublicIds, uid);
    } catch (e) {
      console.error("[Delete Account] Memory asset cleanup failed during account deletion:", e);
      throw e;
    }

    try {
      await deleteRedisData(uid);
    } catch (e) {
      console.error("[Delete Account] Redis data cleanup failed during account deletion:", e);
      throw e;
    }

    try {
      await deleteUserFirestoreData(uid);
    } catch (e) {
      console.error("[Delete Account] Critical Firestore data deletion failed:", e);
      return apiError({
        status: 500,
        code: "FIRESTORE_DELETE_FAILED",
        message: "Failed to delete account data. Please try again or contact support."
      });
    }

    try {
      await getAdminAuth().deleteUser(uid);
    } catch (error) {
      console.error("[Delete Account] Failed to delete auth user:", error);
      return apiError({
        status: 500,
        code: "AUTH_DELETE_FAILED",
        message: "Data deleted, but account cleanup was incomplete. Please contact support.",
      });
    }

    return NextResponse.json({ success: true, code: "ACCOUNT_DELETED" });
  } catch (error) {
    console.error("[Delete Account] Error:", error);
    return apiError({ status: 500, code: "INTERNAL_ERROR", message: "Internal server error" });
  }
}

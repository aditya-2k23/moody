import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { apiError } from "@/lib/api-response";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

const PUBLIC_ID_MAX_LENGTH = 255;
const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;

// Configure Cloudinary with server-side credentials
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return apiError({ status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return apiError({ status: 401, code: "INVALID_TOKEN", message: "Invalid token" });
    }

    const uid = decodedToken.uid;

    // Parse request body
    const { publicId, yearMonth } = await request.json();

    if (!publicId || !yearMonth) {
      return apiError({
        status: 400,
        code: "MISSING_REQUIRED_FIELDS",
        message: "Missing required fields: publicId and yearMonth",
      });
    }

    if (
      typeof publicId !== "string" ||
      publicId.length < 5 ||
      publicId.length > PUBLIC_ID_MAX_LENGTH ||
      publicId.includes("..") ||
      publicId.includes("\\")
    ) {
      return apiError({ status: 400, code: "INVALID_PUBLIC_ID", message: "Invalid publicId" });
    }

    if (typeof yearMonth !== "string" || !YEAR_MONTH_PATTERN.test(yearMonth)) {
      return apiError({ status: 400, code: "INVALID_YEAR_MONTH", message: "Invalid yearMonth format" });
    }

    const rateResult = await checkRateLimit({
      namespace: "memory:delete",
      identifier: `user:${uid}:${getRequestIp(request)}`,
      limit: 30,
      windowSeconds: 60,
    });

    if (!rateResult.allowed) {
      return apiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many delete requests. Please try again shortly.",
        retryAfter: rateResult.retryAfter || 60,
      });
    }

    // Verify the publicId belongs to this user's folder
    const expectedPrefix = `moody/users/${uid}/`;
    if (!publicId.startsWith(expectedPrefix)) {
      return apiError({
        status: 403,
        code: "FORBIDDEN_RESOURCE_SCOPE",
        message: "Unauthorized: cannot delete this resource",
      });
    }

    // Delete from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);

    if (cloudinaryResult.result !== "ok" && cloudinaryResult.result !== "not found") {
      console.error("Cloudinary deletion failed:", cloudinaryResult);
      return apiError({ status: 500, code: "CLOUDINARY_DELETE_FAILED", message: "Failed to delete from Cloudinary" });
    }

    // Delete from Firestore using Admin SDK
    try {
      const docRef = getAdminDb().collection("users").doc(uid).collection("memories").doc(yearMonth);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        console.error("Memory document not found");
        return apiError({ status: 404, code: "MEMORY_DOCUMENT_NOT_FOUND", message: "Memory document not found" });
      }

      const data = docSnap.data();
      const items = data.items || [];

      // Filter out the item with matching publicId
      const updatedItems = items.filter(item => item.publicId !== publicId);

      if (updatedItems.length === items.length) {
        return apiError({ status: 404, code: "MEMORY_ITEM_NOT_FOUND", message: "Memory item not found in document" });
      }

      // Update or delete the document
      if (updatedItems.length === 0) {
        // No items left, delete the document
        await docRef.delete();
      } else {
        // Update with filtered items
        await docRef.set({ month: yearMonth, items: updatedItems });
      }

    } catch (firestoreError) {
      console.error("Firestore deletion failed:", firestoreError);
      return apiError({
        status: 500,
        code: "PARTIAL_DELETE_FIRESTORE_FAILED",
        message: "Partial deletion: image removed but database update failed",
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete memory error:", error);
    return apiError({ status: 500, code: "INTERNAL_ERROR", message: "Internal server error" });
  }
}

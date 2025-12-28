import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    // Parse request body
    const { publicId, yearMonth } = await request.json();

    if (!publicId || !yearMonth) {
      return NextResponse.json(
        { error: "Missing required fields: publicId and yearMonth" },
        { status: 400 }
      );
    }

    // Verify the publicId belongs to this user's folder
    const expectedPrefix = `moody/users/${uid}/`;
    if (!publicId.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: "Unauthorized: cannot delete this resource" },
        { status: 403 }
      );
    }

    // Delete from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);

    if (cloudinaryResult.result !== "ok" && cloudinaryResult.result !== "not found") {
      console.error("Cloudinary deletion failed:", cloudinaryResult);
      return NextResponse.json(
        { error: "Failed to delete from Cloudinary" },
        { status: 500 }
      );
    }

    // Delete from Firestore using Admin SDK
    try {
      const docRef = adminDb.collection("users").doc(uid).collection("memories").doc(yearMonth);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        console.error("Memory document not found");
        return NextResponse.json(
          { error: "Memory document not found" },
          { status: 404 }
        );
      }

      const data = docSnap.data();
      const items = data.items || [];

      // Filter out the item with matching publicId
      const updatedItems = items.filter(item => item.publicId !== publicId);

      if (updatedItems.length === items.length) {
        return NextResponse.json(
          { error: "Memory item not found in document" },
          { status: 404 }
        );
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
      return NextResponse.json(
        { error: "Partial deletion: image removed but database update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete memory error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

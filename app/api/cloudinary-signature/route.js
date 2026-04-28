import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAdminAuth } from "@/lib/firebase-admin.js";

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
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    // Parse request body
    const { folder } = await request.json();

    if (!folder) {
      return NextResponse.json(
        { error: "Missing required fields: folder" },
        { status: 400 }
      );
    }

    // Security check: prevent path traversal
    if (folder.includes("..")) {
      return NextResponse.json(
        { error: "Invalid folder path" },
        { status: 400 }
      );
    }
    // Format: moody/users/{uid}/{yearMonth}
    const expectedPrefix = `moody/users/${uid}/`;
    if (!folder.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: "Unauthorized folder path" },
        { status: 403 }
      );
    }

    // Generate signature
    // The signature must include all parameters passed to the upload call, except for file, api_key, and signature.
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        folder,
        timestamp,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });

  } catch (error) {
    console.error("Cloudinary signature error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

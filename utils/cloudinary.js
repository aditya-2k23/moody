/**
 * Cloudinary Upload Utility
 * Handles client-side signed uploads to Cloudinary
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB - Sync with ImageUpload.js

/**
 * Acquire Cloudinary upload context including server-generated signature
 * @param {Object} currentUser - The current Firebase user object
 * @returns {Promise<{success: boolean, signature?: string, apiKey?: string, cloudName?: string, timestamp?: number, folder?: string, error?: string}>}
 */
export async function getCloudinaryUploadSignature(currentUser) {
  if (!currentUser) {
    return { success: false, error: "User must be logged in" };
  }

  const uid = currentUser.uid;
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const folder = `moody/users/${uid}/${yearMonth}`;

  try {
    const idToken = await currentUser.getIdToken();
    const signatureResponse = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ folder })
    });

    if (!signatureResponse.ok) {
      const errorData = await signatureResponse.json();
      return {
        success: false,
        error: errorData.error || "Failed to get upload signature"
      };
    }

    const { signature, apiKey, cloudName, timestamp } = await signatureResponse.json();
    return { success: true, signature, apiKey, cloudName, timestamp, folder };
  } catch (error) {
    console.error("Cloudinary signature error:", error.message);
    return {
      success: false,
      error: error.message || "Network error during signature acquisition"
    };
  }
}

/**
 * Upload an image to Cloudinary using signed uploads
 * @param {File} file - The image file to upload
 * @param {Object} uploadContext - The context returned from getCloudinaryUploadSignature
 * @returns {Promise<{success: boolean, url?: string, publicId?: string, error?: string}>}
 */
export async function uploadToCloudinary(file, uploadContext) {
  if (!uploadContext?.success) {
    return {
      success: false,
      error: uploadContext?.error || "Missing or invalid upload context"
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "Image must be less than 10MB"
    };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      error: "Only image files are allowed"
    };
  }

  try {
    const { signature, apiKey, cloudName, timestamp, folder } = uploadContext;

    // Perform signed upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", signature);
    formData.append("timestamp", timestamp);
    formData.append("api_key", apiKey);
    formData.append("folder", folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      return {
        success: false,
        error: errorData.error?.message || "Upload failed"
      };
    }

    const data = await uploadResponse.json();
    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id // Include publicId for deletion
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    return {
      success: false,
      error: error.message || "Network error during upload"
    };
  }
}

/**
 * Transform Cloudinary URL for optimized delivery
 * @param {string} url - Original Cloudinary URL
 * @param {number} width - Desired width
 * @returns {string} - Transformed URL (or original if not a valid Cloudinary URL)
 */
export function getOptimizedUrl(url, width = 300) {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Validate hostname is a genuine Cloudinary domain
    // Accepts: res.cloudinary.com, {cloud_name}.res.cloudinary.com, etc.
    const isCloudinaryHost = hostname.endsWith('.cloudinary.com') || hostname === 'cloudinary.com';

    // Only transform if it's a valid Cloudinary host AND has /upload/ in the path
    if (!isCloudinaryHost || !parsed.pathname.includes('/upload/')) {
      return url;
    }

    // Insert transformation parameters after /upload/
    parsed.pathname = parsed.pathname.replace(
      '/upload/',
      `/upload/w_${width},q_auto,f_auto/`
    );

    return parsed.toString();
  } catch {
    // Malformed URL - return original unmodified
    return url;
  }
}

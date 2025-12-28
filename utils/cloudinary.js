/**
 * Cloudinary Upload Utility
 * Handles client-side unsigned uploads to Cloudinary
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB

/**
 * Upload an image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {string} uid - The user's UID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadToCloudinary(file, uid) {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "Image must be less than 5MB"
    };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      error: "Only image files are allowed"
    };
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const folder = `moody/users/${uid}/${yearMonth}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.message || "Upload failed"
      };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.secure_url
    };
  } catch (error) {
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
 * @returns {string} - Transformed URL
 */
export function getOptimizedUrl(url, width = 300) {
  if (!url || !url.includes("cloudinary.com")) return url;

  // Insert transformation parameters before /upload/
  return url.replace(
    "/upload/",
    `/upload/w_${width},q_auto,f_auto/`
  );
}

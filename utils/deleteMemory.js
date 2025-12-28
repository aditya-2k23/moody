import { auth } from "@/firebase";

/**
 * Delete a memory image from Cloudinary and Firestore
 * @param {string} publicId - Cloudinary public_id
 * @param {string} yearMonth - YYYY-MM format
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteMemory(publicId, yearMonth) {
  try {
    // Get current user's ID token
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const idToken = await user.getIdToken();

    const response = await fetch("/api/delete-memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ publicId, yearMonth }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Delete failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete memory error:", error);
    return { success: false, error: error.message || "Network error" };
  }
}

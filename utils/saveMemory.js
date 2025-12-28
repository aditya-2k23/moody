import { db } from "@/firebase";
import { doc, setDoc, getDoc, arrayUnion, Timestamp } from "firebase/firestore";

/**
 * Save a memory (image) to Firestore
 * @param {string} uid - User's UID
 * @param {number} day - Day of the month
 * @param {string} imageUrl - Cloudinary URL of the image
 * @param {string} publicId - Cloudinary public_id for deletion
 * @param {number} [year] - Optional year (defaults to current year)
 * @param {number} [month] - Optional month index 0-11 (defaults to current month)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveMemory(uid, day, imageUrl, publicId, year, month) {
  // Fallback to current date if year or month are not provided
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  // month parameter is 0-indexed (like Date.getMonth()), add 1 for display format
  const targetMonth = month ?? now.getMonth();
  const yearMonth = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;

  const memoryItem = {
    day,
    imageUrl,
    publicId,
    createdAt: Timestamp.now()
  };

  try {
    const docRef = doc(db, "users", uid, "memories", yearMonth);
    await setDoc(
      docRef,
      {
        month: yearMonth,
        items: arrayUnion(memoryItem)
      },
      { merge: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Error saving memory:", error);
    return {
      success: false,
      error: error.message || "Failed to save memory"
    };
  }
}

/**
 * Delete a memory from Firestore (called after Cloudinary deletion)
 * @param {string} uid - User's UID
 * @param {string} yearMonth - YYYY-MM format
 * @param {string} publicId - Cloudinary public_id of image to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteMemoryFromFirestore(uid, yearMonth, publicId) {
  try {
    const docRef = doc(db, "users", uid, "memories", yearMonth);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Memory document not found" };
    }

    const data = docSnap.data();
    const items = data.items || [];

    // Filter out the item with matching publicId
    const updatedItems = items.filter(item => item.publicId !== publicId);

    if (updatedItems.length === items.length) {
      return { success: false, error: "Memory item not found" };
    }

    // Update or delete the document
    if (updatedItems.length === 0) {
      // No items left, delete the document
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(docRef);
    } else {
      // Update with filtered items (merge to preserve other fields)
      await setDoc(docRef, { month: yearMonth, items: updatedItems }, { merge: true });
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting memory from Firestore:", error);
    return {
      success: false,
      error: error.message || "Failed to delete memory"
    };
  }
}

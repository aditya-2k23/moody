import { db } from "@/firebase";
import { doc, setDoc, arrayUnion, Timestamp } from "firebase/firestore";

/**
 * Save a memory (image) to Firestore
 * @param {string} uid - User's UID
 * @param {number} day - Day of the month
 * @param {string} imageUrl - Cloudinary URL of the image
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveMemory(uid, day, imageUrl) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

  const memoryItem = {
    day,
    imageUrl,
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

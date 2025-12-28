import { db } from "@/firebase";
import { doc, setDoc, getDoc, arrayUnion, Timestamp } from "firebase/firestore";

/**
 * Save a memory (image) to Firestore
 * @param {string} uid - User's UID
 * @param {number} day - Day of the month
 * @param {string} imageUrl - Cloudinary URL of the image
 * @param {string} publicId - Cloudinary public_id for deletion
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveMemory(uid, day, imageUrl, publicId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

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
      // Update with filtered items
      await setDoc(docRef, { month: yearMonth, items: updatedItems });
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

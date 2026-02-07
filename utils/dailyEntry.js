import { db } from "@/firebase";
import { deleteField, doc, serverTimestamp, setDoc } from "firebase/firestore";

/**
 * Update a specific day's mood + journal entry.
 *
 * NOTE: In this codebase, daily data is stored as nested fields inside `users/{uid}`:
 * - mood: users/{uid}/{year}/{month}/{day} = number (1-based mood rating)
 * - journal: users/{uid}/{year}/{month}/journal_{day} = string
 *
 * This function updates those existing fields (no new document per day).
 */
export async function updateDailyEntry(uid, { year, month, day, mood, journal }) {
  if (!uid) throw new Error("Missing uid");
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("Missing date parts");
  }

  const docRef = doc(db, "users", uid);

  const payload = {
    [year]: {
      [month]: {
        ...(typeof mood === "number" ? { [day]: mood } : {}),
        ...(typeof journal === "string" ? { [`journal_${day}`]: journal } : {}),
        [`updatedAt_${day}`]: serverTimestamp(),
      },
    },
  };

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Delete a specific day's mood + journal entry.
 * Removes both mood + journal fields for that day.
 */
export async function deleteDailyEntry(uid, { year, month, day }) {
  if (!uid) throw new Error("Missing uid");
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("Missing date parts");
  }

  const docRef = doc(db, "users", uid);

  const payload = {
    [year]: {
      [month]: {
        [day]: deleteField(),
        [`journal_${day}`]: deleteField(),
        [`updatedAt_${day}`]: deleteField(),
      },
    },
  };

  await setDoc(docRef, payload, { merge: true });
}

import { useState } from "react";
import Button from "./Button";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function Journal({ currentUser }) {
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  const handleSave = async () => {
    if (!entry.trim()) {
      toast.error("Journal entry cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await setDoc(docRef, {
        [year]: {
          [month]: {
            [`journal_${day}`]: entry
          }
        }
      }, { merge: true });
      toast.success("Journal entry saved!");
    } catch (error) {
      toast.error("Failed to save journal entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-4 px-2 flex flex-col gap-3 bg-white">
      <h2 className="text-xl md:text-2xl font-bold">Journal</h2>
      <textarea
        name="journal"
        id="journal"
        className="mt-2 w-full h-24 md:h-32 p-2 text-gray-700 text-base md:text-lg border rounded-lg shadow-md outline-none focus:ring-2 focus:ring-indigo-500 hover:shadow-lg transition-all duration-200"
        placeholder="Write about your day..."
        value={entry}
        onChange={e => setEntry(e.target.value)}
      />
      <Button
        className="self-end mt-2 px-4 py-2 font-semibold shadow-md"
        text={saving ? "Saving..." : "Save"}
        dark
        onClick={handleSave}
        disabled={saving}
      />
    </div>
  );
}

import { useState } from "react";
import Button from "./Button";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { analyzeEntry } from "@/utils/analyzeJournal";

export default function Journal({ currentUser }) {
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);

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

  const handleGenerateInsights = async () => {
    if (!entry.trim()) {
      toast.error("Journal entry cannot be empty.");
      return;
    }
    setLoadingInsights(true);
    try {
      const result = await analyzeEntry(entry);
      setInsights(result);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="py-4 flex flex-col gap-2 bg-white">
      <h2 className="text-2xl md:text-3xl font-bold fugaz">Quick Journal</h2>
      <textarea
        name="journal"
        id="journal"
        className="mt-2 w-full h-24 md:h-28 p-2 text-gray-700 text-base md:text-lg border rounded-lg shadow-md outline-none focus:ring-2 focus:ring-indigo-500 hover:shadow-lg transition-all duration-200"
        placeholder="What happened today... 🫶"
        value={entry}
        onChange={e => setEntry(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button
          className="self-end px-4 py-2 font-semibold shadow-md rounded-xl flex items-center gap-2"
          text={
            <span className="flex items-center gap-2">
              <img src="/ai-full.svg" alt="AI Icon" className="w-6 h-6" />
              {loadingInsights ? "Generating..." : "Generate Insights"}
            </span>
          }
          onClick={handleGenerateInsights}
          disabled={loadingInsights}
          dark={false}
        />
        <Button
          className="self-end mt-2 px-4 py-2 font-semibold shadow-md"
          text={saving ? "Saving..." : "Save"}
          dark
          onClick={handleSave}
          disabled={saving}
        />
      </div>
      {insights && (
        <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <img src="/ai.svg" alt="AI Icon" className="w-7 h-7 sparkle" />
            <h3 className="text-2xl font-bold fugaz text-indigo-700">AI Insights</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-white/70 p-4 rounded-xl border border-indigo-200/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="font-semibold text-indigo-700 text-sm uppercase tracking-wide">Mood</span>
              </div>
              <p className="text-gray-800 font-medium text-lg">{insights.mood}</p>
            </div>

            <div className="bg-white/70 p-4 rounded-xl border border-indigo-200/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="font-semibold text-purple-700 text-sm uppercase tracking-wide">Summary</span>
              </div>
              <p className="text-gray-800 leading-relaxed">{insights.summary}</p>
            </div>

            <div className="bg-white/70 p-4 rounded-xl border border-indigo-200/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="font-semibold text-emerald-700 text-sm uppercase tracking-wide">Insight & Tip</span>
              </div>
              <p className="text-gray-800 leading-relaxed italic">{insights.insight}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

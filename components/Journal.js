import { useState } from "react";
import Button from "./Button";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
    const docRef = doc(db, "users", currentUser.uid, "insights", entry);

    try {
      // Check cache first
      const cachedDoc = await getDoc(docRef);
      if (cachedDoc.exists()) {
        setInsights(cachedDoc.data());
        console.log("Loaded cached insights.");
      } else {
        // Fetch new insights
        const result = await analyzeEntry(entry);
        setInsights(result);

        // Cache the new insights
        await setDoc(docRef, result);
        console.log("New insights generated and cached.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="py-4 flex flex-col gap-6">
      {/* Journal Entry Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-2xl md:text-3xl font-bold fugaz mb-4">Quick Journal</h2>
        <textarea
          name="journal"
          id="journal"
          className="w-full h-24 md:h-28 p-4 text-gray-700 text-base md:text-lg border rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 duration-200"
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
      </div>

      {insights && (
        <>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/90 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🧩</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">emotional triggers</h3>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">What Influenced your Mood</h4>
              {insights.summary}
              {Array.isArray(insights.triggers) && insights.triggers.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {insights.triggers.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-200 shadow-sm hover:bg-indigo-200 transition-all duration-150"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/90 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">PERSONALIZED INSIGHT</h3>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">Keep the Momentum Going</h4>
              <p className="text-gray-600 leading-relaxed mb-4">{insights.insight}</p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">💡 Pro tip:</span> {insights.pro_tip}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

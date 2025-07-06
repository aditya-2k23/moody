import { useState, useEffect } from "react";
import Button from "./Button";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { analyzeEntry } from "@/utils/analyzeJournal";
import { generateCreativePlaceholder } from "@/utils/generatePlaceholder";
import Loader from "./Loader";
import { moods } from "@/utils";
import Image from "next/image";
import { useTheme } from "@/context/themeContext";

export default function Journal({ currentUser }) {
  const { theme } = useTheme();
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [placeholder, setPlaceholder] = useState("What happened today... 🫶");
  const [placeholderLoading, setPlaceholderLoading] = useState(true);

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  // Determine if we're in dark mode
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Choose the appropriate AI icon
  const aiIcon = isDarkMode ? "/ai.svg" : "/ai-full.svg";

  useEffect(() => {
    (async () => {
      setPlaceholderLoading(true);
      const creative = await generateCreativePlaceholder();
      setPlaceholder(creative);
      setPlaceholderLoading(false);
    })();
  }, []);

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
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
        <div className="absolute bottom-0 right-36 w-44 h-44 bg-gradient-to-br from-purple-400/40 to-indigo-400/30 dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-10 w-28 h-28 bg-gradient-to-tr from-yellow-400/40 to-orange-400/30 dark:from-purple-400/30 dark:to-indigo-400/30 rounded-full blur-3xl"></div>

        <h2 className="text-2xl md:text-3xl font-bold fugaz mb-4 flex items-center gap-2"><i className="fa-solid fa-book"></i> Quick Journal</h2>
        {placeholderLoading ? (
          <div className="w-full h-24 md:h-28 rounded-lg bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-indigo-400 flex gap-2 text-base md:text-lg font-medium select-none animate-pulse">Generating inspiration... <Loader size="xl" /></span>
            </div>
          </div>
        ) : (
          <textarea
            name="journal"
            id="journal"
            className="dark:bg-slate-700/80 w-full h-24 md:h-28 p-4 text-gray-700 text-base md:text-base lg:text-lg border rounded-lg shadow-sm border-none outline-none focus:ring-2 focus:ring-indigo-500/80 transition-all duration-200 dark:focus:ring-indigo-300/80 dark:text-gray-200 dark:placeholder-gray-300 placeholder-gray-500 resize-none"
            placeholder={placeholder}
            value={entry}
            onChange={e => setEntry(e.target.value)}
            disabled={placeholderLoading}
            style={{ opacity: placeholderLoading ? 0 : 1, transition: 'opacity 0.3s' }}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button
            className="self-end px-4 py-2 font-semibold shadow-md rounded-xl flex items-center gap-2"
            text={
              <span className="flex items-center gap-2">
                <Image src={aiIcon} alt="AI Icon" width={24} height={24} />
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
          <h2 className="text-xl md:text-2xl flex gap-1 md:gap-2 mt-2 md:mt-4 font-bold text-gray-800 dark:text-gray-200 fugaz"><Image src={aiIcon} alt="AI Icon" width={26} height={26} />AI Insights</h2>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/90 rounded-xl flex items-center justify-center cursor-default glow">
                  <span className="text-2xl">🧩</span>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-500 uppercase tracking-wide">emotional triggers</h3>
              </div>

              <div className="flex flex-col items-center justify-between min-w-[90px]">
                <span className="text-xl md:text-2xl lg:text-3xl">{moods[insights.mood] || '😄'}</span>
                <span className="text-sm md:text-base font-semibold text-indigo-500 capitalize fugaz">{insights.mood}</span>
              </div>
            </div>

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

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/90 rounded-xl flex items-center justify-center cursor-default glow">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-500 uppercase tracking-wide">PERSONALIZED INSIGHT</h3>
              </div>

              <div className="flex flex-col items-center justify-between min-w-[90px]">
                <span className="text-xl md:text-2xl lg:text-3xl">{moods[insights.mood] || '😄'}</span>
                <span className="text-sm md:text-base font-semibold text-indigo-500 capitalize fugaz">{insights.mood}</span>
              </div>
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-3">{insights.headline || "Personalized Insight"}</h4>
            <p className="text-gray-600 leading-relaxed mb-4">{insights.insight}</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 glow">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">💡 Pro tip:</span> {insights.pro_tip}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

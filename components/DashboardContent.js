"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/authContext";
import Splashscreen from "./Splashscreen";
import Login from "./Login";
import Calender from "./Calender";
import Memories from "./Memories";
import { useMemories } from "@/hooks/useMemories";
import toast, { Toaster } from "react-hot-toast";
import convertMood, { moods, months } from "@/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/firebase";
import { doc, setDoc, deleteField } from "firebase/firestore";
import Journal from "./Journal";
import { deleteDailyEntry, updateDailyEntry } from "@/utils/dailyEntry";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import StreakIndicator from "./StreakIndicator";

export default function DashboardContent() {
  const { currentUser, userDataObj, setUserDataObj, loading } = useAuth();
  const searchParams = useSearchParams();
  const shouldRegister = searchParams.get("register") === "true";
  const [data, setData] = useState({});
  const now = new Date();
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());
  const [wasAuthenticated, setWasAuthenticated] = useState(!!currentUser);
  const [showAllMoods, setShowAllMoods] = useState(false);

  // Initial loading splash screen state (3 seconds)
  const [initialLoading, setInitialLoading] = useState(true);

  // Debounced mood save state
  const pendingMoodRef = useRef(null); // { year, month, day, mood, streak } or null
  const moodDebounceTimerRef = useRef(null);
  const MOOD_DEBOUNCE_MS = 2000; // 2 seconds

  // Memories state - track selected month/year for the calendar
  const [memoriesYear, setMemoriesYear] = useState(now.getFullYear());
  const [memoriesMonth, setMemoriesMonth] = useState(now.getMonth());

  // Fetch memories for the selected month
  const { memories, status: memoriesStatus, refetch: refetchMemories, removeMemory, yearMonth: memoriesYearMonth } = useMemories(
    currentUser?.uid,
    memoriesYear,
    memoriesMonth
  );

  // Get month label for display
  const monthsArr = Object.keys(months);
  const memoriesLabel = `${monthsArr[memoriesMonth]} ${memoriesYear}`;

  function getTimeRemaining() {
    const now = new Date();
    const hours = 23 - now.getHours();
    const minutes = 59 - now.getMinutes();
    const seconds = 59 - now.getSeconds();
    return `${hours}H ${minutes}M ${seconds}S`;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show splash screen for 3 seconds on first load (only for authenticated users)
  useEffect(() => {
    if (!currentUser) {
      // If not logged in, skip splash
      setInitialLoading(false);
      return;
    }

    // Always set a 3 second timer for authenticated users
    const splashTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    setData(userDataObj);
  }, [currentUser, userDataObj]);

  useEffect(() => {
    if (!wasAuthenticated && currentUser) {
      toast.success("Successfully logged in!");
      toast(
        "Tip: Click any date in the calendar to view your previous journal logs!",
        {
          position: "bottom-center",
          icon: "📝",
          duration: 8000,
          style: {
            background: "#f5f3ff",
            color: "#3730a3",
            fontWeight: "bold"
          },
          removeDelay: 1000
        }
      );
      setWasAuthenticated(true);
    }
  }, [currentUser, wasAuthenticated]);

  /**
   * Immediately flush any pending mood to Firestore.
   * Called on page exit or when we need to ensure data is saved.
   */
  const flushPendingMood = useCallback(async () => {
    if (moodDebounceTimerRef.current) {
      clearTimeout(moodDebounceTimerRef.current);
      moodDebounceTimerRef.current = null;
    }

    const pending = pendingMoodRef.current;
    if (!pending || !currentUser?.uid) return;

    pendingMoodRef.current = null;

    try {
      const { year, month, day, mood, streak } = pending;
      const docRef = doc(db, "users", currentUser.uid);

      if (mood === null) {
        // Deselected mood - delete ONLY the mood field for today (preserve journal)
        await setDoc(docRef, {
          [year]: {
            [month]: {
              [day]: deleteField()
            }
          }
        }, { merge: true });
        await setDoc(docRef, { streak }, { merge: true });
      } else {
        await setDoc(docRef, {
          [year]: {
            [month]: {
              [day]: mood
            }
          },
          streak
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error saving mood:", error.message);
    }
  }, [currentUser?.uid]);

  /**
   * Schedule a debounced save of the mood.
   * Cancels any previous pending save and schedules a new one.
   */
  const debouncedSaveMood = useCallback((moodData) => {
    pendingMoodRef.current = moodData;

    if (moodDebounceTimerRef.current) {
      clearTimeout(moodDebounceTimerRef.current);
    }

    moodDebounceTimerRef.current = setTimeout(() => {
      flushPendingMood();
    }, MOOD_DEBOUNCE_MS);
  }, [flushPendingMood]);

  // Save pending mood on page exit (beforeunload) or visibility change (tab switch/close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable save on page close as async Firestore writes are dropped
      const pending = pendingMoodRef.current;
      if (!pending || !currentUser?.uid) return;

      // Clear pending so flush doesn't double-save
      pendingMoodRef.current = null;
      if (moodDebounceTimerRef.current) {
        clearTimeout(moodDebounceTimerRef.current);
        moodDebounceTimerRef.current = null;
      }

      // Best-effort fallback: send beacon to lightweight endpoint
      // NOTE: Pure async Firestore writes are often lost on hard closes.
      const blob = new Blob(
        [JSON.stringify({ uid: currentUser.uid, ...pending })],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/journal-beacon", blob);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingMood();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Flush on unmount
      if (moodDebounceTimerRef.current) {
        clearTimeout(moodDebounceTimerRef.current);
      }
      // Don't await here since cleanup is sync
      flushPendingMood();
    };
  }, [currentUser?.uid, flushPendingMood]);

  function calculateStreakFromData(dataObj) {
    // Keep this pure so we can recompute streak after edits/deletes.
    // Streak is based only on mood entries (numeric day fields).
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const entryDates = [];
    for (let year in dataObj)
      for (let month in dataObj[year])
        for (let day in dataObj[year][month]) {
          const value = dataObj[year][month][day];
          if (typeof value === "number") {
            const dateObj = new Date(Number(year), Number(month), Number(day));
            entryDates.push(dateObj);
          }
        }

    const entryDateSet = new Set(entryDates.map(e => e.toDateString()));
    const hasTodayEntry = entryDateSet.has(today.toDateString());
    const hasYesterdayEntry = entryDateSet.has(yesterday.toDateString());

    let current;
    if (hasTodayEntry) current = new Date(today);
    else if (hasYesterdayEntry) current = new Date(yesterday);
    else return 0;

    let streak = 0;
    while (entryDateSet.has(current.toDateString())) {
      streak++;
      current.setDate(current.getDate() - 1);
    }

    return streak;
  }

  function handleSetMood(mood) {
    // Use fresh date to avoid stale values if tab was left open overnight
    const freshNow = new Date();
    const day = freshNow.getDate();
    const month = freshNow.getMonth();
    const year = freshNow.getFullYear();

    // Toggle logic: if clicking the same mood, deselect it
    const currentMoodValue = data?.[year]?.[month]?.[day];
    const isDeselecting = currentMoodValue === mood;
    const newMoodValue = isDeselecting ? null : mood;

    const newData = { ...userDataObj };
    // Create new objects for nested levels to preserve immutability
    newData[year] = { ...(userDataObj?.[year] || {}) };
    newData[year][month] = { ...(userDataObj?.[year]?.[month] || {}) };

    if (newMoodValue === null) {
      // Remove mood from local state
      delete newData[year][month][day];
    } else {
      newData[year][month][day] = newMoodValue;
    }

    setData(newData);
    setUserDataObj(newData);

    // Calculate streak based on updated data using shared helper
    const streak = calculateStreakFromData(newData);

    // Schedule debounced save instead of immediate write
    debouncedSaveMood({ year, month, day, mood: newMoodValue, streak });

    // Show feedback toast
    if (isDeselecting) {
      toast("Mood cleared", { icon: <RotateCcw size={18} className="text-indigo-500" />, duration: 1500 });
    }
  }

  function upsertEntryInState(prev, { year, month, day, mood, journal }) {
    const base = prev || {};
    const prevYearObj = base?.[year] || {};
    const prevMonthObj = prevYearObj?.[month] || {};

    const nextMonthObj = { ...prevMonthObj };
    if (typeof mood === "number") {
      nextMonthObj[day] = mood;
    }
    if (typeof journal === "string") {
      nextMonthObj[`journal_${day}`] = journal;
    }

    return {
      ...base,
      [year]: {
        ...prevYearObj,
        [month]: nextMonthObj,
      },
    };
  }

  function deleteEntryFromState(prev, { year, month, day }) {
    const base = prev || {};
    const prevYearObj = base?.[year];
    const prevMonthObj = prevYearObj?.[month];
    if (!prevMonthObj) return base;

    const nextMonthObj = { ...prevMonthObj };
    delete nextMonthObj[day];
    delete nextMonthObj[`journal_${day}`];
    delete nextMonthObj[`updatedAt_${day}`];

    return {
      ...base,
      [year]: {
        ...(prevYearObj || {}),
        [month]: nextMonthObj,
      },
    };
  }

  /**
   * Helper to remove a journal field from state while preserving mood.
   */
  function removeJournalFieldFromState(prev, { year, month, day }) {
    if (!prev?.[year]?.[month]) return prev;
    const next = { ...prev };
    const monthObj = { ...next[year][month] };
    delete monthObj[`journal_${day}`];
    next[year] = { ...next[year], [month]: monthObj };
    return next;
  }

  /**
   * Helper to update both data and userDataObj with the same transformer.
   */
  function updateBothStates(transformer) {
    setData(transformer);
    setUserDataObj(transformer);
  }

  async function handleUpdateDailyEntry({ year, month, day, mood, journal }) {
    if (!currentUser?.uid) throw new Error("Not authenticated");

    const prevMood = data?.[year]?.[month]?.[day];
    const prevJournal = data?.[year]?.[month]?.[`journal_${day}`];
    const hadMood = typeof prevMood === "number";
    const hadJournal = typeof prevJournal === "string";

    // Compute the new state first so we can reuse it for streak calculation
    const nextForStreak = upsertEntryInState(data || {}, { year, month, day, mood, journal });
    updateBothStates(() => nextForStreak);

    try {
      await updateDailyEntry(currentUser.uid, { year, month, day, mood, journal });

      // Recompute streak from the consistent next state
      const streak = calculateStreakFromData(nextForStreak);
      const docRef = doc(db, "users", currentUser.uid);
      await setDoc(docRef, { streak }, { merge: true });
    } catch (error) {
      // Rollback update using a shared rollback transformer
      const rollbackTransformer = (prev) => {
        let rolled = prev;
        // Restore mood or delete if there was none
        if (hadMood) {
          rolled = upsertEntryInState(rolled, { year, month, day, mood: prevMood, journal: undefined });
        } else {
          rolled = deleteEntryFromState(rolled, { year, month, day });
        }
        // Restore journal or remove if there was none
        if (hadJournal) {
          rolled = upsertEntryInState(rolled, { year, month, day, mood: undefined, journal: prevJournal });
        } else {
          rolled = removeJournalFieldFromState(rolled, { year, month, day });
        }
        return rolled;
      };

      updateBothStates(rollbackTransformer);
      throw error;
    }
  }

  async function handleDeleteDailyEntry({ year, month, day }) {
    if (!currentUser?.uid) throw new Error("Not authenticated");

    const prevMood = data?.[year]?.[month]?.[day];
    const prevJournal = data?.[year]?.[month]?.[`journal_${day}`];
    const hadMood = typeof prevMood === "number";
    const hadJournal = typeof prevJournal === "string";

    // Compute the new state first so we can reuse it for streak calculation
    const nextForStreak = deleteEntryFromState(data || {}, { year, month, day });
    updateBothStates(() => nextForStreak);

    try {
      await deleteDailyEntry(currentUser.uid, { year, month, day });

      // Calculate streak from the consistent next state
      const streak = calculateStreakFromData(nextForStreak);
      const docRef = doc(db, "users", currentUser.uid);
      await setDoc(docRef, { streak }, { merge: true });
    } catch (error) {
      // Rollback update using a shared rollback transformer
      const rollbackTransformer = (prev) => {
        let rolled = prev;
        if (hadMood) {
          rolled = upsertEntryInState(rolled, { year, month, day, mood: prevMood, journal: undefined });
        }
        if (hadJournal) {
          rolled = upsertEntryInState(rolled, { year, month, day, mood: undefined, journal: prevJournal });
        }
        return rolled;
      };

      updateBothStates(rollbackTransformer);
      throw error;
    }
  }

  // Get today's mood if already set
  let todaysMood = null;
  if (data && data[now.getFullYear()] && data[now.getFullYear()][now.getMonth()]) {
    todaysMood = data[now.getFullYear()][now.getMonth()][now.getDate()] || null;
  }

  // Memoize stats computation to avoid recomputing on every timer tick
  // Must be called before early returns to satisfy React's rules of hooks
  const memoizedCounts = useMemo(() => {
    // Use fresh date on every call to avoid stale values if tab stays open overnight
    const freshNow = new Date();
    const today = new Date(freshNow.getFullYear(), freshNow.getMonth(), freshNow.getDate());

    let lastMood = null;
    let lastDate = null;
    let hasLoggedToday = false;

    // Collect entries for UI stats (lastMood, hasLoggedToday)
    const entryDates = [];
    for (let year in data)
      for (let month in data[year])
        for (let day in data[year][month]) {
          const value = data[year][month][day];
          if (typeof value === "number") {
            const dateObj = new Date(Number(year), Number(month), Number(day));
            entryDates.push({ date: dateObj, mood: value });
          }
        }

    if (entryDates.length > 0) {
      entryDates.sort((a, b) => b.date - a.date);

      // Determine hasLoggedToday
      hasLoggedToday = entryDates.some((e) => e.date.getTime() === today.getTime());

      // Determine lastMood (previous entry if logged today)
      const prevEntry = entryDates.find((e) => e.date < today);
      if (prevEntry) {
        lastMood = prevEntry.mood;
        lastDate = prevEntry.date;
      } else {
        lastMood = entryDates[0].mood;
        lastDate = entryDates[0].date;
      }
    }

    // Delegate streak calculation to shared pure function
    const streak = calculateStreakFromData(data || {});

    return { streak, lastMood, lastDate, hasLoggedToday };
  }, [data]);

  if (loading) return <Splashscreen />;
  if (!currentUser) return <Login initialRegister={shouldRegister} />;

  // Show full-page splash screen while dashboard loads
  if (initialLoading) return <Splashscreen />;

  const statuses = {
    ...memoizedCounts,
    time_remaining: timeRemaining,
  };

  return (
    <>
      <Toaster position="top-center" />

      <div className='flex flex-col flex-1 gap-6 sm:gap-10 md:gap-14'>
        <div className="grid grid-cols-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl text-indigo-500 dark:font-medium dark:text-indigo-300 p-4 gap-4 shadow-lg dark:shadow-none relative overflow-visible">
          <div className="absolute top-0 right-0 w-24 h-24 dark:w-0 dark:h-0 bg-gradient-to-br from-purple-400/40 to-indigo-400/30  dark:from-yellow-300/10 dark:to-orange-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 dark:w-0 dark:h-0 bg-gradient-to-tr from-yellow-400/40 to-orange-400/30 dark:from-purple-400/20 dark:to-indigo-400/20 rounded-full blur-3xl" />

          {Object.keys(statuses).map((status, statusIndex) => {
            if (status === "lastMood") {
              return (
                <div key={statusIndex} className="flex flex-col items-center gap-1 sm:gap-2">
                  <p className='font-bold dark:font-semibold capitalize text-xs sm:text-base'>Last Mood</p>
                  <p className='fugaz text-base sm:text-xl truncate flex items-center dark:text-white text-indigo-500 gap-1'>
                    {statuses.lastMood ? <>
                      <span className="text-2xl md:text-3xl">{moods[convertMood(statuses.lastMood)]}</span>
                      <span className="capitalize">{convertMood(statuses.lastMood)}</span>
                    </> : '--'}
                  </p>
                </div>
              );
            }
            if (status === "lastDate" || status === "hasLoggedToday") return null;
            if (status === "streak") {
              return (
                <StreakIndicator
                  key={statusIndex}
                  streak={statuses.streak}
                  hasLoggedToday={statuses.hasLoggedToday}
                />
              );
            }
            return (
              <div key={statusIndex} className="flex flex-col items-center gap-1 sm:gap-2">
                <p className='font-bold dark:font-semibold capitalize text-xs sm:text-base'>{status.replaceAll('_', ' ')}</p>
                <p className='fugaz text-base sm:text-xl truncate dark:text-white text-indigo-500'>
                  {statuses[status]}
                </p>
              </div>
            );
          })}
        </div>

        <h4 className="text-3xl sm:text-4xl md:text-5xl text-center fugaz">How do you <span className='textGradient'>feel</span> today?</h4>
        <div className="flex items-stretch flex-wrap gap-4">
          {(showAllMoods ? Object.keys(moods) : Object.keys(moods).slice(0, 5)).map((mood, moodIndex) => {
            const currentMood = moodIndex + 1;
            const isSelected = todaysMood === currentMood;
            return (
              <button
                onClick={() => handleSetMood(currentMood)}
                key={moodIndex}
                style={{
                  outline: isSelected ? '2px solid var(--outline-color)' : 'none',
                  outlineOffset: 2,
                  '--outline-color': 'rgb(79 70 229)'
                }}
                className={`p-4 px-8 rounded-2xl purpleShadow duration-200 transition text-center flex flex-col items-center gap-3 flex-1
                ${isSelected ? 'bg-indigo-500/95 text-white scale-105 shadow-lg [--outline-color:rgb(129_140_248)]' : 'bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-500 dark:text-indigo-300'}`}
              >
                <p className='text-4xl sm:text-5xl md:text-6xl'>{moods[mood]}</p>
                <p className="fugaz text-xs sm:text-sm md:text-base">{mood}</p>
              </button>
            );
          })}

          <button
            onClick={() => setShowAllMoods((prev) => !prev)}
            className="p-4 px-8 rounded-2xl border border-indigo-200 dark:border-indigo-400 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-300 font-bold hover:bg-indigo-100 dark:hover:bg-slate-700 duration-200 transition text-center flex-1 min-w-[100px] flex items-center justify-center"
          >
            {showAllMoods ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
          </button>
        </div>

        <Journal
          currentUser={currentUser}
          onMemoryAdded={refetchMemories}
          onJournalSaved={(savedEntry) => {
            // Compute fresh date values to avoid stale dates if tab was open past midnight
            const now = new Date();
            const day = now.getDate();
            const month = now.getMonth();
            const year = now.getFullYear();
            // Update local data state so Calendar reflects the saved journal immediately
            updateBothStates((prevData) => {
              const newData = { ...prevData };
              newData[year] = { ...(prevData?.[year] || {}) };
              newData[year][month] = { ...(prevData?.[year]?.[month] || {}) };
              newData[year][month][`journal_${day}`] = savedEntry;
              return newData;
            });
          }}
        />

        <Memories
          items={memories}
          status={memoriesStatus}
          monthLabel={memoriesLabel}
          yearMonth={memoriesYearMonth}
          onDelete={removeMemory}
        />

        <Calender
          currentUser={currentUser}
          completeData={data}
          showJournalPopup
          onUpdateEntry={handleUpdateDailyEntry}
          onDeleteEntry={handleDeleteDailyEntry}
          onMonthChange={(year, month) => {
            setMemoriesYear(year);
            setMemoriesMonth(month);
          }}
        />
      </div>
    </>
  );
}

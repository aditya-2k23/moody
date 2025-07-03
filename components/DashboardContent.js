"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/authContext";
import Loader from "./Loader";
import Login from "./Login";
import Calender from "./Calender";
import toast, { Toaster } from "react-hot-toast";
import convertMood, { moods } from "@/utils";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import Journal from "./Journal";

export default function DashboardContent() {
  const { currentUser, userDataObj, setUserDataObj, loading } = useAuth();
  const searchParams = useSearchParams();
  const shouldRegister = searchParams.get("register") === "true";
  const [data, setData] = useState({});
  const now = new Date();
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());
  const [wasAuthenticated, setWasAuthenticated] = useState(!!currentUser);
  const [showAllMoods, setShowAllMoods] = useState(false);

  function getTimeRemaining() {
    const now = new Date();
    const hours = 23 - now.getHours();
    const minutes = 59 - now.getMinutes();
    const seconds = 59 - now.getSeconds();
    return `${hours}H ${minutes}M ${seconds}S`;
  }

  function countValues() {
    let total_number_of_days = 0;
    let lastMood = null;
    let lastDate = null;

    const entryDates = [];
    for (let year in data)
      for (let month in data[year])
        for (let day in data[year][month]) {
          const value = data[year][month][day];
          if (typeof value === "number") {
            total_number_of_days++;
            const dateObj = new Date(Number(year), Number(month), Number(day));
            entryDates.push({ date: dateObj, mood: value });
          }
        }
    if (entryDates.length > 0) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      entryDates.sort((a, b) => b.date - a.date);
      const prevEntry = entryDates.find(e => e.date < today);
      if (prevEntry) {
        lastMood = prevEntry.mood;
        lastDate = prevEntry.date;
      } else {
        lastMood = entryDates[0].mood;
        lastDate = entryDates[0].date;
      }
    }
    let streak = 0;
    const entryDateSet = new Set(entryDates.map(e => e.date.toDateString()));
    let current = new Date();
    while (true) {
      const key = current.toDateString();
      if (entryDateSet.has(key)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    return { streak, lastMood, lastDate };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  async function handleSetMood(mood) {
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    try {
      const newData = { ...userDataObj };
      if (!newData?.[year]) newData[year] = {};
      if (!newData?.[year]?.[month]) newData[year][month] = {};
      newData[year][month][day] = mood;
      setData(newData);
      setUserDataObj(newData);
      const docRef = doc(db, "users", currentUser.uid);
      await setDoc(docRef, {
        [year]: {
          [month]: {
            [day]: mood
          }
        }
      }, { merge: true });
    } catch (error) {
      console.error("Error setting mood:", error.message);
    }
  }

  // Get today's mood if already set
  let todaysMood = null;
  if (data && data[now.getFullYear()] && data[now.getFullYear()][now.getMonth()]) {
    todaysMood = data[now.getFullYear()][now.getMonth()][now.getDate()] || null;
  }

  if (loading) return <Loader />;
  if (!currentUser) return <Login initialRegister={shouldRegister} />;

  const statuses = {
    ...countValues(),
    time_remaining: timeRemaining,
  };

  return (
    <>
      <Toaster position="top-center" />

      <div className='flex flex-col flex-1 gap-6 sm:gap-10 md:gap-14'>
        <div className="grid grid-cols-3 bg-indigo-50 text-indigo-500 p-4 gap-4 rounded-xl">
          {Object.keys(statuses).map((status, statusIndex) => {
            if (status === "lastMood") {
              return (
                <div key={statusIndex} className="flex flex-col items-center gap-1 sm:gap-2">
                  <p className='font-semibold capitalize text-xs sm:text-base'>Last Mood</p>
                  <p className='fugaz text-base sm:text-xl truncate flex items-center gap-2'>
                    {statuses.lastMood ? <>
                      <span className="text-2xl md:text-3xl">{moods[convertMood(statuses.lastMood)]}</span>
                      <span className="capitalize">{convertMood(statuses.lastMood)}</span>
                    </> : '--'}
                  </p>
                </div>
              );
            }
            if (status === "lastDate") return null;
            return (
              <div key={statusIndex} className="flex flex-col items-center gap-1 sm:gap-2">
                <p className='font-semibold capitalize text-xs sm:text-base'>{status.replaceAll('_', ' ')}</p>
                <p className='fugaz text-base sm:text-xl truncate'>
                  {statuses[status]}
                  {status === "streak" ? "🔥" : ""}
                </p>
              </div>
            );
          })}
        </div>

        <h4 className="text-4xl sm:text-5xl md:text-6xl text-center fugaz">How do you <span className='textGradient'>feel</span> today?</h4>
        <div className="flex items-stretch flex-wrap gap-4">
          {(showAllMoods ? Object.keys(moods) : Object.keys(moods).slice(0, 5)).map((mood, moodIndex) => {
            const currentMood = moodIndex + 1;
            const isSelected = todaysMood === currentMood;
            return (
              <button
                onClick={() => handleSetMood(currentMood)}
                key={moodIndex}
                className={`p-4 px-8 rounded-2xl purpleShadow duration-200 transition text-center flex flex-col items-center gap-3 flex-1
                  ${isSelected ? 'bg-indigo-500/95 text-white scale-105 shadow-lg' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-500'}`}
                style={{ outline: isSelected ? '2px solid #4338ca' : 'none', outlineOffset: 2 }}
              >
                <p className='text-4xl sm:text-5xl md:text-6xl'>{moods[mood]}</p>
                <p className={`fugaz text-xs sm:text-sm md:text-base ${isSelected ? 'text-white' : 'text-indigo-500'}`}>{mood}</p>
              </button>
            );
          })}
          {Object.keys(moods).length > 5 && (
            <button
              onClick={() => setShowAllMoods((prev) => !prev)}
              className="p-4 px-8 rounded-2xl border border-indigo-200 bg-white text-indigo-500 font-semibold hover:bg-indigo-100 duration-200 transition text-center flex-1 min-w-[100px]"
            >
              {showAllMoods ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}
            </button>
          )}
        </div>

        <Journal currentUser={currentUser} />

        <Calender completeData={data} showJournalPopup />
      </div>
    </>
  );
}

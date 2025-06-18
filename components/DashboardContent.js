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

export default function DashboardContent() {
  const { currentUser, userDataObj, setUserDataObj, loading } = useAuth();
  const searchParams = useSearchParams();
  const shouldRegister = searchParams.get("register") === "true";
  const [data, setData] = useState({});
  const now = new Date();
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());
  const [wasAuthenticated, setWasAuthenticated] = useState(!!currentUser);

  function getTimeRemaining() {
    const now = new Date();
    const hours = 23 - now.getHours();
    const minutes = 59 - now.getMinutes();
    const seconds = 59 - now.getSeconds();
    return `${hours}H ${minutes}M ${seconds}S`;
  }

  function countValues() {
    let total_number_of_days = 0;
    let sum_moods = 0;
    for (let year in data)
      for (let month in data[year])
        for (let day in data[year][month]) {
          let days_mood = data[year][month][day];
          total_number_of_days++;
          sum_moods += days_mood;
        }
    return { num_days: total_number_of_days, average_mood: ((sum_moods / total_number_of_days) || 0).toFixed(2) };
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

  if (loading) return <Loader />;
  if (!currentUser) return <Login initialRegister={shouldRegister} />;

  const statuses = {
    ...countValues(),
    time_remaining: timeRemaining,
  };

  return (
    <>
      <Toaster position="top-center" />

      <div className='flex flex-col flex-1 gap-8 sm:gap-12 md:gap-16'>
        <div className="grid grid-cols-3 bg-indigo-50 text-indigo-500 p-4 gap-4 rounded-lg">
          {Object.keys(statuses).map((status, statusIndex) => (
            <div key={statusIndex} className="flex flex-col items-center gap-1 sm:gap-2">
              <p className='font-semibold capitalize text-xs sm:text-sm'>{status.replaceAll('_', ' ')}</p>
              <p className='fugaz text-base sm:text-lg truncate'>
                {statuses[status]}
                {status === "num_days" ? "🔥" : ""}
                {status === "average_mood" ? `${moods[convertMood(statuses["average_mood"])]} ` : ""}
              </p>
            </div>
          ))}
        </div>

        <h4 className="text-4xl sm:text-5xl md:text-6xl text-center fugaz">How do you <span className='textGradient'>feel</span> today?</h4>
        <div className="flex items-stretch flex-wrap gap-4">
          {Object.keys(moods).map((mood, moodIndex) => (
            <button onClick={() => {
              const currentMood = moodIndex + 1;
              handleSetMood(currentMood);
            }} key={moodIndex} className={`p-4 px-8 rounded-2xl purpleShadow duration-200 transition bg-indigo-50 hover:bg-indigo-100 text-center flex flex-col items-center gap-3 flex-1`}>
              <p className='text-4xl sm:text-5xl md:text-6xl'>{moods[mood]}</p>
              <p className='fugaz text-indigo-500 text-xs sm:text-sm md:text-base'>{mood}</p>
            </button>
          ))}
        </div>

        <Calender completeData={data} />
      </div>
    </>
  );
}

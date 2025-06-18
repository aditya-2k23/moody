"use client";

import React, { useEffect, useState } from 'react'
import Calender from './Calender'
import { useAuth } from '@/context/authContext';
import { doc, setDoc } from 'firebase/firestore';
import Login from './Login';
import Loader from './Loader';
import { db } from '@/firebase';
import { moods } from '@/utils';

export default function Dashboard() {
  const { currentUser, userDataObj, setUserDataObj, loading } = useAuth();
  const [data, setData] = useState({});

  const now = new Date();

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

  const statuses = {
    ...countValues(),
    time_remaining: `${23 - now.getHours()}H ${60 - now.getMinutes()}M`,
  }

  async function handleSetMood(mood) {
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    try {
      const newData = { ...userDataObj };
      if (!newData?.[year]) {
        newData[year] = {};
      }

      if (!newData?.[year]?.[month]) {
        newData[year][month] = {};
      }

      newData[year][month][day] = mood;

      // update the current state
      setData(newData);

      // update the global state
      setUserDataObj(newData);

      // update the firebase database
      const docRef = doc(db, "users", currentUser.uid);
      const res = await setDoc(docRef, {
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

  useEffect(() => {
    if (!currentUser || !userDataObj) {
      console.log("User not authenticated or user data not available.");
      return;
    }
    setData(userDataObj);
  }, [currentUser, userDataObj]);

  if (loading)
    return <Loader />

  if (!currentUser)
    return <Login />

  return (
    <div className='flex flex-col flex-1 gap-8 sm:gap-12 md:gap-16'>
      <div className="grid grid-cols-3 bg-indigo-50 text-indigo-500 p-4 gap-4 rounded-lg">
        {Object.keys(statuses).map((status, statusIndex) => (
          <div key={statusIndex} className="flex flex-col gap-1 sm:gap-2">
            <p className='font-medium capitalize text-xs sm:text-sm'>{status.replaceAll('_', ' ')}</p>
            <p className='fugaz text-base sm:text-lg truncate'>{statuses[status]}{status === "num_days" ? "🔥" : ""}</p>
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
  )
}

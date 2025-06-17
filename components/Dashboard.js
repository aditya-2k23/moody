"use client";

import React, { useEffect, useState } from 'react'
import Calender from './Calender'
import { useAuth } from '@/context/authContext';
import { doc, setDoc } from 'firebase/firestore';
import Login from './Login';
import Loader from './Loader';
import { db } from '@/firebase';

export default function Dashboard() {
  const { currentUser, userDataObj, setUserDataObj, loading } = useAuth();
  const [data, setData] = useState({});

  async function handleSetMood(mood) {
    const now = new Date();

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

  const statuses = {
    num_days: 14,
    time_remaining: "13:14:26",
    date: (new Date()).toDateString()
  }

  const moods = {
    'Awful': '😭',
    'Sad': '😞',
    'Existing': '😐',
    'Good': '🙂',
    'Elated': '😁',
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
            <p className='font-medium uppercase text-xs sm:text-sm'>{status.replaceAll('_', ' ')}</p>
            <p className='fugaz text-base sm:text-lg truncate'>{statuses[status]}</p>
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

      <Calender completeData={data} handleSetMood={handleSetMood} />
    </div>
  )
}

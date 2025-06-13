import React from 'react'
import Calender from './Calender'

export default function Dashboard() {
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
          <button key={moodIndex} className={`p-4 px-8 rounded-2xl purpleShadow duration-200 transition bg-indigo-50 hover:bg-indigo-100 text-center flex flex-col items-center gap-3 flex-1`}>
            <p className='text-4xl sm:text-5xl md:text-6xl'>{moods[mood]}</p>
            <p className='fugaz text-indigo-500 text-xs sm:text-sm md:text-base'>{mood}</p>
          </button>
        ))}
      </div>

      <Calender />
    </div>
  )
}

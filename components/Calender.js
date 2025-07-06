"use client";

import { baseRating, gradients, demoData, months, dayList } from "@/utils";
import { useState } from "react";
import Button from "./Button";

const monthsArr = Object.keys(months);

export default function Calender({ demo, completeData, showJournalPopup = false }) {
  const now = new Date();
  const currentMonth = now.getMonth();

  const [selectedMonth, setSelectedMonth] = useState(monthsArr[currentMonth]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedJournal, setSelectedJournal] = useState("");

  const numericMonth = monthsArr.indexOf(selectedMonth);
  const data = completeData?.[selectedYear]?.[numericMonth] || {};

  function handleIncrementMonth(val) {
    // if we hit the bounds of the months, then we can just adjust the year that is displayed instead
    if (numericMonth + val < 0) {
      // set month value to 11 and decrement the year
      setSelectedYear(curr => curr - 1);
      setSelectedMonth(monthsArr[11]);
    } else if (numericMonth + val > 11) {
      // set month value to 0 and increment the year
      setSelectedYear(curr => curr + 1);
      setSelectedMonth(monthsArr[0]);
    } else {
      // set the month value to the new month
      setSelectedMonth(monthsArr[numericMonth + val]);
    }
  }

  const monthNow = new Date(selectedYear, monthsArr.indexOf(selectedMonth), 1);
  const firstDayOfMonth = monthNow.getDay();
  const daysInMonth = new Date(selectedYear, monthsArr.indexOf(selectedMonth) + 1, 0).getDate();

  const daysToDisplay = firstDayOfMonth + daysInMonth;
  const numRows = (Math.floor(daysToDisplay / 7)) + (daysToDisplay % 7 ? 1 : 0);

  return (
    <div className="flex flex-col gap-2">
      {showJournalPopup && selectedDay && (
        <div className="relative mb-4 p-4 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
          <button
            className="absolute top-0 right-2 text-indigo-400 hover:text-indigo-700 text-2xl font-bold focus:outline-none"
            onClick={() => { setSelectedDay(null); setSelectedJournal(""); }}
            title="Close"
            aria-label="Close journal entry"
          >
            &times;
          </button>
          <h3 className="font-bold text-indigo-600 mb-2">Journal for {selectedDay} {selectedMonth}, {selectedYear}</h3>
          {selectedJournal ? (
            <p className="whitespace-pre-line text-gray-700">{selectedJournal}</p>
          ) : (
            <p className="text-gray-400 italic">No journal entry for this day.</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-5 gap-4 text-lg sm:text-xl">
        <Button
          text={<i className="fa-solid fa-circle-chevron-left"></i>}
          normal={false}
          className="mr-auto text-indigo-500 hover:opacity-80 duration-200"
          onClick={() => handleIncrementMonth(-1)}
        />
        <p className="fugaz col-span-3 whitespace-nowrap textGradient text-center capitalize">{selectedMonth}, {selectedYear}</p>
        <Button
          className="ml-auto text-indigo-500 hover:opacity-80 duration-200"
          text={<i className="fa-solid fa-circle-chevron-right"></i>}
          normal={false}
          onClick={() => handleIncrementMonth(+1)}
        />
      </div>
      <div className="flex flex-col overflow-hidden gap-1 px-1 py-4 sm:py-6 md:py-10">
        {/* Day of week headings */}
        <div className="grid grid-cols-7 gap-1 text-sm font-semibold text-indigo-500 ml-2 mb-1">
          {dayList.map((day) => (
            <div key={day}>{day.slice(0, 3)}</div>
          ))}
        </div>

        {[...Array(numRows).keys()].map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 gap-1 ">
            {dayList.map((_, dayOfWeekIndex) => {
              // Calculate the actual day number for this calendar cell
              let dayIndex = (rowIndex * 7) + dayOfWeekIndex - (firstDayOfMonth - 1);

              // Determine if this cell should display a day number
              let shouldDisplayDay = true;
              if (dayIndex > daysInMonth) {
                shouldDisplayDay = false; // Beyond the last day of the month
              } else if (row === 0 && dayOfWeekIndex < firstDayOfMonth) {
                shouldDisplayDay = false; // Before the first day of the month
              }

              // If this cell shouldn't display a day, render empty cell
              if (!shouldDisplayDay) {
                return <div className="bg-white" key={dayOfWeekIndex} />;
              }

              // Check if this day is today
              let isToday = dayIndex === now.getDate();

              // Determine the background color based on mood data
              let backgroundColor = "white"; // Default color

              if (demo) {
                // Demo mode: use baseRating data
                let moodRating = baseRating[dayIndex];
                if (moodRating !== undefined && moodRating >= 0 && moodRating <= 12) {
                  backgroundColor = gradients.indigo[moodRating];
                }
              } else {
                // Real data mode: use actual user data
                if (dayIndex in data) {
                  let moodRating = data[dayIndex] - 1;
                  if (moodRating >= 0 && moodRating <= 12) {
                    backgroundColor = gradients.indigo[moodRating];
                    console.log(moodRating);
                  }
                }
              }

              let isSelected = (dayIndex === selectedDay);
              return (
                <div
                  style={{ background: backgroundColor }}
                  className={`text-xs sm:text-sm border border-solid p-2 flex items-center gap-2 justify-between rounded-lg cursor-pointer ${isToday ? "border-indigo-400" : "border-indigo-100"} ${isSelected ? "ring-2 ring-indigo-600" : ""} ${backgroundColor === "white" ? "text-indigo-400" : "text-white"}`}
                  key={dayOfWeekIndex}
                  onClick={() => {
                    setSelectedDay(dayIndex);
                    setSelectedJournal(data[`journal_${dayIndex}`] || "");
                  }}
                  title={data[`journal_${dayIndex}`] ? "View journal entry" : undefined}
                >
                  <p className="font-bold">{dayIndex}</p>
                  {data[`journal_${dayIndex}`] && (
                    <span className="ml-auto" title="Journal entry">📝</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

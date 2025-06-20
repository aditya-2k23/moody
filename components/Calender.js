"use client";

import { baseRating, gradients, demoData, months, dayList } from "@/utils";
import { useState } from "react";
import Button from "./Button";

const monthsArr = Object.keys(months);

export default function Calender({ demo, completeData }) {
  const now = new Date();
  const currentMonth = now.getMonth();

  const [selectedMonth, setSelectedMonth] = useState(monthsArr[currentMonth]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const numericMonth = monthsArr.indexOf(selectedMonth);
  const data = completeData?.[selectedYear]?.[numericMonth] || {};
  console.log("Data for selected month:", data);

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
      <div className="flex flex-col overflow-hidden gap-1 py-4 sm:py-6 md:py-10">
        {/* Day of week headings */}
        <div className="grid grid-cols-7 gap-1 text-sm font-semibold text-indigo-500 mb-1">
          {dayList.map((day) => (
            <div key={day}>{day.slice(0, 3)}</div>
          ))}
        </div>

        {[...Array(numRows).keys()].map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 gap-1 ">
            {dayList.map((dayOfWeek, dayOfWeekIndex) => {
              let dayIndex = (rowIndex * 7) + dayOfWeekIndex - (firstDayOfMonth - 1);
              let dayDisplay = dayIndex > daysInMonth ? false : (row === 0 && dayOfWeekIndex < firstDayOfMonth) ? false : true;
              let isToday = dayIndex === now.getDate();
              if (!dayDisplay) return (
                <div className="bg-white" key={dayOfWeekIndex} />
              );
              let color = demo ? gradients.indigo[baseRating[dayIndex]] : dayIndex in data ? gradients.indigo[data[dayIndex]] : "white";
              return (
                <div style={{ background: color }} className={`text-xs sm:text-sm border border-solid p-2 flex items-center gap-2 justify-between rounded-lg ${isToday ? "border-indigo-400" : "border-indigo-100"} ${color === "white" ? "text-indigo-400" : "text-white"}`} key={dayOfWeekIndex}>
                  <p>{dayIndex}</p>
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

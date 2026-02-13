"use client";

import convertMood, { baseRating, gradients, months, dayList } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import Button from "./Button";
import JournalModal from "./JournalModal";
import { Calendar, StickyNote, ChevronLeft, ChevronRight } from "lucide-react";

const monthsArr = Object.keys(months);

export default function Calender({
  demo,
  currentUser,
  completeData,
  showJournalPopup = false,
  onMonthChange,
  onUpdateEntry,
  onDeleteEntry,
}) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(monthsArr[currentMonth]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedJournal, setSelectedJournal] = useState("");
  const [selectedMood, setSelectedMood] = useState(null);

  const numericMonth = monthsArr.indexOf(selectedMonth);
  const data = useMemo(() => {
    return completeData?.[selectedYear]?.[numericMonth] || {};
  }, [completeData, selectedYear, numericMonth]);

  const isAuthed = !!currentUser?.uid;

  // Keep popup state in sync with the source of truth (completeData).
  useEffect(() => {
    if (!selectedDay) return;

    const journal = data?.[`journal_${selectedDay}`] || "";
    const mood = typeof data?.[selectedDay] === "number" ? data[selectedDay] : null;

    setSelectedJournal(journal);
    setSelectedMood(mood);
  }, [data, selectedDay]);

  // Check if we're at the current month (can't go forward)
  const isAtCurrentMonth = selectedYear === currentYear && numericMonth === currentMonth;

  function handleIncrementMonth(val) {
    // Block navigation to future months
    if (val > 0 && isAtCurrentMonth) {
      return;
    }

    let newYear = selectedYear;
    let newMonthIndex = numericMonth + val;

    // if we hit the bounds of the months, then we can just adjust the year that is displayed instead
    if (newMonthIndex < 0) {
      // set month value to 11 and decrement the year
      newYear = selectedYear - 1;
      newMonthIndex = 11;
      setSelectedYear(newYear);
      setSelectedMonth(monthsArr[11]);
    } else if (newMonthIndex > 11) {
      // Would go to next year - check if that's in the future
      if (selectedYear + 1 > currentYear) {
        return; // Block future year navigation
      }
      newYear = selectedYear + 1;
      newMonthIndex = 0;
      setSelectedYear(newYear);
      setSelectedMonth(monthsArr[0]);
    } else {
      // Check if the new month would be in the future
      if (newYear === currentYear && newMonthIndex > currentMonth) {
        return; // Block future month navigation
      }
      setSelectedMonth(monthsArr[newMonthIndex]);
    }

    // Clear any open popup state when navigating months
    setSelectedDay(null);
    setSelectedJournal("");
    setSelectedMood(null);

    // Notify parent of month change
    if (onMonthChange) {
      onMonthChange(newYear, newMonthIndex);
    }
  }

  const monthNow = new Date(selectedYear, monthsArr.indexOf(selectedMonth), 1);
  const firstDayOfMonth = monthNow.getDay();
  const daysInMonth = new Date(selectedYear, monthsArr.indexOf(selectedMonth) + 1, 0).getDate();

  const daysToDisplay = firstDayOfMonth + daysInMonth;
  const numRows = (Math.floor(daysToDisplay / 7)) + (daysToDisplay % 7 ? 1 : 0);

  return (
    <div className="flex flex-col gap-2 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-700/50 rounded-2xl p-6 pb-3 md:pb-2 shadow-lg border border-gray-100 dark:border-none dark:shadow-none relative overflow-hidden">
      <div className="absolute top-0 left-0 w-44 h-44 bg-gradient-to-br from-purple-300/30 to-indigo-300/30 dark:from-yellow-200/5 dark:to-orange-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/3 w-64 h-44 bg-gradient-to-br from-purple-300/30 to-indigo-300/30 dark:from-yellow-200/5 dark:to-orange-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-44 h-44 bg-gradient-to-br from-purple-300/30 to-indigo-300/30 dark:from-yellow-200/5 dark:to-orange-200/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-28 dark:w-52 dark:h-36 bg-gradient-to-tr from-yellow-300/20 to-orange-300/20 dark:from-purple-400/10 dark:to-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-28 dark:w-52 dark:h-36 bg-gradient-to-tr from-yellow-300/30 to-orange-400/30 dark:from-purple-400/10 dark:to-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Journal Modal */}
      {showJournalPopup && (
        <JournalModal
          isOpen={!!selectedDay}
          day={selectedDay}
          month={numericMonth}
          monthName={selectedMonth}
          year={selectedYear}
          mood={selectedMood}
          journal={selectedJournal}
          isAuthed={isAuthed}
          onSave={async ({ year, month, day, mood, journal }) => {
            if (!onUpdateEntry) return;

            // Capture previous values for rollback
            const previousJournal = selectedJournal;
            const previousMood = selectedMood;

            try {
              // Update local state optimistically
              setSelectedJournal(journal);
              setSelectedMood(mood);

              // Await the save operation
              await onUpdateEntry({ year, month, day, mood, journal });
            } catch (error) {
              // Rollback on error
              setSelectedJournal(previousJournal);
              setSelectedMood(previousMood);
              throw error; // Re-throw so the modal can display the error
            }
          }}
          onDelete={async ({ year, month, day }) => {
            if (!onDeleteEntry) return;
            await onDeleteEntry({ year, month, day });
          }}
          onClose={() => {
            setSelectedDay(null);
            setSelectedJournal("");
            setSelectedMood(null);
          }}
        />
      )}

      <div className="grid grid-cols-5 gap-4 text-lg sm:text-xl md:text-2xl pt-4">
        <Button
          text={<ChevronLeft size={24} />}
          normal={false}
          className="mr-auto text-indigo-500 dark:text-indigo-400/70 hover:opacity-80 duration-200 hover:scale-110"
          onClick={() => handleIncrementMonth(-1)}
        />
        <p className="fugaz col-span-3 whitespace-nowrap textGradient text-center capitalize">{selectedMonth}, {selectedYear}</p>
        <Button
          className={`ml-auto duration-200 ${isAtCurrentMonth ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400/70 hover:opacity-80 hover:scale-110'}`}
          text={<ChevronRight size={24} />}
          normal={false}
          onClick={() => handleIncrementMonth(+1)}
        />
      </div>
      <div className="flex flex-col overflow-hidden gap-1 px-1 py-4 sm:py-6 md:py-10">
        {/* Day of week headings */}
        <div className="grid grid-cols-7 gap-1 text-sm font-semibold text-indigo-500 dark:text-indigo-400 ml-2 mb-1">
          {dayList.map((day) => (
            <div key={day}>{day.slice(0, 3)}</div>
          ))}
        </div>

        {[...Array(numRows).keys()].map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 gap-1">
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
                return <div className="bg-white/30 dark:bg-gray-900/0 border rounded-lg border-indigo-100/70 dark:border-slate-700/30" key={dayOfWeekIndex} />;
              }

              // Check if this day is today
              let isToday = dayIndex === now.getDate() && numericMonth === currentMonth && selectedYear === currentYear;

              // Determine the background color based on mood data
              let backgroundColor = "transparent"; // Default color
              let moodRating = null;

              if (demo) {
                // Demo mode: use baseRating data
                moodRating = baseRating[dayIndex];
                if (moodRating !== undefined && moodRating >= 0 && moodRating <= 12) {
                  backgroundColor = gradients.indigo[moodRating];
                }
              } else {
                // Real data mode: use actual user data
                if (dayIndex in data) {
                  moodRating = data[dayIndex] - 1;
                  if (moodRating >= 0 && moodRating <= 12) {
                    backgroundColor = gradients.indigo[moodRating];
                  }
                }
              }

              // Determine text color based on background darkness and theme
              let textColor = "";
              if (backgroundColor === "transparent") {
                // No mood data - use default colors
                textColor = "text-indigo-400 dark:text-indigo-200";
              } else if (moodRating !== null) {
                // Light backgrounds (ratings 0-4) - use dark text
                if (moodRating < 2) {
                  textColor = "text-indigo-500 dark:text-indigo-600";
                }
                else if (moodRating == 2) {
                  textColor = "text-indigo-600 dark:text-indigo-600";
                }
                // Medium backgrounds (ratings 5-8) - use balanced text
                else if (moodRating <= 8 && moodRating > 4) {
                  textColor = "text-white dark:text-indigo-100";
                }
                // Dark backgrounds (ratings 9-12) - use light text
                else {
                  textColor = "text-white dark:text-gray-100";
                }
              }

              let isSelected = (dayIndex === selectedDay);

              // Check if this date is in the future
              const isFutureDay = (selectedYear === currentYear && numericMonth === currentMonth && dayIndex > now.getDate()) ||
                (selectedYear === currentYear && numericMonth > currentMonth) ||
                (selectedYear > currentYear);

              return (
                <div
                  style={{ background: backgroundColor !== "transparent" ? backgroundColor : undefined }}
                  className={`
                    text-xs sm:text-sm border border-solid p-2 flex items-center gap-2 justify-between rounded-lg truncate
                    ${isFutureDay ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
                    ${isToday ? "border-indigo-500 dark:border-indigo-400" : "border-indigo-100 dark:border-slate-700"}
                    ${isSelected && !isFutureDay ? "ring-2 ring-indigo-600 dark:ring-indigo-400" : ""}
                    ${backgroundColor === "transparent" ? "bg-white dark:bg-slate-800" : backgroundColor}
                    ${textColor}
                  `}
                  key={dayOfWeekIndex}
                  onClick={() => {
                    if (isFutureDay) return; // Block click on future dates

                    setSelectedDay(dayIndex);
                    setSelectedJournal(data[`journal_${dayIndex}`] || "");
                    setSelectedMood(typeof data?.[dayIndex] === "number" ? data[dayIndex] : null);
                  }}
                  title={isFutureDay ? "Future date" : (data[`journal_${dayIndex}`] ? "View journal entry" : undefined)}
                >
                  <p className="font-bold">{dayIndex}</p>
                  {isToday && (
                    <span title="Today"><Calendar size={16} /></span>
                  )}
                  {data[`journal_${dayIndex}`] && (
                    <span className={`ml-auto ${isToday ? "hidden sm:block" : ""}`} title="Journal entry"><StickyNote size={16} /></span>
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

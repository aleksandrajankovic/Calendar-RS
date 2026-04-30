// src/components/CalendarMobileFootball.js
"use client";

import { useEffect, useRef, useState } from "react";
import { russoOne } from "@/app/fonts";
import MonthPagination from "@/components/MonthPagination";

export default function CalendarMobileFootball({
  adminPreview = false,
  year,
  month,
  prevMonth = null,
  nextMonth = null,
}) {
  const [days, setDays] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const chipRefs = useRef([]);
  const stripRef = useRef(null);

  useEffect(() => {
    const dataEl = document.getElementById("calendar-data");
    if (!dataEl) return;

    try {
      const payload = JSON.parse(dataEl.textContent || "{}");
      const allDays = Array.isArray(payload.days) ? payload.days : [];
      const currentDays = allDays.filter((d) => d && typeof d.day === "number");

      let todayIndex = currentDays.findIndex((d) => d.isToday);
      if (todayIndex === -1) todayIndex = currentDays.findIndex((d) => d.hasPromo);
      if (todayIndex === -1) todayIndex = 0;

      setDays(currentDays);
      setSelectedIndex(todayIndex >= 0 ? todayIndex : 0);
    } catch {
      // ignore
    }
  }, []);

  // Auto-scroll chip into view when selectedIndex changes
  useEffect(() => {
    if (!days.length) return;
    const chip = chipRefs.current[selectedIndex];
    if (chip && stripRef.current) {
      chip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedIndex, days.length]);

  if (!days.length) return null;

  const selectedDay = days[selectedIndex];
  const locked = selectedDay?.isLocked && !adminPreview;
  const isToday = selectedDay?.isToday;

  const ballRing = isToday
    ? "ring-4 ring-[#FACC01] shadow-[0_0_40px_rgba(250,204,1,0.8)]"
    : "ring-1 ring-white/15";

  return (
    <div className="w-full flex flex-col items-center justify-evenly pt-4 pb-8 gap-6">

      {/* ── DATE CHIP STRIP ── */}
      <div
        ref={stripRef}
        className="w-full overflow-x-auto no-scrollbar px-4 touch-pan-x"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex gap-2.5 w-max">
          {days.map((day, index) => {
            const isActive = index === selectedIndex;
            const isDayToday = day.isToday;

            return (
              <button
                key={`chip-${day.day}`}
                ref={(el) => (chipRefs.current[index] = el)}
                onClick={() => setSelectedIndex(index)}
                className={`
                  relative flex items-center justify-center
                  h-14 w-11 shrink-0
                  transition duration-200
                  ${isActive ? "scale-110" : "scale-100 opacity-55 hover:opacity-80"}
                `}
                aria-label={`Dan ${day.day}`}
              >
                {/* parallelogram shape */}
                <span
                  className={`
                    absolute inset-0 rounded-sm
                    ${isActive ? (isDayToday ? "bg-[#FFD700]" : "bg-white") : "bg-white/20"}
                  `}
                  style={{ transform: "skewX(-12deg)" }}
                />
                {/* number */}
                <span
                  className={`
                    relative z-10
                    ${russoOne.className}
                    text-[18px] leading-none italic font-bold
                    ${isActive ? "text-black" : "text-white"}
                  `}
                >
                  {day.day}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LARGE BALL ── */}
      <div className="flex flex-col items-center gap-4">
        <button
          data-day-button
          data-day={selectedDay?.day}
          disabled={locked}
          className={`
            relative rounded-full overflow-hidden
            w-[min(72vw,320px)] h-[min(72vw,320px)]
            ${ballRing}
            bg-black/40
            transition duration-300
            ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.97]"}
          `}
          aria-label={selectedDay ? `Dan ${selectedDay.day}` : ""}
        >
          {selectedDay?.icon && (
            <img
              src={selectedDay.icon}
              alt="ball"
              className="w-full h-full object-cover"
            />
          )}

          {/* lock overlay */}
          {locked && (
            <div
              className="absolute inset-0 bg-[#00000080] bg-center bg-no-repeat bg-size-[60px_60px]"
              style={{ backgroundImage: "url('./img/lock.png')" }}
            />
          )}

          {/* today pulse ring */}
          {isToday && (
            <span className="pointer-events-none absolute inset-0 rounded-full animate-ping ring-2 ring-[#FACC01]/30" />
          )}
        </button>

        {/* date number + month label */}
        {selectedDay && (
          <div className="flex flex-col items-center gap-1">
            <span
              className={`
                ${russoOne.className}
                text-[36px] leading-none italic font-bold
                ${isToday ? "text-[#FFD700]" : "text-white"}
              `}
            >
              {selectedDay.day.toString().padStart(2, "0")}
            </span>

          </div>
        )}

        {/* ── PAGINATION ── */}
        {year != null && month != null && (
          <MonthPagination
            year={year}
            month={month}
            prevMonth={prevMonth}
            nextMonth={nextMonth}
            className="text-sm mt-1"
          />
        )}
      </div>
    </div>
  );
}

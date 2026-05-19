"use client";

import { Fragment, useState, useEffect } from "react";
import { getOpenedDays } from "@/lib/calendarProgress";

function dateToWeeklyIdx(date) {
  const dow = date.getDay();
  return dow === 0 ? 6 : dow - 1; // Mon=0 … Sun=6
}

function getSegmentSteps(year, month, weekly, specials, refDay) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today.getFullYear() !== year || today.getMonth() !== month) return null;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const specialsMap = new Map(
    specials
      .filter((s) => s.active && s.year === year && s.month === month)
      .map((s) => [s.day, s.category])
  );

  function categoryForDay(dayNum) {
    const spCat = specialsMap.get(dayNum);
    if (spCat !== undefined) return spCat;
    const date = new Date(year, month, dayNum);
    const w = weekly[dateToWeeklyIdx(date)];
    return w?.active ? w.category || "ALL" : null;
  }

  const goldDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (categoryForDay(d) === "GOLD") goldDays.push(d);
  }
  if (goldDays.length === 0) return null;

  // Segment koji sadrži refDay (zadnje kliknuti dan, ili danas)
  const activeDay = refDay ?? today.getDate();
  let segIdx = goldDays.findIndex((g) => g >= activeDay);
  if (segIdx === -1) segIdx = goldDays.length - 1;

  const segEnd   = goldDays[segIdx];
  const segStart = segIdx === 0 ? 1 : goldDays[segIdx - 1] + 1;

  const steps = [];
  for (let d = segStart; d <= segEnd; d++) {
    const cat = categoryForDay(d);
    if (cat === null) continue; // samo dani sa aktivnom promocijom
    const date = new Date(year, month, d);
    steps.push({
      day: d,
      month,
      year,
      inCurrentMonth: true,
      isToday: d === today.getDate(),
      isFuture: date > today,
      category: cat,
    });
  }

  return steps.length > 0 ? steps : null;
}

export default function ProgressBar({ year, month, weekly, specials }) {
  const [openedDays, setOpenedDays] = useState(() => getOpenedDays(year, month));
  const [contextDay, setContextDay] = useState(null);

  useEffect(() => {
    const onOpened = (e) => {
      if (e.detail?.year === year && e.detail?.month === month) {
        setOpenedDays(getOpenedDays(year, month));
      }
    };
    const onViewed = (e) => {
      if (e.detail?.year === year && e.detail?.month === month) {
        setContextDay(e.detail.day);
      }
    };
    window.addEventListener("mb-day-opened", onOpened);
    window.addEventListener("mb-day-viewed", onViewed);
    return () => {
      window.removeEventListener("mb-day-opened", onOpened);
      window.removeEventListener("mb-day-viewed", onViewed);
    };
  }, [year, month]);

  const today = new Date();
  if (today.getFullYear() !== year || today.getMonth() !== month) return null;

  const steps = getSegmentSteps(year, month, weekly, specials, contextDay);

  if (!steps) return null;

  const isOpened = (step) => step.inCurrentMonth && openedDays.has(step.day);
  const openedCount = steps.filter(isOpened).length;
  const goldReached = isOpened(steps[steps.length - 1]);

  return (
    <div className="hidden md:block mt-5 mb-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <span className="text-white/50 text-[11px] uppercase tracking-[0.14em]">
          Put do Zlatne Lopte
        </span>
        <span className="text-[11px] font-semibold text-[#FACC01]">
          {goldReached
            ? "✓ Dostignut!"
            : `${openedCount} / ${steps.length}`}
        </span>
      </div>

      {/* Steps */}
      <div className="flex items-center">
        {steps.map((step, i) => {
          const gold = step.category === "GOLD";
          const opened = isOpened(step);
          const prevOpened = i > 0 && isOpened(steps[i - 1]);

          return (
            <Fragment key={`${step.year}-${step.month}-${step.day}`}>
              {/* Connecting line */}
              {i > 0 && (
                <div
                  className="flex-1 h-0.5 min-w-1.5 transition-colors duration-500"
                  style={{
                    background: prevOpened
                      ? "#FACC01"
                      : "rgba(255,255,255,0.12)",
                  }}
                />
              )}

              {/* Step */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${
                      gold
                        ? opened
                          ? "bg-[#FACC01] shadow-[0_0_16px_rgba(250,204,1,0.65)]"
                          : step.isFuture
                          ? "border-2 border-[#FACC01]/40 bg-[#FACC01]/5 opacity-40"
                          : "border-2 border-[#FACC01] bg-[#FACC01]/10"
                        : opened
                        ? "bg-white"
                        : step.isToday
                        ? "border-2 border-[#FACC01] bg-transparent"
                        : step.isFuture
                        ? "border border-white/15 bg-white/5 opacity-35"
                        : "border border-white/25 bg-white/5"
                    }
                  `}
                >
                  {opened ? (
                    gold ? (
                      <span className="text-black text-[13px] leading-none">
                        ★
                      </span>
                    ) : (
                      <svg
                        width="11"
                        height="9"
                        viewBox="0 0 11 9"
                        fill="none"
                      >
                        <path
                          d="M1 4l3 3.5L10 1"
                          stroke="#000"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )
                  ) : gold ? (
                    <span
                      className={`text-[13px] leading-none ${
                        step.isFuture
                          ? "text-[#FACC01]/40"
                          : "text-[#FACC01]"
                      }`}
                    >
                      ★
                    </span>
                  ) : null}
                </div>

                {/* Day label */}
                <span
                  className={`text-[10px] leading-none transition-colors ${
                    step.isToday
                      ? "text-[#FACC01]"
                      : step.isFuture
                      ? "text-white/25"
                      : "text-white/40"
                  }`}
                >
                  {step.day.toString().padStart(2, "0")}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

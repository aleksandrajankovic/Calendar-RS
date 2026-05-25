"use client";

import { useState, useEffect } from "react";
import { getOpenedDays } from "@/lib/calendarProgress";

function dateToWeeklyIdx(date) {
  const dow = date.getDay();
  return dow === 0 ? 6 : dow - 1; // Mon=0 … Sun=6
}

function getAllPromoSteps(year, month, weekly, specials) {
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

  const steps = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const cat = categoryForDay(d);
    if (cat === null) continue;
    steps.push({ day: d, inCurrentMonth: true });
  }

  return steps.length > 0 ? steps : null;
}

export default function ProgressBar({ year, month, weekly, specials }) {
  const [openedDays, setOpenedDays] = useState(() => getOpenedDays(year, month));

  useEffect(() => {
    const onOpened = (e) => {
      if (e.detail?.year === year && e.detail?.month === month) {
        setOpenedDays(getOpenedDays(year, month));
      }
    };
    window.addEventListener("mb-day-opened", onOpened);
    return () => window.removeEventListener("mb-day-opened", onOpened);
  }, [year, month]);

  const today = new Date();
  if (today.getFullYear() !== year || today.getMonth() !== month) return null;

  const steps = getAllPromoSteps(year, month, weekly, specials);
  if (!steps) return null;

  const openedCount = steps.filter((s) => s.inCurrentMonth && openedDays.has(s.day)).length;
  const fillPct = steps.length > 0 ? (openedCount / steps.length) * 100 : 0;

  return (
    <div className="hidden md:block mt-5 mb-1">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-white/50 text-[11px] uppercase tracking-[0.14em]">
          Otvorene promocije
        </span>
        <span className="text-[11px] font-semibold text-[#FACC01]">
          {openedCount} / {steps.length}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#FACC01] transition-all duration-500"
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
}

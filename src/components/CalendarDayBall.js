// src/components/CalendarDayBall.js
import { rowdies } from "@/app/fonts";

export default function CalendarDayBall({ cell, adminPreview }) {
  const locked = cell.isLocked && !adminPreview;
  const isToday = cell.isToday;

  const ringClass = isToday
    ? "ring-2 ring-[#FACC01] shadow-[0_0_18px_rgba(250,204,1,0.9)]"
    : "ring-1 ring-white/10";

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center gap-1">
      {/* Today outer pulse */}
      {isToday && (
        <span className="pointer-events-none absolute inset-0 z-20 rounded-full animate-ping ring-1 ring-[#FACC01]/40" />
      )}

      <button
        data-day-button
        data-day={cell.day}
        disabled={locked}
        className={`
          relative rounded-full overflow-hidden
          h-[78%] aspect-square
          ${ringClass}
          transition duration-200
          ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-[1.06] active:scale-[0.97]"}
          bg-black/40
        `}
        aria-label={`Dan ${cell.day}`}
      >
        {/* ball image */}
        {cell.icon && (
          <img
            src={cell.icon}
            alt="ball"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* lock overlay */}
        {locked && (
          <div
            className="absolute inset-0 bg-[#00000080] bg-center bg-no-repeat bg-size-[36%_36%]"
            style={{ backgroundImage: "url('./img/lock.png')" }}
          />
        )}
      </button>

      {/* date number */}
      <span
        className={`
          ${rowdies.className}
          text-[11px] md:text-[13px] lg:text-[15px] leading-none
          ${isToday ? "text-[#FACC01]" : "text-white/80"}
          font-bold
        `}
      >
        {cell.day.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

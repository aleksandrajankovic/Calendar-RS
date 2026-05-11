// src/components/CalendarDayBall.js
import { fwc2026UltraCondensed } from "@/app/fonts";

export default function CalendarDayBall({ cell, adminPreview }) {
  const locked = cell.isLocked && !adminPreview;
  const isToday = cell.isToday;
  const isGold = cell.category === "GOLD";

  const ringClass = isGold
    ? "border-2 border-[#f8d97a]"
    : isToday
    ? "ring-2 ring-[#FACC01] shadow-[0_0_18px_rgba(250,204,1,0.9)]"
    : "ring-1 ring-white/10";

  return (
    <div
      className={`relative h-full w-full flex flex-col items-center justify-center gap-1${
        isGold && !locked ? " gold-ball-wobble" : ""
      }`}
    >
      {/* ball wrapper — ping is relative to this, not the full cell */}
      <div className="relative h-[78%] aspect-square">
        {isToday && (
          <span className="pointer-events-none absolute inset-0 z-20 rounded-full animate-ping ring-1 ring-[#FACC01]/40" />
        )}

      <button
        data-day-button
        data-day={cell.day}
        data-category={cell.category || "ALL"}
        disabled={locked}
        className={`
          relative rounded-full overflow-hidden
          w-full h-full
          ${ringClass}
          ${isGold && !locked ? "gold-ball-glow" : ""}
          transition duration-200
          ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-[1.06] active:scale-[0.97]"}
          bg-black/40
        `}
        aria-label={`Dan ${cell.day}`}
      >
        {/* diagonal shimmer sweep for gold */}
        {isGold && !locked && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)",
              animation: "gold-shimmer 2.8s linear infinite",
            }}
          />
        )}

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
      </div>

      {/* date number */}
      <span
        className={`
          ${fwc2026UltraCondensed.className}
          text-[14px] md:text-[16px] lg:text-[18px] leading-none tracking-[0.02em]
          ${isGold ? "text-[#f8d97a]" : isToday ? "text-[#FACC01]" : "text-white/80"}
          font-normal
        `}
      >
        {cell.day.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

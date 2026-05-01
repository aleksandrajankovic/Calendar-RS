// src/components/CalendarGhostBall.js
import { fwc2026UltraCondensed } from "@/app/fonts";

export default function CalendarGhostBall({ cell }) {
  return (
    <div aria-hidden="true" className="relative h-full w-full flex flex-col items-center justify-center gap-1">
      <div className="rounded-full h-[78%] aspect-square bg-black/40 ring-1 ring-white/8" />
      <span
        className={`
          ${fwc2026UltraCondensed.className}
          text-[14px] md:text-[16px] lg:text-[18px] leading-none tracking-[0.02em]
          text-white/30 font-normal
        `}
      >
        {cell.day.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

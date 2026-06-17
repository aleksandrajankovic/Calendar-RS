"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "leaderboard_toast_seen_v1";

export default function LeaderboardToast() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  function dismiss(e) {
    e?.stopPropagation();
    setExiting(true);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setVisible(false), 350);
  }

  function handleOpen() {
    dismiss();
    window.dispatchEvent(new Event("open-leaderboard"));
  }

  if (!visible) return null;

  return (
    <div
      role="button"
      onClick={handleOpen}
      className={`fixed bottom-5 right-5 z-50 w-72 rounded-2xl bg-[#05070D] shadow-2xl overflow-hidden cursor-pointer
        transition-all duration-350 ease-out hover:brightness-110
        ${exiting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}
      `}
      style={{ animation: exiting ? undefined : "toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <div className="p-4 flex items-center gap-3">
        {/* Trophy icon */}
        <div className="shrink-0 w-9 h-9 rounded-xl bg-[#FACC01]/10 border border-[#FACC01]/20 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FACC01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
            <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M6 5v6a6 6 0 0 0 12 0V5H6z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-snug">Rang lista je objavljena!</p>
          <p className="text-white/40 text-xs mt-0.5">Pogledaj ko je na vrhu</p>
        </div>

        <button
          onClick={dismiss}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-white/40 hover:text-white transition"
          aria-label="Zatvori"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

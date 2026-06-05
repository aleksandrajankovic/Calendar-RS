"use client";

import { useState, useEffect } from "react";

const COUNTDOWN_START = new Date("2026-06-05T00:00:00");
const COUNTDOWN_END = new Date("2026-06-18T00:00:00");

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    function calc() {
      const now = new Date();
      if (now < COUNTDOWN_START || now >= COUNTDOWN_END) return null;
      const diff = COUNTDOWN_END - now;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      return { d, h, m, s };
    }

    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

// Zameniti sa pravim endpoint-om kad bude dostupan
const FEED_URL = null;

export default function LeaderboardButton() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const countdown = useCountdown();

  async function openModal() {
    setOpen(true);
    if (data) return;
    if (!FEED_URL) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(FEED_URL);
      if (!res.ok) throw new Error("Greška pri učitavanju");
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        aria-label="Rang lista"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-black bg-[#FACC01] hover:brightness-110 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
        Rang lista
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-sm rounded-2xl bg-[#1a1a2e] border border-white/10 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#FACC01] via-[#ffe566] to-[#FACC01]" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                {/* Trophy icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FACC01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
                  <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
                  <path d="M8 21h8" />
                  <path d="M12 17v4" />
                  <path d="M6 5v6a6 6 0 0 0 12 0V5H6z" />
                </svg>
                <h2 className="text-white font-semibold text-base">Rang lista</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition"
                aria-label="Zatvori"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mx-5 h-px bg-white/5" />

            {/* Body */}
            <div className="px-5 py-6 min-h-[200px] flex flex-col">
              {!FEED_URL ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                  {countdown ? (
                    <>
                      <p className="text-white/40 text-xs uppercase tracking-widest">Objava za</p>
                      <div className="flex items-start gap-2">
                        {[
                          { v: countdown.d, l: "dana" },
                          { v: countdown.h, l: "sati" },
                          { v: countdown.m, l: "min" },
                          { v: countdown.s, l: "sek" },
                        ].map(({ v, l }, i) => (
                          <div key={l} className="flex items-start gap-2">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                                <span className="text-2xl font-bold text-[#FACC01] tabular-nums leading-none">
                                  {String(v).padStart(2, "0")}
                                </span>
                              </div>
                              <span className="text-[10px] text-white/30 uppercase tracking-widest">{l}</span>
                            </div>
                            {i < 3 && (
                              <span className="text-white/20 text-xl font-light mt-3.5">:</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-white/20 text-xs">18. jun 2026.</p>
                    </>
                  ) : (
                    <>
                      {/* Hourglass icon */}
                      <div className="w-14 h-14 rounded-full bg-[#FACC01]/10 border border-[#FACC01]/20 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FACC01" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 22h14" />
                          <path d="M5 2h14" />
                          <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                          <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                        </svg>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-white/70 text-sm font-medium">Rang lista uskoro</p>
                        <p className="text-white/30 text-xs">Objava 18. juna 2026.</p>
                      </div>
                    </>
                  )}
                </div>
              ) : loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="w-6 h-6 rounded-full border-2 border-[#FACC01] border-t-transparent animate-spin" />
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
                  {error}
                </div>
              ) : data ? (
                <ol className="space-y-2">
                  {(Array.isArray(data) ? data : data.items ?? []).map((entry, i) => (
                    <li key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <span className={`w-6 text-center text-xs font-bold ${i === 0 ? "text-[#FACC01]" : i === 1 ? "text-white/60" : i === 2 ? "text-orange-400" : "text-white/30"}`}>
                        {i + 1}.
                      </span>
                      <span className="flex-1 text-white/90 text-sm">{entry.username ?? entry.name ?? entry.user}</span>
                      <span className="text-[#FACC01] text-sm font-semibold">{entry.score ?? entry.points ?? ""}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

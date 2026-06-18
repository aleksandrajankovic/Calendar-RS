"use client";

import { useState, useEffect, useCallback } from "react";

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

const FEED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeCeYITNed0h7ilWhwlY-sHsPzw1e8AxeZlbIQaPtHLBILXErgLzsl1sj-iTL61g/pub?output=csv";

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  function splitLine(line) {
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += line[i];
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = splitLine(lines[0]);
  return lines
    .slice(1)
    .map((line) => {
      const values = splitLine(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
      return obj;
    })
    .filter((r) => r.account_id);
}

const PAGE_SIZE = 10;

export default function LeaderboardButton() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const countdown = useCountdown();

  const openModal = useCallback(async () => {
    setOpen(true);
    if (data) return;
    if (!FEED_URL) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(FEED_URL);
      if (!res.ok) throw new Error("Greška pri učitavanju");
      const text = await res.text();
      const rows = parseCSV(text);
      const sorted = rows
        .map((r) => ({
          account: r.account_id,
          izazovi: Number(r.BROJ_DANA_ISPUNIO) || 0,
          kvota: parseFloat(String(r.kvota).replace(",", ".")) || 0,
          kvotaLabel: r.kvota,
        }))
        .sort((a, b) => b.izazovi - a.izazovi || b.kvota - a.kvota);
      setData(sorted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    window.addEventListener("open-leaderboard", openModal);
    return () => window.removeEventListener("open-leaderboard", openModal);
  }, [openModal]);

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
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Modal */}
          <div
            className="relative w-full max-w-[480px] max-h-[80vh] bg-[#05070D] rounded-2xl shadow-xl flex flex-col p-4 sm:p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
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
                className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
                aria-label="Zatvori"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="min-h-[200px] flex flex-col overflow-y-auto">
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
              ) : data ? (() => {
                const all = Array.isArray(data) ? data : data.items ?? [];
                const visible = all.slice(0, visibleCount);
                const hasMore = visibleCount < all.length;
                return (
                  <>
                    {/* Zaglavlje kolona */}
                    <div className="flex items-center gap-2 pb-2 mb-1 border-b border-white/10 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                      <span className="w-8 shrink-0 text-center">#</span>
                      <span className="flex-1">Account</span>
                      <span className="w-14 text-center">Izazovi</span>
                      <span className="w-16 text-right">Kvota</span>
                    </div>
                    <ol className="space-y-0.5 max-h-[55vh] overflow-y-auto pr-1">
                      {visible.map((entry, i) => (
                        <li key={i} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
                          <span className={`w-8 shrink-0 text-center text-xs font-bold ${i === 0 ? "text-[#FACC01]" : i === 1 ? "text-white/50" : i === 2 ? "text-orange-400" : "text-white/25"}`}>
                            {i + 1}.
                          </span>
                          <span className="flex-1 text-white/90 text-sm tabular-nums">{entry.account}</span>
                          <span className="w-14 text-center text-white/70 text-sm tabular-nums">{entry.izazovi}</span>
                          <span className="w-16 text-right text-[#FACC01] text-sm font-semibold tabular-nums">{entry.kvotaLabel}</span>
                        </li>
                      ))}
                    </ol>
                    {hasMore && (
                      <button
                        onClick={() => {
                          setLoadingMore(true);
                          setTimeout(() => {
                            setVisibleCount((c) => c + PAGE_SIZE);
                            setLoadingMore(false);
                          }, 400);
                        }}
                        disabled={loadingMore}
                        className="mt-4 w-full py-2.5 rounded-full text-white/80 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(99,102,241,0.6)",
                          boxShadow: "0 0 10px rgba(99,102,241,0.35), inset 0 0 10px rgba(99,102,241,0.08)",
                        }}
                      >
                        {loadingMore ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            Učitavam...
                          </>
                        ) : (
                          `Prikaži još (${all.length - visibleCount} preostalo)`
                        )}
                      </button>
                    )}
                  </>
                );
              })() : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

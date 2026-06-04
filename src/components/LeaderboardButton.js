"use client";

import { useState } from "react";

// Zameniti sa pravim endpoint-om kad bude dostupan
const FEED_URL = null;

export default function LeaderboardButton() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-white font-semibold text-base">Rang lista</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition"
                aria-label="Zatvori"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 min-h-[200px] flex flex-col">
              {!FEED_URL ? (
                <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                  rang lista
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

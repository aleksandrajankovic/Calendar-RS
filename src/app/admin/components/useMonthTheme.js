"use client";
// Tema kalendara za dati mesec (mesečna tema iz Calendar Styling, inače globalna) — editor promocija
// prema njoj prikazuje samo polja koja ta tema koristi. Podešavanja se čitaju jednom po učitavanju admina.
import { useEffect, useState } from "react";

let settingsPromise = null;
const loadSettings = () =>
  (settingsPromise ??= fetch("/api/calendar-settings", { credentials: "include" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null));

export function resolveMonthTheme(settings, year, month) {
  if (!settings) return null;
  return settings.monthBackgrounds?.[`${year}-${month}`]?.theme || settings.theme || "default";
}

// null dok se ne učita (tada editor prikazuje sva polja, kao ranije)
export function useMonthTheme(year, month) {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, []);
  return resolveMonthTheme(settings, year, month);
}

// Koja polja tema koristi:
// - novogodišnja: natpis na srećki; bez kategorija i knockout faza
// - fudbalska: Golden ball (uključi/isključi) + knockout faze
// - default (vertikalna/horizontalna): Sport, Casino, Missions, All
export function themeFields(theme) {
  return {
    scratchText: theme === "newyear" || theme == null,
    categories: theme !== "newyear",
    football: theme === "football" || theme == null,
  };
}

export const FOOTBALL_ONLY_CATEGORIES = new Set(["GOLD", "QUARTER_FINAL", "SEMI_FINAL", "FINAL"]);

// Default tema bira Sport, Casino, Missions, All (fudbalske kategorije imaju svoja polja)
export function categoryOptions(all) {
  return all.filter((c) => !FOOTBALL_ONLY_CATEGORIES.has(c.value));
}

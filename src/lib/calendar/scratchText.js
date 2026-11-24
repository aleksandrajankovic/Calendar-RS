// Natpis na srećki (novogodišnja tema): kratak tekst na zlatnoj kartici pre grebanja.
export const SCRATCH_TEXT_MAX = 40;

export function sanitizeScratchText(raw) {
  if (typeof raw !== "string") return null;
  const t = raw.replace(/\s+/g, " ").trim().slice(0, SCRATCH_TEXT_MAX);
  return t || null;
}

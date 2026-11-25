"use client";
// Tab "Effects": konfete posle grebanja — globalni stil i override za izabrani mesec

import AdminTableCard from "../../components/AdminTableCard";
import MonthOverridePicker from "./MonthOverridePicker";
import { MONTH_NAMES } from "./constants";
import { CONFETTI_STYLES, splitEmoji } from "@/lib/calendar/confetti";

function ConfettiPicker({ value, onChange, allowInherit = false }) {
  const style = value?.style || (allowInherit ? null : "theme");
  const options = allowInherit ? [{ value: null, label: "Use global default" }, ...CONFETTI_STYLES] : CONFETTI_STYLES;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            title={opt.hint || (opt.emoji ? opt.emoji.join(" ") : undefined)}
            onClick={() => onChange(opt.value ? { style: opt.value, emoji: opt.value === "custom" ? value?.emoji || "" : undefined } : null)}
            className={[
              "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors",
              style === opt.value
                ? "border-[#AC1C09] bg-red-50 text-[#AC1C09]"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {style === "custom" && (
        <label className="block">
          <span className="mb-1 inline-block text-sm text-neutral-600">Emoji (up to 8, the first one appears most often)</span>
          <input
            className="w-full max-w-sm border border-[#D0D0D0] rounded px-2.5 py-2 text-lg"
            value={value?.emoji || ""}
            onChange={(e) => onChange({ style: "custom", emoji: e.target.value })}
            placeholder="🎃🍬👻"
          />
          {splitEmoji(value?.emoji).length === 0 && (
            <span className="mt-1 block text-xs text-amber-700">Add at least one emoji, otherwise the global default is used.</span>
          )}
        </label>
      )}

      {style && style !== "custom" && (
        <p className="text-xs text-neutral-400">
          {CONFETTI_STYLES.find((s) => s.value === style)?.hint ||
            CONFETTI_STYLES.find((s) => s.value === style)?.emoji?.join(" ") ||
            (style === "off" ? "No confetti after scratching or the slot reveal." : "")}
        </p>
      )}
    </div>
  );
}

export default function EffectsTab({
  confetti, setConfetti,
  monthBackgrounds, setMonthBackgrounds,
  selYear, setSelYear, selMonth, setSelMonth,
}) {
  const currentKey = `${selYear}-${selMonth}`;
  const monthLabel = `${MONTH_NAMES[selMonth]} ${selYear}`;
  const monthConfetti = monthBackgrounds[currentKey]?.confetti || null;

  function setMonthConfetti(value) {
    setMonthBackgrounds((prev) => ({ ...prev, [currentKey]: { ...prev[currentKey], confetti: value } }));
  }

  // sneg za izabrani mesec: true / false / null = automatski (25 Dec – 15 Jan)
  const monthSnow = monthBackgrounds[currentKey]?.snow;
  const snowSet = typeof monthSnow === "boolean";
  const autoSnowOn = selMonth === 11 || selMonth === 0; // u automatskom režimu pada samo krajem decembra / početkom januara
  const snowOn = snowSet ? monthSnow : false;
  function setMonthSnow(value) {
    setMonthBackgrounds((prev) => ({ ...prev, [currentKey]: { ...prev[currentKey], snow: value } }));
  }

  return (
    <div className="space-y-6">
      <MonthOverridePicker
        selYear={selYear} setSelYear={setSelYear}
        selMonth={selMonth} setSelMonth={setSelMonth}
        sections="Confetti, Snow"
      />

      <AdminTableCard title="Snow">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-800">Falling snow in {monthLabel}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {snowSet
                  ? snowOn
                    ? "On for the whole month (visitors see it on this month's calendar)."
                    : "Off for this month."
                  : autoSnowOn
                    ? "Not set — automatic: snow falls from 25 December to 15 January."
                    : "Not set — automatic (snow only from 25 December to 15 January, so none in this month)."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMonthSnow(!snowOn)}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                snowOn ? "bg-sky-500" : "bg-neutral-300",
              ].join(" ")}
              role="switch"
              aria-checked={snowOn}
              aria-label={`Falling snow in ${monthLabel}`}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200",
                  snowOn ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>
          {snowSet && (
            <button
              type="button"
              onClick={() => setMonthSnow(null)}
              className="text-xs text-neutral-500 underline hover:text-neutral-800"
            >
              Back to automatic
            </button>
          )}
          <p className="text-xs text-neutral-400">Click Save to apply.</p>
        </div>
      </AdminTableCard>

      <AdminTableCard title="Confetti">
        <div className="p-4 space-y-4">
          <p className="text-sm text-neutral-500">
            Shown after a scratch card is scratched. Choose &quot;Gold foil (slot reveal)&quot; for the same gold
            effect as the slot reveal. The slot reveal always keeps its own gold confetti unless this is set to
            &quot;Off&quot;.
          </p>
          <ConfettiPicker value={confetti} onChange={setConfetti} />

          <div className="mt-5 pt-4 border-t border-neutral-100">
            <p className="text-sm font-medium text-neutral-800 mb-2">Override for {monthLabel}</p>
            <ConfettiPicker value={monthConfetti} onChange={setMonthConfetti} allowInherit />
          </div>
        </div>
      </AdminTableCard>
    </div>
  );
}

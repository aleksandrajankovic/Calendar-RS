"use client";
// Novogodišnja tema: „Današnji poklon“ — velika kartica izabranog dana + traka sa danima kampanje.
// Isti raspored na telefonu i desktopu (desktop: kartica položena, traka sa strelicama).
// Klik na karticu ide kroz postojeću logiku (data-day-button → animacija poklona → pop-up),
// a dani u traci samo biraju koji poklon je u kartici.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { rowdies } from "@/app/fonts";
import { getOpenedDays } from "@/lib/calendar/calendarProgress";
import { GIFT_OPEN } from "@/lib/calendar/giftOpen/giftOpenConfig";

const WEEKDAYS = ["NED", "PON", "UTO", "SRE", "ČET", "PET", "SUB"];
const MONTHS = [
  "JANUAR", "FEBRUAR", "MART", "APRIL", "MAJ", "JUN",
  "JUL", "AVGUST", "SEPTEMBAR", "OKTOBAR", "NOVEMBAR", "DECEMBAR",
];

// Otvoreni dani iz localStorage-a (mb-cal-progress), kao string da bi snimak bio stabilan
function useOpenedDays(year, month) {
  const key = useSyncExternalStore(
    (cb) => {
      window.addEventListener("mb-day-opened", cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener("mb-day-opened", cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => [...getOpenedDays(year, month)].sort((a, b) => a - b).join(","),
    () => "",
  );
  return useMemo(() => new Set(key ? key.split(",").map(Number) : []), [key]);
}

// Položaj kalendara u odnosu na vizual (pozadina iz admina je cover + object-top, pa se tačke na
// slici računaju iz njene stvarne veličine — isto na svakoj rezoluciji, zumu i telefonu).
// titleEnd (admin, po mesecu): gde se naslov NA SLICI završava, udeo visine slike, za desktop i mobile.
// - naslov postoji (> 0): kartica ide odmah ispod naslova
// - nema naslova (0): desktop — kartica na CENTER_DESKTOP visine slike (sredina scene); telefon — kalendar
//   centriran između vrha i dna ekrana
// Kad kalendar ne staje na ekran, sam postaje kompaktniji (is-compact, pa is-tight).
const CENTER_DESKTOP = 0.45;
const GAP = 14;

function usePlaceOnVisual(ref, titleEnd) {
  const endDesktop = titleEnd?.desktop || 0;
  const endMobile = titleEnd?.mobile || 0;

  useLayoutEffect(() => {
    const root = ref.current;
    const wrap = root?.closest(".ny-wrap");
    const img = document.querySelector("main picture img");
    if (!wrap || !img) return;
    const desktop = matchMedia("(min-width: 768px)");

    // tačka na slici (udeo visine) → px od vrha dokumenta
    const imageY = (fraction) => {
      const r = img.getBoundingClientRect();
      const scale = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
      const drawnH = img.naturalHeight * scale;
      const posY = parseFloat(getComputedStyle(img).objectPosition.split(" ")[1]) / 100 || 0;
      return r.top + scrollY + (r.height - drawnH) * posY + drawnH * fraction;
    };

    const page = document.documentElement;
    const main = root.closest("main");
    // koliko stranica viri ispod ekrana (paginacija i oznaka 18+ ulaze u račun) — 0 = bez skrola
    const overflow = () => Math.max(0, page.scrollHeight - innerHeight);
    const pad = () => parseFloat(wrap.style.paddingTop) || 0;
    const setPad = (px) => (wrap.style.paddingTop = `${Math.max(0, Math.round(px))}px`);

    const placeOnce = () => {
      wrap.style.paddingTop = "";
      const top = wrap.getBoundingClientRect().top + scrollY; // prirodan početak (ispod naslova iz admina)
      const hero = root.querySelector(".ny-hero");
      const blockH = root.getBoundingClientRect().height;
      const vh = innerHeight;
      const isDesktop = desktop.matches;
      const end = isDesktop ? endDesktop : endMobile;
      let p;

      if (img.naturalWidth && end > 0) {
        p = imageY(end) + GAP - top;
      } else if (img.naturalWidth && isDesktop && hero) {
        p = imageY(CENTER_DESKTOP) - hero.offsetHeight / 2 - top;
      } else {
        p = (vh - top - blockH) / 2;
      }
      setPad(p);
      return end > 0 && img.naturalWidth; // kartica je "zakačena" ispod naslova sa vizuala
    };

    // Cela stranica uvek staje na ekran (kalendar se učitava i u iframe-u — bez skrola):
    // redom kompaktnije → tesno → kartica ide naviše → najmanji raspored.
    const LEVELS = ["", "is-compact", "is-tight", "is-tiny"];
    const setLevel = (i) => {
      root.classList.remove("is-compact", "is-tight", "is-tiny");
      for (const c of LEVELS.slice(1, i + 1)) root.classList.add(c);
      if (main) main.dataset.nyFit = LEVELS[i] ? LEVELS[i].slice(3) : "";
    };

    const place = () => {
      for (let i = 0; i < LEVELS.length; i++) {
        setLevel(i);
        const anchored = placeOnce();
        if (!overflow()) return;
        // bez naslova na vizualu kartica nije vezana za tačku na slici — prvo se samo pomeri naviše
        // (sa naslovom: prvo se smanjuje, da kartica ne pređe preko naslova)
        if (!anchored || i >= 2) {
          setPad(pad() - overflow());
          if (!overflow()) return;
        }
      }
    };

    place();
    document.fonts?.ready.then(place); // posle učitavanja fonta visine se menjaju
    img.addEventListener("load", place); // i kad <picture> zameni mobilnu/desktop sliku
    desktop.addEventListener("change", place);
    let last = `${innerWidth}x${innerHeight}`;
    const onResize = () => {
      const now = `${innerWidth}x${innerHeight}`;
      if (now !== last) {
        last = now;
        place();
      }
    };
    addEventListener("resize", onResize);
    return () => {
      img.removeEventListener("load", place);
      desktop.removeEventListener("change", place);
      removeEventListener("resize", onResize);
      wrap.style.paddingTop = "";
      root.classList.remove("is-compact", "is-tight", "is-tiny");
      if (main) delete main.dataset.nyFit;
    };
  }, [ref, endDesktop, endMobile]);
}

// Desktop: traka sa danima se prevlači mišem (kao prstom na telefonu), uz malo inercije posle puštanja.
// Klik posle prevlačenja se ne računa kao izbor dana. Točkić miša iznad trake je pomera levo-desno.
function useDragScroll(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false, dragging = false, startX = 0, startLeft = 0, lastX = 0, lastT = 0, v = 0, raf = 0;

    const onDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(raf);
      el.classList.remove("is-dragging");
      down = true;
      dragging = false;
      startX = lastX = e.clientX;
      startLeft = el.scrollLeft;
      lastT = performance.now();
      v = 0;
    };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) < 5) return;
        dragging = true;
        el.classList.add("is-dragging");
        el.setPointerCapture?.(e.pointerId);
      }
      const now = performance.now();
      v = (e.clientX - lastX) / Math.max(1, now - lastT); // px/ms
      lastX = e.clientX;
      lastT = now;
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (!dragging) return;
      // inercija: brzina se postepeno gasi (snap trake ostaje isključen dok traka klizi)
      let vel = -v * 16;
      const step = () => {
        if (Math.abs(vel) < 0.5) return el.classList.remove("is-dragging");
        el.scrollLeft += vel;
        vel *= 0.92;
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    // klik koji završava prevlačenje ne bira dan
    const onClick = (e) => {
      if (!dragging) return;
      dragging = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // trackpad horizontalno — radi sam
      if (el.scrollWidth <= el.clientWidth) return;
      cancelAnimationFrame(raf);
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("wheel", onWheel);
    };
  }, [ref]);
}

// Telefon: prevlačenje prstom preko kartice dana menja dan (ulevo = sledeći, udesno = prethodni).
// Kartica prati prst; vertikalni skrol stranice radi normalno (touch-action: pan-y). Posle prevlačenja
// klik se poništava, da se poklon ne otvori slučajno.
function useSwipe(ref, onSwipe) {
  const onSwipeRef = useRef(onSwipe);
  useEffect(() => {
    onSwipeRef.current = onSwipe;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sx = 0, sy = 0, dx = 0, tracking = false, horizontal = null, moved = false;
    const hero = () => el.querySelector(".ny-hero");
    const reset = (h) => {
      if (!h) return;
      h.style.transition = "transform .2s ease, opacity .2s ease";
      h.style.transform = "";
      h.style.opacity = "";
    };

    const start = (e) => {
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      dx = 0;
      tracking = true;
      horizontal = null;
      moved = false;
    };
    const move = (e) => {
      if (!tracking) return;
      const t = e.touches[0];
      const x = t.clientX - sx;
      const y = t.clientY - sy;
      if (horizontal === null && Math.hypot(x, y) > 8) horizontal = Math.abs(x) > Math.abs(y);
      if (!horizontal) return;
      dx = x;
      moved = true;
      const h = hero();
      if (h) {
        h.style.transition = "none";
        h.style.transform = `translateX(${x * 0.55}px) rotate(${x * 0.012}deg)`;
        h.style.opacity = String(1 - Math.min(Math.abs(x) / 700, 0.35));
      }
    };
    const end = () => {
      if (!tracking) return;
      tracking = false;
      const changed = horizontal && Math.abs(dx) > 50 && onSwipeRef.current(dx < 0 ? 1 : -1);
      if (!changed) reset(hero());
      if (moved) {
        el.dataset.swiped = "1";
        setTimeout(() => delete el.dataset.swiped, 400);
      }
    };
    // klik posle prevlačenja ne otvara poklon (capture: pre logike kalendara na #calendar-root)
    const click = (e) => {
      if (el.dataset.swiped) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    el.addEventListener("click", click, true);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
      el.removeEventListener("click", click, true);
    };
  }, [ref]);
}

function stateOf(d, opened) {
  if (d.isLocked) return "locked"; // budući dan — sa promocijom ili bez, ne otkriva se unapred
  if (!d.hasPromo) return d.isFuture ? "locked" : "empty"; // prošao dan bez promocije
  if (opened.has(d.day)) return "opened";
  if (d.isFuture) return "preview"; // budući dan otključan samo u admin pregledu
  if (d.isToday) return "today";
  return "missed";
}

const CTA = {
  today: "OTVORI POKLON",
  missed: "OTVORI PROPUŠTENI POKLON",
  opened: "POGLEDAJ PONOVO",
  preview: "PREGLEDAJ (ADMIN)",
};

function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="11" rx="2.5" fill="currentColor" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function CalendarNewYear({ days, year, month, titleEnd = null }) {
  // svi dani kampanje (opseg meseca iz admina), ne samo oni sa promocijom
  const gifts = days;
  const opened = useOpenedDays(year, month);

  // Početno: danas; inače poslednji otključan dan sa poklonom; inače prvi dan
  const [selected, setSelected] = useState(() => {
    const today = gifts.find((d) => d.isToday);
    if (today) return today.day;
    const unlocked = gifts.filter((d) => !d.isLocked && d.hasPromo);
    return (unlocked.at(-1) || gifts[0])?.day ?? null;
  });

  const stripRef = useRef(null);
  const rootRef = useRef(null);
  const heroWrapRef = useRef(null);
  const [enterFrom, setEnterFrom] = useState(null); // sa koje strane ulazi nova kartica (prevlačenje)
  usePlaceOnVisual(rootRef, titleEnd);

  // susedni dan (dir: 1 = sledeći, -1 = prethodni); vraća false na kraju trake
  const goTo = (dir) => {
    const i = gifts.findIndex((d) => d.day === selected);
    const next = gifts[i + dir];
    if (!next) return false;
    setEnterFrom(dir > 0 ? "right" : "left");
    setSelected(next.day);
    return true;
  };
  useSwipe(heroWrapRef, goTo);
  useDragScroll(stripRef);

  // Desktop: strelice ← → na tastaturi menjaju dan (ne dok je pop-up otvoren ili se kuca u polje)
  const goToRef = useRef(goTo);
  useEffect(() => {
    goToRef.current = goTo;
  });
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      if (!document.getElementById("promo-modal")?.classList.contains("hidden")) return;
      if (goToRef.current(e.key === "ArrowRight" ? 1 : -1)) e.preventDefault();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // Izabrani dan u traci uvek u vidnom polju (i na početku, kad je danas negde na sredini meseca)
  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector(`[data-chip="${selected}"]`);
    if (!strip || !chip) return;
    const left = chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [selected]);

  if (!gifts.some((d) => d.hasPromo)) {
    return <p className="ny-empty">Pokloni stižu uskoro.</p>;
  }

  const sel = gifts.find((d) => d.day === selected) || gifts[0];
  const selState = stateOf(sel, opened);
  const isGift = (d) => !GIFT_OPEN.onlyScratch || d.scratch;
  const iconOf = (d) => (opened.has(d.day) && isGift(d) && GIFT_OPEN.openedIcon ? GIFT_OPEN.openedIcon : d.icon);
  const dateLabel = (d) => `${d.day}. ${MONTHS[month]}`;

  const scrollStrip = (dir) => {
    const strip = stripRef.current;
    strip?.scrollBy({ left: dir * strip.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div ref={rootRef} className={`ny ${rowdies.variable}`}>
      {/* Kartica izabranog dana — ceo dugme otvara poklon (osim zaključanog); na telefonu se prevlači */}
      <div className="ny-hero-wrap" ref={heroWrapRef}>
      <button
        key={sel.day}
        type="button"
        data-day-button={sel.hasPromo ? "" : undefined}
        data-day={sel.day}
        disabled={selState === "locked" || selState === "empty"}
        className={`ny-hero is-${selState}${enterFrom ? ` enter-${enterFrom}` : ""}`}
        aria-label={`${dateLabel(sel)} — ${selState === "locked" ? "uskoro" : selState === "empty" ? "nema poklona" : CTA[selState].toLowerCase()}`}
      >
        <span className="ny-hero__glow" aria-hidden="true" />
        <span className="ny-hero__tag">
          {sel.isToday ? "DANAS" : { missed: "PROPUŠTENO", opened: "OTVORENO", locked: "USKORO", empty: "BEZ POKLONA", preview: "USKORO · ADMIN" }[selState]}
        </span>
        <span className={`ny-hero__date ${rowdies.className}`}>
          {sel.day}
          <small>{MONTHS[month]}</small>
        </span>

        <span className="ny-hero__gift">
          {/* zaključan dan ne otkriva ikonicu; dan bez promocije dobija prigušen otvoren poklon */}
          {selState === "empty" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={GIFT_OPEN.openedIcon || "/rive/poklon-otvoren.webp"} alt="" className="ny-hero__ghost" draggable="false" />
          ) : selState !== "locked" && sel.icon ? (
            // eslint-disable-next-line @next/next/no-img-element -- ikonica se menja (otvoren poklon), a giftOpen čita njen položaj
            <img src={iconOf(sel)} alt="" data-promo-icon data-gift-managed draggable="false" />
          ) : null}
          {selState === "locked" && <LockIcon className="ny-hero__lock" />}
        </span>

        <span className="ny-hero__text">
          <span className={`ny-hero__title ${rowdies.className}`}>
            {selState === "locked"
              ? "Strpljenja…"
              : selState === "empty"
                ? sel.isToday ? "Danas nema poklona" : "Ovog dana nema poklona"
                : selState === "opened"
                  ? "Poklon je otvoren"
                  : "Tvoj poklon čeka!"}
          </span>
          <span className="ny-hero__sub">
            {selState === "locked"
              ? `Ovaj poklon se otvara ${sel.day}.${month + 1}.`
              : selState === "empty"
                ? "Pogledaj ostale dane u traci ispod."
                : selState === "opened"
                ? "Pogledaj ponovo svoju promociju."
                : "Otvori ga i ogrebi zlatnu srećku."}
          </span>
        </span>

        <span className="ny-hero__cta">
          {selState === "locked" ? `OTVARA SE ${sel.day}.${month + 1}.` : selState === "empty" ? "NEMA POKLONA" : CTA[selState]}
        </span>
      </button>
      </div>

      {/* Traka sa danima kampanje */}
      <div className="ny-strip-head">TVOJI POKLONI</div>
      <div className="ny-strip-wrap">
        <button type="button" className="ny-arrow" aria-label="Prethodni dani" onClick={() => scrollStrip(-1)}>‹</button>
        <div className="ny-strip" ref={stripRef}>
          {gifts.map((d) => {
            const st = stateOf(d, opened);
            const wd = WEEKDAYS[new Date(year, month, d.day).getDay()];
            return (
              <button
                key={d.day}
                type="button"
                data-chip={d.day}
                className={`ny-chip is-${st}${d.day === sel.day ? " is-selected" : ""}`}
                onClick={() => {
                  setEnterFrom(null);
                  setSelected(d.day);
                }}
                aria-pressed={d.day === sel.day}
                aria-label={`${dateLabel(d)}${st === "locked" ? " — uskoro" : st === "empty" ? " — nema poklona" : ""}`}
              >
                {st === "locked" ? (
                  <LockIcon className="ny-chip__lock" />
                ) : st === "empty" ? (
                  <span className="ny-chip__dot" aria-hidden="true" />
                ) : d.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={iconOf(d)} alt="" draggable="false" loading="lazy" />
                ) : null}
                <b className={rowdies.className}>{d.day}</b>
                <small>{d.isToday ? "DANAS" : wd}</small>
              </button>
            );
          })}
        </div>
        <button type="button" className="ny-arrow" aria-label="Sledeći dani" onClick={() => scrollStrip(1)}>›</button>
      </div>
    </div>
  );
}

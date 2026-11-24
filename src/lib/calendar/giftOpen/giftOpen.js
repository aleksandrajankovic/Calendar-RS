// Animacija otvaranja poklona preko ikonice dana, pre pop-upa sa grebalicom.
// Rive (ako /rive/poklon.riv postoji i učitan je unapred), inače CSS verzija.
import { GIFT_OPEN } from "./giftOpenConfig";
import { getOpenedDays } from "@/lib/calendar/calendarProgress";

let rivePrep = null; // Promise<{ mod, buf } | null>

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function giftOpenApplies(entry) {
  if (!GIFT_OPEN.enabled || !isGiftDay(entry) || reducedMotion()) return false;
  if (GIFT_OPEN.onlyFirstTime && getOpenedDays(entry.year, entry.month).has(entry.day)) return false;
  return true;
}

const isGiftDay = (d) => !!d?.hasPromo && (!GIFT_OPEN.onlyScratch || !!(d.scratch || d.promo?.scratch));

// Otvoreni (ogrebani) dani: ikonica postaje otvoren poklon — odmah pri učitavanju i čim se dan ogrebe
export function showOpenedGifts(root, days) {
  const src = GIFT_OPEN.openedIcon;
  const first = days.find((d) => d.year != null && d.month != null);
  if (!GIFT_OPEN.enabled || !src || !first) return;

  const apply = (day) => {
    // data-gift-managed: novogodišnja tema sama menja ikonicu (React), ne diramo je ovde
    root.querySelectorAll(`[data-day-button][data-day="${day}"] img[data-promo-icon]:not([data-gift-managed])`).forEach((img) => {
      if (img.dataset.giftOpened) return;
      img.dataset.giftOpened = "1";
      img.removeAttribute("srcset"); // next/image srcset bi vratio staru ikonicu
      img.removeAttribute("sizes");
      img.src = src;
    });
  };

  const opened = getOpenedDays(first.year, first.month);
  days.forEach((d) => isGiftDay(d) && opened.has(d.day) && apply(d.day));

  window.addEventListener("mb-day-opened", (e) => {
    const { year, month, day } = e.detail || {};
    if (year !== first.year || month !== first.month) return;
    if (isGiftDay(days.find((d) => d.day === day))) apply(day);
  });
}

// Učitaj Rive unapred (u pozadini), da klik nema kašnjenje. Bez fajla → CSS verzija.
export function prepareGiftOpen(days) {
  if (rivePrep || !GIFT_OPEN.enabled || !days.some((d) => giftOpenApplies(d))) return;
  const load = () =>
    fetch(GIFT_OPEN.rive.src)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then(async (buf) => {
        if (!buf) return null;
        const mod = await import("@rive-app/canvas");
        mod.RuntimeLoader.setWasmUrl("/rive/rive.wasm");
        await new Promise((res) => mod.RuntimeLoader.getInstance(res)); // WASM spreman
        return { mod, buf };
      })
      .catch(() => null);
  rivePrep = new Promise((res) => {
    const go = () => load().then(res);
    if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 3000 });
    else setTimeout(go, 1500);
  });
}

// Pravougaonik koji slika stvarno zauzima (object-fit / object-position)
function contentRect(img) {
  const b = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  // bez padding-a (lopta u football temi ima razmak od ivice kruga)
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pt = parseFloat(cs.paddingTop) || 0;
  const r = {
    left: b.left + pl,
    top: b.top + pt,
    width: b.width - pl - (parseFloat(cs.paddingRight) || 0),
    height: b.height - pt - (parseFloat(cs.paddingBottom) || 0),
  };
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return r;
  let w = r.width;
  let h = r.height;
  if (cs.objectFit === "contain" || cs.objectFit === "cover" || cs.objectFit === "scale-down") {
    const s = (cs.objectFit === "cover" ? Math.max : Math.min)(r.width / nw, r.height / nh);
    w = nw * s;
    h = nh * s;
  }
  const [px = "50%", py = "50%"] = cs.objectPosition.split(" ");
  const off = (v, free) => (v.endsWith("%") ? (free * parseFloat(v)) / 100 : parseFloat(v) || 0);
  return { left: r.left + off(px, r.width - w), top: r.top + off(py, r.height - h), width: w, height: h };
}

function makeLayer(rect, pad = 0) {
  const el = document.createElement("div");
  el.className = "gift-open";
  el.setAttribute("aria-hidden", "true");
  const size = Math.max(rect.width, rect.height) * (1 + 2 * pad);
  Object.assign(el.style, pad
    ? {
        left: `${rect.left + rect.width / 2 - size / 2}px`,
        top: `${rect.top + rect.height / 2 - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
      }
    : { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  document.body.append(el);
  return el;
}

// Pušta animaciju; onReveal se zove kad treba otvoriti pop-up. Vraća false ako nema šta da se animira.
export function playGiftOpen(btn, { onReveal }) {
  const img = btn.querySelector("img[data-promo-icon]");
  if (!img || !img.complete || !img.naturalWidth) return false;
  const rect = contentRect(img);
  const src = img.currentSrc || img.src;

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    onReveal();
  };
  const restore = () => {
    img.style.visibility = "";
  };

  const runCss = () => {
    const layer = makeLayer(rect);
    layer.style.setProperty("--split", `${GIFT_OPEN.lidSplit * 100}%`);
    layer.style.setProperty("--r", `${rect.width * 0.75}px`); // domet iskri
    layer.innerHTML = `
      <div class="gift-open__body">
        <div class="gift-open__part gift-open__box"><img alt="" src="${src}"></div>
        <div class="gift-open__part gift-open__lid"><img alt="" src="${src}"></div>
        <div class="gift-open__glow"></div>
        <div class="gift-open__sparks">${"<i></i>".repeat(9)}</div>
      </div>`;
    img.style.visibility = "hidden";
    setTimeout(reveal, GIFT_OPEN.revealAfter);
    setTimeout(() => {
      restore();
      layer.remove();
    }, GIFT_OPEN.revealAfter + 600);
  };

  if (!rivePrep) {
    runCss();
    return true;
  }

  // Rive je možda još u učitavanju — ne čekamo: ako nije spreman odmah, CSS
  let settled = false;
  rivePrep.then((prep) => {
    if (settled) return;
    settled = true;
    if (!prep) return runCss();
    runRive(prep, rect, src, img, { reveal, restore, fallback: runCss });
  });
  setTimeout(() => {
    if (!settled) {
      settled = true;
      runCss();
    }
  }, 0);
  return true;
}

function runRive({ mod, buf }, rect, src, img, { reveal, restore, fallback }) {
  const cfg = GIFT_OPEN.rive;
  const { Rive, Layout, Fit, Alignment, decodeImage } = mod;
  const layer = makeLayer(rect, (1 / cfg.iconScale - 1) / 2);
  const canvas = document.createElement("canvas");
  layer.append(canvas);

  let rive = null;
  let done = false;
  const finish = (ok) => {
    if (done) return;
    done = true;
    if (!ok) {
      layer.remove();
      restore();
      fallback();
      return;
    }
    reveal();
    setTimeout(() => {
      restore();
      rive?.cleanup();
      layer.remove();
    }, 600);
  };

  let iconReady = Promise.resolve();
  try {
    rive = new Rive({
      buffer: buf.slice(0),
      canvas,
      stateMachine: cfg.stateMachine,
      autoplay: true,
      autoBind: true, // view model iz fajla (signal "open" je trigger u view modelu)
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      // slika "ikonica" iz fajla se menja ikonicom dana iz admina
      assetLoader: (asset) => {
        if (!asset.isImage || !asset.name.startsWith(cfg.imageAsset)) return false;
        iconReady = fetch(src)
          .then((r) => r.arrayBuffer())
          .then((b) => decodeImage(new Uint8Array(b)))
          .then((image) => {
            asset.setRenderImage(image);
            image.unref?.();
          });
        return true;
      },
      onLoad: async () => {
        try {
          rive.resizeDrawingSurfaceToCanvas();
          // novi Rive: trigger u view modelu; stari fajlovi: state machine input
          const vmTrigger = rive.viewModelInstance?.trigger(cfg.trigger);
          const input = vmTrigger ? null : rive.stateMachineInputs(cfg.stateMachine)?.find((i) => i.name === cfg.trigger);
          if (!vmTrigger && !input) throw new Error(`nema triggera "${cfg.trigger}"`);
          await iconReady;
          layer.classList.add("is-rive");
          img.style.visibility = "hidden";
          if (vmTrigger) vmTrigger.trigger();
          else input.fire();
          setTimeout(() => finish(true), cfg.revealAfter);
        } catch (e) {
          console.warn("[rive] poklon:", e);
          finish(false);
        }
      },
      onLoadError: () => finish(false),
    });
  } catch (e) {
    console.warn("[rive] poklon:", e);
    finish(false);
  }
}

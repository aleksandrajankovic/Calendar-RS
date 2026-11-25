// src/lib/calendarInteractions.js
import { attachFlipListener, initScratch } from "./scratch/initScratch";
import { initSlot } from "./slot/slotReveal";
import { giftOpenApplies, playGiftOpen, prepareGiftOpen, showOpenedGifts } from "./giftOpen/giftOpen";
import { markDayOpened } from "@/lib/calendar/calendarProgress";
import { renderModalHTML } from "@/lib/calendar/promoModalHtml";
import { monthHref } from "@/lib/calendar/calendarUrls";
import { track, disableTracking } from "@/lib/calendar/track";

// -----------------------------
// INIT FUNKCIJA
// -----------------------------
export function initCalendarInteractions(rootSelector = "#calendar-root", { openDay, adminPreview = false } = {}) {
  const root = document.querySelector(rootSelector);
  if (!root) return;
  // Samo jednom po stranici: u dev režimu React (StrictMode) pokreće efekat dvaput, pa bi
  // svaki klik otvarao pop-up dvaput, a zatvaranje vraćalo adresu promocije umesto meseca
  if (root.dataset.interactionsReady) return;
  root.dataset.interactionsReady = "1";

  const dataEl = root.querySelector("#calendar-data");
  if (!dataEl) return;

  const payload = JSON.parse(dataEl.textContent || "{}");
  const days = Array.isArray(payload.days) ? payload.days : [];
  const lang = payload.lang || "sr";
  const theme = payload.theme || "default";

  const modal = root.querySelector("#promo-modal");
  const content = root.querySelector("#promo-content");
  const closeBtn = root.querySelector("#promo-close");
  const dialog = modal ? modal.querySelector("#promo-dialog") : null;

  if (!modal || !content) return;

  // Analitika: admin pregled se ne broji
  if (adminPreview) disableTracking();
  track("view", { year: payload.year, month: payload.month });

  function trackDay(type, entry) {
    track(type, {
      year: entry.year,
      month: entry.month,
      day: entry.day,
      promoType: entry.type,
      title: entry.title,
    });
  }

  let isOpen = false;
  let giftBusy = false; // poklon se upravo otvara — ignoriši nove klikove
  // Poklon koji se otvara (Rive/CSS) i "otvoren poklon" posle grebanja — samo u novogodišnjoj temi;
  // ostale teme (npr. Halloween bundeve) zadržavaju svoje ikonice i običan klik
  const giftTheme = theme === "newyear";
  if (giftTheme) {
    prepareGiftOpen(days);
    showOpenedGifts(root, days);
  }
  let previousUrl = null;
  let currentEntry = null;
  let disposeSlot = () => {};

  // Slot: jednom zavrteo = pri sledećem otvaranju odmah promocija (kao ogrebana grebalica)
  function slotKey(entry) {
    return `slot:${entry.shareUrl || `${entry.year}-${entry.month}-${entry.day}`}`;
  }

  function startSlot(entry) {
    if (!document.getElementById("slot-reveal")) return;
    let alreadyOpened = false;
    try {
      alreadyOpened = localStorage.getItem(slotKey(entry)) === "1";
    } catch {}
    disposeSlot = initSlot({
      alreadyOpened,
      confetti: payload.confetti?.style !== "off",
      onStopped: () => {
        try {
          localStorage.setItem(slotKey(entry), "1");
        } catch {}
        markDayOpened(entry.year, entry.month, entry.day);
        trackDay("slot", entry);
      },
    });
  }

  // ---- Modal style helpers ----

  function resetModalStyles() {
    modal.style.opacity = "";
    modal.style.transition = "";
  }

  // ---- Dialog open/close animations ----

  function animateOpen() {
    if (!dialog) return;

    dialog.classList.remove(
      "opacity-100", "translate-y-0", "scale-100",
      "opacity-0", "translate-y-4", "scale-95"
    );

    // novogodišnja tema na telefonu: panel klizi odozdo umesto da se uveća na sredini
    const sheet = modal.classList.contains("ny-modal") && matchMedia("(max-width: 767px)").matches;
    dialog.style.opacity = "0";
    dialog.style.transform = sheet ? "translateY(60%)" : "scale(0.85)";
    dialog.style.transition =
      "opacity 300ms cubic-bezier(0.34,1.56,0.64,1), transform 300ms cubic-bezier(0.34,1.56,0.64,1)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dialog.style.opacity = "1";
        dialog.style.transform = sheet ? "translateY(0)" : "scale(1)";
        setTimeout(() => {
          dialog.style.transition = "";
          dialog.style.opacity = "";
          dialog.style.transform = "";
          dialog.classList.add("opacity-100", "translate-y-0", "scale-100");
        }, 320);
      });
    });
  }

  function animateClose(cb, { swiped = false } = {}) {
    if (!dialog) {
      cb?.();
      return;
    }

    // zatvoren povlačenjem nadole: panel je već otišao dole — sakrij pa očisti stilove
    if (swiped) {
      modal.style.transition = "opacity 180ms ease";
      modal.style.opacity = "0";
      setTimeout(() => {
        cb?.();
        dialog.style.transform = "";
        dialog.style.transition = "";
        modal.style.opacity = "";
        modal.style.transition = "";
      }, 190);
      return;
    }

    // Clear any lingering inline styles from open animation
    dialog.style.opacity = "";
    dialog.style.transform = "";
    dialog.style.transition = "";

    dialog.classList.remove("opacity-100", "translate-y-0", "scale-100");
    dialog.classList.add("opacity-0", "translate-y-4", "scale-95");

    setTimeout(() => cb?.(), 200);
  }

  // ---- Open modal (with optional overlay fade + dialog delay) ----

  function openModal(entry, { overlayFadeDuration = 0, dialogDelay = 0 } = {}) {
    content.innerHTML = renderModalHTML(entry, lang, theme);
    currentEntry = entry;
    trackDay("day_open", entry);
    if (entry?.year != null && entry?.month != null && entry?.day) {
      window.dispatchEvent(new CustomEvent("mb-day-viewed", {
        detail: { year: entry.year, month: entry.month, day: entry.day },
      }));
    }

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    isOpen = true;

    previousUrl = window.location.href;
    if (entry && entry.shareUrl) {
      history.pushState({ promo: true }, "", entry.shareUrl);
    }

    if (overlayFadeDuration > 0) {
      modal.style.opacity = "0";
      modal.style.transition = `opacity ${overlayFadeDuration}ms ease-out`;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          modal.style.opacity = "1";
          setTimeout(() => {
            modal.style.opacity = "";
            modal.style.transition = "";
          }, overlayFadeDuration + 50);
        })
      );
    }

    setTimeout(() => {
      animateOpen();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const canvas = document.getElementById("scratch-canvas");
          if (canvas) initScratch({ confetti: payload.confetti });
          else if (document.getElementById("flip-card-inner")) attachFlipListener();
          startSlot(entry);
        })
      );
    }, dialogDelay);
  }

  function closeModal({ fromPopstate = false, swiped = false } = {}) {
    isOpen = false;
    disposeSlot();
    disposeSlot = () => {};
    document.body.style.overflow = "";
    if (!swiped) resetModalStyles();

    animateClose(() => {
      modal.classList.add("hidden");
      content.innerHTML = "";

      if (!fromPopstate && previousUrl) {
        history.replaceState(null, "", previousUrl);
      }
    }, { swiped });
  }

  // ---- Novogodišnja tema, telefon: povlačenje panela nadole ga zatvara ----
  // Ne kreće sa zlatne srećke (tamo se greba), linkova i dugmadi, niti dok je sadržaj skrolovan.
  if (dialog && modal.classList.contains("ny-modal")) {
    const phone = matchMedia("(max-width: 767px)");
    let startY = 0, dy = 0, startT = 0, dragging = false, decided = false;

    dialog.addEventListener("touchstart", (e) => {
      if (!isOpen || !phone.matches) return;
      if (e.target.closest("#scratch-canvas, a, button")) return;
      if (content.scrollTop > 0) return;
      // novogodišnja srećka: skroluje se samo tekst — panel se ne vuče dok tekst nije na vrhu
      if (e.target.closest(".ny-scratch__info")?.scrollTop > 0) return;
      startY = e.touches[0].clientY;
      startT = performance.now();
      dy = 0;
      dragging = true;
      decided = false;
    }, { passive: true });

    dialog.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      const d = e.touches[0].clientY - startY;
      if (!decided) {
        if (Math.abs(d) < 6) return;
        decided = true;
        if (d < 0) { dragging = false; return; } // prst ide gore — to je skrol sadržaja
      }
      dy = Math.max(0, d);
      if (e.cancelable) e.preventDefault(); // stranica/sadržaj se ne skroluju dok se panel vuče
      dialog.style.transition = "none";
      dialog.style.transform = `translateY(${dy}px)`;
    }, { passive: false });

    const end = () => {
      if (!dragging) return;
      dragging = false;
      const speed = dy / Math.max(1, performance.now() - startT); // px/ms
      if (dy > 120 || (dy > 40 && speed > 0.6)) {
        dialog.style.transition = "transform 200ms ease-in";
        dialog.style.transform = "translateY(100%)";
        setTimeout(() => isOpen && closeModal({ swiped: true }), 170);
      } else if (dy > 0) {
        dialog.style.transition = "transform 200ms ease-out";
        dialog.style.transform = "";
        setTimeout(() => (dialog.style.transition = ""), 220);
      }
    };
    dialog.addEventListener("touchend", end);
    dialog.addEventListener("touchcancel", end);
  }

  // ---- Click animation ----
  // Isti blagi "pritisak" za sve teme i uređaje (kartice, lopte, desktop grid).
  // Web Animations API + zasebno `scale` svojstvo: ne dira inline style.transform,
  // kojim su mobilne kartice (Stack/Vertical) pozicionirane.

  function animatePressClick(btn, entry) {
    btn.animate(
      [
        { scale: "1", easing: "cubic-bezier(0.34,1.56,0.64,1)" },
        { scale: "1.05", offset: 0.45, easing: "ease-out" },
        { scale: "1" },
      ],
      { duration: 260 }
    );

    setTimeout(() => {
      openModal(entry, { overlayFadeDuration: 200, dialogDelay: 100 });
    }, 200);
  }

  // ---- Click listener ----

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day-button]");
    if (!btn) return;

    const day = Number(btn.getAttribute("data-day"));
    const entry = days.find((d) => d.day === day);
    if (!entry || !entry.hasPromo || giftBusy) return;

    // grebalica: poklon (ikonica) se prvo otvori, pa iskoči pop-up
    if (giftTheme && giftOpenApplies(entry)) {
      const started = playGiftOpen(btn, {
        onReveal: () => {
          giftBusy = false;
          openModal(entry, { overlayFadeDuration: 200 });
        },
      });
      if (started) {
        giftBusy = true;
        return;
      }
    }

    animatePressClick(btn, entry);
  });

  // Klik na dugme promocije (data-track="cta") — analitika
  content.addEventListener("click", (e) => {
    if (currentEntry && e.target.closest('[data-track="cta"]')) trackDay("cta", currentEntry);
  });

  // Grebalica javlja kad je ogrebana (initScratch)
  window.addEventListener("mb-scratch-revealed", () => {
    if (currentEntry) trackDay("scratch", currentEntry);
  });

  // X dugme
  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  });

  // Klik na overlay
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closeModal();
    }
  });

  // back/forward
  window.addEventListener("popstate", () => {
    if (isOpen) {
      closeModal({ fromPopstate: true });
    }
  });

  // Deep-link (/promo/[iso]/[slug]) — dan je već SSR-ovan (server je popunio
  // #promo-content i uklonio "hidden" sa modala), samo povežemo state/scratch
  // bez ponovnog renderovanja sadržaja. Ako iz nekog razloga nije SSR-ovan
  // (modal je i dalje sakriven), padamo nazad na uobičajeno klijentsko otvaranje.
  if (openDay != null) {
    const entry = days.find((d) => d.day === openDay);
    if (entry && entry.hasPromo) {
      if (!modal.classList.contains("hidden")) {
        isOpen = true;
        currentEntry = entry;
        trackDay("day_open", entry);
        document.body.style.overflow = "hidden";
        previousUrl = monthHref(payload.year, payload.month);
        const canvas = document.getElementById("scratch-canvas");
        if (canvas) initScratch({ confetti: payload.confetti });
        else if (document.getElementById("flip-card-inner")) attachFlipListener();
        startSlot(entry);
      } else {
        openModal(entry, { overlayFadeDuration: 200 });
      }
    }
  }
}

export default initCalendarInteractions;

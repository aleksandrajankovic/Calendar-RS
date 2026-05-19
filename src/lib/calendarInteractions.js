// src/lib/calendarInteractions.js
import { renderScratchModal } from "./scratch/renderScratchModal";
import { initScratch } from "./scratch/initScratch";


// -----------------------------
// NORMAL MODAL (bez scratch-a)
// -----------------------------
function renderNormalModal(entry, lang = "sr") {
  if (!entry) {
    return lang === "sr"
      ? "<p>Ne postoje promocije za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  const { promo, type } = entry;

  const title = entry.title || (promo && promo.title) || "";
  const button = entry.button || (promo && promo.button) || "";
  const buttonColor =
    entry.buttonColor || (promo && promo.buttonColor) || "green";
  const link = entry.link || (promo && promo.link) || "";
  const richHtml = entry.richHtml || (promo && promo.richHtml) || "";

  if (!promo && !richHtml) {
    return lang === "sr"
      ? "<p>Ne postoje promocije za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  let imageHtml = null;
  let contentHtml = richHtml;

  if (contentHtml) {
    const imgMatch = contentHtml.match(/<img[^>]*>/i);
    if (imgMatch) {
      imageHtml = imgMatch[0]
        .replace(/\s+width="[^"]*"/gi, "")
        .replace(/\s+height="[^"]*"/gi, "")
        .replace(/\s+style="[^"]*"/gi, "");
      contentHtml = contentHtml.replace(imgMatch[0], "");
    }
  }

  let categoryLabel;
  if (type === "special") {
    categoryLabel =
      lang === "sr" ? "Ekskluzivna promocija" : "Special promotion";
  } else {
    categoryLabel = lang === "sr" ? "Nedeljna promocija" : "Weekly promotion";
  }

  const openUrl = link && String(link);
  const canOpen = openUrl && openUrl !== "#";
  const isYellow = buttonColor === "yellow";
  const defaultButtonLabel =
    button || (lang === "sr" ? "Registruj se" : "Register");

  return `
    <div class="flex flex-col w-full max-w-[420px] mx-auto">
      ${
        imageHtml
          ? `
        <div class="mb-4 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-2xl">
          ${imageHtml}
        </div>`
          : ""
      }

      <h2 class="font-bold text-[24px] md:text-[28px] leading-tight mb-2 text-center text-white">
        ${title}
      </h2>
      <div class="text-[11px] uppercase tracking-[0.12em] text-[#FACC01] mb-3 text-center">
        ${categoryLabel}
      </div>

      ${
        contentHtml
          ? `
        <div class="
          text-sm leading-relaxed text-white/90
          [&_strong]:font-semibold [&_em]:italic [&_u]:underline
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
          [&_li]:mb-0.5
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-1 [&_h1]:mt-2
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1 [&_h2]:mt-2
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-2
        ">
          ${contentHtml}
        </div>`
          : ""
      }

      ${
        canOpen
          ? `
        <div class="pt-5 mt-2 flex justify-center">
          <a
            href="${openUrl}"
            target="_blank"
            rel="noreferrer"
            class="
              w-4/5 max-w-[360px]
              inline-flex items-center justify-center
              px-4 py-3
              rounded-[10px]
              text-sm font-semibold font-condensed
              shadow-[0_10px_25px_rgba(0,0,0,0.6)]
              transition
              ${
                isYellow
                  ? "bg-[#FACC01] text-black hover:brightness-110"
                  : "bg-[#17BB00] text-white hover:brightness-110"
              }
            "
          >
            ${defaultButtonLabel}
          </a>
        </div>`
          : ""
      }
    </div>
  `;
}

// -----------------------------
// MAIN RENDER
// -----------------------------
function renderModalHTML(entry, lang = "sr", theme = "default") {
  if (!entry) {
    return lang === "sr"
      ? "<p>Ne postoje promocije za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  const { promo, type } = entry;

  const title = entry.title || (promo && promo.title) || "";
  const button = entry.button || (promo && promo.button) || "";
  const buttonColor =
    entry.buttonColor || (promo && promo.buttonColor) || "green";
  const link = entry.link || (promo && promo.link) || "";
  const richHtml = entry.richHtml || (promo && promo.richHtml) || "";
  const defaultButtonLabel =
    button || (lang === "sr" ? "Registruj se" : "Register");

  const isScratch = !!(entry?.scratch || promo?.scratch);

  if (isScratch) {
    const shareKey =
      entry?.shareUrl ||
      `${entry?.year}-${entry?.month}-${entry?.day}-${type || "promo"}`;

    return renderScratchModal({
      title,
      richHtml,
      link,
      button: defaultButtonLabel,
      buttonColor,
      type,
      lang,
      shareKey,
      threshold: 0.7,
      theme,
      year: entry?.year,
      month: entry?.month,
      day: entry?.day,
    });
  }

  return renderNormalModal(entry, lang);
}

// -----------------------------
// INIT FUNKCIJA
// -----------------------------
export function initCalendarInteractions(rootSelector = "#calendar-root") {
  const root = document.querySelector(rootSelector);
  if (!root) return;

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

  let isOpen = false;
  let previousUrl = null;

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

    dialog.style.opacity = "0";
    dialog.style.transform = "scale(0.85)";
    dialog.style.transition =
      "opacity 300ms cubic-bezier(0.34,1.56,0.64,1), transform 300ms cubic-bezier(0.34,1.56,0.64,1)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dialog.style.opacity = "1";
        dialog.style.transform = "scale(1)";
        setTimeout(() => {
          dialog.style.transition = "";
          dialog.style.opacity = "";
          dialog.style.transform = "";
          dialog.classList.add("opacity-100", "translate-y-0", "scale-100");
        }, 320);
      });
    });
  }

  function animateClose(cb) {
    if (!dialog) {
      cb?.();
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
          if (canvas) initScratch();
        })
      );
    }, dialogDelay);
  }

  function closeModal({ fromPopstate = false } = {}) {
    isOpen = false;
    document.body.style.overflow = "";
    resetModalStyles();

    animateClose(() => {
      modal.classList.add("hidden");
      content.innerHTML = "";

      if (!fromPopstate && previousUrl) {
        history.replaceState(null, "", previousUrl);
      }
    });
  }

  // ---- Ball click animations ----

  function animateRegularBallClick(btn, entry) {
    // 0ms: spring overshoot up
    btn.style.transition = "transform 150ms cubic-bezier(0.34,1.56,0.64,1)";
    btn.style.transform = "scale(1.18)";

    // 150ms: collapse to 0
    setTimeout(() => {
      btn.style.transition =
        "transform 250ms ease-in, opacity 250ms ease-in";
      btn.style.transform = "scale(0)";
      btn.style.opacity = "0";
    }, 150);

    // 300ms: show modal
    setTimeout(() => {
      btn.style.transform = "";
      btn.style.opacity = "";
      btn.style.transition = "";
      openModal(entry, { overlayFadeDuration: 200, dialogDelay: 100 });
    }, 300);
  }

  function animateGoldBallClick(btn, entry) {
    // 0ms: anticipation shake, scale builds to 1.15
    btn.style.animation = "gold-click-shake 300ms ease-in-out forwards";

    // 300ms: ball zooms with intense glow
    setTimeout(() => {
      btn.style.animation = "";
      btn.style.transition =
        "transform 200ms ease-out, box-shadow 200ms ease-out";
      btn.style.transform = "scale(1.6)";
      btn.style.boxShadow = "0 0 60px 30px rgba(248,217,122,0.8)";
    }, 300);

    // 500ms: ball collapses and fades + open modal
    setTimeout(() => {
      btn.style.transition =
        "transform 250ms ease-in, opacity 250ms ease-in, box-shadow 150ms ease-in";
      btn.style.transform = "scale(0.3)";
      btn.style.opacity = "0";
      btn.style.boxShadow = "";
      openModal(entry, { overlayFadeDuration: 200, dialogDelay: 100 });
    }, 500);

    // Reset ball inline styles after popup is open
    setTimeout(() => {
      btn.style.transform = "";
      btn.style.opacity = "";
      btn.style.transition = "";
      btn.style.boxShadow = "";
      btn.style.animation = "";
    }, 850);
  }

  // ---- Click listener ----

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day-button]");
    if (!btn) return;

    const day = Number(btn.getAttribute("data-day"));
    const entry = days.find((d) => d.day === day);
    if (!entry || !entry.hasPromo) return;

    const category =
      btn.getAttribute("data-category") || entry.category || "ALL";

    if (category === "GOLD") {
      animateGoldBallClick(btn, entry);
    } else {
      animateRegularBallClick(btn, entry);
    }
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
}

export default initCalendarInteractions;

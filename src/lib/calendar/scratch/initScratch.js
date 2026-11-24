// src/lib/scratch/initScratch.js
import confetti from "canvas-confetti";
import { markDayOpened } from "@/lib/calendar/calendarProgress";
import { confettiEmoji } from "@/lib/calendar/confetti";
import { launchGoldConfetti } from "@/lib/calendar/slot/slotReveal";

// Konfete posle grebanja po stilu iz admina: emoji "kiša" (fudbal, Halloween, Božić, custom),
// klasične papirne konfete, ili ništa (off)
function launchConfetti(style) {
  if (style?.style === "off") return;
  if (style?.style === "gold") {
    // isti efekat kao kod slot reveal-a, oko pop-upa
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dialog = document.getElementById("promo-dialog");
    if (dialog) launchGoldConfetti(dialog);
    return;
  }
  const emoji = confettiEmoji(style);

  if (emoji.length) {
    const shapes = emoji.map((text) => confetti.shapeFromText({ text, scalar: 1.6 }));
    const base = { scalar: 1.6, flat: true, ticks: 400, gravity: 3.5, decay: 0.9, shapes, disableForReducedMotion: true };
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        confetti({
          ...base,
          particleCount: 8 + Math.floor(Math.random() * 8),
          spread: 50 + Math.random() * 50,
          startVelocity: 35 + Math.random() * 25,
          origin: { x: 0.25 + Math.random() * 0.5, y: 0.2 + Math.random() * 0.2 },
        });
      }, i * 80 + Math.random() * 40);
    }
    return;
  }

  const colors = ["#ff0000", "#ffd700", "#17bb00", "#0066ff", "#ff69b4", "#ffffff"];
  const opts = { ticks: 300, colors, disableForReducedMotion: true };
  confetti({ ...opts, particleCount: 80, spread: 70, startVelocity: 38, origin: { x: 0.35, y: 0.35 } });
  setTimeout(() => {
    confetti({ ...opts, particleCount: 60, spread: 80, startVelocity: 32, origin: { x: 0.65, y: 0.35 } });
  }, 150);
}

// Visina zadnje strane flip kartice (tekst je obično duži od slike) — meri se na skrivenoj kopiji
function measureNaturalHeight(el, widthPx) {
  const clone = el.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.visibility = "hidden";
  clone.style.pointerEvents = "none";
  clone.style.inset = "auto";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.height = "auto";
  clone.style.width = `${widthPx}px`;
  document.body.appendChild(clone);
  const h = clone.scrollHeight;
  document.body.removeChild(clone);
  return h;
}

// Dodir okreće flip karticu (slika ⇄ detalji); okvir prati visinu strane koja se vidi
export function attachFlipListener() {
  const inner = document.getElementById("flip-card-inner");
  if (!inner || inner.dataset.flipBound) return;
  inner.dataset.flipBound = "1";

  const hint = document.getElementById("flip-hint");
  const wrapper = inner.closest(".flip-card-wrapper");
  const backFace = inner.querySelector(".flip-card-back");
  const frontAspectRatio = wrapper?.style.aspectRatio || "360 / 430";

  inner.onclick = (e) => {
    if (e.target.closest("a, button")) return;
    const flipped = inner.classList.toggle("is-flipped");
    if (hint) hint.style.opacity = flipped ? "0" : "1";

    if (!wrapper) return;
    if (flipped && backFace) {
      const width = wrapper.getBoundingClientRect().width;
      wrapper.style.aspectRatio = "unset";
      wrapper.style.height = `${measureNaturalHeight(backFace, width)}px`;
    } else {
      wrapper.style.height = "";
      wrapper.style.aspectRatio = frontAspectRatio;
    }
  };
}

// Zlatna srećka (novogodišnja tema): folija, isprekidan okvir, pahulje i natpis odluke dana
function fitLines(ctx, text, maxWidth, maxSize, family) {
  const words = String(text).split(/\s+/).filter(Boolean);
  for (let size = maxSize; size >= 14; size -= 2) {
    ctx.font = `700 ${size}px ${family}`;
    const lines = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length <= 3 && widest <= maxWidth) return { lines, size };
  }
  ctx.font = `700 14px ${family}`;
  return { lines: [String(text)], size: 14 };
}

function drawGoldCover(ctx, w, h, { text, kicker, sub, family }) {
  const g = ctx.createLinearGradient(0, h, w, 0);
  [["#8a6420", 0], ["#d8ad55", 0.22], ["#fff0c0", 0.4], ["#e2b85e", 0.58], ["#9b7124", 0.8], ["#d9ae58", 1]].forEach(([c, o]) =>
    g.addColorStop(o, c),
  );
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // pahulje / odsjaji
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  [[0.12, 0.22], [0.84, 0.18], [0.3, 0.84], [0.9, 0.78], [0.62, 0.12], [0.08, 0.7]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x * w, y * h, Math.max(1.5, w / 180), 0, Math.PI * 2);
    ctx.fill();
  });

  // isprekidan okvir
  const pad = Math.max(8, w * 0.03);
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(60,35,0,0.35)";
  ctx.beginPath();
  ctx.roundRect?.(pad, pad, w - pad * 2, h - pad * 2, 14);
  if (!ctx.roundRect) ctx.rect(pad, pad, w - pad * 2, h - pad * 2);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const { lines, size } = fitLines(ctx, text, w * 0.8, Math.round(Math.min(w / 9, h / 4.2)), family);
  const lineH = size * 1.05;
  const smallSize = Math.max(9, Math.round(w / 34));
  const blockH = smallSize * 2 + lineH * lines.length + smallSize * 2.4;
  let y = h / 2 - blockH / 2 + smallSize;

  ctx.fillStyle = "rgba(61,38,2,0.75)";
  ctx.font = `800 ${smallSize}px system-ui, sans-serif`;
  ctx.letterSpacing = "2px";
  ctx.fillText(kicker, w / 2, y);
  y += smallSize + lineH / 2 + 4;

  ctx.letterSpacing = "0px";
  ctx.font = `700 ${size}px ${family}`;
  for (const l of lines) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(l, w / 2, y + 1);
    ctx.fillStyle = "#3d2602";
    ctx.fillText(l, w / 2, y);
    y += lineH;
  }

  y += smallSize * 0.9;
  ctx.fillStyle = "rgba(61,38,2,0.7)";
  ctx.font = `700 ${smallSize}px system-ui, sans-serif`;
  ctx.letterSpacing = "2px";
  ctx.fillText(sub, w / 2, y);
  ctx.letterSpacing = "0px";
}

function getAnonUserId() {
  try {
    let id = localStorage.getItem("anon_user_id");
    if (!id) {
      id =
        (crypto?.randomUUID && crypto.randomUUID()) ||
        `u_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      localStorage.setItem("anon_user_id", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function initScratch({ confetti: confettiStyle = null } = {}) {
  const canvas = document.getElementById("scratch-canvas");
  if (!canvas) return;

  const reveal = document.getElementById("scratch-reveal");
  const hint = document.getElementById("scratch-hint");
  const hint1 = document.getElementById("scratch-hint1");

  const threshold = Number(canvas.dataset.threshold || 0.7);
  const coverUrl = canvas.dataset.cover;
  const promoKey = canvas.dataset.key || "default";
  const theme = canvas.dataset.theme || "default";
  const isFlip = canvas.dataset.flip === "1";
  const bgImg = document.getElementById("scratch-bg-img");
  const coverStyle = canvas.dataset.coverStyle || "image";
  const brush = Number(canvas.dataset.brush || 46);
  const tool = canvas.parentElement?.querySelector(".ny-tool"); // bombona koja prati prst

  const userId = getAnonUserId();
  const storageKey = `scratch:${userId}:${promoKey}`;

  let revealed = false;
  let touched = false;
  let drawing = false;
  let last = { x: 0, y: 0 };
  let timer = null;

  function showReveal() {
    reveal?.classList.remove(
      "max-h-0",
      "opacity-0",
      "translate-y-2",
      "pointer-events-none"
    );
    reveal?.classList.add(
      "max-h-[1200px]",
      "opacity-100",
      "translate-y-0",
      "pointer-events-auto"
    );

    if (isFlip) {
      attachFlipListener();
      const flipHint = document.getElementById("flip-hint");
      if (flipHint) flipHint.style.opacity = "1";
      setTimeout(() => bgImg?.remove(), 520);
    }
  }

  function hideScratchInstant() {
    canvas.style.pointerEvents = "none";
    canvas.style.display = "none";
  }

  function fullyClearCanvas() {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // already revealed
  try {
    if (localStorage.getItem(storageKey) === "1") {
      hint?.remove();
      hint1?.remove();
      hideScratchInstant();
      showReveal();
      return;
    }
  } catch {}

  function setup() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (!r.width || !r.height) return;

    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const startErasing = () => {
      canvas.style.background = "transparent";
      canvas.style.backgroundColor = "transparent";
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brush;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    if (coverStyle === "gold") {
      const family = getComputedStyle(canvas).getPropertyValue("--font-rowdies").trim() || "system-ui, sans-serif";
      const draw = () => {
        if (revealed) return;
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, r.width, r.height);
        drawGoldCover(ctx, r.width, r.height, {
          text: canvas.dataset.coverText || "OGREBI ME!",
          kicker: canvas.dataset.coverKicker || "",
          sub: canvas.dataset.coverSub || "",
          family,
        });
        startErasing();
      };
      draw();
      // font (Rowdies) možda još nije učitan — iscrtaj ponovo kad stigne, ako još niko nije grebao
      document.fonts?.load(`700 30px ${family}`).then(() => {
        if (!touched) draw();
      }).catch(() => {});
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverUrl;

    img.onload = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, r.width, r.height);
      ctx.fillStyle = "#6b21a8";
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.drawImage(img, 0, 0, r.width, r.height);
      canvas.style.backgroundColor = "transparent";

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 46;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    img.onerror = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#6b21a8";
      ctx.fillRect(0, 0, r.width, r.height);
      canvas.style.backgroundColor = "transparent";

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 46;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
  }

  function scratch(from, to) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function percent() {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let clear = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) clear++;
    }
    return clear / (canvas.width * canvas.height);
  }

  function revealNow() {
    if (revealed) return;
    revealed = true;

    try {
      localStorage.setItem(storageKey, "1");
    } catch {}

    const y = parseInt(canvas.dataset.year, 10);
    const m = parseInt(canvas.dataset.month, 10);
    const d = parseInt(canvas.dataset.day, 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      markDayOpened(y, m, d);
    }

    hint?.remove();
    hint1?.remove();

    // analitika (calendarInteractions) — broji se samo pravo grebanje, ne ponovno otvaranje
    window.dispatchEvent(new CustomEvent("mb-scratch-revealed"));

    launchConfetti(confettiStyle || { style: theme === "football" ? "football" : theme === "newyear" ? "christmas" : "classic" });

    showReveal();
    if (coverStyle !== "gold") fullyClearCanvas();

    canvas.style.pointerEvents = "none";
    tool?.classList.remove("is-on");
    const fade = coverStyle === "gold" ? 450 : 250;
    canvas.style.transition = `opacity ${fade}ms ease, transform ${fade}ms ease`;
    canvas.style.opacity = "0";
    if (coverStyle === "gold") canvas.style.transform = "scale(1.04)";
    setTimeout(() => {
      canvas.style.display = "none";
    }, fade + 10);
  }

  function check() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (percent() >= threshold) revealNow();
    }, 180);
  }

  function point(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function moveTool(e) {
    if (!tool || revealed) return;
    const p = point(e);
    // vrh bombone (dole desno na sličici) je tačka grebanja
    tool.style.transform = `translate(${p.x - tool.offsetWidth * 0.82}px, ${p.y - tool.offsetHeight * 0.94}px) rotate(-8deg)`;
    tool.classList.add("is-on");
  }

  function down(e) {
    touched = true;
    moveTool(e);
    drawing = true;
    last = point(e);
    scratch(last, { x: last.x + 0.01, y: last.y });
    check();
  }

  function move(e) {
    if (e.pointerType === "mouse" || drawing) moveTool(e);
    if (!drawing) return;
    const p = point(e);
    scratch(last, p);
    last = p;
    check();
  }

  function up(e) {
    drawing = false;
    if (e?.type === "pointerleave" || e?.pointerType !== "mouse") tool?.classList.remove("is-on");
  }

  setup();
  window.addEventListener("resize", setup, { once: true });

  canvas.onpointerdown = down;
  canvas.onpointermove = move;
  canvas.onpointerup = up;
  canvas.onpointerleave = up;
  canvas.onpointercancel = up;
}

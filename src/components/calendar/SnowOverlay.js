// src/components/calendar/SnowOverlay.js
// Sneg na kalendaru (canvas): tri sloja dubine — daleke sitne i mutne pahulje, srednje, i bliže krupnije —
// sa njihanjem i blagim promenljivim vetrom. Iza sadržaja kalendara (iza staklene kartice), ispred pozadine.
//
// mode (admin → Effects → Snow, po mesecu): true = uključen, false = isključen,
// null = automatski (od 25. decembra do 15. januara, kao ranije).
"use client";

import { useEffect, useRef } from "react";

function isSnowSeason(now = new Date()) {
  const m = now.getMonth();
  const d = now.getDate();
  return (m === 11 && d >= 25) || (m === 0 && d <= 15);
}

// slojevi: udeo pahulja, poluprečnik (px), brzina pada (px/s), providnost, jačina vetra
const LAYERS = [
  { share: 0.5, r: [0.7, 1.5], v: [14, 26], a: [0.3, 0.55], wind: 0.4 },
  { share: 0.33, r: [1.5, 2.6], v: [26, 46], a: [0.5, 0.8], wind: 0.7 },
  { share: 0.17, r: [2.6, 4.4], v: [46, 78], a: [0.7, 0.95], wind: 1 },
];
const rand = (a, b) => a + Math.random() * (b - a);

// meka pahulja: svetlo jezgro koje se gubi ka ivici (crta se jednom, pa samo skalira)
function makeSprite() {
  const s = document.createElement("canvas");
  s.width = s.height = 64;
  const g = s.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,.85)");
  grd.addColorStop(0.7, "rgba(230,240,255,.25)");
  grd.addColorStop(1, "rgba(230,240,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return s;
}

export default function SnowOverlay({ mode = null }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const on = mode === true || (mode == null && isSnowSeason());
    if (!canvas || !on) return;

    const ctx = canvas.getContext("2d");
    const sprite = makeSprite();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, flakes = [], raf = 0, last = performance.now(), t = 0;

    const spawn = (layer, anywhere) => ({
      layer,
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : -10,
      r: rand(...layer.r),
      vy: rand(...layer.v),
      alpha: rand(...layer.a),
      sway: rand(8, 26) * layer.wind,
      freq: rand(0.4, 1.1),
      phase: Math.random() * Math.PI * 2,
    });

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // gustina prema površini ekrana (telefon ~70, veliki monitor ~220)
      const count = Math.round(Math.min(220, Math.max(60, (W * H) / 9000)));
      flakes = LAYERS.flatMap((L) => Array.from({ length: Math.round(count * L.share) }, () => spawn(L, true)));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        const size = f.r * 4;
        ctx.globalAlpha = f.alpha;
        ctx.drawImage(sprite, f.x - size / 2, f.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      // vetar se polako menja (zbir dva spora talasa)
      const wind = Math.sin(t * 0.07) * 18 + Math.sin(t * 0.19 + 1.3) * 9;
      for (const f of flakes) {
        f.y += f.vy * dt;
        f.x += (Math.sin(f.phase + t * f.freq) * f.sway + wind * f.layer.wind) * dt;
        if (f.y > H + 10) Object.assign(f, spawn(f.layer, false));
        if (f.x < -10) f.x = W + 10;
        else if (f.x > W + 10) f.x = -10;
      }
      draw();
      raf = requestAnimationFrame(frame);
    };

    resize();
    if (reduced) {
      draw(); // bez animacije: mirne pahulje
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onResize = () => {
      resize();
      if (reduced) draw();
    };
    // u pozadinskom tabu ne troši procesor
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      ctx.clearRect(0, 0, W, H);
    };
  }, [mode]);

  if (mode === false) return null;
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] h-full w-full" />;
}

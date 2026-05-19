"use client";

const R = 185;          // ring radius in viewBox units
const ARC_START = 230;  // degrees clock (bottom-left ≈ 7–8 o'clock)
const ARC_SPAN  = 280;  // total degrees of arc (gap of 80° at bottom)

function clockToXY(deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: R * Math.sin(rad), y: -R * Math.cos(rad) };
}

function dotAngle(i, n) {
  if (n <= 1) return ARC_START + ARC_SPAN / 2;
  return ARC_START + (i / (n - 1)) * ARC_SPAN;
}

// SVG large-arc path from ARC_START to ARC_START+ARC_SPAN clockwise
const bgStart = clockToXY(ARC_START);
const bgEnd   = clockToXY(ARC_START + ARC_SPAN);
const BG_PATH = `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${R} ${R} 0 1 1 ${bgEnd.x.toFixed(2)} ${bgEnd.y.toFixed(2)}`;

export default function ProgressRing({ steps, openedDays }) {
  if (!steps || steps.length === 0) return null;

  const n = steps.length;

  // Progress arc — up to last consecutively opened step
  let progressEnd = null;
  for (let i = 0; i < n; i++) {
    if (openedDays.has(steps[i].day)) progressEnd = i;
  }

  const progressPath = progressEnd !== null ? (() => {
    const endDeg = dotAngle(progressEnd, n);
    const pEnd = clockToXY(endDeg);
    const spanSoFar = endDeg - ARC_START;
    const largeArc = spanSoFar > 180 ? 1 : 0;
    return `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${pEnd.x.toFixed(2)} ${pEnd.y.toFixed(2)}`;
  })() : null;

  return (
    <svg
      style={{
        position: "absolute",
        pointerEvents: "none",
        width: "calc(var(--football-ball-size) + 54px)",
        height: "calc(var(--football-ball-size) + 54px)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        overflow: "visible",
        zIndex: 25,
      }}
      viewBox="-200 -200 400 400"
    >
      {/* Background arc */}
      <path
        d={BG_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Completed arc */}
      {progressPath && (
        <path
          d={progressPath}
          fill="none"
          stroke="#FACC01"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}

      {/* Dots */}
      {steps.map((step, i) => {
        const { x, y } = clockToXY(dotAngle(i, n));
        const isGold   = step.category === "GOLD";
        const opened   = openedDays.has(step.day);
        const r        = isGold ? 8 : 5.5;

        return (
          <g key={step.day}>
            <circle
              cx={x} cy={y} r={r}
              fill={opened ? (isGold ? "#FACC01" : "white") : "rgba(0,0,0,0.45)"}
              stroke={isGold ? "#FACC01" : (opened ? "white" : "rgba(255,255,255,0.3)")}
              strokeWidth={isGold ? 2 : 1.5}
            />

            {/* Gold star */}
            {isGold && (
              <text
                x={x} y={y + 0.5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="7.5" fill={opened ? "#000" : "#FACC01"}
              >★</text>
            )}

            {/* Checkmark */}
            {opened && !isGold && (
              <path
                d={`M${(x-2.8).toFixed(1)} ${y.toFixed(1)} L${(x-0.3).toFixed(1)} ${(y+2.3).toFixed(1)} L${(x+3.2).toFixed(1)} ${(y-2.8).toFixed(1)}`}
                stroke="#000" strokeWidth="1.6"
                fill="none" strokeLinecap="round" strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

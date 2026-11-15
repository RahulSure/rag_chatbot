"use client";

/**
 * The full-screen backdrop of the river stage: sky and stars, the orb and its road of
 * light, a temple skyline with lit windows and its reflection, a slow boat, the water,
 * and the ghat steps the visitor stands on. Layers shift gently with the pointer.
 */

import { motion, useTransform, type MotionValue } from "framer-motion";

export const VIEW_W = 1440;
export const VIEW_H = 810;
export const HORIZON = 300;

type T = { x: number; w: number; h: number; dome?: boolean };

// Far-bank skyline: shikharas, chhatri domes, low walls between.
const TEMPLES: T[] = [
  { x: 20, w: 52, h: 66 }, { x: 86, w: 34, h: 38, dome: true }, { x: 146, w: 70, h: 96 },
  { x: 236, w: 38, h: 46 }, { x: 320, w: 30, h: 34, dome: true }, { x: 376, w: 60, h: 76 },
  { x: 470, w: 34, h: 36, dome: true }, { x: 540, w: 46, h: 56 }, { x: 640, w: 30, h: 32, dome: true },
  { x: 710, w: 76, h: 110 }, { x: 806, w: 36, h: 42, dome: true }, { x: 900, w: 50, h: 62 },
  { x: 1000, w: 34, h: 38 }, { x: 1180, w: 64, h: 86 }, { x: 1260, w: 34, h: 36, dome: true },
  { x: 1330, w: 48, h: 58 }, { x: 1398, w: 30, h: 34, dome: true },
];

function temple({ x, w, h, dome }: T) {
  const base = HORIZON - 6;
  if (dome) {
    const r = w / 2;
    return `M${x} ${base}V${base - h + r}A${r} ${r} 0 0 1 ${x + w} ${base - h + r}V${base}Z`;
  }
  const top = base - h;
  return `M${x} ${base}V${base - h * 0.3}C${x} ${base - h * 0.75} ${x + w * 0.38} ${base - h * 0.9} ${x + w / 2} ${top}` +
    `C${x + w * 0.62} ${base - h * 0.9} ${x + w} ${base - h * 0.75} ${x + w} ${base - h * 0.3}V${base}Z` +
    `M${x + w / 2 - 5} ${top + 1}a5 2.5 0 0 1 10 0Z` +
    `M${x + w / 2 - 1.2} ${top}h2.4v-10h-2.4Z`;
}

const SKYLINE = TEMPLES.map(temple).join("");

// Warm windows on the bigger temples, lit after dark.
const WINDOWS = TEMPLES.filter((t) => t.h > 50).flatMap((t) =>
  [0.42, 0.62].flatMap((f, i) =>
    t.h > 80 && i === 0
      ? [{ x: t.x + t.w * 0.35, y: HORIZON - 6 - t.h * f }, { x: t.x + t.w * 0.65, y: HORIZON - 6 - t.h * f }]
      : [{ x: t.x + t.w / 2, y: HORIZON - 6 - t.h * f }]
  )
);

const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: ((i * 397) % VIEW_W), y: 14 + ((i * 131) % (HORIZON - 80)), r: 0.6 + ((i * 7) % 3) * 0.35, o: 0.25 + ((i * 11) % 5) * 0.12,
}));

const ORB = { x: 1080, y: 116 };

/**
 * mx/my are the pointer, -1..1; still (reduced motion) pins every layer in place.
 * narrow (a phone) slides the ghat and the orb toward the middle of the picture,
 * where the sideways crop leaves them visible.
 */
export function StageArt({ mx, my, still, narrow }: { mx: MotionValue<number>; my: MotionValue<number>; still: boolean; narrow: boolean }) {
  const far = useTransform(mx, (v) => (still ? 0 : v * -8));
  const mid = useTransform(mx, (v) => (still ? 0 : v * -16));
  const front = useTransform(mx, (v) => (still ? 0 : v * -26));
  const lift = useTransform(my, (v) => (still ? 0 : v * -6));

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"
         className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--sky-top))" />
          <stop offset="1" stopColor="rgb(var(--sky-bottom))" />
        </linearGradient>
        <linearGradient id="st-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--water-top))" />
          <stop offset="1" stopColor="rgb(var(--water-bottom))" />
        </linearGradient>
        <radialGradient id="st-orb-glow">
          <stop offset="0" stopColor="rgb(var(--orb))" stopOpacity="0.5" />
          <stop offset="1" stopColor="rgb(var(--orb))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="st-lamp-glow">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
        <filter id="st-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* sky, stars and the orb */}
      <rect width={VIEW_W} height={HORIZON + 4} fill="url(#st-sky)" />
      <g opacity="var(--stars-op)" fill="#fff">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} className={i % 5 === 0 ? "ganga-glint" : undefined}
                  style={i % 5 === 0 ? { animationDelay: `${-i * 0.7}s` } : undefined} />
        ))}
      </g>
      <motion.g style={{ x: far, y: lift }}>
        <g transform={narrow ? "translate(-300 0)" : undefined}>
          <circle cx={ORB.x} cy={ORB.y} r="120" fill="url(#st-orb-glow)" />
          <circle cx={ORB.x} cy={ORB.y} r="32" fill="rgb(var(--orb))" />
        </g>
      </motion.g>

      {/* the far bank and its reflection */}
      <motion.g style={{ x: far }}>
        <path d={SKYLINE} fill="rgb(var(--bank))" />
        <rect y={HORIZON - 8} x="-40" width={VIEW_W + 80} height="10" fill="rgb(var(--bank))" />
        <g fill="rgb(var(--glint))" opacity="var(--windows-op)">
          {WINDOWS.map((w, i) => (
            <rect key={i} x={w.x - 1.6} y={w.y} width="3.2" height="4.6" rx="0.8"
                  className={i % 3 === 0 ? "ganga-glint" : undefined} style={{ animationDelay: `${-i * 1.1}s` }} />
          ))}
        </g>
        <g transform={`translate(0 ${2 * HORIZON}) scale(1 -1)`} opacity="0.1" filter="url(#st-soft)">
          <path d={SKYLINE} fill="rgb(var(--bank))" />
        </g>
        {/* mist lying on the water along the far bank */}
        <g filter="url(#st-soft)" opacity="0.3">
          <ellipse className="ganga-mist" cx="420" cy={HORIZON + 8} rx="260" ry="13" fill="rgb(var(--sky-bottom))" />
          <ellipse className="ganga-mist" cx="1060" cy={HORIZON + 13} rx="300" ry="15" fill="rgb(var(--sky-bottom))"
                   style={{ animationDelay: "-14s", animationDirection: "alternate-reverse" }} />
        </g>
      </motion.g>

      {/* water */}
      <rect y={HORIZON} width={VIEW_W} height={VIEW_H - HORIZON} fill="url(#st-water)" />

      <motion.g style={{ x: mid }}>
        <g transform={narrow ? "translate(-300 0)" : undefined}>
        {/* the orb's road of light */}
        {Array.from({ length: 18 }, (_, i) => {
          const y = HORIZON + 10 + i * 17;
          const w = 20 + i * 7 + (i % 3) * 10;
          return (
            <rect key={i} className="ganga-shimmer" x={ORB.x - w / 2 + ((i * 37) % 13) - 6} y={y} width={w} height="2.2" rx="1.1"
                  fill="rgb(var(--glint))" style={{ animationDelay: `${-(i * 0.47)}s`, animationDuration: `${3 + (i % 4) * 0.55}s` }} />
          );
        })}
        </g>
        {/* ripples, wandering with the current */}
        {Array.from({ length: 30 }, (_, i) => (
          <rect key={i} className="ganga-sway" x={(i * 263) % VIEW_W} y={HORIZON + 20 + ((i * 97) % (VIEW_H - HORIZON - 50))}
                width={34 + ((i * 17) % 60)} height="1.6" rx="0.8" fill="rgb(var(--glint))" opacity="0.16"
                style={{ animationDelay: `${-(i * 1.3)}s`, animationDuration: `${8 + (i % 5) * 2}s` }} />
        ))}
        {/* other sadhaks' lamps, far out on the water */}
        {[{ y: 328, d: 110, at: 0.15 }, { y: 344, d: 140, at: 0.55 }, { y: 336, d: 125, at: 0.85 }].map((p, i) => (
          <g key={`lamp-${i}`} transform={`translate(-80 ${p.y})`}>
            <g className="ganga-drift" style={{ animationDuration: `${p.d}s`, animationDelay: `${-p.d * p.at}s`, ["--rest" as string]: `${220 + i * 420}px` }}>
              <circle r="8" fill="url(#st-lamp-glow)" />
              <circle r="1.9" fill="#ffd27a" className="ganga-glint" style={{ animationDelay: `${-i * 1.4}s` }} />
            </g>
          </g>
        ))}
        {/* a boatman crossing, far away */}
        <g transform="translate(-120 352)">
          <g className="ganga-drift" style={{ animationDuration: "150s", animationDelay: "-40s", ["--rest" as string]: "700px" }}>
            <path d="M0 0Q24 10 48 0L42-3Q24 3 6-3Z" fill="rgb(var(--bank))" />
            <path d="M30-3q1-9 4-11l2 1q-2 4-3 10Z" fill="rgb(var(--bank))" />
            <path d="M33-13 44 2l1.6-1L36-14Z" fill="rgb(var(--bank))" opacity="0.8" />
          </g>
        </g>
      </motion.g>

      {/* the near bank: ghat steps, a rangoli landing, reeds */}
      <motion.g style={{ x: front }}>
        <g transform={narrow ? "translate(430 0)" : undefined}>
        <path d={`M-40 ${VIEW_H}V560h150v24h44v24h40v24h38v24h34v24h32v24h30v${VIEW_H - 728}Z`} fill="rgb(var(--bank))" />
        <ellipse cx="190" cy="700" rx="52" ry="14" fill="rgb(var(--glint))" opacity="0.18" />
        <g stroke="rgb(var(--glint))" strokeOpacity="0.5" fill="none">
          <ellipse cx="190" cy="700" rx="34" ry="9" />
          <ellipse cx="190" cy="700" rx="18" ry="4.8" />
        </g>
        <g fill="rgb(var(--bank))">
          <path d={`M${VIEW_W - 60} ${VIEW_H}q-6-70 4-110l6 2q-6 48-2 108Z`} />
          <path d={`M${VIEW_W - 36} ${VIEW_H}q2-56 14-88l6 3q-10 36-12 85Z`} />
          <path d={`M${VIEW_W - 86} ${VIEW_H}q-10-44-4-78l6 1q-4 40 6 77Z`} />
        </g>
        {/* fireflies, only after dark */}
        <g opacity="var(--stars-op)">
          {[{ x: 250, y: 560 }, { x: 110, y: 480 }, { x: 1240, y: 600 }, { x: 1330, y: 520 }, { x: 640, y: 690 }].map((f, i) => (
            <g key={i} className="ganga-fly" transform={`translate(${f.x} ${f.y})`}
               style={{ animationDelay: `${-i * 3.7}s`, animationDuration: `${13 + (i % 3) * 4}s` }}>
              <circle className="ganga-blink" r="2" fill="#ffe9a6" style={{ animationDelay: `${-i * 1.9}s`, animationDuration: `${3.6 + (i % 4) * 0.8}s` }} />
            </g>
          ))}
        </g>
        </g>
      </motion.g>
    </svg>
  );
}

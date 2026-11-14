/**
 * The Ganga at dawn (light theme) or under the moon (dark): temples on the far bank,
 * the orb's path of light on the water, ghat steps in the corner, and diyas drifting
 * downstream. Purely decorative; with reduced motion the river is still.
 */

const W = 1200;
const H = 360;
const HORIZON = 150;

// Far-bank skyline: shikharas, a chhatri dome or two, low walls between.
const TEMPLES: { x: number; w: number; h: number; dome?: boolean }[] = [
  { x: 40, w: 46, h: 58 }, { x: 96, w: 30, h: 34, dome: true }, { x: 150, w: 60, h: 82 },
  { x: 228, w: 34, h: 40 }, { x: 330, w: 28, h: 30, dome: true }, { x: 380, w: 52, h: 66 },
  { x: 520, w: 40, h: 48 }, { x: 570, w: 26, h: 28, dome: true }, { x: 690, w: 64, h: 92 },
  { x: 770, w: 32, h: 36, dome: true }, { x: 860, w: 44, h: 54 }, { x: 1010, w: 56, h: 74 },
  { x: 1080, w: 30, h: 32, dome: true }, { x: 1130, w: 42, h: 50 },
];

function temple({ x, w, h, dome }: (typeof TEMPLES)[number]) {
  const base = HORIZON - 6;
  if (dome) {
    const r = w / 2;
    return `M${x} ${base}V${base - h + r}A${r} ${r} 0 0 1 ${x + w} ${base - h + r}V${base}Z`;
  }
  // Curved shikhara rising to a point, with an amalaka disc and a finial.
  const top = base - h;
  return `M${x} ${base}V${base - h * 0.3}C${x} ${base - h * 0.75} ${x + w * 0.38} ${base - h * 0.9} ${x + w / 2} ${top}` +
    `C${x + w * 0.62} ${base - h * 0.9} ${x + w} ${base - h * 0.75} ${x + w} ${base - h * 0.3}V${base}Z` +
    `M${x + w / 2 - 5} ${top + 1}a5 2.5 0 0 1 10 0Z` +
    `M${x + w / 2 - 1.2} ${top}h2.4v-9h-2.4Z`;
}

// Lanes of drifting diyas: vertical place, scale, how long one crossing takes, and where it starts.
const DIYAS = [
  { y: 196, s: 0.7, dur: 70, at: 0.1 },
  { y: 214, s: 0.8, dur: 62, at: 0.55 },
  { y: 238, s: 0.95, dur: 54, at: 0.3 },
  { y: 262, s: 1.1, dur: 48, at: 0.8 },
  { y: 290, s: 1.25, dur: 42, at: 0.05 },
  { y: 318, s: 1.45, dur: 38, at: 0.45 },
  { y: 228, s: 0.85, dur: 66, at: 0.92 },
];

function Diya({ scale }: { scale: number }) {
  return (
    <g transform={`scale(${scale})`}>
      <g className="ganga-bob">
        <ellipse cx="0" cy="13" rx="24" ry="3.5" fill="rgb(var(--glint))" opacity="0.35" />
        {/* leaf boat (dona), clay lamp, a marigold, the flame and its glow */}
        <path d="M-22 4Q0 18 22 4L18 0Q0 9-18 0Z" fill="#3f5f36" />
        <path d="M-11 2Q0 11 11 2L9-1Q0 3-9-1Z" fill="#b5653a" />
        <circle cx="-14" cy="2" r="3.2" fill="#f0a020" />
        <circle cx="0" cy="-8" r="14" fill="url(#ganga-flame-glow)" />
        <path className="ganga-flame" d="M0-15Q5-7 0-1Q-5-7 0-15Z" fill="#ffd27a" />
      </g>
    </g>
  );
}

export function RiverScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"
         className={`ganga-scene block h-full w-full ${className}`}>
      <defs>
        <linearGradient id="ganga-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--sky-top))" />
          <stop offset="1" stopColor="rgb(var(--sky-bottom))" />
        </linearGradient>
        <linearGradient id="ganga-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--water-top))" />
          <stop offset="1" stopColor="rgb(var(--water-bottom))" />
        </linearGradient>
        <radialGradient id="ganga-flame-glow">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ganga-orb-glow">
          <stop offset="0" stopColor="rgb(var(--orb))" stopOpacity="0.55" />
          <stop offset="1" stopColor="rgb(var(--orb))" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={W} height={HORIZON} fill="url(#ganga-sky)" />
      <circle cx="905" cy="100" r="90" fill="url(#ganga-orb-glow)" />
      <circle cx="905" cy="100" r="24" fill="rgb(var(--orb))" />

      <path d={TEMPLES.map(temple).join("")} fill="rgb(var(--bank))" />
      <rect y={HORIZON - 8} width={W} height="10" fill="rgb(var(--bank))" />

      <rect y={HORIZON} width={W} height={H - HORIZON} fill="url(#ganga-water)" />

      {/* the orb's road of light across the water */}
      {Array.from({ length: 14 }, (_, i) => {
        const y = HORIZON + 10 + i * 14;
        const w = 18 + i * 5 + (i % 3) * 8;
        return (
          <rect key={i} className="ganga-glint" x={905 - w / 2 + ((i * 37) % 11) - 5} y={y} width={w} height="2" rx="1"
                fill="rgb(var(--glint))" style={{ animationDelay: `${-(i * 0.45)}s` }} />
        );
      })}
      {/* ripples */}
      {Array.from({ length: 22 }, (_, i) => (
        <rect key={i} x={(i * 263) % W} y={HORIZON + 18 + ((i * 71) % (H - HORIZON - 30))} width={30 + ((i * 17) % 50)} height="1.5"
              rx="0.75" fill="rgb(var(--glint))" opacity="0.18" />
      ))}

      {DIYAS.map((d, i) => (
        <g key={i} transform={`translate(-80 ${d.y})`}>
          <g className="ganga-drift"
             style={{ animationDuration: `${d.dur}s`, animationDelay: `${-d.dur * d.at}s`, ["--rest" as string]: `${80 + d.at * W}px` }}>
            <Diya scale={d.s} />
          </g>
        </g>
      ))}

      {/* ghat steps entering the water, bottom left */}
      <path d={`M0 ${H}V250h40v16h28v16h26v16h24v16h22v16h20v${H - 346}Z`} fill="rgb(var(--bank))" opacity="0.92" />
    </svg>
  );
}

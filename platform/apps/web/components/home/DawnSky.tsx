/**
 * The hero's daytime sky: the sidereal wheel at sunrise. A sun at its heart throws
 * slow-turning rays; the navagraha travel their orbits at their own pace (Rahu
 * and Ketu retrograde, always opposite each other); gold dust hangs in the light.
 * Drawn, not filmed, so the rashi names stay exact. Still under reduced motion.
 */

import { ZodiacWheel } from "./ZodiacWheel";

// radius on the wheel, size, seconds per orbit, starting angle, colours
const GRAHAS: { name: string; r: number; size: number; secs: number; at: number; fill: string; edge?: string; ring?: boolean }[] = [
  { name: "Chandra", r: 142, size: 9, secs: 70, at: 20, fill: "#c9c3b5", edge: "#a39d8f" },
  { name: "Budha", r: 166, size: 6.5, secs: 95, at: 140, fill: "#7aa46f" },
  { name: "Shukra", r: 190, size: 9.5, secs: 125, at: 250, fill: "#f3e6c9", edge: "#c2aa7d" },
  { name: "Mangal", r: 214, size: 7.5, secs: 165, at: 75, fill: "#c4492f" },
  { name: "Guru", r: 240, size: 14, secs: 240, at: 200, fill: "#d9a441" },
  { name: "Shani", r: 281, size: 11, secs: 330, at: 320, fill: "#5d6679", ring: true },
];

function Planet({ size, fill, edge, ring }: { size: number; fill: string; edge?: string; ring?: boolean }) {
  return (
    <>
      {ring && <ellipse rx={size * 2} ry={size * 0.55} fill="none" stroke="#8a90a0" strokeWidth="2" opacity="0.9" />}
      <circle r={size} fill={fill} stroke={edge} strokeWidth={edge ? 1 : 0} />
      <circle cx={-size * 0.32} cy={-size * 0.32} r={size * 0.42} fill="#fff" opacity="0.38" />
    </>
  );
}

const DUST = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 92 + 4}%`, top: `${(i * 53) % 86 + 7}%`, dur: 11 + (i % 5) * 3, delay: -i * 1.7, size: 2 + (i % 3),
}));

export function DawnSky({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`aspect-square ${className}`}>
      {/* the sun's warmth, and its rays turning slowly */}
      <div className="absolute inset-[-12%] rounded-full"
           style={{ background: "radial-gradient(circle, rgb(255 204 128 / 0.55), rgb(249 214 160 / 0.2) 34%, transparent 62%)" }} />
      <div className="zw-turn absolute inset-[4%] rounded-full"
           style={{
             background: "repeating-conic-gradient(from 0deg, rgb(196 140 52 / 0.11) 0deg 2.5deg, transparent 2.5deg 12deg)",
             WebkitMaskImage: "radial-gradient(circle, #000 12%, transparent 62%)",
             maskImage: "radial-gradient(circle, #000 12%, transparent 62%)",
             animationDuration: "720s",
           }} />

      <ZodiacWheel spin className="absolute inset-0 h-full w-full text-gold opacity-[0.2]" />

      {/* the navagraha on their orbits */}
      <svg viewBox="-450 -450 900 900" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="ds-sun">
            <stop offset="0" stopColor="#fff4d6" />
            <stop offset="0.45" stopColor="#f7c25a" />
            <stop offset="1" stopColor="#e0902a" />
          </radialGradient>
          <radialGradient id="ds-sun-glow">
            <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g fill="none" stroke="rgb(var(--accent))" strokeOpacity="0.22" strokeWidth="1" strokeDasharray="1 7">
          {GRAHAS.map((g) => <circle key={g.name} r={g.r} />)}
        </g>
        {/* Surya at the centre */}
        <circle r="70" fill="url(#ds-sun-glow)" className="ganga-lampglow" />
        <circle r="24" fill="url(#ds-sun)" />
        {GRAHAS.map((g) => (
          <g key={g.name} className="zw-orbit" style={{ animationDuration: `${g.secs}s`, animationDelay: `${-(g.at / 360) * g.secs}s` }}>
            <circle r="450" fill="none" />{/* keeps the turning centred on the wheel */}
            <g transform={`translate(${g.r} 0)`}><Planet {...g} /></g>
          </g>
        ))}
        {/* Rahu and Ketu: shadow points, opposite each other, moving backwards */}
        <g className="zw-orbit" style={{ animationDuration: "420s", animationDirection: "reverse" }}>
          <circle r="450" fill="none" />
          <circle cx="252" r="6.5" fill="#4b3f5e" />
          <circle cx="-252" r="6.5" fill="none" stroke="#7a5a3a" strokeWidth="2.5" />
        </g>
      </svg>

      {/* gold dust in the light */}
      {DUST.map((d, i) => (
        <span key={i} className="ganga-fly absolute" style={{ left: d.left, top: d.top, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}>
          <span className="ganga-blink block rounded-full bg-[#d9a441]"
                style={{ width: d.size, height: d.size, boxShadow: "0 0 6px 1px rgb(217 164 65 / 0.45)", animationDelay: `${d.delay * 0.7}s` }} />
        </span>
      ))}
    </div>
  );
}

/**
 * One diya — a leaf boat, clay lamp, marigold and a living flame — used everywhere
 * on the stage. `seed` staggers the bob, the flicker and the wake, so no two lamps
 * on the river ever move in step.
 */
export function DiyaSprite({ size = 72, lit = true, seed = 0 }: { size?: number; lit?: boolean; seed?: number }) {
  const bob = { animationDelay: `${-(seed % 7) * 0.63}s`, animationDuration: `${3.4 + (seed % 5) * 0.45}s` };
  const flame = { animationDelay: `${-(seed % 5) * 0.37}s`, animationDuration: `${1.25 + (seed % 4) * 0.22}s` };
  const innerFlame = { animationDelay: `${-(seed % 3) * 0.29}s`, animationDuration: `${1.05 + (seed % 5) * 0.17}s` };
  return (
    <svg viewBox="-34 -34 68 52" width={size} height={size * (52 / 68)} aria-hidden="true" focusable="false" className="block overflow-visible">
      <ellipse className="ganga-ring" style={{ animationDelay: `${-(seed % 6) * 0.53}s` }}
               cx="0" cy="13" rx="22" ry="3.4" fill="none" stroke="rgb(var(--glint))" strokeWidth="1" />
      <g className="ganga-bob" style={bob}>
        <ellipse cx="0" cy="13" rx="26" ry="4" fill="rgb(var(--glint))" opacity="0.35" />
        <path d="M-24 4Q0 19 24 4L20 0Q0 9-20 0Z" fill="#3f5f36" />
        <path d="M-12 2Q0 12 12 2L10-1Q0 3-10-1Z" fill="#b5653a" />
        <circle cx="-15" cy="2" r="3.5" fill="#f0a020" />
        <circle cx="15" cy="3" r="2.6" fill="#e2563a" />
        {lit && (
          <>
            <circle cx="0" cy="-9" r="15" fill="url(#diya-flame-glow)" />
            <path className="ganga-flame" style={flame} d="M0-16Q5.5-7.5 0-1Q-5.5-7.5 0-16Z" fill="#ffd27a" />
            <path className="ganga-flame" style={innerFlame} d="M0-11Q3-7 0-2.5Q-3-7 0-11Z" fill="#fff3d0" opacity="0.9" />
          </>
        )}
      </g>
      <defs>
        <radialGradient id="diya-flame-glow">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

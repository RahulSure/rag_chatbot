/**
 * One diya — a leaf boat, clay lamp, marigold and a living flame — painted with
 * light: the clay glows where the flame touches it and the halo blooms in two
 * layers. `seed` staggers the bob, the flicker and the wake, so no two lamps on
 * the river ever move in step.
 */
export function DiyaSprite({ size = 72, lit = true, seed = 0 }: { size?: number; lit?: boolean; seed?: number }) {
  const bob = { animationDelay: `${-(seed % 7) * 0.63}s`, animationDuration: `${3.4 + (seed % 5) * 0.45}s` };
  const flame = { animationDelay: `${-(seed % 5) * 0.37}s`, animationDuration: `${1.25 + (seed % 4) * 0.22}s` };
  const innerFlame = { animationDelay: `${-(seed % 3) * 0.29}s`, animationDuration: `${1.05 + (seed % 5) * 0.17}s` };
  return (
    <svg viewBox="-34 -34 68 52" width={size} height={size * (52 / 68)} aria-hidden="true" focusable="false" className="block overflow-visible">
      <defs>
        <radialGradient id="dy-halo">
          <stop offset="0" stopColor="#ffdf9e" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#ffbf63" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ff9d3a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dy-halo-wide">
          <stop offset="0" stopColor="#ffb85c" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffb85c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dy-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0a964" />
          <stop offset="0.45" stopColor="#c06f38" />
          <stop offset="1" stopColor="#71381b" />
        </linearGradient>
        <linearGradient id="dy-leaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d7d3c" />
          <stop offset="1" stopColor="#24351a" />
        </linearGradient>
        <linearGradient id="dy-fire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9b0" />
          <stop offset="0.55" stopColor="#ffb648" />
          <stop offset="1" stopColor="#f07820" />
        </linearGradient>
      </defs>
      <ellipse className="ganga-ring" style={{ animationDelay: `${-(seed % 6) * 0.53}s` }}
               cx="0" cy="13" rx="22" ry="3.4" fill="none" stroke="#ffd27a" strokeOpacity="0.55" strokeWidth="1" />
      <g className="ganga-bob" style={bob}>
        {lit && <ellipse cx="0" cy="2" rx="33" ry="22" fill="url(#dy-halo-wide)" />}
        <ellipse cx="0" cy="13" rx="26" ry="4" fill="#ffd27a" opacity="0.4" />
        <path d="M-24 4Q0 19 24 4L20 0Q0 9-20 0Z" fill="url(#dy-leaf)" />
        <path d="M-24 4Q0 13 24 4Q0 11-24 4Z" fill="#ffca7e" opacity="0.35" />
        <path d="M-12 2Q0 12 12 2L10-1Q0 3-10-1Z" fill="url(#dy-clay)" />
        <path d="M-12 2Q0 7 12 2Q0 5.5-12 2Z" fill="#ffd89a" opacity="0.6" />
        <circle cx="-15" cy="2" r="3.5" fill="#f0a020" />
        <circle cx="-15" cy="1" r="1.7" fill="#ffd25e" />
        <circle cx="15" cy="3" r="2.6" fill="#e2563a" />
        <circle cx="15" cy="2.2" r="1.2" fill="#ff8d64" />
        {lit && (
          <>
            <circle cx="0" cy="-9" r="17" fill="url(#dy-halo)" />
            <path className="ganga-flame" style={flame} d="M0-17Q6-8 0-0.5Q-6-8 0-17Z" fill="url(#dy-fire)" />
            <path className="ganga-flame" style={innerFlame} d="M0-11.5Q3.1-7 0-2.5Q-3.1-7 0-11.5Z" fill="#fff6dd" opacity="0.95" />
            <circle cx="0" cy="-4" r="1.3" fill="#5a84ff" opacity="0.5" />
          </>
        )}
      </g>
    </svg>
  );
}

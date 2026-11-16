/**
 * One diya, drawn the way the river's own lamps look in the backdrops: a clay
 * bowl wreathed in marigold petals, oil glinting inside, a living flame in a
 * two-layer halo. `seed` staggers the bob, the flicker and the wake, so no two
 * lamps on the river ever move in step.
 */

const PETALS_BACK = [-12, -6, 0, 6, 12];
const PETALS_FRONT = [-15, -9, -3, 3, 9, 15];
const MARIGOLD = ["#f59f1f", "#e8611f", "#ffd04e"];

export function DiyaSprite({ size = 72, lit = true, seed = 0 }: { size?: number; lit?: boolean; seed?: number }) {
  const bob = { animationDelay: `${-(seed % 7) * 0.63}s`, animationDuration: `${3.4 + (seed % 5) * 0.45}s` };
  const flame = { animationDelay: `${-(seed % 5) * 0.37}s`, animationDuration: `${1.25 + (seed % 4) * 0.22}s` };
  const innerFlame = { animationDelay: `${-(seed % 3) * 0.29}s`, animationDuration: `${1.05 + (seed % 5) * 0.17}s` };
  return (
    <svg viewBox="-30 -34 60 48" width={size} height={size * (48 / 60)} aria-hidden="true" focusable="false" className="block overflow-visible">
      <defs>
        <radialGradient id="dy-halo">
          <stop offset="0" stopColor="#ffdf9e" stopOpacity="0.8" />
          <stop offset="0.45" stopColor="#ffbf63" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ff9d3a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dy-halo-wide">
          <stop offset="0" stopColor="#ffb85c" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffb85c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dy-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c76f36" />
          <stop offset="0.5" stopColor="#92451e" />
          <stop offset="1" stopColor="#521f0c" />
        </linearGradient>
        <linearGradient id="dy-fire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9b0" />
          <stop offset="0.55" stopColor="#ffb648" />
          <stop offset="1" stopColor="#f07820" />
        </linearGradient>
      </defs>
      <ellipse className="ganga-ring" style={{ animationDelay: `${-(seed % 6) * 0.53}s` }}
               cx="0" cy="10" rx="20" ry="3.2" fill="none" stroke="#ffd27a" strokeOpacity="0.4" strokeWidth="1" />
      <g className="ganga-bob" style={bob}>
        {lit && <ellipse cx="0" cy="0" rx="30" ry="20" fill="url(#dy-halo-wide)" />}
        <ellipse cx="0" cy="10" rx="19" ry="3.4" fill="#000" opacity="0.3" />
        {/* the wreath behind the bowl */}
        {PETALS_BACK.map((x, i) => (
          <ellipse key={`b${i}`} cx={x} cy="-0.5" rx="3.4" ry="2.3" fill={MARIGOLD[i % 3]}
                   transform={`rotate(${x * 2.4} ${x} -0.5)`} opacity="0.9" />
        ))}
        {/* the bowl: dark mouth, clay body, warm oil inside */}
        <ellipse cx="0" cy="1" rx="13" ry="3.2" fill="#2e1206" />
        <path d="M-13 1Q-13 8.6 0 9.8Q13 8.6 13 1Q7 4.4 0 4.4Q-7 4.4-13 1Z" fill="url(#dy-clay)" />
        <ellipse cx="0" cy="1" rx="9.5" ry="2" fill="#ffae45" opacity="0.55" />
        {/* the wreath in front, with two leaves */}
        {PETALS_FRONT.map((x, i) => (
          <ellipse key={`f${i}`} cx={x} cy={7.5 - Math.abs(x) * 0.16} rx="3.8" ry="2.6" fill={MARIGOLD[(i + 1) % 3]}
                   transform={`rotate(${x * 2.2} ${x} ${7.5 - Math.abs(x) * 0.16})`} />
        ))}
        <ellipse cx="-18" cy="4.5" rx="3.4" ry="1.7" fill="#36512c" transform="rotate(-28 -18 4.5)" />
        <ellipse cx="18" cy="4.5" rx="3.4" ry="1.7" fill="#2c4324" transform="rotate(28 18 4.5)" />
        {lit && (
          <>
            <circle cx="0" cy="-9" r="16" fill="url(#dy-halo)" />
            <path className="ganga-flame" style={flame} d="M0-17Q5.6-8.4 0-0.8Q-5.6-8.4 0-17Z" fill="url(#dy-fire)" />
            <path className="ganga-flame" style={innerFlame} d="M0-11.5Q3-7 0-2.8Q-3-7 0-11.5Z" fill="#fff6dd" opacity="0.95" />
            <circle cx="0" cy="-4.4" r="1.2" fill="#5a84ff" opacity="0.5" />
          </>
        )}
      </g>
    </svg>
  );
}

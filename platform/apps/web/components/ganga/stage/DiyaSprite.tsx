/**
 * A dona, as it is floated at the ghats: a bowl stitched from leaves, heaped with
 * marigolds and rose petals, a laddoo and a batasha, a small clay diya burning in
 * the middle — and the writer's chit, rolled and tied with kalava thread, tucked
 * in among the flowers. `seed` staggers the bob, the flicker and the wake, so no
 * two donas on the river move in step. `chit={false}` leaves the letter out.
 */

// marigold heads: x, y, radius — the back row first, so the front ones overlap it
const MARIGOLDS: [number, number, number][] = [
  [-22, -3.5, 4.1], [-14, -6.8, 4.4], [13, -7, 4.3], [21.5, -3.8, 4.2],
  [-25.5, 0.3, 3.6], [25.5, 0.2, 3.6], [-6.5, -2.2, 3.9], [6.2, -2.4, 3.8],
];
const ROSE: [number, number, number][] = [[-18, -1.2, 25], [17.5, -1.5, -30], [-9.5, -7.2, 60], [28.5, -2.2, 10], [-28, -2.4, -15]];
const VEINS = [-24, -15, -6, 3, 12, 21];
const SCALLOPS = [-30, -21.5, -13, -4.5, 4.5, 13, 21.5, 30];

function Marigold({ x, y, r, shade }: { x: number; y: number; r: number; shade: number }) {
  const ring = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);
  const outer = shade % 2 ? "#e8771a" : "#f39a1c";
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={outer} />
      {ring.map((a, i) => (
        <circle key={i} cx={+(x + Math.cos(a) * r * 0.72).toFixed(2)} cy={+(y + Math.sin(a) * r * 0.5).toFixed(2)}
                r={+(r * 0.42).toFixed(2)} fill={i % 2 ? "#ffb52e" : "#f08a1d"} />
      ))}
      <circle cx={x} cy={y - 0.3} r={r * 0.45} fill="#ffc94a" />
      <circle cx={x} cy={y - 0.4} r={r * 0.18} fill="#c25e12" />
    </g>
  );
}

export function DiyaSprite({ size = 112, lit = true, seed = 0, chit = true }: { size?: number; lit?: boolean; seed?: number; chit?: boolean }) {
  const bob = { animationDelay: `${-(seed % 7) * 0.63}s`, animationDuration: `${3.6 + (seed % 5) * 0.45}s` };
  const flame = { animationDelay: `${-(seed % 5) * 0.37}s`, animationDuration: `${1.25 + (seed % 4) * 0.22}s` };
  const innerFlame = { animationDelay: `${-(seed % 3) * 0.29}s`, animationDuration: `${1.05 + (seed % 5) * 0.17}s` };
  return (
    <svg viewBox="-44 -32 88 48" width={size} height={size * (48 / 88)} aria-hidden="true" focusable="false" className="block overflow-visible">
      <defs>
        <radialGradient id="dn-halo">
          <stop offset="0" stopColor="#ffdf9e" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#ffbf63" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ff9d3a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dn-halo-wide">
          <stop offset="0" stopColor="#ffb85c" stopOpacity="0.26" />
          <stop offset="1" stopColor="#ffb85c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dn-leaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b8f44" />
          <stop offset="0.55" stopColor="#5f6a2c" />
          <stop offset="1" stopColor="#2f3716" />
        </linearGradient>
        <linearGradient id="dn-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d07a3c" />
          <stop offset="0.5" stopColor="#97461f" />
          <stop offset="1" stopColor="#5a230e" />
        </linearGradient>
        <linearGradient id="dn-fire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffeab4" />
          <stop offset="0.55" stopColor="#ffb648" />
          <stop offset="1" stopColor="#f07820" />
        </linearGradient>
        <linearGradient id="dn-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf3df" />
          <stop offset="1" stopColor="#d9c39a" />
        </linearGradient>
      </defs>

      <ellipse className="ganga-ring" style={{ animationDelay: `${-(seed % 6) * 0.53}s` }}
               cx="0" cy="10" rx="30" ry="4.6" fill="none" stroke="#ffd27a" strokeOpacity="0.38" strokeWidth="1" />
      <g className="ganga-bob" style={bob}>
        {lit && <ellipse cx="0" cy="-6" rx="44" ry="28" fill="url(#dn-halo-wide)" />}
        <ellipse cx="0" cy="10" rx="30" ry="4.4" fill="#000" opacity="0.32" />

        {/* inside of the bowl, in shadow */}
        <ellipse cx="0" cy="-1.5" rx="31" ry="7.5" fill="#2c3313" />

        {/* the chit, rolled and tied, tucked in at the back */}
        {chit && (
          <g transform="translate(-13 -12.5) rotate(-32)">
            <rect x="-9" y="-2.6" width="18" height="5.2" rx="2.6" fill="url(#dn-paper)" />
            <ellipse cx="9" cy="0" rx="1.3" ry="2.6" fill="#c8ad7c" />
            <path d="M-9 -1.2H8.5" stroke="#b79a68" strokeWidth="0.4" opacity="0.7" />
            <rect x="-1.6" y="-2.9" width="3.2" height="5.8" fill="#b3261e" />
            <path d="M-1.6 -2.9l3.2 5.8M0 -2.9l1.6 2.9" stroke="#e8b13a" strokeWidth="0.55" />
          </g>
        )}

        {/* the clay diya at the heart of the offering */}
        <ellipse cx="0" cy="-7.4" rx="8.6" ry="2.2" fill="#2e1206" />
        <path d="M-8.6 -7.4Q-8.6 -2.2 0 -1.4Q8.6 -2.2 8.6 -7.4Q4.6 -5.2 0 -5.2Q-4.6 -5.2-8.6 -7.4Z" fill="url(#dn-clay)" />
        <ellipse cx="0" cy="-7.4" rx="6.2" ry="1.3" fill="#ffae45" opacity="0.6" />

        {/* flowers and sweets heaped around it */}
        {MARIGOLDS.slice(0, 4).map(([x, y, r], i) => <Marigold key={`mb${i}`} x={x} y={y} r={r} shade={i} />)}
        {ROSE.map(([x, y, a], i) => (
          <ellipse key={`r${i}`} cx={x} cy={y} rx="3.3" ry="1.9" fill={i % 2 ? "#c2185b" : "#e0457a"} transform={`rotate(${a} ${x} ${y})`} />
        ))}
        {/* laddoo */}
        <circle cx="12.4" cy="-1.6" r="3.9" fill="#e7a23a" />
        <circle cx="11.3" cy="-2.8" r="1.4" fill="#f6c766" opacity="0.8" />
        {[[13.6, -0.6], [11, -0.2], [14.2, -2.8]].map(([x, y], i) => <circle key={`ld${i}`} cx={x} cy={y} r="0.45" fill="#b8741d" />)}
        {/* batasha */}
        <path d="M-15.8 -0.2Q-15.8 -5.2 -11.6 -5.2Q-7.4 -5.2 -7.4 -0.2Z" fill="#f6efe0" />
        <path d="M-14.5 -1.4Q-13.5 -4.2 -11.6 -4.2" stroke="#d8ccb2" strokeWidth="0.5" fill="none" />
        {MARIGOLDS.slice(4).map(([x, y, r], i) => <Marigold key={`mf${i}`} x={x} y={y} r={r} shade={i + 1} />)}

        {/* the leaf bowl's front wall: veins, and leaf-tip scallops along the rim */}
        <path d="M-31.5 -1.5Q-31 9.6 0 11.4Q31 9.6 31.5 -1.5Q16 4.6 0 4.6Q-16 4.6-31.5 -1.5Z" fill="url(#dn-leaf)" />
        <g stroke="#a3a35a" strokeOpacity="0.45" strokeWidth="0.55" fill="none">
          {VEINS.map((x) => <path key={x} d={`M${x * 0.32} 11Q${x * 0.8} 7 ${x} ${3.9 - Math.abs(x) * 0.17}`} />)}
        </g>
        <g fill="#7b8239">
          {SCALLOPS.map((x) => {
            const y = 4.6 - (x * x) / 160;
            return <path key={x} d={`M${x - 4.4} ${y + 0.6}Q${x} ${y - 3.2} ${x + 4.4} ${y + 0.6}Z`} />;
          })}
        </g>
        <path d="M-31.5 -1.5Q-16 4.6 0 4.6Q16 4.6 31.5 -1.5" stroke="#ffc97a" strokeOpacity="0.35" strokeWidth="0.8" fill="none" />

        {lit && (
          <>
            <circle cx="0" cy="-15" r="17" fill="url(#dn-halo)" />
            <path className="ganga-flame" style={flame} d="M0-25Q6-16 0-8.4Q-6-16 0-25Z" fill="url(#dn-fire)" />
            <path className="ganga-flame" style={innerFlame} d="M0-19.5Q3.2-14.6 0-10.4Q-3.2-14.6 0-19.5Z" fill="#fff6dd" opacity="0.95" />
            <circle cx="0" cy="-11.8" r="1.2" fill="#5a84ff" opacity="0.5" />
          </>
        )}
      </g>
    </svg>
  );
}

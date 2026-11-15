/** One diya — a leaf boat, clay lamp, marigold and a living flame — used everywhere on the stage. */
export function DiyaSprite({ size = 72, lit = true }: { size?: number; lit?: boolean }) {
  return (
    <svg viewBox="-34 -34 68 52" width={size} height={size * (52 / 68)} aria-hidden="true" focusable="false" className="block overflow-visible">
      <g className="ganga-bob">
        <ellipse cx="0" cy="13" rx="26" ry="4" fill="rgb(var(--glint))" opacity="0.35" />
        <path d="M-24 4Q0 19 24 4L20 0Q0 9-20 0Z" fill="#3f5f36" />
        <path d="M-12 2Q0 12 12 2L10-1Q0 3-10-1Z" fill="#b5653a" />
        <circle cx="-15" cy="2" r="3.5" fill="#f0a020" />
        <circle cx="15" cy="3" r="2.6" fill="#e2563a" />
        {lit && (
          <>
            <circle cx="0" cy="-9" r="15" fill="url(#diya-flame-glow)" />
            <path className="ganga-flame" d="M0-16Q5.5-7.5 0-1Q-5.5-7.5 0-16Z" fill="#ffd27a" />
            <path className="ganga-flame" d="M0-11Q3-7 0-2.5Q-3-7 0-11Z" fill="#fff3d0" opacity="0.9" />
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

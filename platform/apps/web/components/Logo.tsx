/** Rising-sun mark — a neutral, tradition-agnostic symbol that inherits the accent colour. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="text-gold">
      <circle cx="16" cy="19" r="7" fill="currentColor" opacity="0.2" />
      <path d="M9 19a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 24h26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 5v4M6.5 10l2.8 2.8M25.5 10l-2.8 2.8M3 18h3M26 18h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

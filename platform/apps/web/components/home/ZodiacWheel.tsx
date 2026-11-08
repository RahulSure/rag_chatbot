// The sidereal wheel drawn behind the hero: 108 padas on the rim, the twelve rashis
// by their Sanskrit names, the 27 nakshatras on the inner ring. Decorative only.
const RASHIS = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"];

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [Math.round(r * Math.cos(a) * 100) / 100, Math.round(r * Math.sin(a) * 100) / 100];
}

function Spoke({ r1, r2, deg }: { r1: number; r2: number; deg: number }) {
  const [x1, y1] = polar(r1, deg);
  const [x2, y2] = polar(r2, deg);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} />;
}

export function ZodiacWheel({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-450 -450 900 900" aria-hidden="true" focusable="false" className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle r="440" />
        <circle r="418" />
        <circle r="330" />
        <circle r="300" />
        <circle r="262" />
        <circle r="120" strokeDasharray="2 6" />
        {Array.from({ length: 108 }, (_, i) => (
          <Spoke key={`p${i}`} r1={i % 9 === 0 ? 404 : 418} r2={440} deg={(i * 360) / 108} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <Spoke key={`r${i}`} r1={330} r2={418} deg={i * 30} />
        ))}
        {Array.from({ length: 27 }, (_, i) => (
          <Spoke key={`n${i}`} r1={262} r2={300} deg={(i * 360) / 27} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <Spoke key={`c${i}`} r1={120} r2={262} deg={i * 30 + 15} />
        ))}
      </g>
      <g fill="currentColor" fontSize="26" textAnchor="middle" fontFamily="var(--font-serif-deva), serif">
        {RASHIS.map((name, i) => (
          <text key={name} transform={`rotate(${i * 30 + 15}) translate(0 -364)`} dominantBaseline="middle">
            {name}
          </text>
        ))}
      </g>
    </svg>
  );
}

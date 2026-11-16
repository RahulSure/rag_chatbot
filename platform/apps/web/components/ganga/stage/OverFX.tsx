/**
 * The cinematography above the backdrop: mist crossing the water, other
 * sadhaks' lamps far out, petals riding the current, fireflies after dark,
 * and a breath of film grain over everything. Pure decoration, no pointer.
 */

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

const MIST = [
  { top: "43%", width: "58%", height: "16%", dur: "110s", delay: "-38s", op: "opacity-[0.13] dark:opacity-[0.16]" },
  { top: "52%", width: "44%", height: "13%", dur: "150s", delay: "-105s", op: "opacity-[0.09] dark:opacity-[0.12]" },
];
const FAR_LAMPS = [
  { top: "47.5%", dur: "170s", delay: "-40s", s: 5 },
  { top: "49%", dur: "210s", delay: "-130s", s: 4 },
  { top: "51%", dur: "190s", delay: "-80s", s: 6 },
];
const PETALS = [
  { top: "62%", dur: "85s", delay: "-20s", c: "#f0a020", r: 24 },
  { top: "70%", dur: "72s", delay: "-50s", c: "#ff8fb3", r: -40 },
  { top: "78%", dur: "64s", delay: "-10s", c: "#e8611f", r: 65 },
  { top: "86%", dur: "58s", delay: "-33s", c: "#ffd04e", r: -15 },
];
const FIREFLIES = [
  { left: "12%", top: "58%" }, { left: "6%", top: "70%" }, { left: "88%", top: "64%" },
  { left: "94%", top: "55%" }, { left: "45%", top: "80%" },
];

export function OverFX() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {MIST.map((m, i) => (
        <div key={`m${i}`} className={`ganga-crossing absolute rounded-[50%] blur-2xl ${m.op}`}
             style={{ top: m.top, width: m.width, height: m.height, animationDuration: m.dur, animationDelay: m.delay,
                      background: "radial-gradient(ellipse at center, rgb(var(--sky-bottom)), transparent 70%)" }} />
      ))}
      {FAR_LAMPS.map((l, i) => (
        <span key={`l${i}`} className="ganga-crossing absolute mix-blend-screen"
              style={{ top: l.top, animationDuration: l.dur, animationDelay: l.delay }}>
          <span className="ganga-glint block rounded-full" style={{ width: l.s, height: l.s, background: "#ffd27a",
                boxShadow: "0 0 10px 4px rgb(255 190 100 / 0.5)", animationDelay: `${-i * 1.3}s` }} />
        </span>
      ))}
      {PETALS.map((p, i) => (
        <span key={`p${i}`} className="ganga-crossing absolute"
              style={{ top: p.top, animationDuration: p.dur, animationDelay: p.delay }}>
          <span className="block h-1.5 w-2.5 rounded-full opacity-75" style={{ background: p.c, transform: `rotate(${p.r}deg)` }} />
        </span>
      ))}
      <div className="hidden dark:block">
        {FIREFLIES.map((f, i) => (
          <span key={`g${i}`} className="ganga-fly absolute" style={{ left: f.left, top: f.top, animationDelay: `${-i * 3.7}s`, animationDuration: `${13 + (i % 3) * 4}s` }}>
            <span className="ganga-blink block h-1 w-1 rounded-full bg-[#ffe9a6]"
                  style={{ boxShadow: "0 0 6px 2px rgb(255 233 166 / 0.6)", animationDelay: `${-i * 1.9}s`, animationDuration: `${3.6 + (i % 4) * 0.8}s` }} />
          </span>
        ))}
      </div>
      <div className="ganga-grain absolute -inset-[3%] opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

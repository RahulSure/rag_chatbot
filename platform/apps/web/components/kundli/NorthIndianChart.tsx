"use client";

import type { BirthChart } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

// North Indian layout: house 1 is the top diamond, then houses run counter-clockwise.
// Coordinates on a 400×400 square: corners, edge midpoints, centre, and the four
// points where the diagonals cross the inner diamond.
const P = {
  A: [0, 0], B: [400, 0], C: [400, 400], D: [0, 400],
  T: [200, 0], R: [400, 200], M: [200, 400], L: [0, 200], O: [200, 200],
  p1: [100, 100], p2: [300, 100], p3: [300, 300], p4: [100, 300],
} as const;
type Pt = keyof typeof P;

const HOUSES: Pt[][] = [
  ["T", "p2", "O", "p1"], // 1
  ["A", "T", "p1"],       // 2
  ["A", "p1", "L"],       // 3
  ["L", "p1", "O", "p4"], // 4
  ["L", "p4", "D"],       // 5
  ["D", "p4", "M"],       // 6
  ["M", "p4", "O", "p3"], // 7
  ["M", "p3", "C"],       // 8
  ["C", "p3", "R"],       // 9
  ["R", "p3", "O", "p2"], // 10
  ["R", "p2", "B"],       // 11
  ["B", "p2", "T"],       // 12
];

const SIGN_ORDER = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const SHORT: Record<string, { en: string; hi: string }> = {
  Sun: { en: "Su", hi: "सू" }, Moon: { en: "Mo", hi: "चं" }, Mars: { en: "Ma", hi: "मं" },
  Mercury: { en: "Me", hi: "बु" }, Jupiter: { en: "Ju", hi: "गु" }, Venus: { en: "Ve", hi: "शु" },
  Saturn: { en: "Sa", hi: "श" }, Rahu: { en: "Ra", hi: "रा" }, Ketu: { en: "Ke", hi: "के" },
};

function centroid(points: Pt[]): [number, number] {
  const xs: number[] = points.map((p) => P[p][0]);
  const ys: number[] = points.map((p) => P[p][1]);
  return [xs.reduce((a, b) => a + b) / xs.length, ys.reduce((a, b) => a + b) / ys.length];
}

export function NorthIndianChart({ chart, lang }: { chart: BirthChart; lang: Lang }) {
  const retro = new Set(chart.planets.filter((p) => p.retrograde && !["Rahu", "Ketu"].includes(p.name)).map((p) => p.name));

  return (
    <svg viewBox="-4 -4 408 408" role="img" aria-label="North Indian birth chart" className="mx-auto w-full max-w-md">
      <rect x="0" y="0" width="400" height="400" className="fill-cosmic-950 stroke-gold/50" strokeWidth="2" />
      {HOUSES.map((pts, i) => {
        const house = chart.houses[i];
        const [cx, cy] = centroid(pts);
        const signNumber = SIGN_ORDER.indexOf(house.sign) + 1;
        const planets = house.planets.map((name) => SHORT[name][lang] + (retro.has(name) ? "*" : ""));
        // up to three planets per line so crowded houses still fit inside the small triangles
        const lines = Array.from({ length: Math.ceil(planets.length / 3) }, (_, j) => planets.slice(j * 3, j * 3 + 3).join(" "));
        return (
          <g key={i}>
            <polygon
              points={pts.map((p) => P[p].join(",")).join(" ")}
              className={`stroke-gold/50 ${i === 0 ? "fill-gold/10" : "fill-transparent"}`}
              strokeWidth="1.5"
            />
            <text x={cx} y={cy - (planets.length ? 16 : 0)} textAnchor="middle" dominantBaseline="middle"
                  className="fill-cosmic-500 text-[13px]">
              {signNumber}
            </text>
            {planets.length > 0 && (
              <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="middle"
                    className="fill-foreground text-[14px] font-semibold">
                {lines.map((line, j) => (
                  <tspan key={j} x={cx} dy={j === 0 ? 0 : 16}>{line}</tspan>
                ))}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

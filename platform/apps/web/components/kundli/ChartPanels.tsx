"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { BirthChart } from "@/lib/api";
import { useLanguage, type Key, type Lang } from "@/lib/i18n";
import { NorthIndianChart } from "./NorthIndianChart";
import {
  ASPECT_HI, DEITY, KARAKAS, VARGAS, WESTERN_SIGN, graha, say, sign,
} from "@/lib/jyotish-text";
import { NAKSHATRAS, GANA_HI } from "@/lib/nakshatras";

const SIGN_ORDER = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const SIGN_LORD = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
const lordOf = (s: string) => SIGN_LORD[SIGN_ORDER.indexOf(s)];

const card = "rounded-2xl border border-line bg-surface p-6 sm:p-8";

function Ask({ q, label }: { q: string; label: string }) {
  return (
    <Link href={`/chat?q=${encodeURIComponent(q)}`} className="btn-gold">
      <MessageCircle size={16} aria-hidden="true" /> {label}
    </Link>
  );
}

// ── Divisional charts ────────────────────────────────────────────────────

export function VargaPanel({ chart }: { chart: BirthChart }) {
  const { lang, t } = useLanguage();
  const [id, setId] = useState("D9");
  const varga = chart.vargas[id];
  const info = VARGAS.find((v) => v.id === id)!;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("kt.vargas")}>
        {VARGAS.map((v) => (
          <button key={v.id} type="button" role="tab" aria-selected={id === v.id} onClick={() => setId(v.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    id === v.id ? "border-gold bg-gold text-background" : "border-line text-cosmic-300 hover:border-gold/50"}`}>
            {v.id} <span className="hidden sm:inline">· {say(v.name, lang)}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <NorthIndianChart chart={{ ...chart, houses: varga.houses }} lang={lang} />
        </section>
        <section className={card}>
          <p className="label-caps text-[0.68rem]">{id}</p>
          <h3 className="mt-2 font-serif text-3xl text-foreground">{say(info.name, lang)}</h3>
          <p className="mt-3 leading-relaxed text-cosmic-200">{say(info.about, lang)}</p>
          <p className="mt-5 text-sm text-cosmic-400">{t("kt.lagnaIn")}: <span className="text-foreground">{lang === "hi" ? varga.lagna_hi : varga.lagna}</span></p>
          <p className="label-caps mt-6 text-[0.68rem]">{t("kt.planetIn")}</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
            {Object.entries(varga.positions).map(([p, s]) => (
              <li key={p} className="flex justify-between gap-2"><span className="text-cosmic-400">{graha(p, lang)}</span><span className="text-foreground">{sign(s, lang)}</span></li>
            ))}
          </ul>
          {["D30", "D40", "D45", "D60"].includes(id) && <p className="mt-5 text-xs text-cosmic-500">{t("kt.d60Note")}</p>}
        </section>
      </div>
    </div>
  );
}

// ── Nakshatra ────────────────────────────────────────────────────────────

export function NakshatraCard({ index, pada, lang, t }: { index: number; pada?: number; lang: Lang; t: (k: Key) => string }) {
  const n = NAKSHATRAS[index];
  const facts: [Key, string][] = [
    ["kt.deity", say(n.deity, lang)],
    ["kt.symbol", say(n.symbol, lang)],
    ["kt.ruler", graha(n.lord, lang)],
    ["kt.gana", lang === "hi" ? GANA_HI[n.gana] : n.gana],
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-4">
        <span className="font-serif text-5xl leading-none lining-nums text-gold">{index + 1}</span>
        <div>
          <h3 className="font-serif text-3xl text-foreground sm:text-4xl">{lang === "hi" ? n.hi : n.name}</h3>
          {pada && <p className="text-sm text-cosmic-400">{t("kundli.pada")} {pada}</p>}
        </div>
      </div>
      <p className="text-lg leading-relaxed text-cosmic-200">{say(n.traits, lang)}</p>
      <dl className="grid grid-cols-2 gap-4 border-y border-line py-4 text-sm">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs uppercase tracking-wider text-cosmic-500">{t(k)}</dt>
            <dd className="mt-0.5 text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="leading-relaxed text-cosmic-200"><span className="text-gold">{t("kt.practice")}: </span>{say(n.practice, lang)}</p>
    </div>
  );
}

export function NakshatraPanel({ chart }: { chart: BirthChart }) {
  const { lang, t } = useLanguage();
  const moon = chart.planets.find((p) => p.name === "Moon")!;
  const n = NAKSHATRAS[moon.nakshatra_index];
  const q = lang === "hi"
    ? `मेरा जन्म नक्षत्र ${n.hi} है (पाद ${moon.pada})। इसके अनुसार मेरे लिए कौन सी साधना और मंत्र उपयुक्त हैं?`
    : `My birth nakshatra is ${n.name} (pada ${moon.pada}). Which sadhana and mantra suit me according to it?`;
  return (
    <section className={card}>
      <p className="label-caps text-[0.68rem]">{t("kt.yourNakshatra")}</p>
      <div className="mt-4"><NakshatraCard index={moon.nakshatra_index} pada={moon.pada} lang={lang} t={t} /></div>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Ask q={q} label={t("nav.cta")} />
        <Link href={`/nakshatra?n=${moon.nakshatra_index}`} className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
          {t("kt.explore")} <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

// ── Jaimini: karakas and the Ishta Devata ────────────────────────────────

export function IshtaPanel({ chart }: { chart: BirthChart }) {
  const { lang, t } = useLanguage();
  const ishta = chart.ishta_devata;
  const deity = DEITY[ishta.significator];
  const q = lang === "hi"
    ? `जैमिनि विधि से मेरा आत्मकारक ${graha(ishta.atmakaraka, lang)} है और कारकांश से द्वादश में ${graha(ishta.significator, lang)} है, जो ${deity.deity[1]} की ओर संकेत करता है। उनकी साधना कैसे आरम्भ करूँ?`
    : `By the Jaimini method my Atmakaraka is ${ishta.atmakaraka} and ${ishta.significator} rules the 12th from my karakamsha, pointing to ${deity.deity[0]}. How do I begin their sadhana?`;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className={`${card} border-gold/40`}>
        <p className="label-caps text-[0.68rem]">{t("kt.ishtaTitle")}</p>
        <h3 className="mt-3 font-serif text-4xl text-gold sm:text-5xl">{say(deity.deity, lang)}</h3>
        <p className="mt-1 text-cosmic-400">{say(deity.also, lang)}</p>
        <ol className="mt-6 grid grid-cols-2 gap-4 border-y border-line py-5 text-sm sm:grid-cols-4">
          {([
            ["Atmakaraka", graha(ishta.atmakaraka, lang)],
            [t("kt.karakamsha"), lang === "hi" ? ishta.karakamsha_hi : ishta.karakamsha],
            [t("kt.twelfth"), lang === "hi" ? ishta.twelfth_hi : ishta.twelfth],
            [t("kt.significator"), graha(ishta.significator, lang)],
          ] as [string, string][]).map(([k, v], i) => (
            <li key={k}>
              <p className="text-xs uppercase tracking-wider text-cosmic-500">{i + 1}. {k === "Atmakaraka" ? say(KARAKAS.Atmakaraka.name, lang) : k}</p>
              <p className="mt-1 font-serif text-xl text-foreground">{v}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 leading-relaxed text-cosmic-200">{t("kt.ishtaHow")}</p>
        <p className="mt-3 text-sm text-cosmic-500">{t("kt.ishtaNote")}</p>
        <div className="mt-6"><Ask q={q} label={t("kt.askIshta")} /></div>
      </section>
      <section className={card}>
        <p className="label-caps text-[0.68rem]">{t("kt.karakas")}</p>
        <p className="mt-2 text-sm leading-relaxed text-cosmic-400">{t("kt.karakasLead")}</p>
        <ul className="mt-5 divide-y divide-line">
          {chart.karakas.map((k) => (
            <li key={k.karaka} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-foreground">{say(KARAKAS[k.karaka].name, lang)}</span>
                <span className="text-sm text-gold">{graha(k.planet, lang)} <span className="tabular-nums text-cosmic-500">{k.degree.toFixed(1)}°</span></span>
              </div>
              <p className="mt-0.5 text-xs text-cosmic-500">{say(KARAKAS[k.karaka].about, lang)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ── Mangal dosha ─────────────────────────────────────────────────────────

export function MangalPanel({ chart }: { chart: BirthChart }) {
  const { t } = useLanguage();
  const m = chart.mangal_dosha;
  const status = !m.manglik ? t("kt.notManglik") : m.effective ? t("kt.manglik") : t("kt.cancelled");
  const rows: [Key, { house: number; dosha: boolean }][] = [
    ["kt.fromLagna", m.from_lagna], ["kt.fromMoon", m.from_moon], ["kt.fromVenus", m.from_venus],
  ];
  return (
    <section className={card}>
      <p className="label-caps text-[0.68rem]">{t("kt.mangal")}</p>
      <h3 className={`mt-3 font-serif text-4xl ${m.effective ? "text-red-700 dark:text-red-300" : "text-gold"}`}>{status}</h3>
      <p className="mt-3 max-w-2xl leading-relaxed text-cosmic-300">{t("kt.mangalLead")}</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {rows.map(([k, r]) => (
          <div key={k} className={`rounded-xl border p-4 ${r.dosha ? "border-red-700/40 dark:border-red-300/30" : "border-line"}`}>
            <dt className="text-xs uppercase tracking-wider text-cosmic-500">{t(k)}</dt>
            <dd className="mt-1 font-serif text-2xl text-foreground">{r.house} <span className="text-sm text-cosmic-400">{t("kt.house")}</span></dd>
            <dd className={`text-sm ${r.dosha ? "text-red-700 dark:text-red-300" : "text-cosmic-400"}`}>{r.dosha ? t("kt.manglik") : t("kt.notManglik")}</dd>
          </div>
        ))}
      </dl>
      {m.cancellations.length > 0 && (
        <ul className="mt-5 space-y-1.5 text-sm text-cosmic-200">
          {m.cancellations.map((c) => <li key={c}>✓ {t(`kt.c_${c}` as Key)}</li>)}
        </ul>
      )}
      <p className="mt-6 text-sm text-cosmic-400">{t("kt.mangalMatch")}</p>
      <Link href="/matching" className="mt-3 inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
        {t("v4.toolMatching")} <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}

// ── Ashtakavarga ─────────────────────────────────────────────────────────

const SEVEN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export function AshtakavargaPanel({ chart }: { chart: BirthChart }) {
  const { lang, t } = useLanguage();
  const av = chart.ashtakavarga;
  const lagna = SIGN_ORDER.indexOf(chart.ascendant.sign);
  const byHouse = Array.from({ length: 12 }, (_, h) => {
    const s = (lagna + h) % 12;
    return { house: h + 1, sign: SIGN_ORDER[s], points: av.sav[s] };
  });
  return (
    <div className="space-y-6">
      <section className={card}>
        <p className="label-caps text-[0.68rem]">{t("kt.sav")} · {av.total}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cosmic-400">{t("kt.ashtakaLead")}</p>
        <ol className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {byHouse.map((h) => (
            <li key={h.house} className="text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-cosmic-300">{h.house} · {sign(h.sign, lang)}</span>
                <span className={`font-serif text-lg lining-nums ${h.points >= 28 ? "text-gold" : "text-cosmic-400"}`}>{h.points}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-surface-2">
                <div className={`h-full rounded-full ${h.points >= 28 ? "bg-gold" : "bg-cosmic-600"}`} style={{ width: `${Math.min(100, (h.points / 40) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className={`${card} overflow-x-auto`}>
        <p className="label-caps text-[0.68rem]">{t("kt.bav")}</p>
        <table className="mt-4 w-full min-w-[640px] text-center text-sm tabular-nums">
          <thead className="text-xs text-cosmic-500">
            <tr>
              <th className="pb-2 text-left font-medium"></th>
              {SIGN_ORDER.map((s) => <th key={s} className="pb-2 font-medium">{sign(s, lang).slice(0, lang === "hi" ? 4 : 3)}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {SEVEN.map((p) => (
              <tr key={p}>
                <td className="py-1.5 text-left text-cosmic-300">{graha(p, lang)}</td>
                {av.bav[p].map((b, i) => <td key={i} className={b >= 5 ? "text-gold" : b <= 2 ? "text-cosmic-500" : "text-foreground"}>{b}</td>)}
              </tr>
            ))}
            <tr className="font-medium">
              <td className="py-1.5 text-left text-foreground">{t("kt.sav")}</td>
              {av.sav.map((b, i) => <td key={i} className={b >= 28 ? "text-gold" : "text-cosmic-400"}>{b}</td>)}
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

// ── Western ──────────────────────────────────────────────────────────────

const GLYPH: Record<string, string> = { Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa" };

function WesternWheel({ chart }: { chart: BirthChart }) {
  const w = chart.western;
  const asc = w.ascendant.longitude;
  const at = (lon: number, r: number) => {
    const a = ((180 + lon - asc) * Math.PI) / 180;
    return [r * Math.cos(a), -r * Math.sin(a)] as const;
  };
  // Spread planets that sit close together onto inner rings so their labels do not collide.
  const sorted = [...w.planets].sort((a, b) => a.longitude - b.longitude);
  const ring: Record<string, number> = {};
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    ring[p.name] = prev && p.longitude - prev.longitude < 8 ? (ring[prev.name] + 1) % 3 : 0;
  });
  // Stacked planets step inwards and a little along the wheel, so neighbours never print on top of each other.
  const pos = Object.fromEntries(w.planets.map((p) => [p.name, at(p.longitude + ring[p.name] * 7, 128 - ring[p.name] * 20)]));
  const line = Object.fromEntries(w.planets.map((p) => [p.name, at(p.longitude, 92)]));
  return (
    <svg viewBox="-200 -200 400 400" role="img" aria-label="Western birth chart wheel" className="mx-auto w-full max-w-md">
      <circle r="190" fill="none" className="stroke-gold/50" />
      <circle r="158" fill="none" className="stroke-gold/40" />
      <circle r="92" fill="none" className="stroke-line" />
      {SIGN_ORDER.map((s, i) => {
        const [x1, y1] = at(i * 30, 158);
        const [x2, y2] = at(i * 30, 190);
        const [tx, ty] = at(i * 30 + 15, 174);
        return (
          <g key={s}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-gold/40" />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" className="fill-cosmic-400 text-[11px]">{s.slice(0, 3)}</text>
          </g>
        );
      })}
      {(() => {
        const [x1, y1] = at(asc, 92);
        const [x2, y2] = at(asc + 180, 92);
        return <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray="3 4" className="stroke-cosmic-600" />;
      })()}
      {w.aspects.filter((a) => a.aspect !== "conjunction").map((a) => (
        <line key={`${a.a}-${a.b}`} x1={line[a.a][0]} y1={line[a.a][1]} x2={line[a.b][0]} y2={line[a.b][1]} strokeWidth="1"
              className={a.aspect === "trine" || a.aspect === "sextile" ? "stroke-gold/70" : "stroke-red-400/60"} />
      ))}
      {w.planets.map((p) => (
        <text key={p.name} x={pos[p.name][0]} y={pos[p.name][1]} textAnchor="middle" dominantBaseline="middle"
              className="fill-foreground text-[13px] font-semibold">{GLYPH[p.name]}</text>
      ))}
      <text x={at(asc, 140)[0]} y={at(asc, 140)[1] - 9} textAnchor="middle" className="fill-gold text-[11px]">ASC</text>
    </svg>
  );
}

export function WesternPanel({ chart }: { chart: BirthChart }) {
  const { lang, t } = useLanguage();
  const w = chart.western;
  const sun = w.planets.find((p) => p.name === "Sun")!;
  const moon = w.planets.find((p) => p.name === "Moon")!;
  const big: [Key, string][] = [["kt.sunSign", sun.sign], ["kt.moonSign", moon.sign], ["kt.rising", w.ascendant.sign]];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card}><WesternWheel chart={chart} /></section>
      <section className={card}>
        <p className="text-sm leading-relaxed text-cosmic-400">{t("kt.westernLead")}</p>
        <dl className="mt-5 space-y-4">
          {big.map(([k, s]) => (
            <div key={k}>
              <dt className="label-caps text-[0.68rem]">{t(k)}</dt>
              <dd className="mt-1 font-serif text-2xl text-foreground">{sign(s, lang)}</dd>
              <dd className="text-sm text-cosmic-400">{say(WESTERN_SIGN[s], lang)}</dd>
            </div>
          ))}
        </dl>
        <p className="label-caps mt-6 text-[0.68rem]">{t("kt.aspects")}</p>
        <ul className="mt-2 space-y-1 text-sm text-cosmic-300">
          {w.aspects.map((a) => (
            <li key={`${a.a}-${a.b}`}>{graha(a.a, lang)} – {graha(a.b, lang)}: <span className="text-foreground">{lang === "hi" ? ASPECT_HI[a.aspect] : a.aspect}</span> <span className="text-cosmic-500">({a.orb.toFixed(1)}°)</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ── Career and marriage ──────────────────────────────────────────────────

export function ReportsPanel({ chart }: { chart: BirthChart }) {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const houseOf = (p: string) => chart.planets.find((x) => x.name === p)?.house ?? 0;
  const list = (ps: string[]) => (ps.length ? ps.map((p) => graha(p, lang)).join(", ") : t("kt.none"));

  const tenth = chart.houses[9];
  const tenthLord = lordOf(tenth.sign);
  const d10 = chart.vargas.D10;
  const amk = chart.karakas[1].planet;
  const seventh = chart.houses[6];
  const seventhLord = lordOf(seventh.sign);
  const d9 = chart.vargas.D9;
  const dk = chart.karakas[6].planet;

  const careerFacts: [string, string][] = [
    [t("kt.tenth"), `${sign(tenth.sign, lang)} · ${t("kt.lordIn")} ${graha(tenthLord, lang)}, ${t("kt.house")} ${houseOf(tenthLord)}`],
    [t("kt.planetsThere"), list(tenth.planets)],
    ["D10", `${t("kt.lagna")} ${sign(d10.lagna, lang)} · 10: ${list(d10.houses[9].planets)}`],
    [say(KARAKAS.Amatyakaraka.name, lang), graha(amk, lang)],
  ];
  const marriageFacts: [string, string][] = [
    [t("kt.seventh"), `${sign(seventh.sign, lang)} · ${t("kt.lordIn")} ${graha(seventhLord, lang)}, ${t("kt.house")} ${houseOf(seventhLord)}`],
    [t("kt.planetsThere"), list(seventh.planets)],
    [`${graha("Venus", lang)} / ${graha("Jupiter", lang)}`, `${t("kt.house")} ${houseOf("Venus")} / ${houseOf("Jupiter")}`],
    ["D9", `${t("kt.lagna")} ${sign(d9.lagna, lang)} · 7: ${list(d9.houses[6].planets)}`],
    [say(KARAKAS.Darakaraka.name, lang), graha(dk, lang)],
    [t("kt.mangal"), chart.mangal_dosha.effective ? t("kt.manglik") : chart.mangal_dosha.manglik ? t("kt.cancelled") : t("kt.notManglik")],
  ];
  const facts = (rows: [string, string][]) => rows.map(([k, v]) => `${k}: ${v}`).join("; ");
  const qCareer = hi
    ? `मेरी कुंडली के करियर संकेत: ${facts(careerFacts)}। मेरे करियर के लिए इसका क्या अर्थ है और कौन सी साधना सहायक होगी?`
    : `My chart's career factors: ${facts(careerFacts)}. What does this mean for my career, and which sadhana would help?`;
  const qMarriage = hi
    ? `मेरी कुंडली के विवाह संकेत: ${facts(marriageFacts)}। मेरे विवाह और संबंधों के लिए इसका क्या अर्थ है और कौन सी साधना सहायक होगी?`
    : `My chart's marriage factors: ${facts(marriageFacts)}. What does this mean for my marriage and relationships, and which sadhana would help?`;

  const block = (title: Key, rows: [string, string][], q: string, label: Key) => (
    <section className={card}>
      <h3 className="font-serif text-3xl text-foreground">{t(title)}</h3>
      <dl className="mt-5 divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 py-2.5 text-sm">
            <dt className="text-cosmic-500">{k}</dt>
            <dd className="text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6"><Ask q={q} label={t(label)} /></div>
    </section>
  );
  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-cosmic-300">{t("kt.reportLead")}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        {block("kt.career", careerFacts, qCareer, "kt.askCareer")}
        {block("kt.marriage", marriageFacts, qMarriage, "kt.askMarriage")}
      </div>
    </div>
  );
}

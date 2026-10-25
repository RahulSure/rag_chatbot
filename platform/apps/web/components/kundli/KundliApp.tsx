"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Pencil } from "lucide-react";
import { getBirthChart, getPanchang, type BirthChart, type BirthDetails, type Panchang } from "@/lib/api";
import { useLanguage, type Lang } from "@/lib/i18n";
import { BirthForm } from "./BirthForm";
import { NorthIndianChart } from "./NorthIndianChart";
import { AshtakavargaPanel, IshtaPanel, MangalPanel, NakshatraPanel, ReportsPanel, VargaPanel, WesternPanel } from "./ChartPanels";
import type { Key } from "@/lib/i18n";

const TABS: { id: string; label: Key }[] = [
  { id: "overview", label: "kt.overview" },
  { id: "vargas", label: "kt.vargas" },
  { id: "nakshatra", label: "kt.nakshatra" },
  { id: "ishta", label: "kt.ishta" },
  { id: "mangal", label: "kt.mangal" },
  { id: "ashtaka", label: "kt.ashtaka" },
  { id: "reports", label: "kt.reports" },
  { id: "western", label: "kt.western" },
];

// Per-viewer convenience only: birth details never leave the browser except to be calculated.
const STORAGE_KEY = "sadhak_birth";

function loadSaved(): BirthDetails | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BirthDetails) : null;
  } catch {
    return null;
  }
}

function save(details: BirthDetails) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
  } catch {
    /* storage unavailable — the chart still shows, it just won't be remembered */
  }
}

const WEEKDAYS_HI: Record<string, string> = {
  Sunday: "रविवार", Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार",
  Thursday: "गुरुवार", Friday: "शुक्रवार", Saturday: "शनिवार",
};
const PAKSHA_HI: Record<string, string> = { Shukla: "शुक्ल", Krishna: "कृष्ण" };

function degrees(d: number) {
  const whole = Math.floor(d);
  return `${whole}° ${String(Math.floor((d - whole) * 60)).padStart(2, "0")}′`;
}

function formatDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="cosmic-card p-4 hover:translate-y-0">
      <p className="label-caps text-[0.68rem]">{label}</p>
      <p className="mt-2 font-serif text-2xl text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-cosmic-400">{sub}</p>}
    </div>
  );
}

export function KundliApp() {
  const { lang, t } = useLanguage();
  const [details, setDetails] = useState<BirthDetails | null>(null);
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [panchang, setPanchang] = useState<Panchang | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(true);
  const [tab, setTab] = useState("overview");

  const calculate = async (d: BirthDetails) => {
    setBusy(true);
    setError("");
    try {
      const [c, p] = await Promise.all([getBirthChart(d), getPanchang(d.place)]);
      setChart(c);
      setPanchang(p);
      setDetails(d);
      save(d);
      setEditing(false);
    } catch {
      setError(t("kundli.error"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setDetails(saved);
      calculate(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hi = lang === "hi";
  const sign = (s: { sign: string; sign_hi: string }) => (hi ? s.sign_hi : s.sign);
  const md = chart?.dasha.mahadasha;
  const ad = chart?.dasha.antardasha;

  const askQuestion =
    chart &&
    (hi
      ? `मेरा लग्न ${chart.ascendant.sign_hi}, चंद्र राशि ${chart.moon_sign.sign_hi}, जन्म नक्षत्र ${chart.birth_nakshatra.name_hi} है` +
        (md ? `, और ${md.lord_hi} महादशा${ad ? ` में ${ad.lord_hi} अंतर्दशा` : ""} चल रही है` : "") +
        "। मेरी साधना के लिए इसका क्या अर्थ है और कौन सी साधना मेरे लिए उपयुक्त है?"
      : `My ascendant is ${chart.ascendant.sign}, my Moon sign is ${chart.moon_sign.sign} and my birth nakshatra is ${chart.birth_nakshatra.name}` +
        (md ? `, and I am in ${md.lord} mahadasha${ad ? ` with ${ad.lord} antardasha` : ""}` : "") +
        ". What does this mean for my spiritual practice, and which sadhana suits me?");

  return (
    <div className="space-y-8">
      {editing || !chart ? (
        <div className="mx-auto max-w-xl">
          <BirthForm key={details ? "saved" : "new"} initial={details} busy={busy} onSubmit={calculate} />
          {error && <p role="alert" className="mt-3 text-center text-sm text-red-700 dark:text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-cosmic-400">
            {details?.name && <span className="font-medium text-foreground">{details.name} · </span>}
            {details && formatDate(details.date, lang)}
            {details && !details.timeUnknown && ` · ${details.time}`} · {details?.place.name}
          </p>
          <button onClick={() => setEditing(true)} className="btn-ghost inline-flex items-center gap-2 px-4 py-2 text-sm">
            <Pencil size={14} aria-hidden="true" /> {t("kundli.edit")}
          </button>
        </div>
      )}

      {chart && !editing && (
        <>
          {details?.timeUnknown && (
            <p className="rounded-xl border border-amber-600/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              {t("kundli.unknownTimeNote")}
            </p>
          )}

          <div role="tablist" aria-label={t("kundli.title")} className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
            {TABS.map((tb) => (
              <button key={tb.id} type="button" role="tab" aria-selected={tab === tb.id} onClick={() => setTab(tb.id)}
                      className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                        tab === tb.id ? "border-gold text-foreground" : "border-transparent text-cosmic-400 hover:text-foreground"}`}>
                {t(tb.label)}
              </button>
            ))}
          </div>

          {tab === "vargas" && <VargaPanel chart={chart} />}
          {tab === "nakshatra" && <NakshatraPanel chart={chart} />}
          {tab === "ishta" && <IshtaPanel chart={chart} />}
          {tab === "mangal" && <MangalPanel chart={chart} />}
          {tab === "ashtaka" && <AshtakavargaPanel chart={chart} />}
          {tab === "reports" && <ReportsPanel chart={chart} />}
          {tab === "western" && <WesternPanel chart={chart} />}

          {tab === "overview" && (<>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Stat label={t("kundli.lagna")} value={sign(chart.ascendant)} sub={degrees(chart.ascendant.degree_in_sign)} />
            <Stat label={t("kundli.rashi")} value={sign(chart.moon_sign)} />
            <Stat label={t("kundli.nakshatra")} value={hi ? chart.birth_nakshatra.name_hi : chart.birth_nakshatra.name}
                  sub={`${t("kundli.pada")} ${chart.birth_nakshatra.pada}`} />
            <Stat
              label={t("kundli.dasha")}
              value={md ? `${hi ? md.lord_hi : md.lord}${ad ? ` / ${hi ? ad.lord_hi : ad.lord}` : ""}` : "—"}
              sub={ad ? `${t("kundli.until")} ${formatDate(ad.end, lang)}` : undefined}
            />
            <Stat
              label={t("kundli.sadeSati")}
              value={chart.sade_sati.sade_sati ? t("kundli.sadeSatiActive") : t("kundli.sadeSatiInactive")}
              sub={chart.sade_sati.phase ?? undefined}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="cosmic-card p-6 hover:translate-y-0" aria-labelledby="chart-heading">
              <h2 id="chart-heading" className="mb-4 font-serif text-xl text-foreground">{t("kundli.chart")}</h2>
              <NorthIndianChart chart={chart} lang={lang} />
            </section>

            <section className="cosmic-card overflow-x-auto p-6 hover:translate-y-0" aria-labelledby="planets-heading">
              <h2 id="planets-heading" className="mb-4 font-serif text-xl text-foreground">{t("kundli.planets")}</h2>
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-cosmic-500">
                  <tr>
                    <th className="pb-2 font-medium">{t("kundli.colPlanet")}</th>
                    <th className="pb-2 font-medium">{t("kundli.colSign")}</th>
                    <th className="hidden pb-2 font-medium sm:table-cell">{t("kundli.colDegree")}</th>
                    <th className="pb-2 font-medium">{t("kundli.colNakshatra")}</th>
                    <th className="pb-2 text-right font-medium">{t("kundli.colHouse")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {chart.planets.map((p) => (
                    <tr key={p.name} className="text-cosmic-200">
                      <td className="whitespace-nowrap py-2 pr-2 font-medium text-foreground">
                        {hi ? p.name_hi : p.name}
                        {p.retrograde && !["Rahu", "Ketu"].includes(p.name) && (
                          <span className="ml-1 text-xs text-gold" title={t("kundli.retro")}>
                            <span className="sm:hidden">(R)</span>
                            <span className="hidden sm:inline">({t("kundli.retro")})</span>
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-2">{sign(p)}</td>
                      <td className="hidden py-2 tabular-nums sm:table-cell">{degrees(p.degree_in_sign)}</td>
                      <td className="py-2 pr-2">{hi ? p.nakshatra_hi : p.nakshatra} · {p.pada}</td>
                      <td className="py-2 text-right tabular-nums">{p.house}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="cosmic-card p-6 hover:translate-y-0" aria-labelledby="timeline-heading">
              <h2 id="timeline-heading" className="mb-4 font-serif text-xl text-foreground">{t("kundli.timeline")}</h2>
              <ol className="space-y-1.5 text-sm">
                {chart.dasha.sequence.map((p) => {
                  const current = md && p.start === md.start;
                  return (
                    <li key={p.start}
                        className={`flex justify-between rounded-lg px-3 py-1.5 ${current ? "bg-gold/15 font-medium text-foreground" : "text-cosmic-300"}`}>
                      <span>{hi ? p.lord_hi : p.lord}</span>
                      <span className="tabular-nums">{formatDate(p.start, lang)} – {formatDate(p.end, lang)}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            {panchang && (
              <section className="cosmic-card p-6 hover:translate-y-0" aria-labelledby="panchang-heading">
                <h2 id="panchang-heading" className="mb-1 font-serif text-xl text-foreground">{t("kundli.today")}</h2>
                <p className="mb-4 text-xs text-cosmic-500">{formatDate(panchang.date, lang)} · {details?.place.name}</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt className="text-cosmic-500">{t("kundli.vara")}</dt>
                  <dd className="text-foreground">{hi ? WEEKDAYS_HI[panchang.vara] ?? panchang.vara : panchang.vara}</dd>
                  <dt className="text-cosmic-500">{t("kundli.tithi")}</dt>
                  <dd className="text-foreground">{hi ? PAKSHA_HI[panchang.tithi.paksha] ?? panchang.tithi.paksha : panchang.tithi.paksha} {panchang.tithi.name}</dd>
                  <dt className="text-cosmic-500">{t("kundli.todayNakshatra")}</dt>
                  <dd className="text-foreground">{hi ? panchang.nakshatra.name_hi ?? panchang.nakshatra.name : panchang.nakshatra.name}</dd>
                  <dt className="text-cosmic-500">{t("kundli.yoga")}</dt>
                  <dd className="text-foreground">{panchang.yoga.name}</dd>
                  <dt className="text-cosmic-500">{t("kundli.karana")}</dt>
                  <dd className="text-foreground">{panchang.karana.name}</dd>
                </dl>
              </section>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            {askQuestion && (
              <Link href={`/chat?q=${encodeURIComponent(askQuestion)}`} className="btn-gold inline-flex items-center gap-2">
                <MessageCircle size={16} aria-hidden="true" /> {t("kundli.askCta")}
              </Link>
            )}
            <p className="text-xs text-cosmic-500">{t("kundli.method")}</p>
          </div>
          </>)}
        </>
      )}
    </div>
  );
}

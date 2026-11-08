"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle, Pencil } from "lucide-react";
import { useLanguage, type Key } from "@/lib/i18n";
import {
  DIRECTION_NAMES, LOSHU_LAYOUT, NUMBERS, PERSONAL_YEAR, PLANES, kua, pick, readNumbers, type Reading, type Source,
} from "@/lib/numerology";

// Per-viewer convenience only: the reading is worked out here and never sent anywhere.
const STORAGE_KEY = "sadhak_numerology";
const BIRTH_KEY = "sadhak_birth"; // the kundli's details, used to fill the form in

interface Details {
  name: string;
  date: string;
}

function load(key: string): Details | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Details>;
    return d.date ? { name: d.name ?? "", date: d.date } : null;
  } catch {
    return null;
  }
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-base text-foreground " +
  "placeholder:text-cosmic-500 transition-colors focus:border-gold/60 focus:outline-none";
const labelClass = "label-caps mb-2 block text-[0.7rem]";

const DIGIT_STYLE: Record<Source, string> = {
  birth: "text-foreground",
  driver: "text-gold",
  conductor: "text-gold underline decoration-gold/60 underline-offset-4",
};

const last = (chain: number[]) => chain[chain.length - 1];

// Fill whole rows: four across for 4 or 8 cards, three for 3 or 6, otherwise two.
const missingCols = (n: number) => (n % 4 === 0 ? "lg:grid-cols-4" : n % 3 === 0 ? "lg:grid-cols-3" : "");

function Stat({ label, chain, sub }: { label: string; chain: number[] | null; sub: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <p className="label-caps text-[0.68rem]">{label}</p>
      <p className="mt-3 flex items-baseline gap-3">
        <span className="font-serif text-5xl leading-none lining-nums text-gold">{chain ? last(chain) : "—"}</span>
        {chain && chain.length > 1 && <span className="text-sm tabular-nums text-cosmic-500">{chain.join(" → ")}</span>}
      </p>
      <p className="mt-3 text-sm text-cosmic-400">{sub}</p>
    </div>
  );
}

export function NumerologyApp() {
  const { lang, t } = useLanguage();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [details, setDetails] = useState<Details | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [gender, setGender] = useState<"male" | "female" | null>(null);

  const show = (d: Details) => {
    setDetails(d);
    setReading(readNumbers(d.date, d.name));
  };

  useEffect(() => {
    const saved = load(STORAGE_KEY);
    if (saved) {
      setName(saved.name);
      setDate(saved.date);
      show(saved);
      return;
    }
    const birth = load(BIRTH_KEY);
    if (birth) {
      setName(birth.name);
      setDate(birth.date);
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = { name: name.trim(), date };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch {
      /* the reading still shows, it just won't be remembered */
    }
    show(d);
  };

  const hi = lang === "hi";
  const graha = (n: number) => pick(NUMBERS[n].graha, lang);

  if (!reading || !details) {
    return (
      <form onSubmit={submit} className="mx-auto max-w-xl space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-cosmic sm:p-8">
        <div>
          <label htmlFor="num-name" className={labelClass}>{t("num.name")}</label>
          <input id="num-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("num.nameHint")}
                 autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="num-date" className={labelClass}>{t("num.date")}</label>
          <input id="num-date" type="date" required value={date} max={new Date().toISOString().slice(0, 10)}
                 onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <button type="submit" className="btn-gold w-full py-3.5 text-base">{t("num.submit")}</button>
        <p className="text-center text-xs text-cosmic-500">{t("num.privacy")}</p>
      </form>
    );
  }

  const moolank = last(reading.moolank);
  const bhagyank = last(reading.bhagyank);
  const nameNum = reading.name ? last(reading.name) : null;
  const year = last(reading.personalYear.chain);
  const lines = PLANES.filter((p) => !p.yoga);
  const yogas = PLANES.filter((p) => p.yoga && reading.planes.find((r) => r.id === p.id)?.complete);
  const isComplete = (id: string) => reading.planes.find((r) => r.id === id)?.complete ?? false;
  const birthDate = new Date(details.date).toLocaleDateString(hi ? "hi-IN" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const meanings: { label: string; n: number; text: string }[] = [
    { label: t("num.moolank"), n: moolank, text: pick(NUMBERS[moolank].traits, lang) },
    { label: t("num.bhagyank"), n: bhagyank, text: pick(NUMBERS[bhagyank].traits, lang) },
    ...(nameNum ? [{ label: t("num.nameNumber"), n: nameNum, text: pick(NUMBERS[nameNum].traits, lang) }] : []),
    { label: `${t("num.personalYear")} ${reading.personalYear.year}`, n: year, text: pick(PERSONAL_YEAR[year], lang) },
  ];

  const missingList = reading.missing.join(", ");
  const askAll = hi
    ? `मेरा मूलांक ${moolank} (${graha(moolank)}) और भाग्यांक ${bhagyank} (${graha(bhagyank)}) है` +
      (reading.missing.length ? `, और मेरे लो शु ग्रिड में ${missingList} अंक अनुपस्थित हैं` : "") +
      "। ग्रंथों के अनुसार मेरे लिए कौन सी साधना और उपाय उपयुक्त हैं?"
    : `My moolank is ${moolank} (${graha(moolank)}) and my bhagyank is ${bhagyank} (${graha(bhagyank)})` +
      (reading.missing.length ? `, and the numbers ${missingList} are missing from my Lo Shu grid` : "") +
      ". Which sadhana and remedies from the books suit me?";

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-cosmic-400">
          {details.name && <span className="font-medium text-foreground">{details.name} · </span>}
          {birthDate}
        </p>
        <button onClick={() => setReading(null)} className="btn-ghost px-4 py-2 text-sm">
          <Pencil size={14} aria-hidden="true" /> {t("num.edit")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t("num.moolank")} chain={reading.moolank} sub={`${t("num.ruledBy")} ${graha(moolank)}`} />
        <Stat label={t("num.bhagyank")} chain={reading.bhagyank} sub={`${t("num.ruledBy")} ${graha(bhagyank)}`} />
        <Stat label={t("num.nameNumber")} chain={reading.name}
              sub={nameNum ? `${t("num.ruledBy")} ${graha(nameNum)}` : t("num.nameNone")} />
        <Stat label={`${t("num.personalYear")} ${reading.personalYear.year}`} chain={reading.personalYear.chain}
              sub={`${t("num.ruledBy")} ${graha(year)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="grid-heading">
          <h2 id="grid-heading" className="font-serif text-2xl text-foreground">{t("num.grid")}</h2>
          <div className="mx-auto mt-6 grid max-w-sm grid-cols-3 border-l border-t border-gold/45">
            {LOSHU_LAYOUT.map((n) => {
              const sources = reading.grid[n];
              return (
                <div key={n}
                     className={`relative flex aspect-square items-center justify-center border-b border-r border-gold/45 ${sources.length ? "" : "bg-surface-2"}`}>
                  <span className="absolute left-2 top-1.5 text-xs text-cosmic-600" aria-hidden="true">{n}</span>
                  {sources.length > 0 ? (
                    <span className="flex flex-wrap justify-center gap-x-1.5 px-2 font-serif text-3xl leading-tight lining-nums sm:text-4xl">
                      {sources.map((s, i) => <span key={i} className={DIGIT_STYLE[s]}>{n}</span>)}
                    </span>
                  ) : (
                    <span className="sr-only">{n}: —</span>
                  )}
                </div>
              );
            })}
          </div>
          <ul className="mx-auto mt-5 flex max-w-sm flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-cosmic-400">
            <li><span className="font-serif text-lg lining-nums text-foreground">1</span> {t("num.legendBirth")}</li>
            <li><span className="font-serif text-lg lining-nums text-gold">1</span> {t("num.moolank")}</li>
            <li><span className={`font-serif text-lg lining-nums ${DIGIT_STYLE.conductor}`}>1</span> {t("num.bhagyank")}</li>
          </ul>
          <p className="mx-auto mt-4 max-w-sm text-center text-xs leading-relaxed text-cosmic-500">{t("num.gridNote")}</p>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="planes-heading">
          <h2 id="planes-heading" className="font-serif text-2xl text-foreground">{t("num.planes")}</h2>
          <ul className="mt-4 divide-y divide-line">
            {lines.map((p) => {
              const complete = isComplete(p.id);
              return (
                <li key={p.id} className="py-3.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium text-foreground">{pick(p.name, lang)}</span>
                    <span className="text-xs tabular-nums text-cosmic-500">{p.numbers.join(" · ")}</span>
                    <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[0.7rem] uppercase tracking-wider ${
                      complete ? "border-gold/50 text-gold" : "border-line text-cosmic-500"}`}>
                      {complete ? t("num.complete") : t("num.incomplete")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-cosmic-400">{pick(complete ? p.complete : p.missing, lang)}</p>
                </li>
              );
            })}
          </ul>
          {yogas.length > 0 && (
            <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4">
              <p className="label-caps text-[0.68rem]">{t("num.yogas")}</p>
              {yogas.map((p) => (
                <p key={p.id} className="mt-2 text-sm leading-relaxed text-cosmic-200">
                  <span className="font-medium text-foreground">{pick(p.name, lang)}</span> ({p.numbers.join(" · ")}): {pick(p.complete, lang)}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="meaning-heading">
        <h2 id="meaning-heading" className="font-serif text-3xl text-foreground">{t("num.yourNumbers")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {meanings.map((m) => (
            <div key={m.label} className="flex gap-5 rounded-2xl border border-line bg-surface p-6">
              <span className="font-serif text-5xl leading-none lining-nums text-gold">{m.n}</span>
              <div>
                <p className="label-caps text-[0.68rem]">{m.label} · {graha(m.n)}</p>
                <p className="mt-2 leading-relaxed text-cosmic-200">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="missing-heading">
        <h2 id="missing-heading" className="font-serif text-3xl text-foreground">{t("num.missing")}</h2>
        {reading.missing.length === 0 ? (
          <p className="mt-4 text-cosmic-300">{t("num.missingNone")}</p>
        ) : (
          <ul className={`mt-6 grid gap-4 md:grid-cols-2 ${missingCols(reading.missing.length)}`}>
            {reading.missing.map((n) => {
              const info = NUMBERS[n];
              const facts: [Key, string][] = [
                ["num.deity", pick(info.deity, lang)],
                ["num.day", pick(info.day, lang)],
                ["num.colour", pick(info.colour, lang)],
              ];
              return (
                <li key={n} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-5xl leading-none lining-nums text-gold">{n}</span>
                    <span className="font-serif text-xl text-foreground">{pick(info.graha, lang)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-cosmic-400">{pick(info.missing, lang)}</p>
                  <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-line py-3 text-sm">
                    {facts.map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs uppercase tracking-wider text-cosmic-500">{t(k)}</dt>
                        <dd className="mt-0.5 text-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 text-sm leading-relaxed text-cosmic-200">
                    <span className="font-medium text-gold">{t("num.remedy")}: </span>{pick(info.remedy, lang)}
                  </p>
                  <Link href={`/chat?q=${encodeURIComponent(pick(info.ask, lang))}`}
                        className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm text-gold hover:underline">
                    {t("num.askMantra")} <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {reading.repeated.length > 0 && (
        <section aria-labelledby="repeated-heading">
          <h2 id="repeated-heading" className="font-serif text-3xl text-foreground">{t("num.repeated")}</h2>
          <ul className="mt-5 flex flex-wrap gap-3">
            {reading.repeated.map((r) => (
              <li key={r.n} className="rounded-xl border border-line bg-surface px-5 py-3">
                <span className="font-serif text-2xl lining-nums text-gold">{r.n}</span>
                <span className="ml-2 text-sm text-cosmic-300">
                  × {r.count} · {graha(r.n)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cosmic-400">{t("num.repeatedNote")}</p>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="kua-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="kua-heading" className="font-serif text-3xl text-foreground">{t("kua.title")}</h2>
            <p className="mt-1 text-sm text-cosmic-400">{t("kua.lead")}</p>
          </div>
          <div className="flex rounded-full border border-line p-1">
            {(["male", "female"] as const).map((g) => (
              <button key={g} type="button" onClick={() => setGender(g)} aria-pressed={gender === g}
                      className={`rounded-full px-4 py-1.5 text-sm ${gender === g ? "bg-gold text-background" : "text-cosmic-300 hover:text-foreground"}`}>
                {t(g === "male" ? "kua.male" : "kua.female")}
              </button>
            ))}
          </div>
        </div>
        {gender && (() => {
          const k = kua(details.date, gender);
          const labels = [t("kua.success"), t("kua.health"), t("kua.love"), t("kua.growth")];
          return (
            <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr_1fr] md:items-start">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-6xl leading-none lining-nums text-gold">{k.number}</span>
                <span className="text-sm text-cosmic-400">{t(k.group === "east" ? "kua.east" : "kua.west")} {t("kua.group")}</span>
              </div>
              <div>
                <p className="label-caps text-[0.68rem]">{t("kua.good")}</p>
                <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {k.good.map((d, i) => (
                    <li key={d} className="rounded-lg border border-gold/40 px-3 py-2"><span className="text-cosmic-500">{labels[i]}</span><br /><span className="text-foreground">{pick(DIRECTION_NAMES[d], lang)}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label-caps text-[0.68rem]">{t("kua.bad")}</p>
                <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {k.avoid.map((d) => <li key={d} className="rounded-lg border border-line px-3 py-2 text-cosmic-300">{pick(DIRECTION_NAMES[d], lang)}</li>)}
                </ul>
              </div>
            </div>
          );
        })()}
      </section>

      <div className="flex flex-col items-center gap-3 border-t border-line pt-10 text-center">
        <Link href={`/chat?q=${encodeURIComponent(askAll)}`} className="btn-gold">
          <MessageCircle size={16} aria-hidden="true" /> {t("num.askCta")}
        </Link>
        <p className="max-w-xl text-xs leading-relaxed text-cosmic-500">{t("num.method")}</p>
      </div>
    </div>
  );
}

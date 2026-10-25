"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Pencil } from "lucide-react";
import { getVarshaphal, type BirthChart, type BirthDetails, type Varshaphal } from "@/lib/api";
import { loadBirth, saveBirth } from "@/lib/birth";
import { useLanguage } from "@/lib/i18n";
import { MUNTHA_HOUSE, say, sign } from "@/lib/jyotish-text";
import { BirthForm } from "@/components/kundli/BirthForm";
import { NorthIndianChart } from "@/components/kundli/NorthIndianChart";

export function VarshaphalApp() {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const [birth, setBirth] = useState<BirthDetails | null>(null);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [data, setData] = useState<Varshaphal | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const load = async (b: BirthDetails, y: number) => {
    setBusy(true);
    setError("");
    try {
      setData(await getVarshaphal(b, y));
      setEditing(false);
    } catch {
      setError(t("kundli.error"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const b = loadBirth();
    setBirth(b);
    setReady(true);
    if (b) load(b, year);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  if (!birth || editing) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-center text-cosmic-400">{t("day.needBirth")}</p>
        <BirthForm initial={birth} busy={busy} onSubmit={(d) => { saveBirth(d); setBirth(d); load(d, year); }} />
        {error && <p role="alert" className="mt-3 text-center text-sm text-red-700 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  const birthYear = Number(birth.date.slice(0, 4));
  const step = (d: number) => {
    const y = Math.max(birthYear + 1, year + d);
    setYear(y);
    load(birth, y);
  };
  const pravesh = data && new Date(data.pravesh).toLocaleString(hi ? "hi-IN" : "en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: birth.place.tz,
  });
  const q = data && (hi
    ? `मेरा वर्षफल ${data.year}: वर्ष लग्न ${data.varsha_lagna.sign_hi}, मुंथा ${data.muntha.sign_hi} में ${data.muntha.house}वें भाव में है। इस वर्ष मेरे लिए क्या संकेत हैं और कौन सी साधना सहायक होगी?`
    : `My Varshaphal for ${data.year}: the year lagna is ${data.varsha_lagna.sign} and the muntha is in ${data.muntha.sign}, in the ${data.muntha.house}th house. What does this year hold for me, and which sadhana would help?`);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-cosmic-400">{birth.name && <span className="font-medium text-foreground">{birth.name} · </span>}{birth.place.name}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} aria-label="Previous year" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:border-gold/50"><ChevronLeft size={18} /></button>
          <span className="min-w-20 text-center font-serif text-3xl lining-nums text-foreground">{year}</span>
          <button type="button" onClick={() => step(1)} aria-label="Next year" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:border-gold/50"><ChevronRight size={18} /></button>
          <button onClick={() => setEditing(true)} className="btn-ghost ml-2 px-4 py-2 text-sm"><Pencil size={14} aria-hidden="true" /> {t("kundli.edit")}</button>
        </div>
      </div>

      {busy && !data && <p className="text-center text-cosmic-400">{t("kundli.calculating")}</p>}
      {error && <p role="alert" className="text-center text-sm text-red-700 dark:text-red-400">{error}</p>}

      {data && (
        <div className={`grid gap-6 lg:grid-cols-2 ${busy ? "opacity-60" : ""}`}>
          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="label-caps text-[0.68rem]">{t("varsha.pravesh")}</p>
                <p className="mt-2 font-serif text-xl text-foreground">{pravesh}</p>
                <p className="mt-1 text-sm text-cosmic-500">{t("varsha.age")} {data.age}</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="label-caps text-[0.68rem]">{t("varsha.lagna")}</p>
                <p className="mt-2 font-serif text-3xl text-foreground">{hi ? data.varsha_lagna.sign_hi : data.varsha_lagna.sign}</p>
              </div>
            </div>
            <div className={`rounded-2xl border bg-surface p-6 sm:p-8 ${data.muntha.favourable ? "border-gold/40" : "border-red-700/30 dark:border-red-300/25"}`}>
              <p className="label-caps text-[0.68rem]">{t("varsha.muntha")}</p>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="font-serif text-4xl text-foreground">{hi ? data.muntha.sign_hi : data.muntha.sign}</span>
                <span className="text-cosmic-400">{data.muntha.house} {t("kt.house")}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs uppercase tracking-wider ${data.muntha.favourable ? "border-gold/60 text-gold" : "border-red-700/40 text-red-700 dark:text-red-300"}`}>
                  {data.muntha.favourable ? t("varsha.favourable") : t("varsha.careful")}
                </span>
              </div>
              <p className="mt-4 text-lg leading-relaxed text-cosmic-200">{say(MUNTHA_HOUSE[data.muntha.house], lang)}</p>
              <p className="mt-3 text-sm text-cosmic-500">{t("varsha.munthaLead")}</p>
            </div>
            {q && (
              <Link href={`/chat?q=${encodeURIComponent(q)}`} className="btn-gold">
                <MessageCircle size={16} aria-hidden="true" /> {t("varsha.ask")}
              </Link>
            )}
            <p className="text-xs text-cosmic-500">{t("varsha.note")}</p>
          </section>
          <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="mb-4 font-serif text-2xl text-foreground">{t("varsha.chart")} {data.year}</h2>
            <NorthIndianChart chart={data.chart as BirthChart} lang={lang} />
            <ul className="mt-5 grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
              {data.chart.planets.map((p) => (
                <li key={p.name} className="flex justify-between"><span className="text-cosmic-400">{hi ? p.name_hi : p.name}</span><span className="text-foreground">{sign(p.sign, lang)}</span></li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

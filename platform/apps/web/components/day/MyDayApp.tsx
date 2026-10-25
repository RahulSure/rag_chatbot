"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle, Pencil, TriangleAlert } from "lucide-react";
import { getMyDay, type BirthDetails, type DayOutlook, type MoonReading, type Place } from "@/lib/api";
import { loadBirth, saveBirth } from "@/lib/birth";
import { useLanguage } from "@/lib/i18n";
import { TARAS, graha, say, sign } from "@/lib/jyotish-text";
import { BirthForm } from "@/components/kundli/BirthForm";
import { PlacePicker, loadSavedPlace } from "@/components/PlacePicker";

const QUALITY_CLASS: Record<string, string> = {
  good: "border-gold/60 text-gold",
  avoid: "border-red-700/40 text-red-700 dark:border-red-300/30 dark:text-red-300",
  mixed: "border-line text-cosmic-300",
};
const DOT: Record<string, string> = { good: "bg-gold", avoid: "bg-red-500", mixed: "bg-cosmic-500" };

export function MyDayApp() {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const [birth, setBirth] = useState<BirthDetails | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [data, setData] = useState<DayOutlook | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const load = async (b: BirthDetails, p: Place | null) => {
    setBusy(true);
    setError("");
    try {
      setData(await getMyDay(b, p));
      setEditing(false);
    } catch {
      setError(t("kundli.error"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const b = loadBirth();
    const p = loadSavedPlace();
    setBirth(b);
    setPlace(p);
    setReady(true);
    if (b) load(b, p);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;

  if (!birth || editing) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-center text-cosmic-400">{t("day.needBirth")}</p>
        <BirthForm initial={birth} busy={busy} onSubmit={(d) => { saveBirth(d); setBirth(d); load(d, place); }} />
        {error && <p role="alert" className="mt-3 text-center text-sm text-red-700 dark:text-red-400">{error}</p>}
      </div>
    );
  }
  if (!data) return <p className="text-center text-cosmic-400">{busy ? t("kundli.calculating") : error}</p>;

  const now = data.now;
  const tara = TARAS[now.tara];
  const chandraText = now.chandrashtama ? t("day.chandrashtama")
    : now.chandra === "good" ? t("day.chandraGood") : now.chandra === "hard" ? t("day.chandraHard") : t("day.chandraNeutral");
  const md = data.dasha.mahadasha;
  const ad = data.dasha.antardasha;
  const dayName = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(`${iso}T12:00:00`).toLocaleDateString(hi ? "hi-IN" : "en-GB", opts);
  const q = hi
    ? `मेरा जन्म नक्षत्र ${data.natal.nakshatra_hi} है। आज चंद्रमा ${now.nakshatra_hi} में है, यह मेरा ${say(tara.name, lang)} तारा है और चंद्र मेरी राशि से ${now.moon_house}वें भाव में है।${md ? ` ${md.lord_hi} महादशा चल रही है।` : ""} आज मुझे कौन सी साधना करनी चाहिए?`
    : `My birth nakshatra is ${data.natal.nakshatra}. Today the Moon is in ${now.nakshatra}, which is my ${now.tara} tara, and it is in the ${now.moon_house}th house from my Moon.${md ? ` I am in ${md.lord} mahadasha.` : ""} Which sadhana should I do today?`;

  const WeekCard = ({ w }: { w: MoonReading & { date: string } }) => (
    <li className={`rounded-xl border bg-surface p-3 text-center ${w.chandrashtama ? "border-red-700/40 dark:border-red-300/30" : "border-line"}`}>
      <p className="text-xs uppercase tracking-wider text-cosmic-500">{dayName(w.date, { weekday: "short" })}</p>
      <p className="font-serif text-2xl lining-nums text-foreground">{dayName(w.date, { day: "numeric" })}</p>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-cosmic-200">
        <span className={`h-2 w-2 rounded-full ${DOT[w.tara_quality]}`} aria-hidden="true" />{say(TARAS[w.tara].name, lang)}
      </p>
      <p className="mt-0.5 truncate text-[0.7rem] text-cosmic-500">{hi ? w.nakshatra_hi : w.nakshatra}</p>
      {w.chandrashtama && <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-red-700 dark:text-red-300">8th</p>}
    </li>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-cosmic-400">
          {birth.name && <span className="font-medium text-foreground">{birth.name} · </span>}
          {t("day.yourStar")}: <span className="text-foreground">{hi ? data.natal.nakshatra_hi : data.natal.nakshatra}</span> · {sign(data.natal.moon_sign, lang)}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-cosmic-500">{place?.name ?? birth.place.name}</span>
          <PlacePicker onChoose={(p) => { setPlace(p); load(birth, p); }} />
          <button onClick={() => setEditing(true)} className="btn-ghost px-4 py-2 text-sm">
            <Pencil size={14} aria-hidden="true" /> {t("kundli.edit")}
          </button>
        </div>
      </div>

      <section className="grid gap-6 rounded-2xl border border-gold/40 bg-surface p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="label-caps text-[0.68rem]">{t("day.today")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-5xl text-foreground">{say(tara.name, lang)}</h2>
            <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${QUALITY_CLASS[now.tara_quality]}`}>
              {now.tara_number} / 9
            </span>
          </div>
          <p className="mt-4 text-lg leading-relaxed text-cosmic-200">{say(tara.about, lang)}</p>
          <Link href={`/chat?q=${encodeURIComponent(q)}`} className="btn-gold mt-6">
            <MessageCircle size={16} aria-hidden="true" /> {t("day.ask")}
          </Link>
        </div>
        <div className="space-y-4 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-sm text-cosmic-400">{t("day.moonNow")}</p>
          <p className="font-serif text-3xl text-foreground">{hi ? now.nakshatra_hi : now.nakshatra}</p>
          <p className="text-sm text-cosmic-300">{sign(now.moon_sign, lang)} · {now.moon_house} {t("day.house")}</p>
          <p className={`flex items-start gap-2 text-sm leading-relaxed ${now.chandrashtama || now.chandra === "hard" ? "text-red-700 dark:text-red-300" : "text-cosmic-200"}`}>
            {(now.chandrashtama || now.chandra === "hard") && <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}
            {chandraText}
          </p>
          <Link href="/muhurat" className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
            {t("day.muhurat")} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="week-heading">
        <h2 id="week-heading" className="font-serif text-3xl text-foreground">{t("day.week")}</h2>
        <ul className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
          {data.week.map((w) => <WeekCard key={w.date} w={w} />)}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="chakra-heading">
          <h2 id="chakra-heading" className="font-serif text-2xl text-foreground">{t("day.chakra")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cosmic-400">{t("day.chakraLead")}</p>
          <ol className="mt-5 grid gap-2 sm:grid-cols-3">
            {data.chakra.map((g) => (
              <li key={g.tara} className={`rounded-xl border p-3 ${g.number === now.tara_number ? "border-gold bg-gold/10" : "border-line"}`}>
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className={`h-2 w-2 rounded-full ${DOT[g.quality]}`} aria-hidden="true" />
                  {g.number}. {say(TARAS[g.tara].name, lang)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-cosmic-400">
                  {g.nakshatras.map((n) => (
                    <span key={n.index} className={n.index === now.nakshatra_index ? "text-gold" : n.index === data.natal.nakshatra_index ? "text-foreground" : ""}>
                      {hi ? n.name_hi : n.name}
                    </span>
                  )).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, " · ", el] : [el]), [])}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <section className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="label-caps text-[0.68rem]">{t("day.dasha")}</p>
            <p className="mt-2 font-serif text-2xl text-foreground">
              {md ? `${hi ? md.lord_hi : md.lord}${ad ? ` / ${hi ? ad.lord_hi : ad.lord}` : ""}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="label-caps text-[0.68rem]">{t("kundli.sadeSati")}</p>
            <p className={`mt-2 font-serif text-2xl ${data.sade_sati.sade_sati ? "text-red-700 dark:text-red-300" : "text-foreground"}`}>
              {data.sade_sati.sade_sati ? t("day.sadeSatiOn") : t("day.sadeSatiOff")}
            </p>
            <p className="mt-1 text-sm text-cosmic-500">{graha("Saturn", lang)} · {data.sade_sati.house_from_moon} {t("day.house")}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

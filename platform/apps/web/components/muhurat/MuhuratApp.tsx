"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { getMuhurat, type Muhurat, type Place, type TimeSpan } from "@/lib/api";
import { useLanguage, type Key, type Lang } from "@/lib/i18n";
import { PlacePicker, loadSavedPlace } from "@/components/PlacePicker";

// What each planet's hora traditionally suits: [English, Hindi].
const GRAHA: Record<string, { hi: string; suits: [string, string] }> = {
  Sun: { hi: "सूर्य", suits: ["Surya sadhana, health, work with officials", "सूर्य साधना, स्वास्थ्य, अधिकारियों से जुड़े कार्य"] },
  Moon: { hi: "चंद्र", suits: ["Shiva and Devi sadhana, calming the mind, travel", "शिव और देवी साधना, मन की शांति, यात्रा"] },
  Mars: { hi: "मंगल", suits: ["Hanuman sadhana, courage, property", "हनुमान साधना, साहस, भूमि-भवन"] },
  Mercury: { hi: "बुध", suits: ["Ganesha sadhana, study, writing, trade", "गणेश साधना, अध्ययन, लेखन, व्यापार"] },
  Jupiter: { hi: "बृहस्पति", suits: ["Guru mantra and diksha, learning, religious work", "गुरु मंत्र और दीक्षा, विद्या, धार्मिक कार्य"] },
  Venus: { hi: "शुक्र", suits: ["Lakshmi sadhana, wealth, love, the arts", "लक्ष्मी साधना, धन, प्रेम, कलाएँ"] },
  Saturn: { hi: "शनि", suits: ["Shani sadhana, service, patient long work", "शनि साधना, सेवा, धैर्य वाले लंबे कार्य"] },
};
const CHOG_HI: Record<string, string> = { Udveg: "उद्वेग", Char: "चर", Labh: "लाभ", Amrit: "अमृत", Kaal: "काल", Shubh: "शुभ", Rog: "रोग" };
const QUALITY: Record<string, { key: Key; className: string }> = {
  best: { key: "mu.best", className: "border-gold bg-gold text-background" },
  good: { key: "mu.goodQ", className: "border-gold/60 text-gold" },
  neutral: { key: "mu.neutral", className: "border-line text-cosmic-400" },
  avoid: { key: "mu.avoidQ", className: "border-red-700/40 text-red-700 dark:border-red-300/30 dark:text-red-300" },
};
const WEEKDAY_HI: Record<string, string> = {
  Sunday: "रविवार", Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार",
  Thursday: "गुरुवार", Friday: "शुक्रवार", Saturday: "शनिवार",
};

const within = (s: TimeSpan, now: number) => now >= Date.parse(s.start) && now < Date.parse(s.end);
const graha = (lord: string, lang: Lang) => (lang === "hi" ? GRAHA[lord].hi : lord);

function QualityBadge({ quality }: { quality: string }) {
  const t = useLanguage().t;
  const q = QUALITY[quality];
  return <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] uppercase tracking-wider ${q.className}`}>{t(q.key)}</span>;
}

export function MuhuratApp({ initialPlace, initialData }: { initialPlace: Place; initialData: Muhurat | null }) {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const [place, setPlace] = useState<Place>(initialPlace);
  const [data, setData] = useState<Muhurat | null>(initialData);
  const [now, setNow] = useState<number | null>(null);

  const choose = async (p: Place) => {
    setPlace(p);
    setData(await getMuhurat(p).catch(() => null));
  };

  useEffect(() => {
    const saved = loadSavedPlace();
    if (saved && saved.name !== initialPlace.name) choose(saved);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When this Vedic day ends at the next sunrise, fetch the new one.
  useEffect(() => {
    if (data && now && now >= Date.parse(data.next_sunrise)) choose(place);
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const header = (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
      <p className="label-caps">{t("mu.for")} {place.name}</p>
      <PlacePicker onChoose={choose} />
    </div>
  );

  if (!data) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-center text-cosmic-300">{t("mu.noSun")}</p>
      </div>
    );
  }

  const fmt = new Intl.DateTimeFormat(hi ? "hi-IN" : "en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: data.tz });
  const time = (iso: string) => fmt.format(new Date(iso));
  const range = (s: TimeSpan) => `${time(s.start)} – ${time(s.end)}`;
  const until = (iso: string) => (hi ? `${time(iso)} तक` : `until ${time(iso)}`);
  const day = new Date(`${data.date}T12:00:00`).toLocaleDateString(hi ? "hi-IN" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const hora = now ? data.horas.find((h) => within(h, now)) : undefined;
  const chog = now ? data.choghadiya.find((c) => within(c, now)) : undefined;
  const rahuNow = now ? within(data.rahu_kaal, now) : false;
  const askHora = hora && (hi
    ? `अभी ${GRAHA[hora.lord].hi} की होरा है। इस होरा में ग्रंथों के अनुसार कौन सी साधना आरम्भ करना श्रेष्ठ है?`
    : `It is now the hora of ${hora.lord}. Which sadhana from the books is best to begin in this hora?`);

  const good: [Key, TimeSpan, string][] = [
    ["mu.brahma", data.brahma_muhurta, t("mu.brahmaNote")],
    ["mu.abhijit", data.abhijit, data.weekday === "Wednesday" ? t("mu.abhijitWed") : t("mu.abhijitNote")],
  ];
  const avoid: [Key, TimeSpan][] = [["mu.rahu", data.rahu_kaal], ["mu.yama", data.yamaganda], ["mu.gulika", data.gulika]];

  const rowClass = (s: TimeSpan) => {
    if (now && within(s, now)) return "bg-gold/10 ring-1 ring-gold/40 text-foreground";
    if (now && now >= Date.parse(s.end)) return "text-cosmic-500";
    return "text-cosmic-200";
  };

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        {header}
        <p className="text-center text-cosmic-400">{hi ? WEEKDAY_HI[data.weekday] : data.weekday}, {day}</p>
      </div>

      {hora && chog && (
        <section aria-label={t("mu.now")} className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gold/40 bg-surface p-6 sm:p-8">
            <p className="label-caps text-[0.68rem]">{t("mu.now")} · {t("mu.hora")}</p>
            <p className="mt-3 font-serif text-4xl text-foreground">{graha(hora.lord, lang)}</p>
            <p className="mt-1 text-sm text-cosmic-400">{until(hora.end)}</p>
            <p className="mt-4 leading-relaxed text-cosmic-200">{GRAHA[hora.lord].suits[hi ? 1 : 0]}</p>
            {askHora && (
              <Link href={`/chat?q=${encodeURIComponent(askHora)}`} className="mt-5 inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
                {t("mu.askHora")} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <p className="label-caps text-[0.68rem]">{t("mu.now")} · {t("mu.choghadiya")}</p>
            <p className="mt-3 flex flex-wrap items-center gap-3">
              <span className="font-serif text-4xl text-foreground">{hi ? CHOG_HI[chog.name] : chog.name}</span>
              <QualityBadge quality={chog.quality} />
            </p>
            <p className="mt-1 text-sm text-cosmic-400">{until(chog.end)}</p>
            {rahuNow && (
              <p role="status" className="mt-5 flex items-start gap-2 rounded-lg border border-red-700/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-800 dark:text-red-200">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {t("mu.rahuNow")}
              </p>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="label-caps text-[0.68rem]">{t("mu.sunrise")}</dt>
              <dd className="mt-2 font-serif text-3xl lining-nums text-foreground">{time(data.sunrise)}</dd>
            </div>
            <div>
              <dt className="label-caps text-[0.68rem]">{t("mu.sunset")}</dt>
              <dd className="mt-2 font-serif text-3xl lining-nums text-foreground">{time(data.sunset)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="label-caps text-[0.68rem]">{t("mu.good")}</p>
          <dl className="mt-3 space-y-3">
            {good.map(([k, span, note]) => (
              <div key={k}>
                <dt className="flex flex-wrap items-baseline justify-between gap-x-3 text-foreground">
                  <span>{t(k)}</span>
                  <span className="tabular-nums">{range(span)}</span>
                </dt>
                <dd className="text-xs text-cosmic-500">{note}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="label-caps text-[0.68rem]">{t("mu.avoid")}</p>
          <dl className="mt-3 space-y-2.5">
            {avoid.map(([k, span]) => (
              <div key={k} className={`flex flex-wrap items-baseline justify-between gap-x-3 rounded-md ${now && within(span, now) ? "text-red-700 dark:text-red-300" : "text-foreground"}`}>
                <dt>{t(k)}</dt>
                <dd className="tabular-nums">{range(span)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="hora-heading">
          <h2 id="hora-heading" className="font-serif text-2xl text-foreground">{t("mu.horaTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cosmic-400">{t("mu.horaLead")}</p>
          {[true, false].map((isDay) => (
            <div key={String(isDay)} className="mt-6">
              <p className="label-caps mb-2 text-[0.68rem]">{t(isDay ? "mu.day" : "mu.night")}</p>
              <ol className="space-y-1">
                {data.horas.filter((h) => h.day === isDay).map((h) => (
                  <li key={h.start} className={`grid grid-cols-[7.5rem_5.5rem_1fr] items-baseline gap-2 rounded-lg px-3 py-1.5 text-sm ${rowClass(h)}`}>
                    <span className="tabular-nums">{range(h)}</span>
                    <span className="font-medium">{graha(h.lord, lang)}</span>
                    <span className="truncate text-xs text-cosmic-500">{GRAHA[h.lord].suits[hi ? 1 : 0]}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="chog-heading">
          <h2 id="chog-heading" className="font-serif text-2xl text-foreground">{t("mu.choghadiya")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cosmic-400">{t("mu.chogLead")}</p>
          {[true, false].map((isDay) => (
            <div key={String(isDay)} className="mt-6">
              <p className="label-caps mb-2 text-[0.68rem]">{t(isDay ? "mu.day" : "mu.night")}</p>
              <ol className="space-y-1">
                {data.choghadiya.filter((c) => c.day === isDay).map((c) => (
                  <li key={c.start} className={`grid grid-cols-[7.5rem_1fr_auto] items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${rowClass(c)}`}>
                    <span className="tabular-nums">{range(c)}</span>
                    <span className="font-medium">{hi ? CHOG_HI[c.name] : c.name}</span>
                    <QualityBadge quality={c.quality} />
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      </div>

      <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-cosmic-500">{t("mu.method")}</p>
    </div>
  );
}

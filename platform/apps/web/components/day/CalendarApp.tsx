"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { getCalendar, type CalendarDay, type Place } from "@/lib/api";
import { useLanguage, type Lang } from "@/lib/i18n";
import { PlacePicker, loadSavedPlace } from "@/components/PlacePicker";

const TITHI_EN = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami",
  "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi"];
const TITHI_HI = ["प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी",
  "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी"];
const EVENT_HI: Record<string, string> = {
  "Shukla Ekadashi": "शुक्ल एकादशी", "Krishna Ekadashi": "कृष्ण एकादशी", Purnima: "पूर्णिमा", Amavasya: "अमावस्या",
  "Shukla Pradosh": "शुक्ल प्रदोष", "Krishna Pradosh": "कृष्ण प्रदोष", "Masik Shivaratri": "मासिक शिवरात्रि",
  "Vinayaka Chaturthi": "विनायक चतुर्थी",
};
const SANKRANTI_HI: Record<string, string> = {
  Mesha: "मेष", Vrishabha: "वृषभ", Mithuna: "मिथुन", Karka: "कर्क", Simha: "सिंह", Kanya: "कन्या",
  Tula: "तुला", Vrishchika: "वृश्चिक", Dhanu: "धनु", Makara: "मकर", Kumbha: "कुंभ", Meena: "मीन",
};
const EVENT_TONE: Record<string, string> = {
  Ekadashi: "bg-gold/15 text-gold", Purnima: "bg-gold text-background", Amavasya: "bg-cosmic-700 text-foreground",
  Pradosh: "bg-surface-2 text-cosmic-200", Shivaratri: "bg-surface-2 text-cosmic-200", Chaturthi: "bg-surface-2 text-cosmic-200",
  Sankranti: "bg-gold/10 text-gold",
};

function eventName(e: string, lang: Lang) {
  if (lang !== "hi") return e;
  if (e.endsWith(" Sankranti")) return `${SANKRANTI_HI[e.split(" ")[0]] ?? e.split(" ")[0]} संक्रांति`;
  return EVENT_HI[e] ?? e;
}
const tone = (e: string) => EVENT_TONE[Object.keys(EVENT_TONE).find((k) => e.includes(k)) ?? ""] ?? "bg-surface-2 text-cosmic-200";

function tithiName(n: number, lang: Lang) {
  if (n === 15) return lang === "hi" ? "पूर्णिमा" : "Purnima";
  if (n === 30) return lang === "hi" ? "अमावस्या" : "Amavasya";
  const i = (n - 1) % 15;
  return lang === "hi" ? TITHI_HI[i] : TITHI_EN[i];
}

/** The Moon as it looks that morning: 0 new, 0.5 full. */
function Moon({ phase, size = 18 }: { phase: number; size?: number }) {
  const r = size / 2 - 1;
  const rx = Math.abs(Math.cos(2 * Math.PI * phase)) * r;
  const waxing = phase < 0.5;
  const crescent = phase < 0.25 || phase > 0.75;
  const outer = waxing ? 1 : 0;
  const inner = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
  const d = `M 0 ${-r} A ${r} ${r} 0 0 ${outer} 0 ${r} A ${rx} ${r} 0 0 ${inner} 0 ${-r} Z`;
  return (
    <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} aria-hidden="true">
      <circle r={r} className="fill-surface-2 stroke-line" />
      <path d={d} className="fill-gold/80" />
    </svg>
  );
}

function ics(days: CalendarDay[], place: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const events = days.flatMap((d) => d.events.map((e, i) => {
    const day = d.date.replace(/-/g, "");
    const next = new Date(`${d.date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return [
      "BEGIN:VEVENT", `UID:${day}-${i}-${e.replace(/\s+/g, "")}@sadhak.ai`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`,
      `SUMMARY:${e}`, `DESCRIPTION:${e} at ${place} (Sadhak.ai vrat calendar)`, "END:VEVENT",
    ].join("\r\n");
  }));
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sadhak.ai//Vrat calendar//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

export function CalendarApp({ initialPlace }: { initialPlace: Place }) {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });
  const [place, setPlace] = useState<Place>(initialPlace);
  const [days, setDays] = useState<CalendarDay[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const saved = loadSavedPlace();
    if (saved) setPlace(saved);
  }, []);

  useEffect(() => {
    let live = true;
    setBusy(true);
    getCalendar(ym.y, ym.m, place).then((r) => {
      if (!live) return;
      setDays(r?.days ?? null);
      setBusy(false);
    }).catch(() => live && setBusy(false));
    return () => { live = false; };
  }, [ym, place]);

  const shift = (d: number) => setYm(({ y, m }) => {
    const n = new Date(y, m - 1 + d, 1);
    return { y: n.getFullYear(), m: n.getMonth() + 1 };
  });
  const monthName = new Date(ym.y, ym.m - 1, 1).toLocaleDateString(hi ? "hi-IN" : "en-GB", { month: "long", year: "numeric" });
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(hi ? "hi-IN" : "en-GB", { weekday: "short" }));
  const lead = days ? (new Date(`${days[0].date}T12:00:00`).getDay() + 6) % 7 : 0; // Monday first
  const todayIso = today.toLocaleDateString("en-CA");
  const observances = days?.filter((d) => d.events.length) ?? [];
  const sel = days?.find((d) => d.date === selected);

  const download = () => {
    if (!days) return;
    const blob = new Blob([ics(days, place.name)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sadhak-vrat-${ym.y}-${String(ym.m).padStart(2, "0")}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} aria-label={t("cal.prev")} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:border-gold/50"><ChevronLeft size={18} /></button>
          <h2 className="min-w-48 text-center font-serif text-3xl text-foreground">{monthName}</h2>
          <button type="button" onClick={() => shift(1)} aria-label={t("cal.next")} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:border-gold/50"><ChevronRight size={18} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="label-caps">{place.name}</span>
          <PlacePicker onChoose={setPlace} />
          <button type="button" onClick={download} disabled={!days} className="btn-ghost px-4 py-2 text-sm disabled:opacity-40">
            <CalendarPlus size={15} aria-hidden="true" /> {t("cal.download")}
          </button>
        </div>
      </div>

      <section className={`rounded-2xl border border-line bg-surface p-3 sm:p-6 ${busy ? "opacity-50" : ""}`} aria-busy={busy}>
        <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wider text-cosmic-500 sm:gap-2">
          {weekdays.map((w) => <div key={w} className="pb-2">{w}</div>)}
        </div>
        {!days ? (
          <p className="py-16 text-center text-cosmic-400">{t("cal.loading")}</p>
        ) : (
          <ol className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: lead }, (_, i) => <li key={`pad${i}`} aria-hidden="true" />)}
            {days.map((d) => {
              const isToday = d.date === todayIso;
              return (
                <li key={d.date}>
                  <button type="button" onClick={() => setSelected(d.date)} aria-pressed={selected === d.date}
                          className={`flex h-full min-h-16 w-full flex-col rounded-lg border p-1.5 text-left transition-colors sm:min-h-28 sm:p-2.5 ${
                            selected === d.date ? "border-gold bg-gold/10" : isToday ? "border-gold/50" : "border-line hover:border-gold/40"}`}>
                    <span className="flex items-center justify-between">
                      <span className={`font-serif text-lg lining-nums sm:text-xl ${isToday ? "text-gold" : "text-foreground"}`}>{Number(d.date.slice(8))}</span>
                      <Moon phase={d.phase} size={16} />
                    </span>
                    <span className="mt-0.5 hidden text-[0.68rem] text-cosmic-500 sm:block">{tithiName(d.tithi, lang)}</span>
                    <span className="mt-auto flex flex-col gap-0.5 pt-1">
                      {d.events.map((e) => (
                        <span key={e} className={`truncate rounded px-1 py-0.5 text-[0.6rem] leading-tight sm:text-[0.68rem] ${tone(e)}`}>
                          <span className="sm:hidden" aria-hidden="true">•</span>
                          <span className="hidden sm:inline">{eventName(e, lang)}</span>
                          <span className="sr-only sm:hidden">{eventName(e, lang)}</span>
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="month-list">
          <h2 id="month-list" className="font-serif text-2xl text-foreground">{t("cal.upcoming")}</h2>
          <ul className="mt-4 divide-y divide-line">
            {observances.map((d) => (
              <li key={d.date}>
                <button type="button" onClick={() => setSelected(d.date)} className="flex w-full items-center gap-4 py-3 text-left hover:text-gold">
                  <span className="w-20 shrink-0 text-sm tabular-nums text-cosmic-400">
                    {new Date(`${d.date}T12:00:00`).toLocaleDateString(hi ? "hi-IN" : "en-GB", { day: "numeric", month: "short", weekday: "short" })}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {d.events.map((e) => <span key={e} className={`rounded px-2 py-0.5 text-xs ${tone(e)}`}>{eventName(e, lang)}</span>)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          {sel ? (
            <>
              <p className="label-caps text-[0.68rem]">
                {new Date(`${sel.date}T12:00:00`).toLocaleDateString(hi ? "hi-IN" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <div className="mt-3 flex items-center gap-4">
                <Moon phase={sel.phase} size={44} />
                <div>
                  <p className="font-serif text-3xl text-foreground">{hi ? (sel.paksha === "Shukla" ? "शुक्ल" : "कृष्ण") : sel.paksha} {tithiName(sel.tithi, lang)}</p>
                  <p className="text-sm text-cosmic-400">{hi ? sel.nakshatra_hi : sel.nakshatra}</p>
                </div>
              </div>
              {sel.events.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {sel.events.map((e) => <li key={e} className={`rounded px-2.5 py-1 text-sm ${tone(e)}`}>{eventName(e, lang)}</li>)}
                </ul>
              )}
              <Link
                href={`/chat?q=${encodeURIComponent(hi
                  ? `${sel.date} को ${sel.events.length ? sel.events.map((e) => eventName(e, lang)).join(", ") : tithiName(sel.tithi, lang)} है। इस दिन कौन सी साधना करें और कैसे?`
                  : `On ${sel.date} it is ${sel.events.length ? sel.events.join(", ") : `${sel.paksha} ${tithiName(sel.tithi, lang)}`}. Which sadhana should I do that day, and how?`)}`}
                className="btn-gold mt-6"
              >
                <MessageCircle size={16} aria-hidden="true" /> {t("nav.cta")}
              </Link>
            </>
          ) : (
            <p className="text-cosmic-400">{t("cal.lead")}</p>
          )}
        </section>
      </div>
      <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-cosmic-500">{t("cal.method")}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { getPanchang, searchPlaces, type Panchang, type Place } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { todayReading } from "@/lib/today";

const PLACE_KEY = "sadhak_today_place";

function loadPlace(): Place | null {
  try {
    const raw = localStorage.getItem(PLACE_KEY);
    return raw ? (JSON.parse(raw) as Place) : null;
  } catch {
    return null;
  }
}

/**
 * Today's panchang at the visitor's city and the practice tied to the day.
 * Server-rendered for Jodhpur so it reads without script; the city can be changed.
 */
export function TodayPractice({ initialPlace, initialPanchang }: { initialPlace: Place; initialPanchang: Panchang | null }) {
  const { lang, t } = useLanguage();
  const [place, setPlace] = useState<Place>(initialPlace);
  const [panchang, setPanchang] = useState<Panchang | null>(initialPanchang);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) video.current?.pause();
  }, []);

  const choose = async (p: Place) => {
    setPlace(p);
    setQuery("");
    setSuggestions([]);
    setPicking(false);
    try {
      localStorage.setItem(PLACE_KEY, JSON.stringify(p));
    } catch {
      /* remembered only if storage is available */
    }
    const next = await getPanchang(p).catch(() => null);
    if (next) setPanchang(next);
  };

  useEffect(() => {
    const saved = loadPlace();
    if (saved && saved.name !== initialPlace.name) choose(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearTimeout(debounce.current);
    if (query.trim().length < 2) return setSuggestions([]);
    debounce.current = setTimeout(() => {
      searchPlaces(query.trim(), 6).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [query]);

  if (!panchang) return null;
  const reading = todayReading(panchang, lang);
  const hi = lang === "hi";
  const date = new Date(panchang.date).toLocaleDateString(hi ? "hi-IN" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const facts: [string, string][] = [
    [t("kundli.tithi"), hi
      ? `${panchang.tithi.paksha === "Shukla" ? "शुक्ल" : "कृष्ण"} ${reading.tithi}`
      : `${panchang.tithi.paksha} ${panchang.tithi.name}`],
    [t("kundli.todayNakshatra"), hi ? panchang.nakshatra.name_hi ?? panchang.nakshatra.name : panchang.nakshatra.name],
    [t("kundli.yoga"), panchang.yoga.name],
    [t("kundli.karana"), panchang.karana.name],
  ];

  return (
    <section id="today" className="scroll-mt-20 px-4 py-20 sm:py-28" aria-labelledby="today-title">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <figure className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-line lg:max-w-none">
          {/* The evening lamp: a muted loop of the Ganga aarti, still for visitors who ask for reduced motion. */}
          <video
            ref={video}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            poster="/images/ganga-aarti-poster.jpg"
            aria-label="Ganga aarti at Haridwar at dusk"
            className="aspect-[4/5] w-full object-cover"
          >
            <source src="/videos/ganga-aarti-haridwar.webm" type="video/webm" />
          </video>
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-12 text-sm text-white/85">
            Ganga aarti, Haridwar
          </figcaption>
        </figure>

        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="label-caps">
              {t("v4.todayIn")} {place.name}
            </p>
            <button
              type="button"
              onClick={() => setPicking((v) => !v)}
              aria-expanded={picking}
              aria-controls="today-place-picker"
              className="inline-flex items-center gap-1.5 text-sm text-cosmic-400 underline-offset-4 hover:text-gold hover:underline"
            >
              <MapPin size={14} aria-hidden="true" /> {t("v4.changePlace")}
            </button>
          </div>

          {picking && (
            <div id="today-place-picker" className="relative mt-3 max-w-sm">
              <label htmlFor="today-place" className="sr-only">{t("v4.changePlace")}</label>
              <input
                id="today-place"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("v4.placeHint")}
                autoComplete="off"
                className="w-full rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm text-foreground placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none"
              />
              {suggestions.length > 0 && (
                <ul role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-surface shadow-cosmic">
                  {suggestions.map((p) => (
                    <li key={`${p.name}-${p.latitude}-${p.longitude}`} role="option" aria-selected={false}>
                      <button
                        type="button"
                        onClick={() => choose(p)}
                        className="w-full px-4 py-2.5 text-left text-sm text-cosmic-200 hover:bg-gold/10"
                      >
                        {[p.name, p.region, p.country].filter(Boolean).join(", ")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <h2 id="today-title" className="mt-4 text-4xl leading-tight sm:text-5xl">
            {t("v4.todayTitle")} <em className="text-gold">{t("v4.todayAccent")}</em>
          </h2>
          <p className="mt-3 text-cosmic-400">{date}</p>

          <div className="mt-8 flex items-center gap-6 border-y border-line py-6">
            <span className="font-serif text-7xl leading-none lining-nums text-gold sm:text-8xl">{reading.day}</span>
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wider text-cosmic-500">{label}</dt>
                  <dd className="mt-0.5 text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-cosmic-200">{reading.paragraph}</p>
          <Link href={`/chat?q=${encodeURIComponent(reading.question)}`} className="btn-gold mt-8">
            {t("v4.askHow")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

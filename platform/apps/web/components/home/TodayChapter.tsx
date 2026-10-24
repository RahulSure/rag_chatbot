"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getPanchang, searchPlaces, type Panchang, type Place } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { todayReading } from "@/lib/today";
import s from "./home.module.css";

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
 * The live thing: today's panchang at the visitor's place and the practice
 * traditionally tied to the day. Server-rendered for Jodhpur, so it reads fine
 * without script; the visitor can change the place.
 */
export function TodayChapter({ initialPlace, initialPanchang }: { initialPlace: Place; initialPanchang: Panchang | null }) {
  const { lang, t } = useLanguage();
  const [place, setPlace] = useState<Place>(initialPlace);
  const [panchang, setPanchang] = useState<Panchang | null>(initialPanchang);
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

  const reading = panchang ? todayReading(panchang, lang) : null;
  const placeName = place.name;
  const sloganLine2 = lang === "hi" ? `${placeName} में` : placeName;

  return (
    <section aria-labelledby="today-heading">
      <div className={s.board}>
        <div className={s.tileA}>
          <h2 id="today-heading" className={`${s.slogan} ${s.display} ${s.rise}`}
              style={{ "--chars": Math.max(8, sloganLine2.length) } as React.CSSProperties}>
            {t("v3.todayLine1")}
            <br />
            {sloganLine2}
          </h2>
        </div>
        <div className={s.tileB}>
          {reading && (
            <>
              <span className={`${s.figure} ${s.display}`}>{reading.day}</span>
              <span className={s.figureLabel}>{reading.tithi}</span>
            </>
          )}
        </div>
        <div className={s.tileC}>
          {/* The evening lamp: a muted loop of the Ganga aarti, still for visitors who ask for reduced motion. */}
          <video ref={video} muted loop playsInline autoPlay preload="metadata" poster="/images/akash-deep.jpg"
                 aria-label="Ganga aarti at Haridwar at dusk">
            <source src="/videos/ganga-aarti-haridwar.webm" type="video/webm" />
          </video>
        </div>
      </div>

      <div className={s.todayText}>
        <div className={`${s.todayControls} ${s.rise}`} style={{ "--i": 1 } as React.CSSProperties}>
          <div className={s.placeField}>
            <label htmlFor="today-place" className="sr-only">{t("v3.changePlace")}</label>
            <input
              id="today-place"
              className={s.placeInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`${t("v3.changePlace")}: ${t("v3.placeHint")}`}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className={s.placeList} role="listbox">
                {suggestions.map((p) => (
                  <li key={`${p.name}-${p.latitude}`} role="option" aria-selected={false}>
                    <button type="button" onClick={() => choose(p)}>
                      {[p.name, p.region, p.country].filter(Boolean).join(", ")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {reading && (
            <Link href={`/chat?q=${encodeURIComponent(reading.question)}`} className={s.button}>
              {t("v3.askHow")}
            </Link>
          )}
        </div>
        <p className={`${s.todayParagraph} ${s.rise}`} style={{ "--i": 2 } as React.CSSProperties}>
          {reading?.paragraph ?? ""}
        </p>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { searchPlaces, type Place } from "@/lib/api";
import { useT } from "@/lib/i18n";

// One remembered city for every "today" view (home panchang, muhurat …).
const PLACE_KEY = "sadhak_today_place";

export function loadSavedPlace(): Place | null {
  try {
    const raw = localStorage.getItem(PLACE_KEY);
    return raw ? (JSON.parse(raw) as Place) : null;
  } catch {
    return null;
  }
}

function savePlace(p: Place) {
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify(p));
  } catch {
    /* remembered only if storage is available */
  }
}

/** "Change city" link that opens a search field with suggestions. */
export function PlacePicker({ onChoose }: { onChoose: (p: Place) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (query.trim().length < 2) return setSuggestions([]);
    debounce.current = setTimeout(() => {
      searchPlaces(query.trim(), 6).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [query]);

  const choose = (p: Place) => {
    savePlace(p);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onChoose(p);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm text-cosmic-400 underline-offset-4 hover:text-gold hover:underline"
      >
        <MapPin size={14} aria-hidden="true" /> {t("v4.changePlace")}
      </button>
      {open && (
        <div className="relative mt-3 w-full max-w-sm basis-full">
          <label htmlFor="place-picker" className="sr-only">{t("v4.changePlace")}</label>
          <input
            id="place-picker"
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
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { searchPlaces, type BirthDetails, type Place } from "@/lib/api";
import { useT } from "@/lib/i18n";

const inputClass =
  "w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-base text-foreground " +
  "placeholder:text-cosmic-500 transition-colors focus:border-gold/60 focus:outline-none";
const labelClass = "label-caps mb-2 block !text-[0.7rem]";

function placeLabel(p: Place) {
  return [p.name, p.region, p.country].filter(Boolean).join(", ");
}

export function BirthForm({
  initial,
  busy,
  onSubmit,
}: {
  initial?: BirthDetails | null;
  busy: boolean;
  onSubmit: (details: BirthDetails) => void;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [timeUnknown, setTimeUnknown] = useState(initial?.timeUnknown ?? false);
  const [place, setPlace] = useState<Place | null>(initial?.place ?? null);
  const [query, setQuery] = useState(initial?.place ? placeLabel(initial.place) : "");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [error, setError] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Suggest birthplaces as the user types (debounced); a chosen place clears the list.
  useEffect(() => {
    clearTimeout(debounce.current);
    if (place && query === placeLabel(place)) return setSuggestions([]);
    if (query.trim().length < 2) return setSuggestions([]);
    debounce.current = setTimeout(() => {
      searchPlaces(query.trim()).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [query, place]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return setError(t("kundli.pickPlace"));
    setError("");
    onSubmit({ name: name.trim() || undefined, date, time: timeUnknown ? "12:00" : time, timeUnknown, place });
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-cosmic sm:p-8">
      <div>
        <label htmlFor="birth-name" className={labelClass}>{t("kundli.name")}</label>
        <input id="birth-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="birth-date" className={labelClass}>{t("kundli.date")}</label>
          <input id="birth-date" type="date" required value={date} max={new Date().toISOString().slice(0, 10)}
                 onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="birth-time" className={labelClass}>{t("kundli.time")}</label>
          <input id="birth-time" type="time" required={!timeUnknown} disabled={timeUnknown} value={timeUnknown ? "" : time}
                 onChange={(e) => setTime(e.target.value)} className={`${inputClass} disabled:opacity-50`} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-cosmic-400">
        <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)}
               className="h-4 w-4 accent-[rgb(var(--accent))]" />
        {t("kundli.timeUnknown")}
      </label>

      <div className="relative">
        <label htmlFor="birth-place" className={labelClass}>{t("kundli.place")}</label>
        <input
          id="birth-place"
          autoComplete="off"
          value={query}
          placeholder={t("kundli.placeHint")}
          onChange={(e) => {
            setQuery(e.target.value);
            setPlace(null);
          }}
          className={inputClass}
          aria-autocomplete="list"
          aria-controls="birth-place-list"
        />
        {suggestions.length > 0 && (
          <ul id="birth-place-list" role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-surface shadow-cosmic">
            {suggestions.map((p) => (
              <li key={`${p.name}-${p.latitude}-${p.longitude}`} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => {
                    setPlace(p);
                    setQuery(placeLabel(p));
                    setSuggestions([]);
                    setError("");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-cosmic-200 hover:bg-gold/10"
                >
                  <MapPin size={12} className="flex-shrink-0 text-gold" aria-hidden="true" />
                  {placeLabel(p)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}

      <button type="submit" disabled={busy} className="btn-gold w-full py-3.5 text-base disabled:opacity-50">
        {busy ? t("kundli.calculating") : t("kundli.submit")}
      </button>
      <p className="text-center text-xs text-cosmic-500">{t("kundli.privacy")}</p>
    </form>
  );
}

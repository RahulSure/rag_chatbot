"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gangaApi, type GangaProfile } from "@/lib/api";
import { loadBirth } from "@/lib/birth";
import { useLanguage, type Key } from "@/lib/i18n";
import { ErrorNote, PRACTICES, codeOf } from "./shared";

const chip = (on: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? "border-gold bg-gold text-background" : "border-line text-cosmic-300 hover:border-gold/50"}`;

/** First visit (or Edit): pen name, languages, path, an opt-in kundli match, and the river's two promises. */
export function JoinForm({ current, onSaved, onCancel }: {
  current: GangaProfile | null;
  onSaved: (p: GangaProfile) => void;
  onCancel?: () => void;
}) {
  const { lang, t } = useLanguage();
  const [name, setName] = useState(current?.name ?? "");
  const [languages, setLanguages] = useState<("en" | "hi")[]>(current?.languages ?? [lang]);
  const [practices, setPractices] = useState<string[]>(current?.practices ?? []);
  const [hasBirth, setHasBirth] = useState(false);
  const [byKundli, setByKundli] = useState(current?.by_kundli ?? false);
  const [adult, setAdult] = useState(!!current);
  const [rules, setRules] = useState(!!current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const birth = loadBirth();
    setHasBirth(!!birth);
    if (birth && !current) setByKundli(true);
  }, [current]);

  const toggle = <T,>(list: T[], v: T, max = 99) =>
    list.includes(v) ? list.filter((x) => x !== v) : list.length < max ? [...list, v] : list;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const birth = byKundli ? loadBirth() : null;
    try {
      const { profile } = await gangaApi.join({
        name, languages, practices, adult, accept_rules: rules,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
        birth: birth && {
          date: birth.date, time: birth.timeUnknown ? "12:00" : birth.time,
          latitude: birth.place.latitude, longitude: birth.place.longitude, tz: birth.place.tz,
        },
      });
      onSaved(profile);
    } catch (err) {
      setError(codeOf(err) === "422" ? "name" : codeOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="font-serif text-3xl">{t("ganga.joinTitle")}</h2>
      <p className="mt-2 leading-relaxed text-cosmic-300">{t("ganga.joinLead")}</p>

      <label htmlFor="ganga-name" className="label-caps mt-7 block text-[0.7rem]">{t("ganga.penName")}</label>
      <input id="ganga-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={24}
             autoComplete="off" aria-describedby="ganga-name-hint"
             className="mt-2 w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-base text-foreground placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none" />
      <p id="ganga-name-hint" className="mt-1.5 text-sm text-cosmic-500">{t("ganga.penNameHint")}</p>

      <fieldset className="mt-6">
        <legend className="label-caps text-[0.7rem]">{t("ganga.languages")}</legend>
        <div className="mt-2 flex gap-2">
          {(["en", "hi"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={languages.includes(l)} className={chip(languages.includes(l))}
                    onClick={() => setLanguages((cur) => (cur.length === 1 && cur[0] === l ? cur : toggle(cur, l)))}>
              {l === "en" ? "English" : "हिंदी"}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label-caps text-[0.7rem]">{t("ganga.practices")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRACTICES.map((p) => (
            <button key={p} type="button" aria-pressed={practices.includes(p)} className={chip(practices.includes(p))}
                    onClick={() => setPractices((cur) => toggle(cur, p, 6))}>
              {t(`ganga.p.${p}` as Key)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 rounded-xl border border-line bg-surface-2 p-4">
        {hasBirth ? (
          <label className="flex gap-3">
            <input type="checkbox" checked={byKundli} onChange={(e) => setByKundli(e.target.checked)} className="mt-1 h-4 w-4 accent-[rgb(var(--accent))]" />
            <span>
              <span className="text-foreground">{t("ganga.kundli")}</span>
              <span className="mt-1 block text-sm leading-relaxed text-cosmic-400">{t("ganga.kundliHint")}</span>
            </span>
          </label>
        ) : (
          <p className="text-sm leading-relaxed text-cosmic-300">
            {t("ganga.kundliNone")}{" "}
            <Link href="/kundli" className="text-gold underline-offset-4 hover:underline">{t("ganga.kundliOpen")}</Link>
          </p>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <label className="flex gap-3">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} required className="mt-1 h-4 w-4 accent-[rgb(var(--accent))]" />
          <span className="text-cosmic-200">{t("ganga.adult")}</span>
        </label>
        <label className="flex gap-3">
          <input type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} required className="mt-1 h-4 w-4 accent-[rgb(var(--accent))]" />
          <span className="leading-relaxed text-cosmic-200">{t("ganga.rules")}</span>
        </label>
      </div>

      <div className="mt-5"><ErrorNote code={error} /></div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="btn-gold disabled:opacity-60">
          {busy ? t("ganga.saving") : current ? t("ganga.saveProfile") : t("ganga.join")}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost">{t("ganga.cancel")}</button>}
      </div>
    </form>
  );
}

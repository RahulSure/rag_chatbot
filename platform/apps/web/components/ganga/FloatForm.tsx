"use client";

import { useState } from "react";
import { gangaApi, type DiyaKind } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ErrorNote, KINDS, codeOf, keyOf } from "./shared";

const MAX = 600;

export function FloatForm({ onFloated }: { onFloated: () => void }) {
  const { t } = useLanguage();
  const [kind, setKind] = useState<DiyaKind>("seeking");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await gangaApi.float(kind, text);
      setText("");
      setDone(true);
      onFloated();
    } catch (err) {
      setError(codeOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <h2 className="font-serif text-2xl sm:text-3xl">{t("ganga.floatTitle")}</h2>

      <fieldset className="mt-5">
        <legend className="label-caps text-[0.7rem]">{t("ganga.floatKind")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <label key={k} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${kind === k ? "border-gold bg-gold text-background" : "border-line text-cosmic-300 hover:border-gold/50"}`}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {t(keyOf("ganga.k.", k, "ganga.k.sharing"))}
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor="diya-text" className="sr-only">{t("ganga.floatTitle")}</label>
      <textarea id="diya-text" value={text} onChange={(e) => { setText(e.target.value); setDone(false); }}
                rows={7} maxLength={MAX} required placeholder={t("ganga.floatPlaceholder")} aria-describedby="diya-hint"
                className="mt-5 w-full resize-y rounded-lg border border-line bg-surface-2 px-4 py-3 font-serif text-lg leading-relaxed text-foreground placeholder:font-sans placeholder:text-base placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none" />
      <div className="mt-1.5 flex justify-between gap-4 text-sm text-cosmic-500">
        <p id="diya-hint">{t("ganga.floatHint")}</p>
        <span className={`shrink-0 lining-nums ${text.trim().length < 20 ? "" : "text-gold"}`}>{text.length} / {MAX}</span>
      </div>

      <div className="mt-4 space-y-3">
        <ErrorNote code={error} />
        {done && <p role="status" className="text-gold">{t("ganga.floated")}</p>}
      </div>

      <button type="submit" disabled={busy || !text.trim()} className="btn-gold mt-5 disabled:opacity-60">
        <span aria-hidden="true">🪔</span> {busy ? t("ganga.floating") : t("ganga.float")}
      </button>
    </form>
  );
}

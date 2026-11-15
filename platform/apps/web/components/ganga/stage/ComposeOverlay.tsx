"use client";

/**
 * Writing a diya on the ghat. "Light the diya" closes the card and sets the lit
 * lamp on the steps; the stage then lets the writer drag it onto the water.
 * Moderation refusals from the river reopen this card with the reason.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { DiyaKind } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ErrorNote, KINDS, keyOf } from "../shared";

const MAX = 600;

export function ComposeOverlay({ initial, error, onLight, onClose }: {
  initial: { kind: DiyaKind; text: string } | null;
  error: string | null;
  onLight: (kind: DiyaKind, text: string) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [kind, setKind] = useState<DiyaKind>(initial?.kind ?? "seeking");
  const [text, setText] = useState(initial?.text ?? "");
  const [shortErr, setShortErr] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 20) {
      setShortErr(true);
      return;
    }
    onLight(kind, text);
  }

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.form
        role="dialog" aria-modal="true" aria-label={t("ganga.floatTitle")}
        onSubmit={submit}
        className="relative w-full max-w-xl rounded-2xl border border-gold/30 bg-surface shadow-cosmic"
        initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <button type="button" onClick={onClose} aria-label={t("ganga.stage.close")}
                className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-cosmic-400 hover:text-foreground">
          <X size={18} />
        </button>
        <div className="max-h-[78dvh] overflow-y-auto p-5 sm:p-7">
          <h2 className="font-serif text-2xl sm:text-3xl">{t("ganga.floatTitle")}</h2>

          <fieldset className="mt-4">
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

          <label htmlFor="stage-diya-text" className="sr-only">{t("ganga.floatTitle")}</label>
          <textarea id="stage-diya-text" value={text} autoFocus
                    onChange={(e) => { setText(e.target.value); setShortErr(false); }}
                    rows={6} maxLength={MAX} required placeholder={t("ganga.floatPlaceholder")} aria-describedby="stage-diya-hint"
                    className="mt-4 w-full resize-y rounded-lg border border-line bg-surface-2 px-4 py-3 font-serif text-lg leading-relaxed text-foreground placeholder:font-sans placeholder:text-base placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none" />
          <div className="mt-1.5 flex justify-between gap-4 text-sm text-cosmic-500">
            <p id="stage-diya-hint">{t("ganga.floatHint")}</p>
            <span className={`shrink-0 lining-nums ${text.trim().length < 20 ? "" : "text-gold"}`}>{text.length} / {MAX}</span>
          </div>

          {(error || shortErr) && <div className="mt-3"><ErrorNote code={shortErr ? "too_short" : error} /></div>}

          <button type="submit" className="btn-gold mt-5">
            <span aria-hidden="true">🪔</span> {t("ganga.stage.light")}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

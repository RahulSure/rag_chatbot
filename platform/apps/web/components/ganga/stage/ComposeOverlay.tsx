"use client";

/**
 * Writing a diya: a sheet of ruled paper over the river. "Light the diya" folds
 * the sheet down into a strip; the stage then rolls it into a tied scroll that
 * arcs into the dona waiting on the ghat. Moderation refusals from the river
 * reopen this sheet with the words still on it and the reason beneath.
 */

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { DiyaKind } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ErrorNote, KINDS, keyOf } from "../shared";

const MAX = 600;

export interface SheetEdge { x: number; y: number; w: number }

export function ComposeOverlay({ initial, error, stageRef, onLight, onClose }: {
  initial: { kind: DiyaKind; text: string } | null;
  error: string | null;
  stageRef: React.RefObject<HTMLDivElement | null>;
  /** The sheet has folded; `edge` is its bottom edge in stage pixels, where the scroll forms. */
  onLight: (kind: DiyaKind, text: string, edge: SheetEdge | null) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const still = useReducedMotion() ?? false;
  const [kind, setKind] = useState<DiyaKind>(initial?.kind ?? "seeking");
  const [text, setText] = useState(initial?.text ?? "");
  const [shortErr, setShortErr] = useState(false);
  const [folding, setFolding] = useState(false);
  const [sheet, setSheet] = useState<HTMLFormElement | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 20) {
      setShortErr(true);
      return;
    }
    if (still) return finish();
    setFolding(true);
  }

  function finish() {
    const stage = stageRef.current?.getBoundingClientRect();
    const r = sheet?.getBoundingClientRect();
    onLight(kind, text, stage && r ? { x: r.left - stage.left, y: r.bottom - stage.top, w: r.width } : null);
  }

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-end justify-center p-3 sm:items-center sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
      style={{ background: folding ? "transparent" : "rgb(0 0 0 / 0.45)", transition: "background 0.4s" }}
      onClick={(e) => !folding && e.target === e.currentTarget && onClose()}
    >
      <motion.form
        ref={setSheet}
        role="dialog" aria-modal="true" aria-label={t("ganga.floatTitle")}
        onSubmit={submit}
        className="ganga-chit relative w-full max-w-xl"
        initial={{ y: 70, opacity: 0, scaleY: 1 }}
        animate={folding ? { y: 0, opacity: 1, scaleY: 0.04 } : { y: 0, opacity: 1, scaleY: 1 }}
        transition={folding ? { scaleY: { duration: 0.55, ease: "easeIn" } } : { type: "spring", stiffness: 260, damping: 26 }}
        onAnimationComplete={() => folding && finish()}
        style={{ transformOrigin: folding ? "bottom center" : "center" }}
      >
        <span aria-hidden="true" className={`ganga-kalava transition-opacity ${folding ? "opacity-0" : ""}`} />
        <div className={`max-h-[80dvh] overflow-y-auto px-5 pb-5 pt-7 transition-opacity duration-150 sm:px-8 sm:pb-7 sm:pt-8 ${folding ? "opacity-0 delay-[380ms]" : ""}`}>
          <button type="button" onClick={onClose} aria-label={t("ganga.stage.close")}
                  className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-cosmic-500 hover:text-foreground">
            <X size={18} />
          </button>
          <h2 className="ganga-ink text-3xl sm:text-4xl">{t("ganga.floatTitle")}</h2>

          <fieldset className="mt-4">
            <legend className="label-caps text-[0.68rem]">{t("ganga.floatKind")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <label key={k} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${kind === k ? "border-[#8f2a1c] bg-[#8f2a1c] text-[#fbf3df]" : "border-line text-cosmic-300 hover:border-gold/60"}`}>
                  <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                  {t(keyOf("ganga.k.", k, "ganga.k.sharing"))}
                </label>
              ))}
            </div>
          </fieldset>

          <label htmlFor="stage-diya-text" className="sr-only">{t("ganga.floatTitle")}</label>
          <textarea id="stage-diya-text" value={text} autoFocus
                    onChange={(e) => { setText(e.target.value); setShortErr(false); }}
                    rows={7} maxLength={MAX} required placeholder={t("ganga.floatPlaceholder")} aria-describedby="stage-diya-hint"
                    className="ganga-ink ganga-ruled mt-5 w-full resize-none bg-transparent px-1 text-xl placeholder:font-sans placeholder:text-base placeholder:not-italic placeholder:text-cosmic-500 focus:outline-none" />
          <div className="mt-2 flex justify-between gap-4 text-sm text-cosmic-500">
            <p id="stage-diya-hint">{t("ganga.floatHint")}</p>
            <span className={`shrink-0 lining-nums ${text.trim().length < 20 ? "" : "text-gold"}`}>{text.length} / {MAX}</span>
          </div>

          {(error || shortErr) && <div className="mt-3"><ErrorNote code={shortErr ? "too_short" : error} /></div>}

          <button type="submit" disabled={folding} className="btn-chit btn-chit-primary mt-5 px-6 py-2.5">
            <span aria-hidden="true">🪔</span> {t("ganga.stage.light")}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

"use client";

/**
 * A diya lifted from the water. The message rests on a card above the river:
 * reply opens a letter, blessing bursts into marigold petals, a sideways swipe
 * (or the button) lets it float on, report is quiet in the corner.
 */

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flag, HandHeart, MailOpen, Send, Waves, X } from "lucide-react";
import { gangaApi, type CaughtDiya } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ErrorNote, ReportPicker, ago, codeOf, keyOf } from "../shared";
import { DiyaSprite } from "./DiyaSprite";
import { MaitriDial, reasonText } from "./maitri";
import { Petals } from "./Petals";

export function DiyaOverlay({ diya, onChange, onClose, onOpenThread }: {
  diya: CaughtDiya;
  onChange: (d: CaughtDiya) => void;
  onClose: () => void;
  onOpenThread: (id: string) => void;
}) {
  const { lang, t } = useLanguage();
  const still = useReducedMotion() ?? false;
  const [mode, setMode] = useState<"idle" | "reply" | "report">("idle");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blessing, setBlessing] = useState(false);
  const [leaving, setLeaving] = useState<"pass" | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = (next: Partial<CaughtDiya>, after = 0) => {
    onChange({ ...diya, ...next });
    if (after && !still) closeTimer.current = setTimeout(onClose, after);
    else onClose();
  };

  async function act(run: () => Promise<Partial<CaughtDiya>>, before?: () => void, after = 0) {
    setBusy(true);
    setError(null);
    try {
      const next = await run();
      before?.();
      done(next, after);
    } catch (e) {
      setError(codeOf(e));
      setBusy(false);
      setLeaving(null);
    }
  }

  const bless = () =>
    act(async () => { await gangaApi.bless(diya.id); return { action: "blessed" }; },
        () => { setBlessing(true); try { navigator.vibrate?.(20); } catch { /* no haptics */ } }, 1200);
  const pass = () =>
    act(async () => { await gangaApi.pass(diya.id); return { action: "passed" }; }, () => setLeaving("pass"), 500);

  const m = diya.maitri;
  const open = !diya.action || mode !== "idle";

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog" aria-modal="true" aria-label={t("ganga.tabRiver")}
        className="relative w-full max-w-xl cursor-grab rounded-2xl border border-gold/30 bg-surface shadow-cosmic active:cursor-grabbing"
        initial={still ? { opacity: 0 } : { y: 90, opacity: 0, rotate: -1.5 }}
        animate={leaving === "pass" ? { x: 480, rotate: 14, opacity: 0 } : { y: 0, x: 0, opacity: 1, rotate: 0 }}
        exit={still ? { opacity: 0 } : { y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        drag={!still && !busy && open ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 140 || Math.abs(info.velocity.x) > 600) pass();
        }}
      >
        {/* the diya itself sits on the card's rim */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            <DiyaSprite size={116} seed={1} chit={false} />
            {blessing && <Petals />}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label={t("ganga.stage.close")}
                className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-cosmic-400 hover:text-foreground">
          <X size={18} />
        </button>

        <div className="max-h-[72dvh] overflow-y-auto p-5 pt-10 sm:p-7 sm:pt-11">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="label-caps text-[0.68rem]">{t(keyOf("ganga.k.", diya.kind, "ganga.k.sharing"))}</p>
              <p className="mt-1 text-sm text-cosmic-400">
                {t("ganga.from")} <span className="text-foreground">{diya.from}</span> · {ago(diya.created_at, lang)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-xs uppercase tracking-widest text-gold">{t("ganga.maitri")}</p>
                <p className="text-xs text-cosmic-500">{m.by_kundli ? t("ganga.byKundli") : t("ganga.byPath")}</p>
              </div>
              <MaitriDial score={m.score} />
            </div>
          </div>

          <p lang={diya.lang} className="mt-4 whitespace-pre-line font-serif text-xl leading-relaxed text-foreground sm:text-[1.35rem]">
            {diya.text}
          </p>

          {m.reasons.length > 0 && (
            <ul className="mt-4 space-y-1 border-t border-line pt-3 text-sm text-cosmic-300">
              {m.reasons.map((r, i) => (
                <li key={i} className="flex gap-2"><span className="text-gold" aria-hidden="true">✦</span>{reasonText(r, t, lang)}</li>
              ))}
            </ul>
          )}

          <div className="mt-5">
            {diya.action === "replied" && diya.thread ? (
              <p className="flex flex-wrap items-center gap-3 text-sm text-cosmic-300">
                {t("ganga.replied")}
                <button type="button" onClick={() => onOpenThread(diya.thread!)} className="inline-flex items-center gap-1.5 text-gold hover:underline">
                  <MailOpen size={15} aria-hidden="true" /> {t("ganga.openLetters")}
                </button>
              </p>
            ) : diya.action ? (
              <p className="text-sm text-cosmic-300">
                {t(diya.action === "blessed" ? "ganga.blessed" : diya.action === "passed" ? "ganga.passed" : "ganga.reported")}
              </p>
            ) : mode === "reply" ? (
              <form onSubmit={(e) => { e.preventDefault(); act(async () => ({ action: "replied", thread: (await gangaApi.reply(diya.id, text)).thread })); }}>
                <label htmlFor="stage-reply" className="sr-only">{t("ganga.reply")}</label>
                <textarea id="stage-reply" value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1000} required autoFocus
                          placeholder={t("ganga.replyPlaceholder")}
                          className="w-full resize-y rounded-lg border border-line bg-surface-2 px-4 py-3 text-base text-foreground placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none" />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button type="submit" disabled={busy || !text.trim()} className="btn-gold px-5 py-2 text-sm disabled:opacity-60">
                    <Send size={15} aria-hidden="true" /> {t("ganga.send")}
                  </button>
                  <button type="button" onClick={() => setMode("idle")} className="btn-ghost px-5 py-2 text-sm">{t("ganga.cancel")}</button>
                  <span className="ml-auto text-xs text-cosmic-500 lining-nums">{text.length} / 1000</span>
                </div>
              </form>
            ) : mode === "report" ? (
              <ReportPicker onCancel={() => setMode("idle")}
                            onPick={(reason) => act(async () => { await gangaApi.reportDiya(diya.id, reason); return { action: "reported" }; })} />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setMode("reply")} className="btn-gold px-5 py-2 text-sm">
                    <Send size={15} aria-hidden="true" /> {t("ganga.reply")}
                  </button>
                  <button type="button" disabled={busy} onClick={bless} className="btn-ghost px-4 py-2 text-sm">
                    <HandHeart size={15} aria-hidden="true" /> {t("ganga.bless")}
                  </button>
                  <button type="button" disabled={busy} onClick={pass} className="px-3 py-2 text-sm text-cosmic-300 hover:text-foreground">
                    <Waves size={15} aria-hidden="true" className="mr-1 inline" /> {t("ganga.pass")}
                  </button>
                  <button type="button" onClick={() => setMode("report")} className="ml-auto inline-flex items-center gap-1 px-2 py-2 text-sm text-cosmic-500 hover:text-foreground">
                    <Flag size={14} aria-hidden="true" /> {t("ganga.report")}
                  </button>
                </div>
                {!still && <p className="mt-3 text-center text-xs text-cosmic-500">{t("ganga.stage.swipeHint")}</p>}
              </>
            )}
            <AnimatePresence>{error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3"><ErrorNote code={error} /></motion.div>}</AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

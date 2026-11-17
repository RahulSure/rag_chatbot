"use client";

/**
 * The river's game loop, one diya at a time — the way a bottle washes ashore.
 *
 * A diya comes down the river and rests in the shallows in front of you.
 * Touch it and it lifts out of the water into your hand; the message unfurls
 * beneath it. Hold the bless lamp to charge a blessing (petals burst and it
 * floats on), flick the diya back into the river to pass it on (it flies with
 * your gesture, lands in a splash and drifts away), or write back. Then the
 * next one arrives. Buttons cover every gesture for keyboards and still hands.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flag, HandHeart, Send, Waves, X } from "lucide-react";
import { gangaApi, type CaughtDiya } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ErrorNote, ReportPicker, ago, codeOf, fill, keyOf } from "../shared";
import { sfx } from "./ambience";
import { LampOnWater } from "./LampOnWater";
import { MaitriDial, reasonText } from "./maitri";
import { Petals } from "./Petals";
import { Splash } from "./Splash";

type Phase = "empty" | "waiting" | "arriving" | "resting" | "lifted" | "blessing" | "thrown" | "leaving";

const REST = { left: "40%", top: "62%" };
const LIFT = { left: "50%", top: "33%" };
const DONA = 144; // px width of the dona at rest

const buzz = (ms: number) => { try { navigator.vibrate?.(ms); } catch { /* no haptics */ } };

export function RiverFlow({ queue, holdsMore, onAct, onToast, onOpenChange, stageRef }: {
  queue: CaughtDiya[];
  holdsMore: number;
  onAct: (d: CaughtDiya) => void;
  onToast: (msg: string) => void;
  onOpenChange: (open: boolean) => void;
  stageRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { lang, t } = useLanguage();
  const still = useReducedMotion() ?? false;
  const [active, setActive] = useState<CaughtDiya | null>(null);
  const [phase, setPhase] = useState<Phase>("empty");
  const [mode, setMode] = useState<"read" | "reply" | "report">("read");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [throwTo, setThrowTo] = useState<{ x: number; y: number; midY: number } | null>(null);
  const [splash, setSplash] = useState<{ left: string; top: string; key: number } | null>(null);
  const [result, setResult] = useState<CaughtDiya | null>(null); // committed when the lamp has left
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lampRef = useRef<HTMLDivElement>(null);

  // The next diya sets out a moment after the river is clear.
  useEffect(() => {
    if (active || queue.length === 0) return;
    const timer = setTimeout(() => {
      setActive(queue[0]);
      setMode("read");
      setText("");
      setError(null);
      setResult(null);
      setThrowTo(null);
      setPhase(still ? "resting" : "arriving");
    }, phase === "empty" ? 700 : 1600);
    return () => clearTimeout(timer);
  }, [active, queue, still, phase]);

  const splashHere = useCallback(() => {
    const stage = stageRef.current?.getBoundingClientRect();
    const lamp = lampRef.current?.getBoundingClientRect();
    if (!stage || !lamp) return;
    setSplash({
      left: `${(((lamp.left + lamp.right) / 2 - stage.left) / stage.width) * 100}%`,
      top: `${((lamp.top + lamp.height * 0.62 - stage.top) / stage.height) * 100}%`,
      key: Date.now(),
    });
  }, [stageRef]);

  /** The lamp has fully left the frame: commit the action and let the next one come. */
  const finish = useCallback(() => {
    if (result) onAct(result);
    setActive(null);
    setPhase("empty");
  }, [result, onAct]);

  async function act(run: () => Promise<Partial<CaughtDiya>>, leave: (next: CaughtDiya) => void) {
    if (!active || busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = { ...active, ...(await run()) };
      setResult(next);
      leave(next);
    } catch (e) {
      setError(codeOf(e));
      setMode((m) => (m === "report" ? "read" : m));
    } finally {
      setBusy(false);
    }
  }

  const lift = () => {
    if (phase !== "resting") return;
    buzz(12);
    sfx("lift");
    splashHere();
    setPhase("lifted");
  };

  const doBless = () =>
    act(async () => { await gangaApi.bless(active!.id); return { action: "blessed" }; },
        () => { buzz(25); sfx("chime"); setPhase("blessing"); });

  const doPass = (vx = 420, vy = -260) =>
    act(async () => { await gangaApi.pass(active!.id); return { action: "passed" }; },
        () => {
          buzz(18);
          const dx = Math.max(180, Math.min(560, Math.abs(vx) * 0.45)) * (vx >= 0 ? 1 : -0.6);
          const dy = Math.min(300, Math.max(120, 200 + vy * 0.1));
          setThrowTo({ x: dx, y: dy, midY: Math.min(-60, vy * 0.25) });
          setPhase("thrown");
        });

  const doReply = (e: React.FormEvent) => {
    e.preventDefault();
    act(async () => ({ action: "replied", thread: (await gangaApi.reply(active!.id, text)).thread }),
        () => { sfx("chime"); onToast(t("ganga.flow.sent")); setPhase("leaving"); });
  };

  const doReport = (reason: string) =>
    act(async () => { await gangaApi.reportDiya(active!.id, reason); return { action: "reported" }; },
        () => setPhase("leaving"));

  const startHold = () => {
    if (busy) return;
    setHolding(true);
    holdTimer.current = setTimeout(() => { setHolding(false); doBless(); }, 900);
  };
  const cancelHold = () => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  const open = !!active && phase === "lifted";
  useEffect(() => onOpenChange(open), [open, onOpenChange]);

  if (!active) {
    return null;
  }
  const ring = 2 * Math.PI * 15;

  // Where the lamp is, per phase (left/top animate between river points; x/y carry the throw).
  const lampAnimate =
    phase === "arriving" ? { left: ["104%", "70%", REST.left], top: ["50%", "55%", REST.top], scale: [0.42, 0.72, 1], opacity: 1 }
    : phase === "resting" ? { left: REST.left, top: REST.top, scale: 1, opacity: 1 }
    : phase === "thrown" && throwTo ? { x: [null, throwTo.x * 0.6, throwTo.x] as [null, number, number], y: [null, throwTo.midY, throwTo.y] as [null, number, number], scale: 0.75, rotate: [0, 4, -3], opacity: 1 }
    : phase === "leaving" || phase === "blessing" ? { left: "86%", top: "56%", scale: 0.45, opacity: 0 }
    : { left: LIFT.left, top: LIFT.top, scale: still ? 1.05 : 1.2, x: 0, y: 0, opacity: 1 };

  const lampTransition =
    phase === "arriving" ? { duration: 4.2, times: [0, 0.55, 1], ease: "easeOut" as const }
    : phase === "thrown" ? { duration: 0.8, times: [0, 0.45, 1], ease: "easeOut" as const }
    : phase === "leaving" ? { duration: 2.4, ease: "easeIn" as const }
    : phase === "blessing" ? { duration: 2.6, delay: 1.1, ease: "easeIn" as const }
    : { type: "spring" as const, stiffness: 230, damping: 22 };

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* the world dims while you hold a diya */}
      <AnimatePresence>
        {open && (
          <motion.div key="dim" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ background: "radial-gradient(circle at 50% 38%, rgb(2 2 10 / 0.1), rgb(2 2 10 / 0.62) 78%)" }} />
        )}
      </AnimatePresence>

      {phase === "arriving" && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="ganga-caption absolute left-1/2 top-[30%] -translate-x-1/2 text-[15px]">
          {t("ganga.flow.arriving")}
        </motion.p>
      )}

      {/* the diya itself */}
      <motion.div
        ref={lampRef}
        className={`absolute z-10 ${open && mode === "read" ? "pointer-events-auto cursor-grab active:cursor-grabbing" : ""}`}
        animate={lampAnimate}
        transition={lampTransition}
        onAnimationComplete={() => {
          if (phase === "arriving") setPhase("resting");
          else if (phase === "thrown") { splashHere(); sfx("plip"); buzz(10); setPhase("leaving"); }
          else if (phase === "leaving" || phase === "blessing") finish();
        }}
        drag={open && mode === "read" && !still && !busy}
        dragSnapToOrigin
        dragElastic={0.5}
        whileDrag={{ scale: 1.55 }}
        onDragEnd={(_, info) => {
          const speed = Math.hypot(info.velocity.x, info.velocity.y);
          if (speed > 550 || Math.hypot(info.offset.x, info.offset.y) > 150) doPass(info.velocity.x, info.velocity.y);
        }}
      >
        <div className="-translate-x-1/2 -translate-y-1/2">
        {phase === "resting" ? (
          <button type="button" onClick={lift}
                  aria-label={`${fill(t("ganga.stage.diyaFrom"), { name: active.from })} · ${t("ganga.maitri")} ${active.maitri.score}`}
                  className="pointer-events-auto block outline-none focus-visible:rounded-3xl focus-visible:ring-2 focus-visible:ring-gold">
            <LampOnWater size={DONA} seed={3}
                         caption={<>{active.from} · <span className="not-italic text-[#ffd27a] lining-nums">{active.maitri.score}</span></>} />
          </button>
        ) : (
          <div className="relative">
            {/* once lifted, the chit has been taken out of the dona and unrolled below */}
            <LampOnWater size={DONA} seed={3} chit={phase !== "lifted"} />
            {phase === "blessing" && <Petals count={16} />}
          </div>
        )}
        </div>
      </motion.div>

      {phase === "resting" && (
        <>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.65, 1] }} transition={{ duration: 2.4, repeat: Infinity }}
                    className="ganga-caption absolute text-[14px]" style={{ left: REST.left, top: "74%", transform: "translateX(-50%)" }}>
            {t("ganga.flow.touch")}
          </motion.p>
          {holdsMore > 0 && (
            <p className="ganga-caption absolute left-1/2 top-[27%] -translate-x-1/2 text-[13px] opacity-80">
              {fill(t("ganga.flow.holds"), { n: holdsMore })}
            </p>
          )}
        </>
      )}

      {/* the chit, taken out of the dona and unrolled beneath it */}
      <AnimatePresence>
        {open && (
          <div key={active.id} className="pointer-events-auto absolute left-1/2 top-[45%] z-10 w-[min(92vw,34rem)] -translate-x-1/2"
               style={{ perspective: 1000 }}>
          <motion.div
            initial={still ? { opacity: 0 } : { opacity: 0, y: -90, scale: 0.28, rotateX: -80 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={still ? { opacity: 0 } : { opacity: 0, y: -70, scale: 0.4, rotateX: -70 }}
            transition={{ type: "spring", stiffness: 170, damping: 21, mass: 0.9 }}
            style={{ transformOrigin: "top center" }}
          >
            <div className="ganga-chit">
              <span aria-hidden="true" className="ganga-kalava" />
              <div className="relative max-h-[48dvh] overflow-y-auto px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
                <button type="button" onClick={() => { setPhase("resting"); setMode("read"); }} aria-label={t("ganga.stage.close")}
                        className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-cosmic-500 hover:text-foreground">
                  <X size={16} aria-hidden="true" />
                </button>
                <div className="flex items-start gap-4 pr-6">
                  <div className="min-w-0 flex-1">
                    <p className="label-caps text-[0.68rem]">{t(keyOf("ganga.k.", active.kind, "ganga.k.sharing"))}</p>
                    <p className="mt-1 text-sm text-cosmic-400">
                      {t("ganga.from")} <span className="ganga-ink text-[16px]">{active.from}</span> · {ago(active.created_at, lang)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gold">{t("ganga.maitri")}</p>
                      <p className="text-xs text-cosmic-500">{active.maitri.by_kundli ? t("ganga.byKundli") : t("ganga.byPath")}</p>
                    </div>
                    <MaitriDial score={active.maitri.score} />
                  </div>
                </div>

                <p lang={active.lang} className="ganga-ink mt-4 whitespace-pre-line text-xl leading-relaxed sm:text-[1.4rem]">
                  {active.text}
                </p>

                {active.maitri.reasons.length > 0 && (
                  <ul className="mt-4 space-y-1 border-t border-dashed border-line pt-3 text-sm text-cosmic-300">
                    {active.maitri.reasons.map((r, i) => (
                      <li key={i} className="flex gap-2"><span className="text-gold" aria-hidden="true">✦</span>{reasonText(r, t, lang)}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-5">
                  {mode === "reply" ? (
                    <form onSubmit={doReply}>
                      <label htmlFor="flow-reply" className="sr-only">{t("ganga.reply")}</label>
                      <textarea id="flow-reply" value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1000} required autoFocus
                                placeholder={t("ganga.replyPlaceholder")}
                                className="ganga-ink w-full resize-y rounded-md border border-line bg-white/40 px-4 py-3 text-lg placeholder:font-sans placeholder:text-sm placeholder:not-italic placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none" />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button type="submit" disabled={busy || !text.trim()} className="btn-chit btn-chit-primary text-sm">
                          <Send size={15} aria-hidden="true" /> {t("ganga.send")}
                        </button>
                        <button type="button" onClick={() => setMode("read")} className="px-3 py-2 text-sm text-cosmic-400 hover:text-foreground">{t("ganga.cancel")}</button>
                        <span className="ml-auto text-xs text-cosmic-500 lining-nums">{text.length} / 1000</span>
                      </div>
                    </form>
                  ) : mode === "report" ? (
                    <ReportPicker onPick={doReport} onCancel={() => setMode("read")} />
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setMode("reply")} className="btn-chit btn-chit-primary text-sm">
                          <Send size={15} aria-hidden="true" /> {t("ganga.reply")}
                        </button>
                        {/* hold to bless: the ring fills while you press */}
                        <button type="button" disabled={busy}
                                onPointerDown={startHold} onPointerUp={cancelHold} onPointerLeave={cancelHold} onPointerCancel={cancelHold}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doBless(); } }}
                                className="btn-chit relative text-sm">
                          <svg viewBox="0 0 34 34" className="h-5 w-5 -rotate-90" aria-hidden="true">
                            <circle cx="17" cy="17" r="15" fill="none" strokeWidth="2.5" className="stroke-[#7a4a22]/25" />
                            <circle cx="17" cy="17" r="15" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-[#962a1c]"
                                    strokeDasharray={ring} strokeDashoffset={holding ? 0 : ring}
                                    style={{ transition: holding ? "stroke-dashoffset 0.9s linear" : "none" }} />
                          </svg>
                          <HandHeart size={15} aria-hidden="true" /> {t("ganga.flow.holdBless")}
                        </button>
                        <button type="button" disabled={busy} onClick={() => doPass()} className="px-3 py-2 text-sm text-cosmic-400 hover:text-foreground">
                          <Waves size={15} aria-hidden="true" className="mr-1 inline" /> {t("ganga.pass")}
                        </button>
                        <button type="button" onClick={() => setMode("report")} aria-label={t("ganga.report")}
                                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-cosmic-500 hover:text-foreground">
                          <Flag size={14} aria-hidden="true" />
                        </button>
                      </div>
                      {!still && <p className="mt-3 text-center text-xs text-cosmic-500">{t("ganga.flow.flick")}</p>}
                    </>
                  )}
                  {error && <div className="mt-3"><ErrorNote code={error} /></div>}
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {splash && <Splash key={splash.key} left={splash.left} top={splash.top} />}
    </div>
  );
}

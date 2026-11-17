"use client";

/**
 * The river's play. Every dona the river has brought today drifts on the water
 * at once, each in its own lane, carried slowly downstream (transform-only
 * motion, so nothing stutters). Touch one and it lifts out of the water from
 * wherever the current has carried it; its chit leaves the bowl and unrolls
 * below. Hold to bless (petals, and it floats on), flick it back into the river
 * to pass it on (it flies with the gesture, splashes down and drifts away), or
 * write back — your reply rolls up into the dona before the river takes it.
 * Closing the chit sets the dona back on the water where its lane has reached.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flag, HandHeart, Send, Waves, X } from "lucide-react";
import { gangaApi, type CaughtDiya } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ErrorNote, ReportPicker, ago, codeOf, fill, keyOf } from "../shared";
import { sfx } from "./ambience";
import { ChitRoll, type RollPath } from "./ChitRoll";
import { LampOnWater } from "./LampOnWater";
import { MaitriDial, reasonText } from "./maitri";
import { Petals } from "./Petals";
import { Splash } from "./Splash";

const DONA = 138;        // px width of a dona at lane scale 1
const ON_WATER = 4;      // donas on the river at once; the rest wait upstream

// Depth lanes over the backdrop's open water (above the stone ledge in the foreground):
// nearer lanes sit lower, larger and a little faster.
const LANES = [
  { top: 61, s: 0.9, dur: 125 },
  { top: 68, s: 1.06, dur: 104 },
  { top: 55, s: 0.72, dur: 150 },
  { top: 65, s: 0.98, dur: 114 },
];
const STILL_X = ["16vw", "64vw", "40vw", "84vw"]; // where donas rest when motion is reduced

type Phase = "held" | "blessing" | "thrown" | "sealing" | "leaving" | "returning";
interface Pt { x: number; y: number }
interface Held {
  diya: CaughtDiya;
  start: Pt;              // where it was lifted from (stage px) — the anchor for every offset
  lane: number;
  box: { w: number; h: number };
  phase: Phase;
  to?: Pt;                // destination when returning; landing point when thrown
  mid?: number;           // arc height for a throw
  result?: CaughtDiya;
}

const buzz = (ms: number) => { try { navigator.vibrate?.(ms); } catch { /* no haptics */ } };

function hash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * One dona drifting in its lane. The current is a CSS animation (compositor-driven,
 * and its negative delay spreads the donas along the river); the sway on top is
 * memoised so re-renders never restart it.
 */
function Drifter({ diya, slot, hidden, still, setRef, onLift }: {
  diya: CaughtDiya; slot: number; hidden: boolean; still: boolean;
  setRef: (el: HTMLButtonElement | null) => void; onLift: () => void;
}) {
  const { t } = useLanguage();
  const h = hash(diya.id);
  const laneIdx = slot % LANES.length;
  const lane = LANES[laneIdx];
  // spread along the river: each slot starts a different way down its lane
  const along = (slot * 0.29 + ((h >>> 5) % 100) / 400) % 1;
  const sway = useMemo(
    () => ({
      animate: still ? {} : { y: [0, 7, -5, 3, 0], rotate: [0, 1.6, -1.2, 0.8, 0] },
      transition: { duration: 9 + (h % 4) * 2.2, repeat: Infinity, ease: "easeInOut" as const, delay: -(h % 7) },
    }),
    [still, h],
  );
  return (
    <div className="absolute left-0" style={{ top: `${lane.top}%`, zIndex: Math.round(lane.s * 10) }}>
      <div className={still ? undefined : "ganga-current"}
           style={still ? { transform: `translateX(${STILL_X[laneIdx]})` } : { animationDuration: `${lane.dur}s`, animationDelay: `${-lane.dur * along}s` }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }}>
          <motion.div animate={sway.animate} transition={sway.transition}>
            <div className={`transition-opacity duration-200 ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}>
              <button ref={setRef} type="button" onClick={onLift}
                      aria-label={`${fill(t("ganga.stage.diyaFrom"), { name: diya.from })} · ${t("ganga.maitri")} ${diya.maitri.score}`}
                      className="block -translate-x-1/2 -translate-y-1/2 rounded-3xl outline-none transition-[filter] duration-300 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-gold"
                      style={{ scale: lane.s }}>
                <LampOnWater size={DONA} seed={h % 9}
                             caption={<>{diya.from} · <span className="not-italic text-[#ffd27a] lining-nums">{diya.maitri.score}</span></>} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

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
  const [held, setHeld] = useState<Held | null>(null);
  const [mode, setMode] = useState<"read" | "reply" | "report">("read");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [roll, setRoll] = useState<RollPath | null>(null);
  const [splash, setSplash] = useState<{ left: string; top: string; key: number } | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onWater = queue.slice(0, ON_WATER);
  // Each dona keeps the lane it first drifted in, even as others leave the river around it.
  const slots = useRef<Record<string, number>>({});
  const slotOf = (id: string, i: number) => {
    if (slots.current[id] === undefined) {
      const taken = new Set(onWater.map((d) => slots.current[d.id]).filter((n) => n !== undefined));
      let n = i;
      while (taken.has(n % ON_WATER)) n++;
      slots.current[id] = n % ON_WATER;
    }
    return slots.current[id];
  };
  const open = !!held && (held.phase === "held" || held.phase === "sealing");
  useEffect(() => onOpenChange(open), [open, onOpenChange]);

  /** Centre of an element, in stage pixels. */
  const centreOf = useCallback((el: Element | null | undefined): Pt | null => {
    const stage = stageRef.current?.getBoundingClientRect();
    const r = el?.getBoundingClientRect();
    if (!stage || !r) return null;
    return { x: r.left + r.width / 2 - stage.left, y: r.top + r.height / 2 - stage.top };
  }, [stageRef]);

  const liftPoint = (h: Held): Pt => ({ x: h.box.w / 2, y: h.box.h * 0.3 });
  const setPhase = (phase: Phase, extra: Partial<Held> = {}) => setHeld((h) => (h ? { ...h, ...extra, phase } : h));

  const lift = (d: CaughtDiya) => {
    if (held) return;
    const start = centreOf(refs.current[d.id]);
    const stage = stageRef.current;
    if (!start || !stage) return;
    buzz(12);
    sfx("lift");
    setSplash({ left: `${start.x}px`, top: `${start.y + 18}px`, key: Date.now() });
    setMode("read");
    setText("");
    setError(null);
    setHeld({ diya: d, start, lane: (slots.current[d.id] ?? 0) % LANES.length, box: { w: stage.clientWidth, h: stage.clientHeight }, phase: "held" });
  };

  async function act(run: () => Promise<Partial<CaughtDiya>>, then: (result: CaughtDiya) => void) {
    if (!held || busy) return;
    setBusy(true);
    setError(null);
    try {
      then({ ...held.diya, ...(await run()) });
    } catch (e) {
      setError(codeOf(e));
      setMode((m) => (m === "report" ? "read" : m));
    } finally {
      setBusy(false);
    }
  }

  const doBless = () =>
    act(async () => { await gangaApi.bless(held!.diya.id); return { action: "blessed" }; },
        (result) => { buzz(25); sfx("chime"); setPhase("blessing", { result }); });

  const doPass = (vx = 420, vy = -260) =>
    act(async () => { await gangaApi.pass(held!.diya.id); return { action: "passed" }; },
        (result) => {
          buzz(18);
          const dx = Math.max(180, Math.min(560, Math.abs(vx) * 0.45)) * (vx >= 0 ? 1 : -0.6);
          const dy = Math.min(300, Math.max(140, 210 + vy * 0.1));
          const lp = liftPoint(held!);
          setPhase("thrown", { result, to: { x: lp.x + dx, y: lp.y + dy }, mid: Math.min(-60, vy * 0.25) });
        });

  const doReply = (e: React.FormEvent) => {
    e.preventDefault();
    act(async () => ({ action: "replied", thread: (await gangaApi.reply(held!.diya.id, text)).thread }),
        (result) => setPhase("sealing", { result }));
  };

  const doReport = (reason: string) =>
    act(async () => { await gangaApi.reportDiya(held!.diya.id, reason); return { action: "reported" }; },
        (result) => setPhase("leaving", { result }));

  const putBack = () => {
    if (!held) return;
    setMode("read");
    setPhase("returning", { to: centreOf(refs.current[held.diya.id]) ?? held.start });
  };

  const startHold = () => {
    if (busy) return;
    setHolding(true);
    holdTimer.current = setTimeout(() => { setHolding(false); doBless(); }, 900);
  };
  const cancelHold = () => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  /** The reply sheet has folded down into a strip: roll it up and into the dona. */
  const sealed = () => {
    const stage = stageRef.current?.getBoundingClientRect();
    const card = cardRef.current?.getBoundingClientRect();
    if (!held || !stage || !card) return setPhase("leaving");
    setRoll({ from: { x: card.left - stage.left, y: card.bottom - stage.top, w: card.width }, to: liftPoint(held) });
  };

  // Every phase as offsets from where the dona was lifted (transforms only).
  const motionFor = (h: Held) => {
    const lp = liftPoint(h);
    const s = LANES[h.lane].s;
    const off = (p: Pt) => ({ x: p.x - h.start.x, y: p.y - h.start.y });
    const lifted = off(lp);
    switch (h.phase) {
      case "held":
      case "sealing":
        return { animate: { ...lifted, scale: still ? 1.05 : 1.2, opacity: 1, rotate: 0 },
                 transition: { type: "spring" as const, stiffness: 120, damping: 17 } };
      case "returning":
        return { animate: { ...off(h.to ?? h.start), scale: s, opacity: 1, rotate: 0 },
                 transition: { duration: still ? 0.01 : 0.9, ease: "easeInOut" as const } };
      case "thrown": {
        const land = off(h.to!);
        return {
          animate: { x: [lifted.x, lifted.x + (land.x - lifted.x) * 0.6, land.x], y: [lifted.y, lifted.y + h.mid!, land.y],
                     scale: [1.2, 1, s], rotate: [0, 5, -3] },
          transition: { duration: 0.85, times: [0, 0.45, 1], ease: "easeOut" as const },
        };
      }
      case "blessing":
      case "leaving": {
        // back down onto the water (where it landed, if thrown) and away with the current
        const fromPt = h.result?.action === "passed" && h.to ? off(h.to) : lifted;
        const waterY = h.result?.action === "passed" && h.to ? fromPt.y : 0;
        const delay = h.phase === "blessing" ? 1.1 : 0;
        return {
          animate: { x: [fromPt.x, fromPt.x + 50, h.box.w + 200 - h.start.x], y: [fromPt.y, waterY, waterY],
                     scale: [still ? 1 : 1.2, s, s * 0.92], rotate: 0, opacity: [1, 1, 0] },
          transition: still ? { duration: 0.01 }
            : { duration: 7.5, times: [0, 0.2, 1], ease: "easeIn" as const, delay },
        };
      }
    }
  };

  const onHeldDone = () => {
    if (!held) return;
    if (held.phase === "returning") setHeld(null);
    else if (held.phase === "thrown") {
      setSplash({ left: `${held.to!.x}px`, top: `${held.to!.y + 18}px`, key: Date.now() });
      sfx("plip");
      buzz(10);
      setPhase("leaving");
    } else if (held.phase === "blessing" || held.phase === "leaving") {
      if (held.result) onAct(held.result);
      setHeld(null);
    }
  };

  const ring = 2 * Math.PI * 15;
  const anim = held ? motionFor(held) : null;
  // The chit is out of the bowl while it is being read or written on; it is back in once rolled up.
  const chitInBowl = !held || !(held.phase === "held" || held.phase === "sealing");

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* the river: every dona waiting today, drifting */}
      <div className="pointer-events-auto">
        {onWater.map((d, i) => (
          <Drifter key={d.id} diya={d} slot={slotOf(d.id, i)} still={still} hidden={held?.diya.id === d.id}
                   setRef={(el) => { refs.current[d.id] = el; }} onLift={() => lift(d)} />
        ))}
      </div>

      {!held && onWater.length > 0 && (
        <>
          {holdsMore > 0 && (
            <p className="ganga-caption absolute left-1/2 top-[42%] -translate-x-1/2 whitespace-nowrap text-[13px] opacity-75">
              {fill(t("ganga.flow.holds"), { n: holdsMore })}
            </p>
          )}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="ganga-caption absolute left-1/2 top-[47%] -translate-x-1/2 whitespace-nowrap text-[14px]">
            {t("ganga.flow.touch")}
          </motion.p>
        </>
      )}

      {/* the world dims while you hold a dona */}
      <AnimatePresence>
        {open && (
          <motion.div key="dim" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ background: "radial-gradient(circle at 50% 38%, rgb(2 2 10 / 0.08), rgb(2 2 10 / 0.6) 78%)" }} />
        )}
      </AnimatePresence>

      {/* the dona in your hands */}
      {held && anim && (
        <motion.div
          className={`absolute z-30 ${held.phase === "held" && mode === "read" ? "pointer-events-auto cursor-grab active:cursor-grabbing" : ""}`}
          style={{ left: held.start.x, top: held.start.y }}
          initial={{ x: 0, y: 0, scale: LANES[held.lane].s, opacity: 1 }}
          animate={anim.animate}
          transition={anim.transition}
          onAnimationComplete={onHeldDone}
          drag={held.phase === "held" && mode === "read" && !still && !busy}
          dragSnapToOrigin
          dragElastic={0.5}
          whileDrag={{ scale: 1.35 }}
          onDragEnd={(_, info) => {
            const speed = Math.hypot(info.velocity.x, info.velocity.y);
            if (speed > 550 || Math.hypot(info.offset.x, info.offset.y) > 150) doPass(info.velocity.x, info.velocity.y);
          }}
        >
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <LampOnWater size={DONA} seed={hash(held.diya.id) % 9} chit={chitInBowl} />
            {held.phase === "blessing" && <Petals count={16} />}
          </div>
        </motion.div>
      )}

      {/* the chit, taken out of the dona and unrolled beneath it */}
      <AnimatePresence>
        {held && open && (
          <div key={held.diya.id} className="pointer-events-auto absolute left-1/2 top-[45%] z-30 w-[min(92vw,34rem)] -translate-x-1/2"
               style={{ perspective: 1000 }}>
            <motion.div
              ref={cardRef}
              initial={still ? { opacity: 0 } : { opacity: 0, y: -90, scale: 0.28, rotateX: -80, scaleY: 1 }}
              animate={held.phase === "sealing"
                ? { opacity: 1, y: 0, scale: 1, rotateX: 0, scaleY: 0.04 }
                : { opacity: 1, y: 0, scale: 1, rotateX: 0, scaleY: 1 }}
              exit={still || held.result ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, y: -70, scale: 0.4, rotateX: -70 }}
              transition={held.phase === "sealing"
                ? { scaleY: { duration: 0.5, ease: "easeIn" } }
                : { type: "spring", stiffness: 170, damping: 21, mass: 0.9 }}
              onAnimationComplete={() => { if (held.phase === "sealing" && !roll) sealed(); }}
              style={{ transformOrigin: held.phase === "sealing" ? "bottom center" : "top center" }}
            >
              <div className="ganga-chit">
                <span aria-hidden="true" className={`ganga-kalava transition-opacity duration-200 ${held.phase === "sealing" ? "opacity-0" : ""}`} />
                <div className={`relative max-h-[48dvh] overflow-y-auto px-5 pb-5 pt-6 transition-opacity duration-150 sm:px-7 sm:pb-6 sm:pt-7 ${held.phase === "sealing" ? "opacity-0 delay-[350ms]" : ""}`}>
                  <button type="button" onClick={putBack} aria-label={t("ganga.stage.close")}
                          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-cosmic-500 hover:text-foreground">
                    <X size={16} aria-hidden="true" />
                  </button>
                  <div className="flex items-start gap-4 pr-6">
                    <div className="min-w-0 flex-1">
                      <p className="label-caps text-[0.68rem]">{t(keyOf("ganga.k.", held.diya.kind, "ganga.k.sharing"))}</p>
                      <p className="mt-1 text-sm text-cosmic-400">
                        {t("ganga.from")} <span className="ganga-ink text-[16px]">{held.diya.from}</span> · {ago(held.diya.created_at, lang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gold">{t("ganga.maitri")}</p>
                        <p className="text-xs text-cosmic-500">{held.diya.maitri.by_kundli ? t("ganga.byKundli") : t("ganga.byPath")}</p>
                      </div>
                      <MaitriDial score={held.diya.maitri.score} />
                    </div>
                  </div>

                  <p lang={held.diya.lang} className="ganga-ink mt-4 whitespace-pre-line text-xl leading-relaxed sm:text-[1.4rem]">
                    {held.diya.text}
                  </p>

                  {held.diya.maitri.reasons.length > 0 && (
                    <ul className="mt-4 space-y-1 border-t border-dashed border-line pt-3 text-sm text-cosmic-300">
                      {held.diya.maitri.reasons.map((r, i) => (
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
                                  className="ganga-ink ganga-ruled w-full resize-none bg-transparent px-1 text-lg placeholder:font-sans placeholder:text-sm placeholder:not-italic placeholder:text-cosmic-500 focus:outline-none" />
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

      {roll && (
        <ChitRoll from={roll.from} to={roll.to} onDone={() => {
          setRoll(null);
          sfx("chime");
          onToast(t("ganga.flow.sent"));
          setPhase("leaving");
        }} />
      )}

      {splash && <Splash key={splash.key} left={splash.left} top={splash.top} />}
    </div>
  );
}

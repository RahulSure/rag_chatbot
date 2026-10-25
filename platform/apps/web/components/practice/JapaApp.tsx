"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, MessageCircle, RotateCcw, Smartphone, Undo2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const BEADS = 108;
const TARGETS = [1, 3, 5, 11, 21];
// Per-viewer convenience only: the count and history live in this browser.
const STATE_KEY = "sadhak_japa";

interface JapaState {
  date: string;
  count: number;          // beads into the current mala
  malas: number;          // malas completed today
  target: number;
  mantra: string;
  sound: boolean;
  vibrate: boolean;
  history: Record<string, number>; // date -> repetitions
}

const localDate = (d = new Date()) => d.toLocaleDateString("en-CA");

function load(): JapaState {
  const fresh: JapaState = { date: localDate(), count: 0, malas: 0, target: 1, mantra: "", sound: true, vibrate: true, history: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY) ?? "null") as JapaState | null;
    if (!saved) return fresh;
    // A new day starts a new count, but keeps the settings and the history.
    return saved.date === fresh.date ? saved : { ...saved, date: fresh.date, count: 0, malas: 0 };
  } catch {
    return fresh;
  }
}

function streak(history: Record<string, number>) {
  let n = 0;
  const d = new Date();
  if (!history[localDate(d)]) d.setDate(d.getDate() - 1); // today not begun yet: count back from yesterday
  while (history[localDate(d)]) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** A soft temple bell made in the browser: two decaying partials, no audio file. */
function ring(ctx: AudioContext) {
  const now = ctx.currentTime;
  for (const [freq, gain] of [[528, 0.25], [1056, 0.08]] as const) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    osc.connect(amp).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.5);
  }
}

export function JapaApp() {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const [s, setS] = useState<JapaState | null>(null);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => setS(load()), []);
  useEffect(() => {
    if (!s) return;
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(s));
    } catch {
      /* the counter still works, it just won't be remembered */
    }
  }, [s]);

  const count = useCallback(() => {
    setS((prev) => {
      if (!prev) return prev;
      const today = localDate();
      const base = prev.date === today ? prev : { ...prev, date: today, count: 0, malas: 0 };
      const next = base.count + 1;
      const done = next >= BEADS;
      if (base.vibrate && typeof navigator !== "undefined") navigator.vibrate?.(done ? [60, 40, 60] : 8);
      if (done && base.sound) {
        audio.current ??= new AudioContext();
        ring(audio.current);
      }
      return {
        ...base,
        count: done ? 0 : next,
        malas: done ? base.malas + 1 : base.malas,
        history: { ...base.history, [today]: (base.history[today] ?? 0) + 1 },
      };
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        count();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  if (!s) return null;

  const update = (patch: Partial<JapaState>) => setS({ ...s, ...patch });
  const undo = () => {
    if (s.count === 0 && s.malas === 0) return;
    const today = localDate();
    const back = s.count === 0 ? { count: BEADS - 1, malas: s.malas - 1 } : { count: s.count - 1, malas: s.malas };
    update({ ...back, history: { ...s.history, [today]: Math.max(0, (s.history[today] ?? 1) - 1) } });
  };
  const todayTotal = s.history[localDate()] ?? 0;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { iso: localDate(d), label: d.toLocaleDateString(hi ? "hi-IN" : "en-GB", { weekday: "short" }), n: s.history[localDate(d)] ?? 0 };
  });
  const max = Math.max(BEADS, ...days.map((d) => d.n));
  const complete = s.malas >= s.target;

  const R = 150;
  const beads = Array.from({ length: BEADS }, (_, i) => {
    const a = ((i + 0.5) / BEADS) * 2 * Math.PI - Math.PI / 2;
    return { x: Math.round(R * Math.cos(a) * 100) / 100, y: Math.round(R * Math.sin(a) * 100) / 100, lit: i < s.count };
  });

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col items-center">
        <button type="button" onClick={count} aria-label={`${t("japa.tap")}: ${s.count} / ${BEADS}`}
                className="group relative w-full max-w-md touch-manipulation select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold">
          <svg viewBox="-180 -180 360 360" className="w-full" aria-hidden="true">
            <circle r={R} fill="none" className="stroke-gold/20" strokeWidth="1" />
            {beads.map((b, i) => (
              <circle key={i} cx={b.x} cy={b.y} r={b.lit ? 4.4 : 3.6}
                      className={b.lit ? "fill-gold" : "fill-gold/15 stroke-gold/40"} strokeWidth="1" />
            ))}
            {/* The sumeru bead, where the mala turns. */}
            <circle cx="0" cy={-R - 16} r="9" className="fill-gold/80" />
            <path d={`M -4 ${-R - 6} L 0 ${-R + 4} L 4 ${-R - 6}`} className="stroke-gold/60" fill="none" />
            <text y="-6" textAnchor="middle" className="fill-foreground font-serif text-[64px] lining-nums">{s.count}</text>
            <text y="30" textAnchor="middle" className="fill-cosmic-500 text-[14px]">/ {BEADS}</text>
            <text y="62" textAnchor="middle" className="fill-gold text-[15px]">
              {complete ? `${s.malas} / ${s.target}`
                : hi ? `${s.target} में से माला ${s.malas + 1}` : `${t("japa.mala")} ${s.malas + 1} ${t("japa.of")} ${s.target}`}
            </text>
          </svg>
          <span className="absolute inset-x-0 bottom-6 text-center text-xs uppercase tracking-widest text-cosmic-500 transition-colors group-active:text-gold">
            {t("japa.tap")}
          </span>
        </button>
        {complete && <p role="status" className="mt-4 font-serif text-2xl text-gold">{t("japa.done")}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={undo} className="btn-ghost px-4 py-2 text-sm"><Undo2 size={15} aria-hidden="true" /> {t("japa.undo")}</button>
          <button type="button" onClick={() => update({ count: 0 })} className="btn-ghost px-4 py-2 text-sm"><RotateCcw size={15} aria-hidden="true" /> {t("japa.reset")}</button>
          <button type="button" onClick={() => update({ sound: !s.sound })} aria-pressed={s.sound} className="btn-ghost px-4 py-2 text-sm">
            {s.sound ? <Bell size={15} aria-hidden="true" /> : <BellOff size={15} aria-hidden="true" />} {t("japa.sound")}
          </button>
          <button type="button" onClick={() => update({ vibrate: !s.vibrate })} aria-pressed={s.vibrate} className={`btn-ghost px-4 py-2 text-sm ${s.vibrate ? "" : "opacity-50"}`}>
            <Smartphone size={15} aria-hidden="true" /> {t("japa.vibrate")}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <label htmlFor="japa-mantra" className="label-caps mb-2 block text-[0.7rem]">{t("japa.mantra")}</label>
          <input id="japa-mantra" value={s.mantra} onChange={(e) => update({ mantra: e.target.value })} placeholder={t("japa.mantraHint")}
                 className="w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-base text-foreground placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none" />
          <p className="label-caps mb-2 mt-5 text-[0.7rem]">{t("japa.target")}</p>
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((n) => (
              <button key={n} type="button" onClick={() => update({ target: n })} aria-pressed={s.target === n}
                      className={`h-10 min-w-12 rounded-lg border px-3 font-serif text-lg lining-nums ${s.target === n ? "border-gold bg-gold text-background" : "border-line text-cosmic-300 hover:border-gold/50"}`}>
                {n}
              </button>
            ))}
          </div>
        </section>
        <section className="grid grid-cols-3 gap-3">
          {([[t("japa.total"), todayTotal], [hi ? "पूरी मालाएँ" : "Malas done", s.malas], [t("japa.streak"), streak(s.history)]] as [string, number][]).map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-line bg-surface p-4 text-center">
              <p className="font-serif text-3xl lining-nums text-gold">{v}</p>
              <p className="mt-1 text-xs text-cosmic-500">{k}</p>
            </div>
          ))}
        </section>
        <section className="rounded-2xl border border-line bg-surface p-6">
          <p className="label-caps text-[0.68rem]">{t("japa.week")}</p>
          <ol className="mt-4 flex h-28 items-end gap-2">
            {days.map((d) => (
              <li key={d.iso} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[0.65rem] tabular-nums text-cosmic-500">{d.n || ""}</span>
                <span className={`w-full rounded-t ${d.n ? "bg-gold" : "bg-surface-2"}`} style={{ height: `${Math.max(4, (d.n / max) * 72)}px` }} />
                <span className="text-[0.65rem] text-cosmic-500">{d.label}</span>
              </li>
            ))}
          </ol>
        </section>
        <p className="text-sm text-cosmic-500">{t("japa.private")}</p>
        <Link href={`/chat?q=${encodeURIComponent(hi ? "मुझे दैनिक जप के लिए कौन सा मंत्र चुनना चाहिए?" : "Which mantra should I choose for my daily japa?")}`} className="btn-gold">
          <MessageCircle size={16} aria-hidden="true" /> {t("japa.ask")}
        </Link>
      </div>
    </div>
  );
}

"use client";

/**
 * The river as the interface. The day's diyas drift by on the water — tap one to
 * lift it out and read it. Write your own, and it waits lit on the ghat steps
 * until you drag it onto the river and let go. Letters and your own diyas slide
 * in from the edge, so you never leave the ghat.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { HelpCircle, Mail, ScrollText, Volume2, VolumeX } from "lucide-react";
import { gangaApi, type CaughtDiya, type DiyaKind, type GangaProfile } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { AboutRiver } from "../AboutRiver";
import { Letters } from "../Letters";
import { MyDiyas } from "../MyDiyas";
import { ErrorNote, codeOf, fill } from "../shared";
import { useGangaUnread } from "../unread";
import { startAmbience, stopAmbience } from "./ambience";
import { ComposeOverlay } from "./ComposeOverlay";
import { DiyaOverlay } from "./DiyaOverlay";
import { RiverFlow } from "./RiverFlow";
import { DiyaSprite } from "./DiyaSprite";
import { LampOnWater } from "./LampOnWater";
import { Panel } from "./Panel";
import { SceneBackdrop } from "./SceneBackdrop";

const SOUND_KEY = "sadhak_ganga_sound";

const ACTION_MARK: Record<string, string> = { blessed: "🙏", replied: "✉️" };

export function RiverStage({ profile, onEdit, onLeft }: { profile: GangaProfile; onEdit: () => void; onLeft: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const still = useReducedMotion() ?? false;
  const unread = useGangaUnread(true, pathname);
  const stageRef = useRef<HTMLDivElement>(null);

  const [narrow, setNarrow] = useState(false);
  const [data, setData] = useState<{ diyas: CaughtDiya[]; share: number; left: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [flowOpen, setFlowOpen] = useState(false); // a diya is held: the HUD steps back
  const [compose, setCompose] = useState<{ initial: { kind: DiyaKind; text: string } | null; error: string | null } | null>(null);
  const [pending, setPending] = useState<{ kind: DiyaKind; text: string } | null>(null);
  const [ghatKey, setGhatKey] = useState(0); // remounts the ghat diya so a missed drop springs back
  const [sail, setSail] = useState<{ left: number; top: number; dx: number } | null>(null);
  const [floated, setFloated] = useState(0);
  const [panel, setPanel] = useState<"mine" | "letters" | "about" | null>(null);
  const [thread, setThread] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const busyRef = useRef(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useEffect(() => {
    gangaApi.catch().then(setData).catch((e) => setLoadError(codeOf(e)));
  }, []);

  useEffect(() => {
    const measure = () => setNarrow((stageRef.current?.clientWidth ?? window.innerWidth) < 640);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The river remembers whether this visitor likes its sound; audio may only start on a tap.
  useEffect(() => {
    let wants = false;
    try { wants = localStorage.getItem(SOUND_KEY) === "1"; } catch { /* no storage */ }
    if (!wants) return;
    const begin = () => { startAmbience(); setSound(true); };
    window.addEventListener("pointerdown", begin, { once: true });
    return () => window.removeEventListener("pointerdown", begin);
  }, []);
  useEffect(() => stopAmbience, []);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    if (next) startAmbience(); else stopAmbience();
    try { localStorage.setItem(SOUND_KEY, next ? "1" : "0"); } catch { /* fine */ }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else if (compose) setCompose(null);
      else if (panel) setPanel(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, compose, panel]);

  const say = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  async function floatNow(drop?: { px: number; py: number }) {
    if (!pending || busyRef.current) return;
    busyRef.current = true;
    const rect = stageRef.current?.getBoundingClientRect();
    try {
      await gangaApi.float(pending.kind, pending.text);
      try { navigator.vibrate?.(30); } catch { /* no haptics */ }
      setPending(null);
      setFloated((n) => n + 1);
      if (rect && !still) {
        const left = (drop?.px ?? 0.13) * 100;
        const top = (drop?.py ?? 0.82) * 100;
        setSail({ left, top, dx: (1.18 - (drop?.px ?? 0.13)) * rect.width });
      }
      say(t("ganga.stage.floated"));
    } catch (e) {
      setCompose({ initial: pending, error: codeOf(e) });
      setPending(null);
      setGhatKey((k) => k + 1);
    } finally {
      busyRef.current = false;
    }
  }

  // The river's queue: unanswered diyas arrive one by one; answered ones rest at the ghat.
  const queue = (data?.diyas ?? []).filter((d) => !d.action);
  const acted = (data?.diyas ?? []).filter((d) => d.action === "blessed" || d.action === "replied");
  const selectedDiya = acted.find((d) => d.id === selected) ?? null;
  const merge = (next: CaughtDiya) =>
    setData((cur) => cur && { ...cur, diyas: cur.diyas.map((x) => (x.id === next.id ? next : x)) });

  const openThread = (id: string) => {
    setSelected(null);
    setThread(id);
    setPanel("letters");
  };

  return (
    <div
      ref={stageRef}
      className="ganga-scene relative h-[calc(100dvh-4rem)] min-h-[34rem] w-full overflow-hidden"
      onPointerMove={(e) => {
        const r = stageRef.current?.getBoundingClientRect();
        if (!r) return;
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
    >
      <SceneBackdrop mx={mx} my={my} still={still} narrow={narrow} />

      {/* the river brings the day's diyas one at a time */}
      {data && (
        <RiverFlow queue={queue} holdsMore={Math.max(0, queue.length - 1) + (data.left ?? 0)}
                   onAct={merge} onToast={say} onOpenChange={setFlowOpen} stageRef={stageRef} />
      )}

      {/* diyas already answered today, resting at the ghat's edge */}
      {acted.length > 0 && (
        <div className="absolute left-3 top-16 z-10">
          <p className="ganga-caption text-[11px] opacity-80">{t("ganga.flow.answered")}</p>
          <div className="mt-0.5 flex gap-0.5">
            {acted.map((d, i) => (
              <button key={d.id} type="button" onClick={() => setSelected(d.id)}
                      aria-label={`${fill(t("ganga.stage.diyaFrom"), { name: d.from })} (${d.action})`}
                      className="relative rounded-full p-0.5 transition-[filter] hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <DiyaSprite size={34} seed={i + 4} />
                <span aria-hidden="true" className="absolute -right-0.5 -top-1 text-[10px] drop-shadow">{ACTION_MARK[d.action!]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* a freshly floated diya sailing downstream */}
      <AnimatePresence>
        {sail && (
          <motion.div key="sail" className="pointer-events-none absolute" style={{ left: `${sail.left}%`, top: `${sail.top}%` }}
                      initial={{ x: 0, y: 0, scale: 1.1, rotate: 0 }}
                      animate={{ x: [0, sail.dx * 0.3, sail.dx], y: [0, -12, -30], scale: [1.1, 0.95, 0.78], rotate: [0, 2.5, -1.5] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 10, times: [0, 0.42, 1], ease: "easeInOut" }}
                      onAnimationComplete={() => setSail(null)} aria-hidden="true">
            <LampOnWater size={70} seed={2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* your written diya, lit and waiting on the ghat landing */}
      {pending && (
        <div key={ghatKey} className="absolute bottom-[9%] z-20" style={{ left: narrow ? "14%" : "8%" }}>
          <motion.div
            drag={!still}
            dragMomentum={false}
            whileDrag={{ scale: 1.15 }}
            onDragEnd={(_, info) => {
              const r = stageRef.current?.getBoundingClientRect();
              if (!r) return;
              const px = (info.point.x - r.left) / r.width;
              const py = (info.point.y - r.top) / r.height;
              if (py > 0.34 && py < 0.97 && px > 0.22) floatNow({ px, py });
              else setGhatKey((k) => k + 1);
            }}
            className="cursor-grab touch-none active:cursor-grabbing"
            initial={still ? undefined : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <DiyaSprite size={88} seed={5} />
          </motion.div>
          <div className="pointer-events-auto mt-2 max-w-[14rem]">
            <p className="rounded-xl bg-black/40 px-3 py-2 text-center text-xs leading-snug text-white/95 backdrop-blur-sm">
              {still ? t("ganga.stage.setAfloatHint") : t("ganga.stage.dragHint")}
            </p>
            <button type="button" onClick={() => floatNow()} className="btn-gold mx-auto mt-2 block px-4 py-1.5 text-xs">
              {t("ganga.stage.setAfloat")}
            </button>
          </div>
        </div>
      )}

      {/* captions on the water */}
      {loadError && <div className="absolute left-1/2 top-[46%] w-full max-w-md -translate-x-1/2 px-4"><ErrorNote code={loadError} /></div>}
      {!loadError && data && queue.length === 0 && !pending && (
        <p className="absolute left-1/2 top-[46%] w-full max-w-md -translate-x-1/2 px-6 text-center leading-relaxed text-white/85 drop-shadow">
          {t("ganga.stage.quiet")}
        </p>
      )}
      {data && data.share > 3 && (
        <p className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/30 px-3 py-1 text-xs text-[#ffd27a] backdrop-blur-sm">
          {t("ganga.brahma")}
        </p>
      )}

      {/* HUD: who you are, sound, today's share, the three doors */}
      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-[#f3dcae]/30 bg-black/45 py-1 pl-4 pr-1.5 backdrop-blur-sm">
        <span className="text-sm text-[#d9cdb4]">
          {t("ganga.signedAs")} <span className="font-serif italic text-[#f0cf92]">{profile.name}</span>
        </span>
        <button type="button" onClick={onEdit} className="rounded-full px-2 py-1 text-xs text-[#bdb296] hover:text-[#f3dcae]">{t("ganga.edit")}</button>
        <button type="button"
                onClick={async () => { if (window.confirm(t("ganga.leaveConfirm"))) { await gangaApi.leave().catch(() => undefined); onLeft(); } }}
                className="rounded-full px-2 py-1 text-xs text-[#9a9079] hover:text-[#f3dcae]">
          {t("ganga.leave")}
        </button>
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-2">
        {data && (
          <span className="rounded-full border border-[#f3dcae]/30 bg-black/45 px-3 py-1.5 text-sm text-[#e8dcc2] backdrop-blur-sm lining-nums"
                title={data.left > 0 ? fill(t("ganga.catchLeft"), { n: data.left }) : t("ganga.catchDone")}>
            🪔 {data.diyas.length}/{data.share}
          </span>
        )}
        <button type="button" onClick={toggleSound} aria-pressed={sound}
                aria-label={sound ? t("ganga.stage.soundOn") : t("ganga.stage.soundOff")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f3dcae]/30 bg-black/45 text-[#d9cdb4] backdrop-blur-sm hover:text-[#ffd27a]">
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button type="button" onClick={() => setPanel("about")} aria-label={t("ganga.about.open")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f3dcae]/30 bg-black/45 text-[#d9cdb4] backdrop-blur-sm hover:text-[#ffd27a]">
          <HelpCircle size={16} />
        </button>
      </div>
      <div className={`absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-center gap-2.5 p-3 transition-opacity duration-300 sm:justify-end sm:p-5 ${flowOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <button type="button" onClick={() => setCompose({ initial: pending, error: null })} className="btn-ganga px-6 py-2.5 text-sm">
          <span aria-hidden="true">🪔</span> {t("ganga.stage.write")}
        </button>
        <button type="button" onClick={() => setPanel("mine")} className="btn-ganga px-5 py-2.5 text-sm opacity-90">
          <ScrollText size={15} aria-hidden="true" /> {t("ganga.tabMine")}
        </button>
        <button type="button" onClick={() => { setThread(null); setPanel("letters"); }} className="btn-ganga px-5 py-2.5 text-sm opacity-90">
          <Mail size={15} aria-hidden="true" /> {t("ganga.tabLetters")}
          {unread > 0 && <span className="rounded-full bg-[#e2bf84] px-1.5 text-xs font-semibold text-black lining-nums">{unread}</span>}
        </button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.p key="toast" role="status" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute bottom-20 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {toast}
          </motion.p>
        )}
      </AnimatePresence>

      {/* overlays */}
      <AnimatePresence>
        {selectedDiya && (
          <DiyaOverlay key={selectedDiya.id} diya={selectedDiya} onClose={() => setSelected(null)} onOpenThread={openThread}
                       onChange={(next) => setData((cur) => cur && { ...cur, diyas: cur.diyas.map((x) => (x.id === next.id ? next : x)) })} />
        )}
        {compose && (
          <ComposeOverlay key="compose" initial={compose.initial} error={compose.error} onClose={() => setCompose(null)}
                          onLight={(kind, text) => { setCompose(null); setPending({ kind, text }); setGhatKey((k) => k + 1); }} />
        )}
        {panel === "mine" && (
          <Panel key="mine" title="ganga.tabMine" onClose={() => setPanel(null)}><MyDiyas version={floated} /></Panel>
        )}
        {panel === "letters" && (
          <Panel key="letters" title="ganga.tabLetters" onClose={() => setPanel(null)}><Letters open={thread} onOpen={setThread} /></Panel>
        )}
        {panel === "about" && (
          <Panel key="about" title="ganga.about.open" onClose={() => setPanel(null)}><AboutRiver /></Panel>
        )}
      </AnimatePresence>
    </div>
  );
}

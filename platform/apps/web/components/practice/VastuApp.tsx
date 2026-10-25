"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Compass, MessageCircle } from "lucide-react";
import { useLanguage, type Key } from "@/lib/i18n";
import { say, type Pair } from "@/lib/jyotish-text";

type Dir = "NW" | "N" | "NE" | "W" | "C" | "E" | "SW" | "S" | "SE";
type Rating = "best" | "good" | "ok" | "avoid";

// The plan as drawn: north at the top.
const GRID: Dir[] = ["NW", "N", "NE", "W", "C", "E", "SW", "S", "SE"];
const DIR: Record<Dir, { name: Pair; ruler: Pair }> = {
  N: { name: ["North", "उत्तर"], ruler: ["Kubera", "कुबेर"] },
  NE: { name: ["North-east (Ishanya)", "ईशान"], ruler: ["Ishana (Shiva)", "ईशान (शिव)"] },
  E: { name: ["East", "पूर्व"], ruler: ["Surya, Indra", "सूर्य, इंद्र"] },
  SE: { name: ["South-east (Agneya)", "आग्नेय"], ruler: ["Agni", "अग्नि"] },
  S: { name: ["South", "दक्षिण"], ruler: ["Yama", "यम"] },
  SW: { name: ["South-west (Nairitya)", "नैऋत्य"], ruler: ["Nirriti", "निऋति"] },
  W: { name: ["West", "पश्चिम"], ruler: ["Varuna", "वरुण"] },
  NW: { name: ["North-west (Vayavya)", "वायव्य"], ruler: ["Vayu", "वायु"] },
  C: { name: ["Centre (Brahmasthan)", "ब्रह्मस्थान"], ruler: ["Brahma", "ब्रह्मा"] },
};

interface Room {
  id: string;
  name: Pair;
  ratings: Record<Dir, Rating>;
  why: Pair;
  fix: Pair;
}

const ROOMS: Room[] = [
  { id: "puja", name: ["Puja room", "पूजा कक्ष"],
    ratings: { NE: "best", N: "good", E: "good", C: "good", W: "ok", NW: "ok", S: "avoid", SW: "avoid", SE: "avoid" },
    why: ["The north-east belongs to Ishana, a form of Shiva, and receives the first light: the purest corner for worship.", "ईशान कोण शिव के ईशान रूप का है और उसमें सबसे पहले प्रकाश आता है: पूजा के लिए सबसे पवित्र कोना।"],
    fix: ["Place the images so you face east or north as you sit. Keep the space clean, uncluttered and lit; a lamp at dusk and fresh water each morning purify any corner. Avoid the space under stairs or a wall shared with a toilet.", "मूर्तियाँ ऐसे रखें कि बैठते समय आपका मुख पूर्व या उत्तर की ओर हो। स्थान स्वच्छ, खुला और प्रकाशित रखें; संध्या का दीपक और प्रातः ताज़ा जल हर कोने को पवित्र करते हैं। सीढ़ियों के नीचे या शौचालय से लगी दीवार से बचें।"] },
  { id: "entrance", name: ["Main entrance", "मुख्य द्वार"],
    ratings: { N: "best", E: "best", NE: "best", NW: "good", W: "ok", SE: "ok", S: "avoid", SW: "avoid", C: "avoid" },
    why: ["A door in the north, east or north-east lets in light and the energy of growth.", "उत्तर, पूर्व या ईशान का द्वार प्रकाश और उन्नति की ऊर्जा को भीतर आने देता है।"],
    fix: ["Keep the doorway bright and clean, hang a toran, place a swastika or Om by the door, and keep shoes out of the way.", "द्वार को उजला और स्वच्छ रखें, तोरण लगाएँ, द्वार पर स्वस्तिक या ॐ रखें, और जूते रास्ते से हटाकर रखें।"] },
  { id: "kitchen", name: ["Kitchen", "रसोई"],
    ratings: { SE: "best", NW: "good", E: "ok", W: "ok", S: "ok", NE: "avoid", SW: "avoid", N: "avoid", C: "avoid" },
    why: ["The south-east is the corner of Agni, the god of fire: the natural home of the stove.", "आग्नेय कोण अग्नि देव का है: चूल्हे का स्वाभाविक स्थान।"],
    fix: ["Cook facing east if you can. Keep the stove away from the sink, and keep the north-east free of fire and heavy things.", "हो सके तो पूर्व की ओर मुख करके भोजन बनाएँ। चूल्हा सिंक से दूर रखें, और ईशान कोण को अग्नि और भारी वस्तुओं से मुक्त रखें।"] },
  { id: "bedroom", name: ["Main bedroom", "मुख्य शयनकक्ष"],
    ratings: { SW: "best", S: "good", W: "good", NW: "ok", N: "ok", E: "ok", NE: "avoid", SE: "avoid", C: "avoid" },
    why: ["The south-west is the earth corner: it gives stability, sound sleep and steadiness to the head of the family.", "नैऋत्य पृथ्वी का कोना है: यह स्थिरता, गहरी नींद और परिवार के मुखिया को दृढ़ता देता है।"],
    fix: ["Sleep with your head to the south or east, never to the north. Keep mirrors from facing the bed, and the room free of clutter.", "सिर दक्षिण या पूर्व की ओर करके सोएँ, उत्तर की ओर कभी नहीं। दर्पण पलंग के सामने न रखें, और कक्ष को अव्यवस्था से मुक्त रखें।"] },
  { id: "toilet", name: ["Toilet", "शौचालय"],
    ratings: { NW: "best", W: "good", S: "ok", SE: "ok", N: "avoid", E: "avoid", NE: "avoid", SW: "avoid", C: "avoid" },
    why: ["The north-west belongs to Vayu, the wind: what is released there is carried away.", "वायव्य वायु देव का है: वहाँ जो छोड़ा जाता है वह बह जाता है।"],
    fix: ["Keep the door closed and the room dry and fresh. A bowl of sea salt, changed every week, is the traditional remedy. Never place it in the north-east.", "द्वार बंद और कक्ष सूखा तथा ताज़ा रखें। समुद्री नमक का कटोरा, हर सप्ताह बदला हुआ, पारम्परिक उपाय है। ईशान कोण में कभी न रखें।"] },
  { id: "study", name: ["Study", "अध्ययन कक्ष"],
    ratings: { NE: "best", N: "good", E: "good", W: "ok", NW: "ok", SW: "ok", S: "ok", SE: "avoid", C: "avoid" },
    why: ["North and east bring clarity, with the support of Mercury and the rising sun.", "उत्तर और पूर्व बुध और उगते सूर्य के सहयोग से स्पष्टता लाते हैं।"],
    fix: ["Sit facing east or north while you study, with your back to a wall, and keep the desk clear.", "अध्ययन करते समय पूर्व या उत्तर की ओर मुख करें, पीठ दीवार की ओर रखें, और मेज़ साफ़ रखें।"] },
];

const RATING: Record<Rating, { key: Key; cell: string; badge: string }> = {
  best: { key: "vastu.best", cell: "bg-gold/35", badge: "border-gold bg-gold text-background" },
  good: { key: "vastu.good", cell: "bg-gold/20", badge: "border-gold/60 text-gold" },
  ok: { key: "vastu.ok", cell: "bg-gold/5", badge: "border-line text-cosmic-300" },
  avoid: { key: "vastu.avoid", cell: "bg-red-500/10", badge: "border-red-700/40 text-red-700 dark:border-red-300/30 dark:text-red-300" },
};

const FACING: { dir: Pair; why: Pair }[] = [
  { dir: ["East", "पूर्व"], why: ["Towards the rising sun: the general direction for japa and meditation.", "उगते सूर्य की ओर: जप और ध्यान के लिए सामान्य दिशा।"] },
  { dir: ["North", "उत्तर"], why: ["Towards Kubera and the Himalaya: for Lakshmi, wealth and guru sadhana.", "कुबेर और हिमालय की ओर: लक्ष्मी, धन और गुरु साधना के लिए।"] },
  { dir: ["North-east", "ईशान"], why: ["Ishana's corner: excellent for Shiva and all spiritual practice.", "ईशान का कोना: शिव और सभी आध्यात्मिक साधनाओं के लिए उत्तम।"] },
  { dir: ["South", "दक्षिण"], why: ["Only for pitru rites, and for fierce sadhanas when a guru has given them.", "केवल पितृ कर्म के लिए, और उग्र साधनाओं के लिए जब गुरु ने दी हों।"] },
];

const PLAN_KEY = "sadhak_vastu";
const COMPASS_NAMES = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export function VastuApp() {
  const { lang, t } = useLanguage();
  const [room, setRoom] = useState(ROOMS[0].id);
  const [plan, setPlan] = useState<Record<string, Dir>>({});
  const [heading, setHeading] = useState<number | null>(null);
  const [compassState, setCompassState] = useState<"idle" | "on" | "none">("idle");
  const gotReading = useRef(false);

  useEffect(() => {
    try {
      setPlan(JSON.parse(localStorage.getItem(PLAN_KEY) ?? "{}"));
    } catch {
      /* start with an empty plan */
    }
  }, []);
  const place = (dir: Dir) => {
    const next = { ...plan, [room]: dir };
    setPlan(next);
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify(next));
    } catch {
      /* remembered only if storage is available */
    }
  };

  const startCompass = async () => {
    const D = typeof window !== "undefined" ? (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent : undefined;
    if (!D) return setCompassState("none");
    if (D.requestPermission && (await D.requestPermission().catch(() => "denied")) !== "granted") return setCompassState("none");
    const onTurn = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
      const h = e.webkitCompassHeading ?? (e.absolute && e.alpha !== null ? 360 - e.alpha : null);
      if (h !== null && h !== undefined) {
        gotReading.current = true;
        setHeading(Math.round(h) % 360);
      }
    };
    window.addEventListener("deviceorientationabsolute", onTurn as EventListener);
    window.addEventListener("deviceorientation", onTurn as EventListener);
    setCompassState("on");
    // Desktops expose the event but never fire it; give a phone three seconds to answer.
    setTimeout(() => !gotReading.current && setCompassState("none"), 3000);
  };

  const current = ROOMS.find((r) => r.id === room)!;
  const chosen = plan[room];
  const rating = chosen ? current.ratings[chosen] : null;
  const summary = ROOMS.filter((r) => plan[r.id]).map((r) => `${say(r.name, "en")}: ${plan[r.id]}`).join(", ");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label={t("vastu.room")}>
        {ROOMS.map((r) => (
          <button key={r.id} type="button" role="tab" aria-selected={room === r.id} onClick={() => setRoom(r.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${room === r.id ? "border-gold bg-gold text-background" : "border-line text-cosmic-300 hover:border-gold/50"}`}>
            {say(r.name, lang)}{plan[r.id] && <span className="ml-1.5 text-xs opacity-70">· {plan[r.id]}</span>}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <p className="label-caps text-center text-[0.68rem]">{t("vastu.where")}</p>
          <p className="mt-1 text-center text-xs text-cosmic-500">▲ {t("vastu.north")}</p>
          <div className="mx-auto mt-4 grid aspect-square max-w-sm grid-cols-3 overflow-hidden rounded-xl border-2 border-gold/50">
            {GRID.map((d) => {
              const r = current.ratings[d];
              const selected = chosen === d;
              return (
                <button key={d} type="button" onClick={() => place(d)} aria-pressed={selected}
                        aria-label={`${say(DIR[d].name, lang)}: ${t(RATING[r].key)}`}
                        className={`flex flex-col items-center justify-center border border-gold/20 p-1 text-center transition-colors ${RATING[r].cell} ${selected ? "ring-2 ring-inset ring-gold" : "hover:bg-gold/25"}`}>
                  <span className="font-serif text-xl text-foreground">{d}</span>
                  <span className="text-[0.65rem] leading-tight text-cosmic-400">{say(DIR[d].ruler, lang)}</span>
                </button>
              );
            })}
          </div>
          <ul className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
            {(Object.keys(RATING) as Rating[]).map((r) => (
              <li key={r} className={`rounded-full border px-2.5 py-0.5 ${RATING[r].badge}`}>{t(RATING[r].key)}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <p className="label-caps text-[0.68rem]">{say(current.name, lang)}</p>
            {chosen && rating ? (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="font-serif text-3xl text-foreground">{say(DIR[chosen].name, lang)}</h2>
                  <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${RATING[rating].badge}`}>{t(RATING[rating].key)}</span>
                </div>
                <p className="mt-4 leading-relaxed text-cosmic-200">{say(current.why, lang)}</p>
                {rating !== "best" && <p className="mt-3 leading-relaxed text-cosmic-200">{say(current.fix, lang)}</p>}
              </>
            ) : (
              <p className="mt-3 text-cosmic-400">{t("vastu.pick")}</p>
            )}
          </div>

          {room === "puja" && (
            <div className="rounded-2xl border border-line bg-surface p-6">
              <p className="label-caps text-[0.68rem]">{t("vastu.face")}</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {FACING.map((f) => (
                  <li key={f.dir[0]}><span className="font-medium text-foreground">{say(f.dir, lang)}</span> <span className="text-cosmic-400">· {say(f.why, lang)}</span></li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="label-caps text-[0.68rem]">{t("vastu.compass")}</p>
            {compassState === "on" && heading !== null ? (
              <div className="mt-3 flex items-center gap-4">
                <svg viewBox="-30 -30 60 60" className="h-16 w-16" aria-hidden="true">
                  <circle r="27" fill="none" className="stroke-line" />
                  <g transform={`rotate(${-heading})`}>
                    <path d="M0 -24 L5 0 L0 -4 L-5 0Z" className="fill-gold" />
                    <text y="-14" textAnchor="middle" className="fill-background text-[7px] font-bold">N</text>
                  </g>
                </svg>
                <p className="text-cosmic-200">{t("vastu.heading")} <span className="font-serif text-2xl text-foreground">{COMPASS_NAMES[Math.round(heading / 45) % 8]}</span> <span className="text-cosmic-500">({heading}°)</span></p>
              </div>
            ) : compassState === "none" ? (
              <p className="mt-3 text-sm text-cosmic-400">{t("vastu.compassNone")}</p>
            ) : (
              <button type="button" onClick={startCompass} className="btn-ghost mt-3 px-4 py-2 text-sm"><Compass size={15} aria-hidden="true" /> {t("vastu.compassStart")}</button>
            )}
          </div>

          <Link href={`/chat?q=${encodeURIComponent(lang === "hi"
            ? `मेरे घर का वास्तु: ${summary || "अभी कुछ नहीं चुना"}। पूजा स्थान और साधना के लिए क्या सुधार करूँ?`
            : `My home's Vastu: ${summary || "nothing placed yet"}. What should I improve for my puja place and sadhana?`)}`} className="btn-gold">
            <MessageCircle size={16} aria-hidden="true" /> {t("nav.cta")}
          </Link>
          <p className="text-xs leading-relaxed text-cosmic-500">{t("vastu.note")}</p>
        </section>
      </div>
    </div>
  );
}

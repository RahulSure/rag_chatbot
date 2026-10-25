"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, MessageCircle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { say, type Pair } from "@/lib/jyotish-text";

type LineId = "heart" | "head" | "life" | "fate";

interface Choice {
  id: string;
  name: Pair;
  meaning: Pair;
  /** how to draw this choice on the hand */
  shape?: { long: boolean; longFingers: boolean };
  path?: string;
  dashed?: boolean;
}

interface Step {
  id: "shape" | LineId;
  title: Pair;
  look: Pair;
  choices: Choice[];
}

// Line paths on a right palm drawn in a 200 x 300 box (palm from y 120 to 250).
const STEPS: Step[] = [
  {
    id: "shape", title: ["Hand shape", "हाथ का आकार"],
    look: ["Compare the palm (square or longer than wide) and the fingers (shorter or longer than the palm).", "हथेली (चौकोर या लंबी) और उँगलियों (हथेली से छोटी या लंबी) की तुलना करें।"],
    choices: [
      { id: "earth", name: ["Earth: square palm, short fingers", "पृथ्वी: चौकोर हथेली, छोटी उँगलियाँ"], shape: { long: false, longFingers: false },
        meaning: ["Practical, steady and dependable. You trust what you can touch, work with your hands and keep your word.", "व्यावहारिक, स्थिर और भरोसेमंद। आप जो छू सकें उस पर विश्वास करते हैं, हाथों से काम करते हैं और वचन निभाते हैं।"] },
      { id: "air", name: ["Air: square palm, long fingers", "वायु: चौकोर हथेली, लंबी उँगलियाँ"], shape: { long: false, longFingers: true },
        meaning: ["Thoughtful, curious and articulate. Ideas and conversation feed you; the mind needs rest as much as the body.", "विचारशील, जिज्ञासु और वाक्पटु। विचार और संवाद आपको पोषण देते हैं; मन को भी शरीर जितना विश्राम चाहिए।"] },
      { id: "fire", name: ["Fire: long palm, short fingers", "अग्नि: लंबी हथेली, छोटी उँगलियाँ"], shape: { long: true, longFingers: false },
        meaning: ["Energetic, warm and quick to act. You lead with enthusiasm; patience is your sadhana.", "ऊर्जावान, उष्ण और शीघ्र कर्म करने वाले। आप उत्साह से नेतृत्व करते हैं; धैर्य ही आपकी साधना है।"] },
      { id: "water", name: ["Water: long palm, long fingers", "जल: लंबी हथेली, लंबी उँगलियाँ"], shape: { long: true, longFingers: true },
        meaning: ["Sensitive, intuitive and artistic. You feel deeply and are drawn to devotion and inner life.", "संवेदनशील, अंतर्ज्ञानी और कलात्मक। आप गहराई से अनुभव करते हैं और भक्ति तथा आंतरिक जीवन की ओर आकर्षित होते हैं।"] },
    ],
  },
  {
    id: "heart", title: ["Heart line", "हृदय रेखा"],
    look: ["The top line, starting under the little finger and running across.", "सबसे ऊपर की रेखा, जो छोटी उँगली के नीचे से आरम्भ होकर आर-पार जाती है।"],
    choices: [
      { id: "curved", name: ["Curves up between index and middle", "तर्जनी और मध्यमा के बीच ऊपर मुड़ती है"], path: "M160 138 C 130 136 100 142 82 118",
        meaning: ["Warm and expressive in love: you give your feelings openly.", "प्रेम में स्नेही और अभिव्यक्त: आप अपनी भावनाएँ खुलकर देते हैं।"] },
      { id: "straight", name: ["Runs straight across", "सीधी आर-पार जाती है"], path: "M160 138 L 52 142",
        meaning: ["Calm and practical in love: steady affection more than great displays.", "प्रेम में शांत और व्यावहारिक: बड़े प्रदर्शन से अधिक स्थिर स्नेह।"] },
      { id: "short", name: ["Ends under the middle finger", "मध्यमा के नीचे समाप्त होती है"], path: "M160 138 C 140 137 122 139 106 132",
        meaning: ["Independent in love: you need space, and love best in freedom.", "प्रेम में स्वतंत्र: आपको स्थान चाहिए, और आप स्वतंत्रता में सबसे अच्छा प्रेम करते हैं।"] },
      { id: "high", name: ["Ends high under the index finger", "तर्जनी के नीचे ऊँचाई पर समाप्त होती है"], path: "M160 138 C 120 136 80 136 60 114",
        meaning: ["Idealistic and devoted: you seek a love that is also a dharma.", "आदर्शवादी और समर्पित: आप ऐसा प्रेम चाहते हैं जो धर्म भी हो।"] },
    ],
  },
  {
    id: "head", title: ["Head line", "मस्तिष्क रेखा"],
    look: ["The middle line, starting at the edge of the palm between thumb and index finger.", "बीच की रेखा, जो अंगूठे और तर्जनी के बीच हथेली के किनारे से आरम्भ होती है।"],
    choices: [
      { id: "straight", name: ["Long and straight", "लंबी और सीधी"], path: "M44 160 L 156 168",
        meaning: ["Clear, logical and focused: you think in straight lines and finish what you plan.", "स्पष्ट, तार्किक और केंद्रित: आप सीधी रेखा में सोचते हैं और योजना पूरी करते हैं।"] },
      { id: "sloping", name: ["Slopes down towards the wrist", "कलाई की ओर नीचे झुकती है"], path: "M44 160 C 90 165 120 190 138 218",
        meaning: ["Imaginative and creative: intuition and images guide your thinking.", "कल्पनाशील और सृजनशील: अंतर्ज्ञान और कल्पना आपके चिंतन को दिशा देते हैं।"] },
      { id: "short", name: ["Short, ending mid-palm", "छोटी, हथेली के बीच समाप्त"], path: "M44 160 L 104 164",
        meaning: ["Quick and decisive: you prefer action to long deliberation.", "शीघ्र और निर्णायक: आप लंबे विचार से अधिक कर्म पसंद करते हैं।"] },
      { id: "forked", name: ["Splits into a fork at the end", "अंत में दो शाखाओं में बँटती है"], path: "M44 160 L 130 168 M130 168 L 156 162 M130 168 L 152 186",
        meaning: ["The writer's fork: you see both sides and can put thought into words.", "लेखक का कांटा: आप दोनों पक्ष देखते हैं और विचार को शब्दों में ढाल सकते हैं।"] },
    ],
  },
  {
    id: "life", title: ["Life line", "जीवन रेखा"],
    look: ["The curve around the base of the thumb.", "अंगूठे के मूल के चारों ओर की वक्र रेखा।"],
    choices: [
      { id: "wide", name: ["A wide arc into the palm", "हथेली में चौड़ा घेरा"], path: "M46 158 C 90 175 100 220 82 252",
        meaning: ["Vitality and enthusiasm: you have energy to share with others.", "जीवनी शक्ति और उत्साह: आपके पास दूसरों से बाँटने को ऊर्जा है।"] },
      { id: "close", name: ["Close to the thumb", "अंगूठे के पास"], path: "M46 158 C 64 172 70 214 64 252",
        meaning: ["Careful with energy: rest, routine and pranayama keep you strong.", "ऊर्जा में सावधान: विश्राम, दिनचर्या और प्राणायाम आपको सशक्त रखते हैं।"] },
      { id: "long", name: ["Long and unbroken to the wrist", "कलाई तक लंबी और अखंड"], path: "M46 158 C 80 174 92 220 76 262",
        meaning: ["Steady constitution and a settled life rhythm.", "स्थिर शरीर-प्रकृति और व्यवस्थित जीवन लय।"] },
      { id: "broken", name: ["Broken or chained in places", "कहीं-कहीं टूटी या जंजीरनुमा"], path: "M46 158 C 80 174 92 220 76 262", dashed: true,
        meaning: ["Times of change: new chapters in where you live or how you live. Not a sign of danger.", "परिवर्तन के समय: रहने के स्थान या जीवन शैली में नए अध्याय। यह संकट का संकेत नहीं है।"] },
    ],
  },
  {
    id: "fate", title: ["Fate line", "भाग्य रेखा"],
    look: ["A line running up the middle of the palm towards the middle finger. Many hands do not have one.", "हथेली के बीच से मध्यमा की ओर ऊपर जाती रेखा। कई हाथों में यह नहीं होती।"],
    choices: [
      { id: "clear", name: ["Clear, from the wrist upwards", "स्पष्ट, कलाई से ऊपर"], path: "M100 262 L 100 140",
        meaning: ["A strong sense of purpose: your path in work and life is clear to you.", "उद्देश्य की दृढ़ भावना: काम और जीवन में आपका मार्ग आपको स्पष्ट है।"] },
      { id: "late", name: ["Starts in the middle of the palm", "हथेली के बीच से आरम्भ"], path: "M100 205 L 100 140",
        meaning: ["You find your calling later, often after a turning point.", "आप अपना मार्ग बाद में पाते हैं, प्रायः किसी मोड़ के बाद।"] },
      { id: "none", name: ["Faint or absent", "हल्की या अनुपस्थित"], path: "",
        meaning: ["You make your own way: a free spirit, not bound to one track.", "आप अपना मार्ग स्वयं बनाते हैं: एक स्वतंत्र आत्मा, किसी एक लीक से न बँधी।"] },
    ],
  },
];

function Hand({ long = false, longFingers = false, line, dashed, focus }: { long?: boolean; longFingers?: boolean; line?: string; dashed?: boolean; focus?: string }) {
  const top = 120;
  const bottom = long ? 262 : 250;
  const f = longFingers ? 1.25 : 1;
  const fingers = [[50, 26, 58], [80, 27, 66], [111, 26, 62], [140, 22, 46]]; // x, width, length
  return (
    <svg viewBox="0 0 200 300" className="mx-auto h-64 w-auto sm:h-72" aria-hidden="true">
      <g fill="none" className="stroke-gold/50" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="38" y={top} width="128" height={bottom - top} rx="34" className="fill-surface-2" />
        {fingers.map(([x, w, l]) => (
          <rect key={x} x={x} y={top - l * f + 10} width={w} height={l * f} rx={w / 2} className="fill-surface-2" />
        ))}
        <rect x="6" y="150" width="30" height="78" rx="15" transform="rotate(-28 21 189)" className="fill-surface-2" />
        {/* the other main lines, faint, for orientation */}
        {focus !== "heart" && <path d="M160 138 C 130 136 100 142 82 118" className="stroke-gold/15" />}
        {focus !== "head" && <path d="M44 160 L 150 170" className="stroke-gold/15" />}
        {focus !== "life" && <path d="M46 158 C 80 174 92 220 76 252" className="stroke-gold/15" />}
      </g>
      {line && <path d={line} fill="none" className="stroke-gold" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={dashed ? "10 7" : undefined} />}
    </svg>
  );
}

export function PalmApp() {
  const { lang, t } = useLanguage();
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);

  const shape = STEPS[0].choices.find((c) => c.id === picks.shape)?.shape ?? { long: false, longFingers: false };
  const done = step >= STEPS.length;
  const current = STEPS[Math.min(step, STEPS.length - 1)];
  const chosen = (s: Step) => s.choices.find((c) => c.id === picks[s.id]);
  const q = STEPS.map((s) => `${say(s.title, lang)}: ${chosen(s) ? say(chosen(s)!.name, lang) : "—"}`).join("; ");

  const photoBox = (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-gold/40 p-4 text-center text-sm text-cosmic-400 hover:border-gold">
      {photo ? <img src={photo} alt="" className="max-h-72 rounded-lg object-contain" /> : <Camera size={22} className="text-gold" aria-hidden="true" />}
      <span>{t("palm.photo")}</span>
      <span className="text-xs text-cosmic-500">{t("palm.photoNote")}</span>
      <input type="file" accept="image/*" capture="environment" className="sr-only"
             onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
    </label>
  );

  if (done) {
    return (
      <div className="space-y-8">
        <section className="grid gap-8 rounded-2xl border border-gold/40 bg-surface p-6 sm:p-8 lg:grid-cols-[0.7fr_1.3fr]">
          <Hand {...shape} />
          <div>
            <p className="label-caps text-[0.68rem]">{t("palm.reading")}</p>
            <dl className="mt-4 divide-y divide-line">
              {STEPS.map((s) => {
                const c = chosen(s);
                return c ? (
                  <div key={s.id} className="py-4">
                    <dt className="font-serif text-xl text-foreground">{say(s.title, lang)} <span className="text-sm text-cosmic-500">· {say(c.name, lang)}</span></dt>
                    <dd className="mt-1 leading-relaxed text-cosmic-200">{say(c.meaning, lang)}</dd>
                  </div>
                ) : null;
              })}
            </dl>
          </div>
        </section>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={`/chat?q=${encodeURIComponent(lang === "hi" ? `मेरी हथेली: ${q}। इसके अनुसार मेरे लिए कौन सी साधना उपयुक्त है?` : `My palm: ${q}. Which sadhana suits me, given this?`)}`} className="btn-gold">
            <MessageCircle size={16} aria-hidden="true" /> {t("palm.ask")}
          </Link>
          <button type="button" onClick={() => { setPicks({}); setStep(0); }} className="btn-ghost"><RotateCcw size={15} aria-hidden="true" /> {t("palm.again")}</button>
        </div>
        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-cosmic-500">{t("palm.note")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ol className="flex flex-wrap justify-center gap-2 text-sm" aria-label={t("palm.step")}>
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button type="button" onClick={() => i <= step && setStep(i)} disabled={i > step}
                    className={`rounded-full border px-3.5 py-1.5 ${i === step ? "border-gold bg-gold text-background" : picks[s.id] ? "border-gold/50 text-gold" : "border-line text-cosmic-500"}`}>
              {i + 1}. {say(s.title, lang)}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h2 className="font-serif text-3xl text-foreground">{say(current.title, lang)}</h2>
          <p className="mt-2 text-cosmic-400">{say(current.look, lang)}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {current.choices.map((c) => {
              const active = picks[current.id] === c.id;
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => setPicks({ ...picks, [current.id]: c.id })} aria-pressed={active}
                          className={`flex h-full w-full flex-col items-center rounded-xl border p-3 text-center transition-colors ${active ? "border-gold bg-gold/10" : "border-line hover:border-gold/50"}`}>
                    <Hand {...(c.shape ?? shape)} line={c.path} dashed={c.dashed} focus={current.id} />
                    <span className="mt-2 text-sm text-foreground">{say(c.name, lang)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex justify-between gap-3">
            <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="btn-ghost px-4 py-2 text-sm disabled:opacity-30">
              <ArrowLeft size={15} aria-hidden="true" /> {t("palm.back")}
            </button>
            <button type="button" onClick={() => setStep(step + 1)} disabled={!picks[current.id]} className="btn-gold px-5 py-2 text-sm disabled:opacity-40">
              {step === STEPS.length - 1 ? t("palm.see") : t("palm.next")} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </section>
        <aside className="space-y-4">{photoBox}</aside>
      </div>
      <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-cosmic-500">{t("palm.note")}</p>
    </div>
  );
}

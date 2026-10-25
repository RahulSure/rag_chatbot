/**
 * Numerology and the Lo Shu grid, worked out in the browser.
 *
 * Moolank (driver) is the birth day reduced to one digit, bhagyank (conductor)
 * is every digit of the birth date reduced, the name number uses the Chaldean
 * letter values. The Lo Shu grid places each non-zero digit of the birth date,
 * plus the conductor and (for two-digit days) the driver, as is common in
 * Indian practice. Numbers map to the grahas of Vedic numerology. Remedies are
 * traditional observances only; the exact mantra comes from the books via Sadhak.
 */

import type { Lang } from "./i18n";

type Pair = [string, string]; // [English, Hindi]

/** Digit sum repeated until one digit remains; returns every step, e.g. [30, 3]. */
export function reduceChain(n: number): number[] {
  const chain = [n];
  while (chain[chain.length - 1] > 9) {
    chain.push(String(chain[chain.length - 1]).split("").reduce((a, d) => a + Number(d), 0));
  }
  return chain;
}

const digitSum = (s: string) => s.replace(/\D/g, "").split("").reduce((a, d) => a + Number(d), 0);

// Chaldean values; 9 is held sacred and given to no letter.
const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

/** null when the name has no Latin letters to count. */
export function nameNumber(name: string): number[] | null {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return null;
  return reduceChain(letters.split("").reduce((a, c) => a + CHALDEAN[c], 0));
}

// Lo Shu square: 4 9 2 / 3 5 7 / 8 1 6
export const LOSHU_LAYOUT = [4, 9, 2, 3, 5, 7, 8, 1, 6];

export type Source = "birth" | "driver" | "conductor";

export interface Reading {
  moolank: number[];
  bhagyank: number[];
  name: number[] | null;
  personalYear: { year: number; chain: number[] };
  /** digit → where each occurrence came from */
  grid: Record<number, Source[]>;
  missing: number[];
  repeated: { n: number; count: number }[];
  planes: { id: PlaneId; complete: boolean }[];
}

export function readNumbers(isoDate: string, name: string, today = new Date()): Reading {
  const [y, m, d] = isoDate.split("-").map(Number);
  const moolank = reduceChain(d);
  const bhagyank = reduceChain(digitSum(isoDate));
  const year = today.getFullYear();
  const personalYear = { year, chain: reduceChain(digitSum(`${d}${m}${year}`)) };

  const grid: Record<number, Source[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };
  `${String(d).padStart(2, "0")}${String(m).padStart(2, "0")}${y}`
    .split("")
    .map(Number)
    .filter((n) => n > 0)
    .forEach((n) => grid[n].push("birth"));
  if (d > 9) grid[moolank[moolank.length - 1]].push("driver");
  grid[bhagyank[bhagyank.length - 1]].push("conductor");

  const missing = LOSHU_LAYOUT.filter((n) => grid[n].length === 0).sort();
  const repeated = Object.entries(grid)
    .map(([n, s]) => ({ n: Number(n), count: s.length }))
    .filter((r) => r.count >= 3);
  const planes = PLANES.map((p) => ({ id: p.id, complete: p.numbers.every((n) => grid[n].length > 0) }));

  return { moolank, bhagyank, name: nameNumber(name), personalYear, grid, missing, repeated, planes };
}

// ── What the numbers mean ──────────────────────────────────────────────────

export interface NumberInfo {
  graha: Pair;
  deity: Pair;
  day: Pair;
  colour: Pair;
  traits: Pair;
  missing: Pair;
  remedy: Pair;
  /** question handed to Sadhak for the exact sadhana and mantra */
  ask: Pair;
}

export const NUMBERS: Record<number, NumberInfo> = {
  1: {
    graha: ["Sun", "सूर्य"], deity: ["Surya", "सूर्य देव"], day: ["Sunday", "रविवार"], colour: ["orange and gold", "नारंगी और सुनहरा"],
    traits: ["Leadership, self-reliance and a strong will. Number 1 likes to begin things and to stand on its own.",
      "नेतृत्व, आत्मनिर्भरता और दृढ़ इच्छाशक्ति। अंक 1 नई शुरुआत करना और अपने पैरों पर खड़े रहना पसंद करता है।"],
    missing: ["Confidence and saying what you feel may take effort.", "आत्मविश्वास और मन की बात कहने में प्रयास लग सकता है।"],
    remedy: ["Offer water to the rising sun on Sundays, and honour your father and elders.",
      "रविवार को उगते सूर्य को अर्घ्य दें, और पिता तथा बड़ों का सम्मान करें।"],
    ask: ["Which Surya sadhana strengthens the Sun and the number 1?", "सूर्य और अंक 1 को बल देने वाली सूर्य साधना कौन सी है?"],
  },
  2: {
    graha: ["Moon", "चंद्र"], deity: ["Shiva", "शिव"], day: ["Monday", "सोमवार"], colour: ["white and silver", "सफ़ेद और चाँदी"],
    traits: ["Sensitivity, intuition and care for others. Number 2 is gentle and brings people together.",
      "संवेदनशीलता, अंतर्ज्ञान और दूसरों की परवाह। अंक 2 कोमल है और लोगों को जोड़ता है।"],
    missing: ["Patience and reading other people's feelings may take work.", "धैर्य और दूसरों की भावनाएँ समझने पर काम करना पड़ सकता है।"],
    remedy: ["Offer water or milk to Shiva on Mondays, and keep a quiet hour for yourself each evening.",
      "सोमवार को शिव को जल या दूध अर्पित करें, और हर संध्या अपने लिए एक शांत समय रखें।"],
    ask: ["Which sadhana calms the Moon and strengthens the number 2?", "चंद्रमा को शांत करने और अंक 2 को बल देने वाली साधना कौन सी है?"],
  },
  3: {
    graha: ["Jupiter", "बृहस्पति"], deity: ["Guru and Vishnu", "गुरु और विष्णु"], day: ["Thursday", "गुरुवार"], colour: ["yellow", "पीला"],
    traits: ["Wisdom, learning and optimism. Number 3 is the teacher's number: it loves knowledge and sharing it.",
      "ज्ञान, विद्या और आशावाद। अंक 3 गुरु का अंक है: इसे ज्ञान पाना और बाँटना प्रिय है।"],
    missing: ["Imagination and clear thinking may take effort; studies need more discipline.",
      "कल्पना और स्पष्ट सोच में प्रयास लग सकता है; अध्ययन में अधिक अनुशासन चाहिए।"],
    remedy: ["On Thursdays, honour your guru and teachers, and sit with your guru mantra.",
      "गुरुवार को अपने गुरु और शिक्षकों का सम्मान करें, और गुरु मंत्र का जप करें।"],
    ask: ["Which Guru sadhana strengthens Jupiter and the number 3?", "बृहस्पति और अंक 3 को बल देने वाली गुरु साधना कौन सी है?"],
  },
  4: {
    graha: ["Rahu", "राहु"], deity: ["Durga", "दुर्गा"], day: ["Saturday", "शनिवार"], colour: ["grey and smoky blue", "धूसर और धुँधला नीला"],
    traits: ["Hard work, order and an unusual way of seeing. Number 4 builds patiently and questions the usual path.",
      "परिश्रम, व्यवस्था और अलग दृष्टि। अंक 4 धैर्य से निर्माण करता है और प्रचलित मार्ग पर प्रश्न करता है।"],
    missing: ["Order and steady effort may take work; plans can stay unfinished.",
      "व्यवस्था और निरंतर प्रयास पर काम करना पड़ सकता है; योजनाएँ अधूरी रह सकती हैं।"],
    remedy: ["Worship Durga, keep your space in order, and serve people in need on Saturdays.",
      "दुर्गा की उपासना करें, अपना स्थान व्यवस्थित रखें, और शनिवार को ज़रूरतमंदों की सेवा करें।"],
    ask: ["Which Durga sadhana pacifies Rahu and balances the number 4?", "राहु को शांत करने और अंक 4 को संतुलित करने वाली दुर्गा साधना कौन सी है?"],
  },
  5: {
    graha: ["Mercury", "बुध"], deity: ["Ganesha", "गणेश"], day: ["Wednesday", "बुधवार"], colour: ["green", "हरा"],
    traits: ["Quick thinking, speech and adaptability. Number 5 sits at the centre of the grid and balances the rest.",
      "तीव्र बुद्धि, वाणी और लचीलापन। अंक 5 ग्रिड के केंद्र में है और बाकी अंकों को संतुलित करता है।"],
    missing: ["The centre of the grid is empty: balance and steady focus need care.",
      "ग्रिड का केंद्र खाली है: संतुलन और एकाग्रता पर ध्यान देना होगा।"],
    remedy: ["Begin your practice with Ganesha on Wednesdays, and feed green grass to a cow.",
      "बुधवार को साधना का आरम्भ गणेश जी से करें, और गाय को हरी घास खिलाएँ।"],
    ask: ["Which Ganesha sadhana strengthens Mercury and the number 5?", "बुध और अंक 5 को बल देने वाली गणेश साधना कौन सी है?"],
  },
  6: {
    graha: ["Venus", "शुक्र"], deity: ["Lakshmi", "लक्ष्मी"], day: ["Friday", "शुक्रवार"], colour: ["white and soft pink", "सफ़ेद और हल्का गुलाबी"],
    traits: ["Love, beauty and care for home and family. Number 6 brings comfort, art and responsibility.",
      "प्रेम, सौन्दर्य और घर-परिवार की देखभाल। अंक 6 सुख, कला और उत्तरदायित्व देता है।"],
    missing: ["Home and close relationships may need more attention.", "घर और निकट संबंधों पर अधिक ध्यान देना पड़ सकता है।"],
    remedy: ["Light a ghee lamp for Lakshmi on Fridays, and keep your home clean and fragrant.",
      "शुक्रवार को लक्ष्मी के लिए घी का दीपक जलाएँ, और घर को स्वच्छ व सुगंधित रखें।"],
    ask: ["Which Lakshmi sadhana strengthens Venus and the number 6?", "शुक्र और अंक 6 को बल देने वाली लक्ष्मी साधना कौन सी है?"],
  },
  7: {
    graha: ["Ketu", "केतु"], deity: ["Ganesha", "गणेश"], day: ["Tuesday", "मंगलवार"], colour: ["grey and mixed colours", "धूसर और मिश्रित रंग"],
    traits: ["Inner search, intuition and detachment. Number 7 is the seeker's number, drawn to meditation and hidden knowledge.",
      "आंतरिक खोज, अंतर्ज्ञान और वैराग्य। अंक 7 साधक का अंक है, ध्यान और गूढ़ ज्ञान की ओर आकर्षित।"],
    missing: ["Quiet reflection may not come easily; a lesson can repeat until it is learnt.",
      "शांत चिंतन सहज नहीं होता; सीख तब तक दोहराई जा सकती है जब तक समझ न आए।"],
    remedy: ["Worship Ganesha, sit in silence for a few minutes every day, and feed a street dog.",
      "गणेश जी की उपासना करें, प्रतिदिन कुछ मिनट मौन बैठें, और किसी गली के कुत्ते को भोजन दें।"],
    ask: ["Which sadhana pacifies Ketu and strengthens the number 7?", "केतु को शांत करने और अंक 7 को बल देने वाली साधना कौन सी है?"],
  },
  8: {
    graha: ["Saturn", "शनि"], deity: ["Shani and Hanuman", "शनि और हनुमान"], day: ["Saturday", "शनिवार"], colour: ["dark blue and black", "गहरा नीला और काला"],
    traits: ["Patience, discipline and justice. Number 8 rewards steady effort, often later in life.",
      "धैर्य, अनुशासन और न्याय। अंक 8 निरंतर परिश्रम का फल देता है, प्रायः जीवन में आगे चलकर।"],
    missing: ["Money and long-term plans may need more care.", "धन और दीर्घकालिक योजनाओं पर अधिक ध्यान देना पड़ सकता है।"],
    remedy: ["Light a sesame-oil lamp at dusk on Saturdays, read the Hanuman Chalisa, and serve elders and workers.",
      "शनिवार को संध्या में तिल के तेल का दीपक जलाएँ, हनुमान चालीसा पढ़ें, और बुज़ुर्गों व श्रमिकों की सेवा करें।"],
    ask: ["Which Shani sadhana balances Saturn and the number 8?", "शनि और अंक 8 को संतुलित करने वाली शनि साधना कौन सी है?"],
  },
  9: {
    graha: ["Mars", "मंगल"], deity: ["Hanuman", "हनुमान"], day: ["Tuesday", "मंगलवार"], colour: ["red", "लाल"],
    traits: ["Courage, energy and service. Number 9 is generous and protective, and finishes what it begins.",
      "साहस, ऊर्जा और सेवा। अंक 9 उदार और रक्षक है, और जो आरम्भ करता है उसे पूरा करता है।"],
    missing: ["Drive and the courage to act may need building.", "उत्साह और कर्म करने का साहस बढ़ाने पर काम करना पड़ सकता है।"],
    remedy: ["Read the Hanuman Chalisa on Tuesdays, give red lentils (masoor) in charity, and guard against anger.",
      "मंगलवार को हनुमान चालीसा पढ़ें, लाल मसूर का दान करें, और क्रोध से बचें।"],
    ask: ["Which Hanuman sadhana strengthens Mars and the number 9?", "मंगल और अंक 9 को बल देने वाली हनुमान साधना कौन सी है?"],
  },
};

export type PlaneId = "mental" | "emotional" | "practical" | "thought" | "will" | "action" | "golden" | "silver";

interface Plane {
  id: PlaneId;
  numbers: number[];
  /** diagonals are yogas: shown only when complete */
  yoga: boolean;
  name: Pair;
  complete: Pair;
  missing: Pair;
}

export const PLANES: Plane[] = [
  { id: "mental", numbers: [4, 9, 2], yoga: false, name: ["Mental plane", "मानसिक तल"],
    complete: ["A sharp memory and a mind that plans well.", "तेज़ स्मरण शक्ति और योजना बनाने वाला मन।"],
    missing: ["Thinking things through needs patience; write your plans down.", "सोच-विचार में धैर्य चाहिए; योजनाएँ लिखकर रखें।"] },
  { id: "emotional", numbers: [3, 5, 7], yoga: false, name: ["Emotional plane", "भावनात्मक तल"],
    complete: ["Deep feeling, balanced by understanding.", "गहरी भावनाएँ, समझ से संतुलित।"],
    missing: ["Feelings may stay inside; share them with someone you trust.", "भावनाएँ भीतर रह सकती हैं; किसी विश्वसनीय व्यक्ति से बाँटें।"] },
  { id: "practical", numbers: [8, 1, 6], yoga: false, name: ["Practical plane", "व्यावहारिक तल"],
    complete: ["Good with money, things and getting work done.", "धन, वस्तुओं और काम पूरा करने में कुशल।"],
    missing: ["Practical matters go better with routines and help.", "व्यावहारिक काम दिनचर्या और सहायता से बेहतर होते हैं।"] },
  { id: "thought", numbers: [4, 3, 8], yoga: false, name: ["Thought plane", "विचार तल"],
    complete: ["Ideas turn into plans.", "विचार योजनाओं में बदलते हैं।"],
    missing: ["Ideas may stay ideas; pick one and act on it.", "विचार केवल विचार रह सकते हैं; एक चुनें और उस पर काम करें।"] },
  { id: "will", numbers: [9, 5, 1], yoga: false, name: ["Will plane", "इच्छाशक्ति तल"],
    complete: ["Determination that carries you through.", "दृढ़ संकल्प जो अंत तक ले जाता है।"],
    missing: ["Resolve may waver; a daily sankalpa helps.", "संकल्प डगमगा सकता है; प्रतिदिन संकल्प लेना सहायक है।"] },
  { id: "action", numbers: [2, 7, 6], yoga: false, name: ["Action plane", "कर्म तल"],
    complete: ["You act on what you feel.", "आप जो अनुभव करते हैं, उस पर कर्म करते हैं।"],
    missing: ["Starting can be hard; small first steps help.", "आरम्भ करना कठिन हो सकता है; छोटे पहले कदम सहायक हैं।"] },
  { id: "golden", numbers: [4, 5, 6], yoga: true, name: ["Golden yoga (success)", "स्वर्ण योग (सफलता)"],
    complete: ["The line of success: effort brings recognition and prosperity.", "सफलता की रेखा: परिश्रम से सम्मान और समृद्धि।"],
    missing: ["", ""] },
  { id: "silver", numbers: [2, 5, 8], yoga: true, name: ["Silver yoga (property)", "रजत योग (संपत्ति)"],
    complete: ["The line of property: a gift for building lasting assets.", "संपत्ति की रेखा: स्थायी संपत्ति बनाने का गुण।"],
    missing: ["", ""] },
];

export const PERSONAL_YEAR: Record<number, Pair> = {
  1: ["A year of beginnings: start the practice you have been putting off.", "आरम्भ का वर्ष: वह साधना शुरू करें जिसे आप टालते रहे हैं।"],
  2: ["A year of patience and partnership: let things grow slowly.", "धैर्य और साझेदारी का वर्ष: चीज़ों को धीरे-धीरे बढ़ने दें।"],
  3: ["A year of learning and expression: study, write, share.", "विद्या और अभिव्यक्ति का वर्ष: पढ़ें, लिखें, बाँटें।"],
  4: ["A year of foundations: steady work and order.", "नींव का वर्ष: निरंतर परिश्रम और व्यवस्था।"],
  5: ["A year of change and movement: stay flexible.", "परिवर्तन और गति का वर्ष: लचीले रहें।"],
  6: ["A year of home and responsibility: care for your family.", "घर और उत्तरदायित्व का वर्ष: परिवार की देखभाल करें।"],
  7: ["A year of inner work: deepen your sadhana and reflection.", "आंतरिक साधना का वर्ष: अपनी साधना और चिंतन को गहरा करें।"],
  8: ["A year of effort and reward: discipline pays.", "परिश्रम और फल का वर्ष: अनुशासन फल देता है।"],
  9: ["A year of completion: finish, forgive and let go.", "पूर्णता का वर्ष: पूरा करें, क्षमा करें और छोड़ दें।"],
};

export const pick = (pair: Pair, lang: Lang) => (lang === "hi" ? pair[1] : pair[0]);

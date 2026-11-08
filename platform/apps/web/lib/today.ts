/**
 * "Today, at your place" — the practice traditionally tied to the day.
 *
 * Built from the live panchang (tithi, paksha, nakshatra, weekday). These are
 * the common observances of the tradition (Ekadashi for Vishnu, Pradosh for
 * Shiva, Saturday for Shani …). No mantra text lives here on purpose: the page
 * sends the visitor to Sadhak for the exact mantra and method from the books.
 */

import type { Panchang } from "./api";
import type { Lang } from "./i18n";

const TITHI_HI: Record<number, string> = {
  1: "प्रतिपदा", 2: "द्वितीया", 3: "तृतीया", 4: "चतुर्थी", 5: "पंचमी", 6: "षष्ठी", 7: "सप्तमी", 8: "अष्टमी",
  9: "नवमी", 10: "दशमी", 11: "एकादशी", 12: "द्वादशी", 13: "त्रयोदशी", 14: "चतुर्दशी", 15: "पूर्णिमा", 30: "अमावस्या",
};

// Observance of the tithi: [English, Hindi]. Keyed by day of the fortnight; 15 is Purnima, 30 Amavasya.
const TITHI_PRACTICE: Record<number, [string, string]> = {
  1: ["A day for beginnings: a good day to start a new sadhana.", "आरम्भ का दिन: नई साधना शुरू करने के लिए शुभ।"],
  2: ["A gentle day for steady japa and for keeping a vow you have begun.", "आरम्भ किए संकल्प को स्थिर जप से निभाने का दिन।"],
  3: ["Tritiya belongs to Gauri: a day for devotion to the Devi.", "तृतीया गौरी की तिथि है: देवी की भक्ति का दिन।"],
  4: ["Chaturthi is Ganesha's tithi: begin with him and ask him to clear the way.", "चतुर्थी गणेश जी की तिथि है: उन्हीं से आरम्भ करें, बाधाएँ दूर होने की प्रार्थना के साथ।"],
  5: ["Panchami is kept for the Naga devatas and for Saraswati.", "पंचमी नाग देवताओं और सरस्वती की तिथि है।"],
  6: ["Shashthi is the tithi of Skanda, Kartikeya.", "षष्ठी स्कंद, कार्तिकेय की तिथि है।"],
  7: ["Saptami belongs to Surya: offer water to the rising sun.", "सप्तमी सूर्य की तिथि है: उगते सूर्य को अर्घ्य दें।"],
  8: ["Ashtami is for Durga, and in the dark fortnight for Bhairava.", "अष्टमी दुर्गा की तिथि है, और कृष्ण पक्ष में भैरव की।"],
  9: ["Navami is a day for the Devi, and for Rama.", "नवमी देवी और श्रीराम की तिथि है।"],
  10: ["Dashami is a day of resolve: finish what the fortnight began.", "दशमी संकल्प का दिन है: पक्ष में आरम्भ किया कार्य पूरा करें।"],
  11: ["Ekadashi is Vishnu's day: fasting and japa are traditional.", "एकादशी विष्णु का दिन है: व्रत और जप की परम्परा है।"],
  12: ["Dwadashi follows the Ekadashi fast: a day for Vishnu and for giving.", "द्वादशी एकादशी व्रत के बाद आती है: विष्णु पूजा और दान का दिन।"],
  13: ["Trayodashi brings Pradosh: worship Shiva at dusk.", "त्रयोदशी को प्रदोष होता है: संध्या के समय शिव की उपासना करें।"],
  14: ["Chaturdashi is Shiva's tithi; in the dark fortnight it is Masik Shivaratri.", "चतुर्दशी शिव की तिथि है; कृष्ण पक्ष में यह मासिक शिवरात्रि होती है।"],
  15: ["Purnima, the full moon, is the Guru's day: a day for guru mantra and gratitude.", "पूर्णिमा गुरु का दिन है: गुरु मंत्र और कृतज्ञता का दिन।"],
  30: ["Amavasya, the new moon, is for the ancestors: a lamp and tarpan, and for Kali.", "अमावस्या पितरों का दिन है: दीपक और तर्पण, तथा काली की उपासना।"],
};

// Weekday: [ruler English, ruler Hindi, practice English, practice Hindi]
const VARA: Record<string, [string, string, string, string]> = {
  Sunday: ["Surya", "सूर्य", "Offer water to the sun at sunrise.", "सूर्योदय पर सूर्य को अर्घ्य दें।"],
  Monday: ["Shiva and the Moon", "शिव और चंद्र", "Offer water to Shiva and sit for japa.", "शिव को जल अर्पित करें और जप करें।"],
  Tuesday: ["Hanuman and Mangal", "हनुमान और मंगल", "Read the Hanuman Chalisa.", "हनुमान चालीसा का पाठ करें।"],
  Wednesday: ["Ganesha and Budh", "गणेश और बुध", "Begin your japa with Ganesha.", "जप का आरम्भ गणेश जी से करें।"],
  Thursday: ["the Guru and Vishnu", "गुरु और विष्णु", "Sit with your guru mantra.", "गुरु मंत्र का जप करें।"],
  Friday: ["Lakshmi and Shukra", "लक्ष्मी और शुक्र", "Light a ghee lamp for Lakshmi.", "लक्ष्मी के लिए घी का दीपक जलाएँ।"],
  Saturday: ["Shani and Hanuman", "शनि और हनुमान", "Light a sesame-oil lamp at dusk.", "संध्या को तिल के तेल का दीपक जलाएँ।"],
};

const WEEKDAY_HI: Record<string, string> = {
  Sunday: "रविवार", Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार",
  Thursday: "गुरुवार", Friday: "शुक्रवार", Saturday: "शनिवार",
};

export interface TodayReading {
  /** day of the fortnight shown large: 1–15, or 30 for Amavasya */
  day: number;
  tithi: string;
  paragraph: string;
  /** question handed to the chat when the visitor asks how */
  question: string;
}

export function todayReading(p: Panchang, lang: Lang): TodayReading {
  const n = p.tithi.number;
  const day = n === 30 ? 30 : n > 15 ? n - 15 : n;
  const shukla = p.tithi.paksha === "Shukla";
  const [tithiEn, tithiHi] = TITHI_PRACTICE[day] ?? TITHI_PRACTICE[1];
  const [rulerEn, rulerHi, varaEn, varaHi] = VARA[p.vara] ?? VARA.Sunday;
  const tithiName = lang === "hi" ? TITHI_HI[day] ?? p.tithi.name : p.tithi.name;
  const nakshatra = lang === "hi" ? p.nakshatra.name_hi ?? p.nakshatra.name : p.nakshatra.name;

  if (lang === "hi") {
    const paksha = day === 15 || day === 30 ? "" : shukla ? "शुक्ल पक्ष की " : "कृष्ण पक्ष की ";
    return {
      day,
      tithi: tithiName,
      paragraph:
        `आज ${paksha}${tithiName} है। चंद्रमा ${nakshatra} नक्षत्र में है, और आज ${WEEKDAY_HI[p.vara] ?? p.vara} है, ` +
        `${rulerHi} का दिन। ${tithiHi} ${varaHi} साधना के लिए सबसे अच्छा समय ब्रह्म मुहूर्त है, सूर्योदय से लगभग ` +
        `डेढ़ घंटा पहले। साधक आपको पुस्तकों से सटीक मंत्र और विधि बताएगा, और पहले आपके बारे में थोड़ा पूछेगा, ` +
        `ताकि साधना आपके अनुभव और दीक्षा के अनुकूल हो।`,
      question: `आज ${paksha}${tithiName} और ${WEEKDAY_HI[p.vara] ?? p.vara} है। आज मुझे कौन सी साधना करनी चाहिए और उसकी विधि क्या है?`,
    };
  }

  const paksha = day === 15 || day === 30 ? "" : `${shukla ? "Shukla" : "Krishna"} `;
  const fortnight = day === 15 || day === 30 ? "" : `, day ${day} of the ${shukla ? "bright" : "dark"} fortnight`;
  return {
    day,
    tithi: tithiName,
    paragraph:
      `Today is ${paksha}${tithiName}${fortnight}. The Moon is in ${nakshatra}, and it is ${p.vara}, the day of ${rulerEn}. ` +
      `${tithiEn} ${varaEn} The best hour for practice is Brahma muhurta, about an hour and a half before sunrise. ` +
      `Sadhak can give you the exact mantra and method from the books, and asks a little about you first, ` +
      `so the practice fits your experience and your diksha.`,
    question: `Today is ${paksha}${tithiName} and ${p.vara}. Which sadhana should I do today, and how?`,
  };
}

"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

interface Need {
  deva: string;
  name: string;
  en: string;
  hi: string;
  q: [string, string];
}

// Each card opens the chat with a question; Sadhak asks about the seeker before it prescribes.
const NEEDS: Need[] = [
  { deva: "लक्ष्मी", name: "Lakshmi", en: "Wealth and a steady income", hi: "धन और स्थिर आय",
    q: ["I want a Lakshmi sadhana for wealth and a steady income", "धन और स्थिर आय के लिए लक्ष्मी साधना बताइए"] },
  { deva: "सरस्वती", name: "Saraswati", en: "Learning, memory and clear speech", hi: "विद्या, स्मरण शक्ति और वाणी",
    q: ["Which Saraswati sadhana helps with study and memory?", "पढ़ाई और स्मरण शक्ति के लिए सरस्वती साधना बताइए"] },
  { deva: "बगलामुखी", name: "Baglamukhi", en: "Protection from enemies and disputes", hi: "शत्रु और विवाद से रक्षा",
    q: ["I need Baglamukhi sadhana for protection from enemies", "शत्रुओं से रक्षा के लिए बगलामुखी साधना बताइए"] },
  { deva: "हनुमान", name: "Hanuman", en: "Strength, courage, freedom from fear", hi: "बल, साहस और भय से मुक्ति",
    q: ["A Hanuman sadhana for courage and to remove fear", "भय दूर करने और साहस के लिए हनुमान साधना बताइए"] },
  { deva: "शिव", name: "Shiva", en: "Peace of mind and stillness", hi: "मन की शांति और स्थिरता",
    q: ["Which Shiva sadhana brings peace of mind?", "मन की शांति के लिए शिव साधना बताइए"] },
  { deva: "गणेश", name: "Ganesha", en: "Good beginnings, obstacles removed", hi: "शुभ आरम्भ, विघ्नों का नाश",
    q: ["A Ganesha sadhana to remove obstacles before a new start", "नए कार्य से पहले विघ्न दूर करने के लिए गणेश साधना बताइए"] },
  { deva: "शनि", name: "Shani", en: "Relief during Sade Sati", hi: "साढ़ेसाती में राहत",
    q: ["I am in Sade Sati. Which Shani sadhana should I do?", "मेरी साढ़ेसाती चल रही है। कौन सी शनि साधना करूँ?"] },
  { deva: "कुण्डलिनी", name: "Kundalini", en: "Meditation and awakening", hi: "ध्यान और जागरण",
    q: ["How do I begin kundalini meditation safely?", "कुण्डलिनी ध्यान सुरक्षित रूप से कैसे आरम्भ करें?"] },
  { deva: "गुरु", name: "Guru", en: "Diksha and the guru mantra", hi: "दीक्षा और गुरु मंत्र",
    q: ["What is guru diksha and how do I practise the guru mantra?", "गुरु दीक्षा क्या है और गुरु मंत्र का जप कैसे करें?"] },
  { deva: "गौरी", name: "Gauri", en: "Harmony in marriage", hi: "दाम्पत्य में सामंजस्य",
    q: ["A sadhana for harmony in my marriage", "दाम्पत्य जीवन में सामंजस्य के लिए साधना बताइए"] },
  { deva: "सौन्दर्य", name: "Saundarya", en: "Radiance and charm", hi: "सौन्दर्य और आकर्षण",
    q: ["Tell me about Saundarya sadhana for radiance", "सौन्दर्य साधना के बारे में बताइए"] },
  { deva: "पितृ", name: "Pitru", en: "Peace for the ancestors", hi: "पितरों की शांति",
    q: ["Which sadhana brings peace to my ancestors (pitru dosha)?", "पितृ दोष की शांति के लिए कौन सी साधना करें?"] },
];

export function SadhanaNeeds() {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";

  return (
    <section className="border-t border-line bg-surface-2/60 px-4 py-20 sm:py-28" aria-labelledby="needs-title">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="needs-title" className="text-4xl leading-tight sm:text-5xl">
            {t("v4.needsTitle")} <em className="text-gold">{t("v4.needsAccent")}</em>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-cosmic-300">{t("v4.needsLead")}</p>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {NEEDS.map((n) => (
            <li key={n.name}>
              <Link
                href={`/chat?q=${encodeURIComponent(hi ? n.q[1] : n.q[0])}`}
                className="cosmic-card group flex h-full flex-col p-4 sm:p-6"
              >
                <span lang="hi" className="font-serif text-2xl text-gold sm:text-3xl">{n.deva}</span>
                {!hi && <span className="mt-3 font-medium text-foreground">{n.name}</span>}
                <span className={`${hi ? "mt-3" : "mt-1"} text-sm leading-snug text-cosmic-400`}>{hi ? n.hi : n.en}</span>
                <span aria-hidden="true" className="mt-auto pt-4 text-sm text-cosmic-500 transition-colors group-hover:text-gold">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

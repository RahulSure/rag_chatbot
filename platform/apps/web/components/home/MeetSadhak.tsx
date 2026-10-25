"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import replies from "@/lib/showcase-replies.json";

// Tab names for the three recorded conversations, in the order of showcase-replies.json.
const TABS: [string, string][] = [
  ["Lakshmi sadhana", "लक्ष्मी साधना"],
  ["Career", "करियर"],
  ["Vashikaran", "वशीकरण"],
];

/** A real exchange, shown as the chat window it came from. */
export function MeetSadhak() {
  const { lang, t } = useLanguage();
  const [active, setActive] = useState(0);
  const convo = replies[active];

  return (
    <section className="px-4 py-20 sm:py-28" aria-labelledby="meet-title">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="label-caps">{t("v4.sampleLabel")}</p>
          <h2 id="meet-title" className="mt-4 text-4xl leading-tight sm:text-5xl">
            {t("v4.meetTitle")} <em className="text-gold">{t("v4.meetAccent")}</em>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-cosmic-200">{t("v4.meetLead")}</p>
          <p className="mt-4 leading-relaxed text-cosmic-400">{t("v4.sampleNote")}</p>
          <Link href="/chat" className="btn-gold mt-8">
            {t("nav.cta")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-cosmic">
          <div role="tablist" aria-label={t("v4.sampleLabel")} className="flex overflow-x-auto border-b border-line">
            {TABS.map(([en, hi], i) => (
              <button
                key={en}
                role="tab"
                type="button"
                id={`convo-tab-${i}`}
                aria-selected={active === i}
                aria-controls="convo-panel"
                onClick={() => setActive(i)}
                className={`whitespace-nowrap border-b-2 px-5 py-3.5 text-sm transition-colors ${
                  active === i ? "border-gold text-foreground" : "border-transparent text-cosmic-400 hover:text-foreground"
                }`}
              >
                {lang === "hi" ? hi : en}
              </button>
            ))}
          </div>

          <div id="convo-panel" role="tabpanel" aria-labelledby={`convo-tab-${active}`} className="space-y-5 p-5 sm:p-7">
            <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-gold/15 px-4 py-3 text-foreground">
              {convo.question}
            </p>
            <div className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 font-serif text-lg text-gold"
              >
                स
              </span>
              <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-cosmic-200">{convo.reply}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-line bg-surface-2 px-5 py-3.5 sm:px-7">
            <span className="text-xs text-cosmic-500">{t("v4.askNote")}</span>
            <Link
              href={`/chat?q=${encodeURIComponent(convo.question)}`}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm text-gold hover:underline"
            >
              {t("nav.cta")} <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

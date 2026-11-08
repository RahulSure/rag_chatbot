"use client";

import { useT, type Key } from "@/lib/i18n";

const ITEMS: [Key, Key][] = [
  ["v4.faq1q", "v4.faq1a"],
  ["v4.faq2q", "v4.faq2a"],
  ["v4.faq3q", "v4.faq3a"],
  ["v4.faq4q", "v4.faq4a"],
  ["v4.faq5q", "v4.faq5a"],
];

export function Faq() {
  const t = useT();
  return (
    <section className="border-t border-line bg-surface-2/60 px-4 py-20 sm:py-28" aria-labelledby="faq-title">
      <div className="mx-auto max-w-3xl">
        <h2 id="faq-title" className="text-center text-4xl leading-tight sm:text-5xl">
          {t("v4.faqTitle")} <em className="text-gold">{t("v4.faqAccent")}</em>
        </h2>
        <div className="mt-12 divide-y divide-line border-y border-line">
          {ITEMS.map(([q, a], i) => (
            <details key={q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg text-foreground [&::-webkit-details-marker]:hidden">
                {t(q)}
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"
                     className="shrink-0 text-gold transition-transform group-open:rotate-45">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </summary>
              <p className="pb-6 pr-10 leading-relaxed text-cosmic-300">{t(a)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useT, type Key } from "@/lib/i18n";

// Small line drawings in the chart's own language, one per tool.
const GLYPHS: Record<string, React.ReactNode> = {
  kundli: (
    <>
      <rect x="4" y="4" width="32" height="32" />
      <path d="M4 4 36 36M36 4 4 36M20 4 36 20 20 36 4 20Z" />
    </>
  ),
  panchang: (
    <>
      <circle cx="20" cy="20" r="15" />
      <path d="M20 5a15 15 0 0 1 0 30a9 15 0 0 0 0-30Z" fill="currentColor" stroke="none" />
    </>
  ),
  dasha: <path d="M5 10h30M5 17h18M5 24h26M5 31h11" />,
  sadeSati: (
    <>
      <circle cx="20" cy="20" r="6" />
      <ellipse cx="20" cy="20" rx="16" ry="6" transform="rotate(-20 20 20)" />
    </>
  ),
  numerology: (
    <>
      <rect x="5" y="5" width="30" height="30" />
      <path d="M15 5v30M25 5v30M5 15h30M5 25h30" />
    </>
  ),
  tarot: (
    <>
      <rect x="10" y="3" width="20" height="34" rx="2" />
      <path d="M20 13l1.8 4.2 4.2 1.8-4.2 1.8L20 25l-1.8-4.2L14 19l4.2-1.8Z" />
    </>
  ),
  matching: (
    <>
      <path d="M14 6 26 18 14 30 2 18Z" />
      <path d="M26 10 38 22 26 34 14 22Z" />
    </>
  ),
  mangal: (
    <>
      <circle cx="17" cy="23" r="11" />
      <path d="M25 15 35 5M27 5h8v8" />
    </>
  ),
};

const TOOLS: { id: string; title: Key; desc: Key; href?: string }[] = [
  { id: "kundli", title: "v4.toolKundli", desc: "v4.toolKundliDesc", href: "/kundli" },
  { id: "panchang", title: "v4.toolPanchang", desc: "v4.toolPanchangDesc", href: "/#today" },
  { id: "dasha", title: "v4.toolDasha", desc: "v4.toolDashaDesc", href: "/kundli" },
  { id: "sadeSati", title: "v4.toolSadeSati", desc: "v4.toolSadeSatiDesc", href: "/kundli" },
  { id: "numerology", title: "v4.toolNumerology", desc: "v4.toolNumerologyDesc", href: "/numerology" },
  { id: "tarot", title: "v4.toolTarot", desc: "v4.toolTarotDesc", href: "/tarot" },
  { id: "matching", title: "v4.toolMatching", desc: "v4.toolMatchingDesc" },
  { id: "mangal", title: "v4.toolMangal", desc: "v4.toolMangalDesc" },
];

export function FreeTools() {
  const t = useT();
  return (
    <section className="border-t border-line bg-surface-2/60 px-4 py-20 sm:py-28" aria-labelledby="tools-title">
      <div className="mx-auto max-w-6xl">
        <h2 id="tools-title" className="text-center text-4xl leading-tight sm:text-5xl">
          {t("v4.toolsTitle")} <em className="text-gold">{t("v4.toolsAccent")}</em>
        </h2>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => {
            const body = (
              <>
                <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor"
                     strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" className="text-gold">
                  {GLYPHS[tool.id]}
                </svg>
                <span className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-serif text-2xl text-foreground">{t(tool.title)}</span>
                  {!tool.href && (
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-[0.7rem] uppercase tracking-wider text-cosmic-500">
                      {t("v4.comingSoon")}
                    </span>
                  )}
                </span>
                <span className="mt-2 leading-relaxed text-cosmic-400">{t(tool.desc)}</span>
              </>
            );
            return (
              <li key={tool.id}>
                {tool.href ? (
                  <Link href={tool.href} className="cosmic-card flex h-full flex-col p-6 sm:p-7">{body}</Link>
                ) : (
                  <div className="cosmic-card flex h-full flex-col p-6 opacity-70 sm:p-7">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

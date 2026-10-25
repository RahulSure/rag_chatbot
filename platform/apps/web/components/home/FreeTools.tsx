"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT, type Key } from "@/lib/i18n";

// Small line drawings in the chart's own language, one per tool.
const GLYPHS: Record<string, React.ReactNode> = {
  kundli: (
    <>
      <rect x="4" y="4" width="32" height="32" />
      <path d="M4 4 36 36M36 4 4 36M20 4 36 20 20 36 4 20Z" />
    </>
  ),
  day: (
    <>
      <circle cx="20" cy="20" r="7" />
      <path d="M20 4v5M20 31v5M4 20h5M31 20h5M8.7 8.7l3.5 3.5M27.8 27.8l3.5 3.5M8.7 31.3l3.5-3.5M27.8 12.2l3.5-3.5" />
    </>
  ),
  muhurat: (
    <>
      <path d="M4 28h32M12 28a8 8 0 0 1 16 0" />
      <path d="M20 10v5M9 15l3 3M31 15l-3 3" />
    </>
  ),
  matching: (
    <>
      <path d="M14 6 26 18 14 30 2 18Z" />
      <path d="M26 10 38 22 26 34 14 22Z" />
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
  japa: (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * 2 * Math.PI;
        return <circle key={i} cx={Math.round((20 + 13 * Math.sin(a)) * 10) / 10} cy={Math.round((22 - 13 * Math.cos(a)) * 10) / 10} r="2" />;
      })}
      <circle cx="20" cy="5" r="2.6" fill="currentColor" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="7" width="32" height="29" rx="2" />
      <path d="M4 15h32M12 3v7M28 3v7" />
      <circle cx="26" cy="26" r="4.5" />
      <path d="M26 21.5a4.5 4.5 0 0 1 0 9a3 4.5 0 0 0 0-9Z" fill="currentColor" stroke="none" />
    </>
  ),
};

const TOOLS: { id: string; title: Key; desc: Key; href: string }[] = [
  { id: "kundli", title: "v4.toolKundli", desc: "v4.toolKundliDesc", href: "/kundli" },
  { id: "day", title: "day.label", desc: "tools.dayDesc", href: "/my-day" },
  { id: "muhurat", title: "mu.nav", desc: "mu.navDesc", href: "/muhurat" },
  { id: "matching", title: "v4.toolMatching", desc: "tools.matchingDesc", href: "/matching" },
  { id: "numerology", title: "v4.toolNumerology", desc: "v4.toolNumerologyDesc", href: "/numerology" },
  { id: "tarot", title: "v4.toolTarot", desc: "v4.toolTarotDesc", href: "/tarot" },
  { id: "japa", title: "tools.japaShort", desc: "tools.japaDesc", href: "/japa" },
  { id: "calendar", title: "cal.label", desc: "tools.calDesc", href: "/calendar" },
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
          {TOOLS.map((tool) => (
            <li key={tool.id}>
              <Link href={tool.href} className="cosmic-card flex h-full flex-col p-6 sm:p-7">
                <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor"
                     strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" className="text-gold">
                  {GLYPHS[tool.id]}
                </svg>
                <span className="mt-5 font-serif text-2xl text-foreground">{t(tool.title)}</span>
                <span className="mt-2 leading-relaxed text-cosmic-400">{t(tool.desc)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center">
          <Link href="/tools" className="btn-ghost">
            {t("tools.all")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </div>
    </section>
  );
}

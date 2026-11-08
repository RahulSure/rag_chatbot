"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { NAKSHATRAS } from "@/lib/nakshatras";
import { NakshatraCard } from "@/components/kundli/ChartPanels";

const SPAN = 360 / 27;
// Rounded so the server-rendered SVG and the browser's agree to the last digit.
const r2 = (n: number) => Math.round(n * 100) / 100;

function arc(i: number, inner: number, outer: number) {
  const a0 = ((i * SPAN - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * SPAN - 90) * Math.PI) / 180;
  const p = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  return `M ${p(outer, a0)} A ${outer} ${outer} 0 0 1 ${p(outer, a1)} L ${p(inner, a1)} A ${inner} ${inner} 0 0 0 ${p(inner, a0)} Z`;
}

/** A wheel of the 27 nakshatras from 0° Aries; choose one to read it. */
export function NakshatraExplorer() {
  const { lang, t } = useLanguage();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get("n"));
    if (Number.isInteger(n) && n >= 0 && n < 27) setSelected(n);
  }, []);

  const n = NAKSHATRAS[selected];
  const q = lang === "hi"
    ? `${n.hi} नक्षत्र के बारे में बताइए: इसके देवता, गुण और इसके लिए उपयुक्त साधना।`
    : `Tell me about the nakshatra ${n.name}: its deity, its qualities and the sadhana that suits it.`;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-2">
      <svg viewBox="-210 -210 420 420" className="mx-auto w-full max-w-lg" role="group" aria-label={t("nak.title")}>
        {NAKSHATRAS.map((x, i) => {
          const mid = ((i + 0.5) * SPAN - 90) * (Math.PI / 180);
          const active = i === selected;
          return (
            <g key={x.name} role="button" tabIndex={0} aria-pressed={active} aria-label={lang === "hi" ? x.hi : x.name}
               onClick={() => setSelected(i)}
               onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(i))}
               className="cursor-pointer outline-none [&:focus-visible>path]:stroke-gold">
              <path d={arc(i, 120, 200)} className={`stroke-gold/40 transition-colors ${active ? "fill-gold" : "fill-surface hover:fill-gold/15"}`} />
              <text x={r2(160 * Math.cos(mid))} y={r2(160 * Math.sin(mid))} textAnchor="middle" dominantBaseline="middle"
                    className={`text-[15px] ${active ? "fill-background font-semibold" : "fill-cosmic-300"}`}>{i + 1}</text>
            </g>
          );
        })}
        {Array.from({ length: 12 }, (_, s) => {
          const a = ((s * 30 - 90) * Math.PI) / 180;
          return <line key={s} x1={r2(112 * Math.cos(a))} y1={r2(112 * Math.sin(a))} x2={r2(92 * Math.cos(a))} y2={r2(92 * Math.sin(a))} className="stroke-gold/50" />;
        })}
        <circle r="92" fill="none" className="stroke-line" />
        <text y="-8" textAnchor="middle" className="fill-gold font-serif text-[26px]">{lang === "hi" ? n.hi : n.name}</text>
        <text y="22" textAnchor="middle" className="fill-cosmic-400 text-[12px]">
          {(selected * SPAN).toFixed(2)}° – {((selected + 1) * SPAN).toFixed(2)}°
        </text>
      </svg>
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <NakshatraCard index={selected} lang={lang} t={t} />
        <Link href={`/chat?q=${encodeURIComponent(q)}`} className="btn-gold mt-8">
          <MessageCircle size={16} aria-hidden="true" /> {t("nav.cta")}
        </Link>
      </section>
    </div>
  );
}

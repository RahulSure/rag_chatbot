"use client";

import type { MaitriReason } from "@/lib/api";
import { graha } from "@/lib/jyotish-text";
import type { Key, Lang } from "@/lib/i18n";
import { fill, keyOf } from "../shared";

export function reasonText(r: MaitriReason, t: (k: Key) => string, lang: Lang) {
  const text = t(keyOf("ganga.r.", r.code, "ganga.err.generic"));
  if (r.code === "shared_practice") {
    const items = (r.items ?? []).map((p) => t(keyOf("ganga.p.", p, "ganga.p.japa")));
    return fill(text, { items: new Intl.ListFormat(lang === "hi" ? "hi-IN" : "en", { type: "conjunction" }).format(items) });
  }
  if (r.code === "moon_friends") return fill(text, { a: graha(String(r.a), lang), b: graha(String(r.b), lang) });
  if (r.code === "same_gana") return fill(text, { gana: t(keyOf("ganga.gana.", String(r.gana), "ganga.gana.Deva")) });
  return fill(text, { a: r.a ?? "", b: r.b ?? "" });
}

/** The friendship score as a small dial: the arc fills with the score. */
export function MaitriDial({ score }: { score: number }) {
  const c = 2 * Math.PI * 22;
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 shrink-0" aria-hidden="true">
      <circle cx="28" cy="28" r="22" fill="none" strokeWidth="3" className="stroke-line" />
      <circle cx="28" cy="28" r="22" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-gold"
              strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 28 28)" />
      <text x="28" y="33" textAnchor="middle" className="fill-foreground font-serif text-[17px] lining-nums">{score}</text>
    </svg>
  );
}

"use client";

/**
 * What this river is, and what it is for — the tradition, how the matching
 * works, and the intention (no feed, no likes; a friend on the path).
 * `onScene` sets the palette for reading over the night photograph.
 */

import { useLanguage } from "@/lib/i18n";

export function AboutRiver({ onScene = false }: { onScene?: boolean }) {
  const { t } = useLanguage();
  const head = onScene ? "text-[#f6e7c6]" : "text-foreground";
  const body = onScene ? "text-[#d9cdb4]" : "text-cosmic-200";
  const content = (
    <>
      <p className={`label-caps ${onScene ? "!text-[#e2bf84]" : ""}`}>{t("ganga.about.label")}</p>
      <h2 className={`mt-3 font-serif text-3xl sm:text-4xl ${head}`}>{t("ganga.about.title")}</h2>
      {(["ganga.about.p1", "ganga.about.p2", "ganga.about.p3", "ganga.about.p4"] as const).map((k) => (
        <p key={k} className={`mt-4 leading-relaxed ${body}`}>{t(k)}</p>
      ))}
    </>
  );
  if (!onScene) return <article>{content}</article>;
  return <article className="rounded-2xl border border-[#f3dcae]/20 bg-black/35 p-6 backdrop-blur-md sm:p-8">{content}</article>;
}

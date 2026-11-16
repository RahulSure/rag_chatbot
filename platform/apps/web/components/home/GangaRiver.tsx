"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RiverVideo } from "@/components/ganga/stage/RiverVideo";
import { useLanguage } from "@/lib/i18n";

/** The river at night, moving, as a full-bleed invitation to the Ganga. */
export function GangaRiver() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="ganga-home-title" className="relative overflow-hidden">
      <RiverVideo />
      {/* the night scene is the ground here in both themes; the scrim carries the text */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

      <div className="relative mx-auto flex min-h-[32rem] max-w-6xl items-center px-4 py-24 sm:py-32">
        <div className="max-w-xl">
          <p className="label-caps !text-[#e2bf84]">{t("home.ganga.label")}</p>
          <h2 id="ganga-home-title" className="ganga-display mt-4 text-4xl leading-[1.15] sm:text-6xl">
            {t("ganga.title")}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#ecdfc5]">{t("home.ganga.lead")}</p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#cfc3a8]">
            {(["home.ganga.point1", "home.ganga.point2", "home.ganga.point3"] as const).map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span aria-hidden="true" className="text-[#f0cf92]">✦</span> {t(k)}
              </li>
            ))}
          </ul>
          <Link href="/ganga" className="btn-ganga mt-8 px-7 py-3">
            <span aria-hidden="true">🪔</span> {t("ganga.join")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT, type Key } from "@/lib/i18n";

// The size of Sadhak's library today: books ingested, disciples' articles, searchable passages.
const STATS: [string, Key][] = [
  ["3", "v4.statBooks"],
  ["2,158", "v4.statArticles"],
  ["16,800+", "v4.statPassages"],
];

export function TheTeacher() {
  const t = useT();
  return (
    <section className="border-t border-line px-4 py-20 sm:py-28" aria-labelledby="teacher-title">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <figure className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface p-3 lg:max-w-none">
          <Image
            src="/images/yantra.jpg"
            alt="A painted yantra from nineteenth-century India"
            width={843}
            height={894}
            sizes="(min-width: 1024px) 560px, 100vw"
            className="h-auto w-full rounded-xl"
          />
          <figcaption className="px-2 pb-1 pt-3 text-sm text-cosmic-500">Mystical Diagram (Yantra), India, 19th century</figcaption>
        </figure>

        <div>
          <p className="label-caps">{t("v4.teacherLabel")}</p>
          <h2 id="teacher-title" className="mt-4 text-4xl leading-tight sm:text-5xl">
            {t("v4.teacherTitle")} <em className="text-gold">{t("v4.teacherAccent")}</em>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-cosmic-200">{t("v4.teacherLead")}</p>

          <dl className="mt-10 grid grid-cols-3 gap-6 border-y border-line py-6">
            {STATS.map(([value, label]) => (
              <div key={label}>
                <dd className="font-serif text-3xl lining-nums text-gold sm:text-4xl">{value}</dd>
                <dt className="mt-1 text-sm leading-snug text-cosmic-400">{t(label)}</dt>
              </div>
            ))}
          </dl>

          <Link href="/guru" className="btn-ghost mt-8">
            {t("v4.teacherCta")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BirthChart, BirthDetails } from "@/lib/api";
import { useLanguage, type Key } from "@/lib/i18n";
import { saveBirth } from "@/lib/birth";
import { BirthForm } from "@/components/kundli/BirthForm";
import { NorthIndianChart } from "@/components/kundli/NorthIndianChart";

const POINTS: Key[] = ["v4.formPoint1", "v4.formPoint2", "v4.formPoint3"];

/** The birth form beside the chart of this very moment, read the same way. */
export function KundliPreview({ chart }: { chart: BirthChart | null }) {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const hi = lang === "hi";

  const open = (details: BirthDetails) => {
    setBusy(true);
    saveBirth(details);
    router.push("/kundli");
  };

  return (
    <section className="border-t border-line px-4 py-20 sm:py-28" aria-labelledby="kundli-title">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-caps">{t("v4.formLabel")}</p>
          <h2 id="kundli-title" className="mt-4 text-4xl leading-tight sm:text-5xl">
            {t("v4.formTitle")} <em className="text-gold">{t("v4.formAccent")}</em>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-cosmic-300">{t("v4.formLead")}</p>
        </div>

        <div className="mt-14 grid items-start gap-8 lg:grid-cols-2">
          <BirthForm busy={busy} onSubmit={open} />

          {chart && (
            <figure className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <figcaption>
                <p className="font-serif text-2xl text-foreground">
                  {t("v4.skyTitle")} <em className="text-gold">{t("v4.skyAccent")}</em>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-cosmic-400">{t("v4.skyLead")}</p>
              </figcaption>
              <div className="mt-6">
                <NorthIndianChart chart={chart} lang={lang} />
              </div>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-cosmic-500">{t("v4.skyRising")}</dt>
                  <dd className="mt-1 font-serif text-lg text-foreground">{hi ? chart.ascendant.sign_hi : chart.ascendant.sign}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-cosmic-500">{t("v4.skyMoon")}</dt>
                  <dd className="mt-1 font-serif text-lg text-foreground">{hi ? chart.moon_sign.sign_hi : chart.moon_sign.sign}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-cosmic-500">{t("v4.skyNakshatra")}</dt>
                  <dd className="mt-1 font-serif text-lg text-foreground">
                    {hi ? chart.birth_nakshatra.name_hi : chart.birth_nakshatra.name}
                  </dd>
                </div>
              </dl>
            </figure>
          )}
        </div>

        <ol className="mt-14 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
          {POINTS.map((k, i) => (
            <li key={k} className="flex gap-4">
              <span className="font-serif text-3xl leading-none text-gold">{["I", "II", "III"][i]}</span>
              <p className="leading-relaxed text-cosmic-200">{t(k)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

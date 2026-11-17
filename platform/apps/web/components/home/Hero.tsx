"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useT, type Key } from "@/lib/i18n";
import { LoopVideo, useIsDark } from "@/components/ganga/stage/RiverVideo";
import { DawnSky } from "./DawnSky";

const SUGGESTIONS: Key[] = ["v4.suggest1", "v4.suggest2", "v4.suggest3", "v4.suggest4"];

/**
 * The opening: words and the question box in a calm left column, the sky to the
 * right. By night the sky is the cosmos turning (planets on golden orbits,
 * vignetted around its sun so nothing passes behind the words); by day it is
 * the sidereal wheel turning. On phones the sky sits above, fading into the page.
 */
export function Hero() {
  const t = useT();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const dark = useIsDark();

  const ask = (q: string) => {
    const text = q.trim();
    router.push(text ? `/chat?q=${encodeURIComponent(text)}` : "/chat");
  };

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:pb-24 sm:pt-24 lg:flex lg:min-h-[46rem] lg:items-center" aria-labelledby="hero-title">
      {/* by night: the cosmos */}
      <div aria-hidden="true"
           className="hero-cosmos pointer-events-none absolute inset-x-0 top-0 hidden h-[48vh] dark:block lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-[62%]">
        {dark && <LoopVideo src="/cosmos/hero.mp4" poster="/cosmos/hero-poster.webp" fit="object-[50%_42%]" />}
      </div>
      {/* by day: the wheel at sunrise, the navagraha on their orbits */}
      {dark === false && (
        <DawnSky className="dawnsky-band pointer-events-none absolute left-1/2 top-0 w-[640px] max-w-none -translate-x-1/2 -translate-y-[24%] sm:w-[780px] lg:left-[78%] lg:top-1/2 lg:w-[920px] lg:-translate-y-1/2" />
      )}

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center pt-[29vh] sm:pt-[32vh] lg:mx-0 lg:max-w-[38rem] lg:text-left lg:pt-0 xl:max-w-[40rem]">
          <p className="label-caps rise-in">{t("v4.heroLabel")}</p>
          <h1 id="hero-title" className="rise-in mt-6 text-[2.6rem] leading-[1.06] sm:text-6xl lg:text-[3.6rem] xl:text-[3.9rem]">
            {t("v4.heroTitle1")}
            <br />
            <em className="text-gold">{t("v4.heroTitle2")}</em>
          </h1>
          <p className="rise-in mx-auto mt-6 max-w-xl text-base leading-relaxed text-cosmic-300 sm:text-lg lg:mx-0">
            {t("v4.heroLead")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
            className="rise-in mx-auto mt-10 max-w-2xl rounded-2xl border border-line bg-surface/90 p-5 text-left shadow-cosmic backdrop-blur sm:p-6 lg:mx-0"
          >
            <label htmlFor="hero-ask" className="block font-serif text-2xl text-foreground sm:text-[1.75rem]">
              {t("v4.askTitle")}
            </label>
            <div className="mt-4 flex gap-2 rounded-xl border border-line bg-surface-2 p-1.5 transition-colors focus-within:border-gold/60">
              <input
                id="hero-ask"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("v4.askPlaceholder")}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-foreground placeholder:text-cosmic-500 focus:outline-none focus-visible:shadow-none"
              />
              <button type="submit" className="btn-gold shrink-0 px-5 py-2.5">
                <span className="hidden sm:inline">{t("v4.askButton")}</span>
                <ArrowRight size={18} aria-hidden="true" />
                <span className="sr-only sm:hidden">{t("v4.askButton")}</span>
              </button>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((k) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => ask(t(k))}
                    className="h-full w-full rounded-xl border border-line px-4 py-3 text-left text-sm leading-snug text-cosmic-200 transition-colors hover:border-gold/50 hover:text-foreground"
                  >
                    {t(k)}
                  </button>
                </li>
              ))}
            </ul>
          </form>
          <p className="mt-4 text-sm text-cosmic-500">{t("v4.askNote")}</p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useT, type Key } from "@/lib/i18n";
import { ZodiacWheel } from "./ZodiacWheel";

const SUGGESTIONS: Key[] = ["v4.suggest1", "v4.suggest2", "v4.suggest3", "v4.suggest4"];

/** Centred serif headline over the wheel, and the question box that opens the chat. */
export function Hero() {
  const t = useT();
  const router = useRouter();
  const [question, setQuestion] = useState("");

  const ask = (q: string) => {
    const text = q.trim();
    router.push(text ? `/chat?q=${encodeURIComponent(text)}` : "/chat");
  };

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:pb-24 sm:pt-24" aria-labelledby="hero-title">
      <ZodiacWheel className="pointer-events-none absolute left-1/2 top-[-140px] w-[980px] max-w-none -translate-x-1/2 text-gold opacity-[0.12] sm:top-[-220px] sm:w-[1240px]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="label-caps rise-in">{t("v4.heroLabel")}</p>
        <h1 id="hero-title" className="rise-in mt-6 text-[2.6rem] leading-[1.06] sm:text-6xl lg:text-[4.5rem]">
          {t("v4.heroTitle1")}
          <br />
          <em className="text-gold">{t("v4.heroTitle2")}</em>
        </h1>
        <p className="rise-in mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cosmic-300 sm:text-lg">
          {t("v4.heroLead")}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="rise-in mx-auto mt-10 max-w-2xl rounded-2xl border border-line bg-surface/90 p-5 text-left shadow-cosmic backdrop-blur sm:p-6"
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
    </section>
  );
}

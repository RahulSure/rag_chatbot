"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { useT, type Key } from "@/lib/i18n";

const CHIPS: Key[] = ["hero.chip1", "hero.chip2", "hero.chip3", "hero.chip4"];

export function HeroSection() {
  const t = useT();
  const [query, setQuery] = useState("");
  const router = useRouter();

  const ask = (q: string) => {
    if (!q.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 md:pb-24 md:pt-24">
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm text-gold">
            <Sparkles size={14} aria-hidden="true" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="mb-5 font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
            {t("hero.title1")}
            <br />
            <span className="text-gold">{t("hero.title2")}</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-base text-cosmic-300 md:text-lg">{t("hero.lead")}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(query);
            }}
            role="search"
            className="relative mx-auto mb-6 max-w-2xl"
          >
            <label htmlFor="hero-ask" className="sr-only">
              {t("hero.placeholder")}
            </label>
            <input
              id="hero-ask"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("hero.placeholder")}
              className="w-full rounded-2xl border border-gold/30 bg-cosmic-950/80 py-4 pl-5 pr-28 text-base text-foreground
                         shadow-cosmic placeholder-cosmic-500 backdrop-blur-md transition-all focus:border-gold/70 focus:outline-none"
            />
            <button
              type="submit"
              className="btn-gold absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-xl px-5 py-2.5 text-sm"
            >
              <Search size={16} aria-hidden="true" />
              {t("hero.ask")}
            </button>
          </form>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {CHIPS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => ask(t(k))}
                className="rounded-full border border-gold/25 bg-gold/5 px-4 py-2 text-sm text-cosmic-200
                           font-devanagari transition-colors hover:border-gold/60 hover:text-foreground"
              >
                {t(k)}
              </button>
            ))}
          </div>

          <p className="text-xs text-cosmic-500">{t("hero.grounded")}</p>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, MessageCircle, Search } from "lucide-react";
import { findSwitchWords, type SwitchWordResult } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import type { Pair } from "@/lib/jyotish-text";

// Common needs, searched in English because the posts are written in English.
const NEEDS: { label: Pair; q: string }[] = [
  { label: ["Confidence", "आत्मविश्वास"], q: "confidence and courage" },
  { label: ["Money", "धन"], q: "money problems and financial growth" },
  { label: ["Job and career", "नौकरी और करियर"], q: "getting a job and career growth" },
  { label: ["Marriage", "विवाह"], q: "marriage delay and finding a partner" },
  { label: ["Relationships", "संबंध"], q: "harmony in relationships and family" },
  { label: ["Exams and study", "परीक्षा और पढ़ाई"], q: "concentration for study and exams" },
  { label: ["Fear and worry", "भय और चिंता"], q: "fear anxiety and worry" },
  { label: ["Decisions", "निर्णय"], q: "confusion and making decisions" },
  { label: ["Sleep", "नींद"], q: "sleeplessness and good sleep" },
  { label: ["Health support", "स्वास्थ्य सहायता"], q: "physical problems and healing" },
];

export function SwitchWordsApp() {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState("");
  const [results, setResults] = useState<SwitchWordResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const run = async (q: string, shown = q) => {
    const text = q.trim();
    if (text.length < 2) return;
    setAsked(shown.trim());
    setBusy(true);
    try {
      setResults(await findSwitchWords(text));
    } catch {
      setResults([]);
    } finally {
      setBusy(false);
    }
  };

  const copy = (w: string) => {
    navigator.clipboard?.writeText(w);
    setCopied(w);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-10">
      <form onSubmit={(e) => { e.preventDefault(); run(query); }} className="mx-auto max-w-2xl">
        <div className="flex gap-2 rounded-xl border border-line bg-surface p-1.5 transition-colors focus-within:border-gold/60">
          <label htmlFor="sw-q" className="sr-only">{t("sw.placeholder")}</label>
          <input id="sw-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("sw.placeholder")}
                 className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-foreground placeholder:text-cosmic-500 focus:outline-none focus-visible:shadow-none" />
          <button type="submit" className="btn-gold shrink-0 px-5 py-2.5"><Search size={16} aria-hidden="true" /> {t("sw.search")}</button>
        </div>
        <p className="label-caps mb-3 mt-6 text-center text-[0.68rem]">{t("sw.try")}</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {NEEDS.map((n) => (
            <li key={n.q}>
              <button type="button" onClick={() => { setQuery(hi ? n.label[1] : n.label[0]); run(n.q, hi ? n.label[1] : n.label[0]); }}
                      className="rounded-full border border-line px-4 py-1.5 text-sm text-cosmic-300 transition-colors hover:border-gold/50 hover:text-foreground">
                {hi ? n.label[1] : n.label[0]}
              </button>
            </li>
          ))}
        </ul>
      </form>

      {busy && <p className="text-center text-cosmic-400">{t("sw.searching")}</p>}
      {!busy && results && results.length === 0 && <p className="text-center text-cosmic-400">{t("sw.none")}</p>}
      {!busy && results && results.length > 0 && (
        <section aria-live="polite">
          <p className="mb-4 text-center text-xs text-cosmic-500">{t("sw.copy")}</p>
          <ul className="grid gap-4 md:grid-cols-2">
            {results.map((r) => (
              <li key={r.title + r.excerpt.slice(0, 20)} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                <h2 className="font-serif text-xl text-foreground">{r.title}</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {r.switch_words.map((w) => (
                    <li key={w}>
                      <button type="button" onClick={() => copy(w)} title={t("sw.copy")}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/10 px-3 py-1.5 text-sm font-medium tracking-[0.12em] text-gold transition-colors hover:bg-gold/20">
                        {copied === w && <Check size={13} aria-hidden="true" />}
                        {w}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-cosmic-400">{r.excerpt}…</p>
                <Link href={`/chat?q=${encodeURIComponent(hi
                  ? `${asked} के लिए स्विच वर्ड्स "${r.switch_words.slice(0, 3).join('", "')}" हैं। इनका जप कैसे और कितनी बार करें?`
                  : `For ${asked}, the switch words are "${r.switch_words.slice(0, 3).join('", "')}". How and how often should I chant them?`)}`}
                      className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm text-gold hover:underline">
                  <MessageCircle size={14} aria-hidden="true" /> {t("sw.ask")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface-2/60 p-6 text-center sm:p-8">
        <h2 className="font-serif text-2xl text-foreground">{t("sw.howTitle")}</h2>
        <p className="mt-3 leading-relaxed text-cosmic-300">{t("sw.how")}</p>
        <p className="mt-4 text-sm text-cosmic-400">{t("sw.health")}</p>
        <p className="mt-2 text-xs text-cosmic-500">{t("sw.credit")}</p>
      </section>
    </div>
  );
}

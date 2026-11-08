"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en, type Key } from "./en";
import { hi } from "./hi";

export type Lang = "en" | "hi";

const DICTS: Record<Lang, Record<Key, string>> = { en, hi };

const STORAGE_KEY = "sadhak_lang";
const LEGACY_STORAGE_KEY = "shrimali_lang"; // read once so returning visitors keep their choice

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: Key) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => en[key],
});

function readStoredLang(): Lang | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return saved === "hi" || saved === "en" ? saved : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start in English so server and first client render match.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = readStoredLang();
    if (saved) setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the choice just won't persist */
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: (key) => DICTS[lang][key] ?? en[key] }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;

/** Inline translated text — usable from server components, which cannot call hooks. */
export function T({ k }: { k: Key }) {
  return <>{useT()(k)}</>;
}

export type { Key };

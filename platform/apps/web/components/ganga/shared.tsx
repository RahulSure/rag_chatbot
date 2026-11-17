"use client";

import Link from "next/link";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { GangaError, type DiyaKind } from "@/lib/api";
import { en } from "@/lib/i18n/en";
import { useLanguage, type Key, type Lang } from "@/lib/i18n";

export const KINDS: DiyaKind[] = ["seeking", "sharing", "gratitude", "prayer", "partner"];
export const PRACTICES = ["japa", "meditation", "mantra", "bhakti", "yoga", "seva", "jyotish", "tantra", "pranayama", "scripture"] as const;
const REASONS = ["unsafe", "abuse", "sexual", "money", "spam", "other"] as const;

export const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/** A key from parts, when it exists ("ganga.k." + kind); otherwise the fallback. */
export function keyOf(prefix: string, value: string, fallback: Key): Key {
  const k = `${prefix}${value}`;
  return k in en ? (k as Key) : fallback;
}

export const codeOf = (e: unknown) => (e instanceof GangaError ? e.code : "generic");

/** API times are UTC without a zone; read them as UTC and say how long ago, in the reader's language. */
export function ago(iso: string, lang: Lang) {
  const then = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`).getTime();
  const secs = Math.round((then - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === "hi" ? "hi-IN" : "en", { numeric: "auto" });
  for (const [unit, size] of [["day", 86400], ["hour", 3600], ["minute", 60]] as const) {
    if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
  }
  return rtf.format(0, "minute");
}

export function CrisisCard() {
  const { t } = useLanguage();
  return (
    <div role="alert" className="rounded-2xl border border-gold/50 bg-gold/10 p-5">
      <p className="flex items-center gap-2 font-serif text-xl text-foreground">
        <LifeBuoy size={20} aria-hidden="true" className="text-gold" /> {t("ganga.crisisTitle")}
      </p>
      <p className="mt-2 leading-relaxed text-cosmic-200">{t("ganga.crisisBody")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href="tel:14416" className="btn-gold px-5 py-2 text-sm">Tele-MANAS 14416</a>
        <a href="tel:112" className="btn-ghost px-5 py-2 text-sm">112</a>
        <Link href="/chat" className="btn-ghost px-5 py-2 text-sm">{t("ganga.crisisAsk")}</Link>
      </div>
    </div>
  );
}

/** Why the river refused something, in the writer's language; a crisis shows help instead. */
export function ErrorNote({ code }: { code: string | null }) {
  const { t } = useLanguage();
  if (!code) return null;
  if (code === "crisis") return <CrisisCard />;
  return (
    <p role="alert" className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-cosmic-200">
      {t(keyOf("ganga.err.", code, "ganga.err.generic"))}
    </p>
  );
}

/** Reason chips shown when someone reports a diya or a letter thread. */
export function ReportPicker({ onPick, onCancel }: { onPick: (reason: string) => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className="text-sm text-foreground">{t("ganga.reportTitle")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <button key={r} type="button" disabled={busy}
                  onClick={() => { setBusy(true); onPick(r); }}
                  className="rounded-full border border-line px-3 py-1.5 text-sm text-cosmic-200 transition-colors hover:border-gold/60 hover:text-foreground disabled:opacity-50">
            {t(`ganga.reason.${r}` as Key)}
          </button>
        ))}
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-cosmic-400 hover:text-foreground">
          {t("ganga.cancel")}
        </button>
      </div>
    </div>
  );
}

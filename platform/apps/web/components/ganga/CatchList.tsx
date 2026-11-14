"use client";

import { useEffect, useState } from "react";
import { Flag, HandHeart, MailOpen, Send, Waves } from "lucide-react";
import { gangaApi, type CaughtDiya, type MaitriReason } from "@/lib/api";
import { graha } from "@/lib/jyotish-text";
import { useLanguage, type Key } from "@/lib/i18n";
import { ErrorNote, ReportPicker, ago, codeOf, fill, keyOf } from "./shared";

function reasonText(r: MaitriReason, t: (k: Key) => string, lang: "en" | "hi") {
  const text = t(keyOf("ganga.r.", r.code, "ganga.err.generic"));
  if (r.code === "shared_practice") {
    const items = (r.items ?? []).map((p) => t(keyOf("ganga.p.", p, "ganga.p.japa")));
    return fill(text, { items: new Intl.ListFormat(lang === "hi" ? "hi-IN" : "en", { type: "conjunction" }).format(items) });
  }
  if (r.code === "moon_friends") return fill(text, { a: graha(String(r.a), lang), b: graha(String(r.b), lang) });
  if (r.code === "same_gana") return fill(text, { gana: t(keyOf("ganga.gana.", String(r.gana), "ganga.gana.Deva")) });
  return fill(text, { a: r.a ?? "", b: r.b ?? "" });
}

/** The friendship score as a small dial: the arc fills with the score. */
function MaitriDial({ score }: { score: number }) {
  const c = 2 * Math.PI * 22;
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 shrink-0" aria-hidden="true">
      <circle cx="28" cy="28" r="22" fill="none" strokeWidth="3" className="stroke-line" />
      <circle cx="28" cy="28" r="22" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-gold"
              strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 28 28)" />
      <text x="28" y="33" textAnchor="middle" className="fill-foreground font-serif text-[17px] lining-nums">{score}</text>
    </svg>
  );
}

function DiyaCard({ diya, onChange, onOpenThread }: {
  diya: CaughtDiya;
  onChange: (d: CaughtDiya) => void;
  onOpenThread: (id: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState<"idle" | "reply" | "report">("idle");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(run: () => Promise<Partial<CaughtDiya>>) {
    setBusy(true);
    setError(null);
    try {
      onChange({ ...diya, ...(await run()) });
      setMode("idle");
    } catch (e) {
      setError(codeOf(e));
    } finally {
      setBusy(false);
    }
  }

  const m = diya.maitri;
  return (
    <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="label-caps text-[0.68rem]">{t(keyOf("ganga.k.", diya.kind, "ganga.k.sharing"))}</p>
          <p className="mt-1 text-sm text-cosmic-400">
            {t("ganga.from")} <span className="text-foreground">{diya.from}</span> · {ago(diya.created_at, lang)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">{t("ganga.maitri")}</p>
            <p className="text-xs text-cosmic-500">{m.by_kundli ? t("ganga.byKundli") : t("ganga.byPath")}</p>
          </div>
          <MaitriDial score={m.score} />
          <span className="sr-only">{t("ganga.maitri")}: {m.score} / 100</span>
        </div>
      </div>

      <p lang={diya.lang} className="mt-4 whitespace-pre-line font-serif text-xl leading-relaxed text-foreground sm:text-[1.35rem]">
        {diya.text}
      </p>

      {m.reasons.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-line pt-3 text-sm text-cosmic-300">
          {m.reasons.map((r, i) => (
            <li key={i} className="flex gap-2"><span className="text-gold" aria-hidden="true">✦</span>{reasonText(r, t, lang)}</li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        {diya.action === "replied" && diya.thread ? (
          <p className="flex flex-wrap items-center gap-3 text-sm text-cosmic-300">
            {t("ganga.replied")}
            <button type="button" onClick={() => onOpenThread(diya.thread!)} className="inline-flex items-center gap-1.5 text-gold hover:underline">
              <MailOpen size={15} aria-hidden="true" /> {t("ganga.openLetters")}
            </button>
          </p>
        ) : diya.action ? (
          <p className="text-sm text-cosmic-300">
            {t(diya.action === "blessed" ? "ganga.blessed" : diya.action === "passed" ? "ganga.passed" : "ganga.reported")}
          </p>
        ) : mode === "reply" ? (
          <form onSubmit={(e) => { e.preventDefault(); act(async () => ({ action: "replied", thread: (await gangaApi.reply(diya.id, text)).thread })); }}>
            <label htmlFor={`reply-${diya.id}`} className="sr-only">{t("ganga.reply")}</label>
            <textarea id={`reply-${diya.id}`} value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1000} required autoFocus
                      placeholder={t("ganga.replyPlaceholder")}
                      className="w-full resize-y rounded-lg border border-line bg-surface-2 px-4 py-3 text-base text-foreground placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="submit" disabled={busy || !text.trim()} className="btn-gold px-5 py-2 text-sm disabled:opacity-60">
                <Send size={15} aria-hidden="true" /> {t("ganga.send")}
              </button>
              <button type="button" onClick={() => setMode("idle")} className="btn-ghost px-5 py-2 text-sm">{t("ganga.cancel")}</button>
              <span className="ml-auto text-xs text-cosmic-500 lining-nums">{text.length} / 1000</span>
            </div>
          </form>
        ) : mode === "report" ? (
          <ReportPicker onCancel={() => setMode("idle")}
                        onPick={(reason) => act(async () => { await gangaApi.reportDiya(diya.id, reason); return { action: "reported" }; })} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setMode("reply")} className="btn-gold px-5 py-2 text-sm">
              <Send size={15} aria-hidden="true" /> {t("ganga.reply")}
            </button>
            <button type="button" disabled={busy} className="btn-ghost px-4 py-2 text-sm"
                    onClick={() => act(async () => { await gangaApi.bless(diya.id); return { action: "blessed" }; })}>
              <HandHeart size={15} aria-hidden="true" /> {t("ganga.bless")}
            </button>
            <button type="button" disabled={busy} className="px-3 py-2 text-sm text-cosmic-300 hover:text-foreground"
                    onClick={() => act(async () => { await gangaApi.pass(diya.id); return { action: "passed" }; })}>
              <Waves size={15} aria-hidden="true" className="mr-1 inline" /> {t("ganga.pass")}
            </button>
            <button type="button" onClick={() => setMode("report")} className="ml-auto inline-flex items-center gap-1 px-2 py-2 text-sm text-cosmic-500 hover:text-foreground">
              <Flag size={14} aria-hidden="true" /> {t("ganga.report")}
            </button>
          </div>
        )}
        <div className={error ? "mt-3" : ""}><ErrorNote code={error} /></div>
      </div>
    </article>
  );
}

/** What the river brought today, kept for the whole day, with how many more may still come. */
export function CatchList({ onOpenThread }: { onOpenThread: (id: string) => void }) {
  const { t } = useLanguage();
  const [data, setData] = useState<{ diyas: CaughtDiya[]; share: number; left: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gangaApi.catch().then(setData).catch((e) => setError(codeOf(e)));
  }, []);

  if (error) return <ErrorNote code={error} />;
  if (!data) return <p className="text-cosmic-400">{t("ganga.loading")}</p>;

  return (
    <div className="space-y-5">
      {data.share > 3 && <p className="text-sm text-gold">{t("ganga.brahma")}</p>}
      {data.diyas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center leading-relaxed text-cosmic-300">{t("ganga.catchEmpty")}</p>
      ) : (
        data.diyas.map((d) => (
          <DiyaCard key={d.id} diya={d} onOpenThread={onOpenThread}
                    onChange={(next) => setData((cur) => cur && { ...cur, diyas: cur.diyas.map((x) => (x.id === next.id ? next : x)) })} />
        ))
      )}
      <p className="text-sm text-cosmic-500">{data.left > 0 ? fill(t("ganga.catchLeft"), { n: data.left }) : t("ganga.catchDone")}</p>
    </div>
  );
}

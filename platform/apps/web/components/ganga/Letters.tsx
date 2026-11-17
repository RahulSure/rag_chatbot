"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Ban, Flag, Send } from "lucide-react";
import { gangaApi, type GangaThread, type GangaThreadSummary } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ErrorNote, ReportPicker, ago, codeOf } from "./shared";
import { GANGA_UNREAD_EVENT } from "./unread";

function ThreadList({ onOpen }: { onOpen: (id: string) => void }) {
  const { lang, t } = useLanguage();
  const [threads, setThreads] = useState<GangaThreadSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gangaApi.threads().then(setThreads).catch((e) => setError(codeOf(e)));
  }, []);

  if (error) return <ErrorNote code={error} />;
  if (!threads) return <p className="text-cosmic-400">{t("ganga.loading")}</p>;
  if (threads.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center leading-relaxed text-cosmic-300">{t("ganga.lettersEmpty")}</p>;
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {threads.map((th) => (
        <li key={th.id}>
          <button type="button" onClick={() => onOpen(th.id)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gold/5">
            <span aria-hidden="true" className={`mt-2 h-2 w-2 shrink-0 rounded-full ${th.unread ? "bg-gold" : "bg-transparent"}`} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className={`truncate ${th.unread ? "font-semibold text-foreground" : "text-foreground"}`}>{th.with}</span>
                <span className="shrink-0 text-xs text-cosmic-500">
                  {th.unread && <span className="mr-2 text-gold">{t("ganga.new")}</span>}
                  {ago(th.updated_at, lang)}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-sm italic text-cosmic-400">“{th.diya_text}”</span>
              <span className="mt-1 block truncate text-sm text-cosmic-300">{th.last}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ThreadView({ id, onBack }: { id: string; onBack: () => void }) {
  const { lang, t } = useLanguage();
  const [thread, setThread] = useState<GangaThread | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    gangaApi.thread(id)
      .then((th) => {
        setThread(th);
        window.dispatchEvent(new Event(GANGA_UNREAD_EVENT)); // opening marks it read
      })
      .catch((e) => setError(codeOf(e)));
  }, [id]);
  useEffect(load, [load]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [thread?.letters.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await gangaApi.send(id, text);
      setText("");
      load();
    } catch (err) {
      setError(codeOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function block() {
    if (!window.confirm(t("ganga.blockConfirm"))) return;
    await gangaApi.block(id).catch(() => undefined);
    load();
  }

  async function report(reason: string) {
    await gangaApi.reportThread(id, reason).catch(() => undefined);
    setReporting(false);
    load();
  }

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-cosmic-300 hover:text-foreground">
          <ArrowLeft size={16} aria-hidden="true" /> {t("ganga.back")}
        </button>
        <h2 className="min-w-[7rem] flex-1 truncate font-serif text-xl">{thread?.with ?? ""}</h2>
        {thread && !thread.closed && (
          <div className="-ml-2 flex gap-1 sm:ml-0">
            <button type="button" onClick={block} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-cosmic-400 hover:text-foreground">
              <Ban size={14} aria-hidden="true" /> {t("ganga.block")}
            </button>
            <button type="button" onClick={() => setReporting(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-cosmic-400 hover:text-foreground">
              <Flag size={14} aria-hidden="true" /> {t("ganga.reportThread")}
            </button>
          </div>
        )}
      </div>

      {reporting && <div className="border-b border-line p-4"><ReportPicker onPick={report} onCancel={() => setReporting(false)} /></div>}

      {!thread ? (
        <div className="p-5">{error ? <ErrorNote code={error} /> : <p className="text-cosmic-400">{t("ganga.loading")}</p>}</div>
      ) : (
        <>
          <div className="px-5 pt-5">
            <p className="label-caps text-[0.68rem]">{t("ganga.aboutDiya")}</p>
            <blockquote className="mt-2 border-l-2 border-gold/60 pl-4 font-serif text-lg italic leading-relaxed text-cosmic-200">{thread.diya_text}</blockquote>
          </div>
          <ol className="space-y-3 p-5" aria-live="polite">
            {thread.letters.map((l) => (
              <li key={l.id} className={`flex ${l.mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${l.mine ? "rounded-br-sm bg-gold/15" : "rounded-bl-sm border border-line bg-surface-2"}`}>
                  <p className="whitespace-pre-line leading-relaxed text-foreground">{l.text}</p>
                  <p className="mt-1 text-xs text-cosmic-500">{l.mine ? t("ganga.you") : thread.with} · {ago(l.created_at, lang)}</p>
                </div>
              </li>
            ))}
          </ol>
          <div ref={end} />
          {thread.closed ? (
            <p className="border-t border-line px-5 py-4 text-sm text-cosmic-400">{t("ganga.err.closed")}</p>
          ) : (
            <form onSubmit={send} className="border-t border-line p-4">
              <label htmlFor="letter-text" className="sr-only">{t("ganga.compose")}</label>
              <textarea id="letter-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} required
                        placeholder={t("ganga.compose")}
                        className="w-full resize-y rounded-lg border border-line bg-surface-2 px-4 py-3 text-base text-foreground placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none" />
              {error && <div className="mt-2"><ErrorNote code={error} /></div>}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy || !text.trim()} className="btn-gold px-5 py-2 text-sm disabled:opacity-60">
                  <Send size={15} aria-hidden="true" /> {t("ganga.send")}
                </button>
                <p className="text-xs text-cosmic-500">{t("ganga.safety")}</p>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export function Letters({ open, onOpen }: { open: string | null; onOpen: (id: string | null) => void }) {
  return open ? <ThreadView id={open} onBack={() => onOpen(null)} /> : <ThreadList onOpen={onOpen} />;
}

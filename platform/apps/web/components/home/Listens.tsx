"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import replies from "@/lib/showcase-replies.json";
import { useLanguage } from "@/lib/i18n";
import s from "./home.module.css";

type Reply = { lang: string; question: string; reply: string };

/**
 * Showcase blueprint "Input half, output half". The left field is editable; the
 * right shows Sadhak's real first reply (recorded from the live system) for the
 * chosen question, or — for the visitor's own words — what will happen next.
 */
export function Listens() {
  const { lang, t } = useLanguage();
  const pool = useMemo(() => {
    const own = (replies as Reply[]).filter((r) => r.lang === lang);
    return own.length ? own : (replies as Reply[]);
  }, [lang]);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState<string | null>(null);

  const preset = pool[index % pool.length];
  const asked = text ?? preset.question;
  const matching = pool.find((r) => r.question.trim() === asked.trim());

  return (
    <section className={s.split} aria-labelledby="listens-heading">
      <div className={s.inputField}>
        <label htmlFor="listens-input" className="sr-only">{t("v3.yourWords")}</label>
        <textarea id="listens-input" className={s.asked} value={asked} onChange={(e) => setText(e.target.value)} />
        <div className={s.inputHint}>
          <button type="button" onClick={() => { setText(null); setIndex((i) => i + 1); }}>{t("v3.tryAnother")}</button>
        </div>
      </div>

      <div className={s.outputField}>
        <div className={s.chat} data-ui>
          <div className={s.bubbleUser}>{asked}</div>
          {matching ? (
            <div className={s.bubbleBot}>
              <span className={s.bubbleName}>{lang === "hi" ? "साधक" : "Sadhak"}</span>
              {matching.reply}
            </div>
          ) : (
            <div className={s.bubbleBot}>
              <span className={s.bubbleName}>{lang === "hi" ? "साधक" : "Sadhak"}</span>
              {t("v3.willAsk")}
            </div>
          )}
          <Link href={`/chat?q=${encodeURIComponent(asked)}`} className={s.button} style={{ alignSelf: "flex-start" }}>
            {t("v3.continueChat")}
          </Link>
        </div>
      </div>

      <h2 id="listens-heading" className={`${s.splitHeading} ${s.display}`}>
        <span className={s.splitLeft}>{t("v3.youAsk")}</span>
        <span className={s.splitRight}>{t("v3.itListens")}</span>
      </h2>
    </section>
  );
}

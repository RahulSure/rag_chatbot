"use client";

import { useState } from "react";
import { useLanguage, type Lang } from "@/lib/i18n";
import s from "./home.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** CTA blueprint "First step, already open": the sign-up for daily guidance, ready to use. */
export function PractiseCta() {
  const { lang, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [guidanceLang, setGuidanceLang] = useState<Lang | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const chosen = guidanceLang ?? lang;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(`${API}/subscribe/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: `home-daily-guidance-${chosen}` }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className={s.cta} aria-labelledby="cta-heading">
      <div className={s.ctaWords}>
        <h2 id="cta-heading" className={`${s.display} ${s.rise}`}>
          {t("v3.ctaTitle1")}
          <br />
          {t("v3.ctaTitle2")}
        </h2>
        <p className={s.rise} style={{ "--i": 1 } as React.CSSProperties}>{t("v3.ctaLine")}</p>
      </div>

      <form className={s.dialog} data-ui onSubmit={submit} aria-labelledby="dialog-title">
        <p id="dialog-title" className={s.dialogTitle}>{t("v3.dialogTitle")}</p>
        <label htmlFor="cta-email" className={s.dialogLabel}>{t("v3.dialogEmail")}</label>
        <input id="cta-email" type="email" required className={s.dialogInput} value={email}
               onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <span className={s.dialogLabel} style={{ marginTop: 18 }}>{t("v3.dialogLang")}</span>
        <div className={s.segment} role="group" aria-label={t("v3.dialogLang")}>
          <button type="button" aria-pressed={chosen === "en"} onClick={() => setGuidanceLang("en")}>English</button>
          <button type="button" aria-pressed={chosen === "hi"} onClick={() => setGuidanceLang("hi")}>हिन्दी</button>
        </div>
        <button type="submit" className={s.dialogButton} disabled={status === "sending"}>{t("email.cta")}</button>
        {status === "done" && <p role="status" className={s.dialogNote}>{t("email.success")}</p>}
        {status === "error" && <p role="alert" className={s.dialogNote}>{t("email.error")}</p>}
      </form>
    </section>
  );
}

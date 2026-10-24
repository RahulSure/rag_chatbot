"use client";

import { useState } from "react";
import { Bell, Loader2, CheckCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function EmailCapture() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(`${API}/subscribe/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "homepage" }),
      });
      const data = await res.json();
      setStatus("success");
      setMessage(data.message || t("email.success"));
    } catch {
      setStatus("error");
      setMessage(t("email.error"));
    }
  };

  return (
    <section className="px-6 py-16">
      <div className="cosmic-card relative mx-auto max-w-2xl overflow-hidden p-8 text-center sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/15">
            <Bell size={22} className="text-gold" />
          </div>
          <h2 className="mb-2 font-serif text-2xl text-foreground">{t("email.title")}</h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-cosmic-400">{t("email.body")}</p>

          {status === "success" ? (
            <div role="status" className="flex items-center justify-center gap-2 font-medium text-green-700 dark:text-green-400">
              <CheckCircle size={18} />
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-3 sm:flex-row">
              <label htmlFor="email-capture" className="sr-only">
                Email
              </label>
              <input
                id="email-capture"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email.placeholder")}
                required
                className="flex-1 rounded-xl border border-gold/25 bg-cosmic-900/60 px-4 py-2.5 text-sm text-foreground
                           placeholder-cosmic-500 transition-all focus:border-gold/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-gold flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : null}
                {t("email.cta")}
              </button>
            </form>
          )}

          {status === "error" && (
            <p role="alert" className="mt-3 text-xs text-red-700 dark:text-red-400">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

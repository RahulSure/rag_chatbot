"use client";

import Image from "next/image";
import { useState } from "react";
import { useT } from "@/lib/i18n";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** The morning-guidance list, over the Himalaya at first light. */
export function WhatsAppSoon() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch(`${API_BASE}/subscribe/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "home-whatsapp" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="relative isolate overflow-hidden px-4 py-24 sm:py-32" aria-labelledby="wa-title">
      <Image src="/images/himalaya.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[rgb(10_9_15/0.72)]" />
      <div className="mx-auto max-w-2xl text-center text-white">
        <h2 id="wa-title" className="text-4xl leading-tight !text-white sm:text-5xl">
          {t("v4.waTitle")} <em className="text-[#e0c796]">{t("v4.waAccent")}</em>
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-white/85">{t("v4.waLead")}</p>

        {state === "done" ? (
          <p role="status" className="mt-10 text-lg text-[#e0c796]">{t("email.success")}</p>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
            <label htmlFor="wa-email" className="sr-only">Email</label>
            <input
              id="wa-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="min-w-0 flex-1 rounded-md border border-white/30 bg-black/40 px-4 py-3 text-white placeholder:text-white/50 focus:border-[#e0c796] focus:outline-none"
            />
            <button type="submit" disabled={state === "busy"} className="rounded-md bg-[#c8a96e] px-6 py-3 font-medium text-[#14110b] transition hover:brightness-110 disabled:opacity-60">
              {t("email.cta")}
            </button>
          </form>
        )}
        {state === "error" && <p role="alert" className="mt-3 text-sm text-red-300">{t("email.error")}</p>}
      </div>
    </section>
  );
}

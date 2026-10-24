"use client";

import { MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

/** Home-page "coming soon" section. */
export function WhatsAppSection() {
  const t = useT();

  return (
    <section className="px-6 py-20">
      <div className="cosmic-card relative mx-auto max-w-3xl overflow-hidden p-10 text-center md:p-12">
        <div className="pointer-events-none absolute inset-0 bg-green-600/5" />
        <div className="relative">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-600/15">
            <MessageCircle size={28} className="text-green-700 dark:text-green-400" />
          </div>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-600/30 bg-green-600/10 px-3 py-1
                       text-xs font-medium text-green-800 dark:text-green-400"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-600 dark:bg-green-400" />
            {t("wa.soon")}
          </div>
          <h2 className="mb-3 font-serif text-3xl text-foreground">{t("wa.title")}</h2>
          <p className="mx-auto mb-6 max-w-lg text-cosmic-300">{t("wa.body")}</p>
          <div
            className="inline-flex cursor-default items-center gap-3 rounded-xl border border-green-600/30 bg-green-600/5 px-6 py-3
                       text-sm font-medium text-green-800 dark:text-green-400"
          >
            <MessageCircle size={18} />
            {t("wa.stay")}
          </div>
          <p className="mt-5 text-xs text-cosmic-500">{t("wa.note")}</p>
        </div>
      </div>
    </section>
  );
}

/** Small floating badge — desktop only so it never covers the chat input on phones. */
export function WhatsAppBadge() {
  const t = useT();

  return (
    <div
      className="fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full border border-green-600/30
                 bg-background/90 px-4 py-2.5 text-xs font-medium text-green-800 shadow-cosmic backdrop-blur-md
                 dark:text-green-400 md:flex"
    >
      <MessageCircle size={14} />
      <span>{t("wa.badge")}</span>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-600 dark:bg-green-400" />
    </div>
  );
}

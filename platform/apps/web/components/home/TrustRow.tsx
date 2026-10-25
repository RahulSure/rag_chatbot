"use client";

import { useT, type Key } from "@/lib/i18n";

const ITEMS: Key[] = ["v4.trust1", "v4.trust2", "v4.trust3", "v4.trust4"];

/** The four promises, in one hairline band under the hero. */
export function TrustRow() {
  const t = useT();
  return (
    <section aria-label="What Sadhak promises" className="border-y border-line bg-surface-2/70">
      <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-x-8 gap-y-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((k) => (
          <li key={k} className="flex items-start gap-3 text-sm leading-snug text-cosmic-200">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="mt-0.5 shrink-0 text-gold">
              <path d="M7 0.8 8.6 5.4 13.2 7 8.6 8.6 7 13.2 5.4 8.6 0.8 7 5.4 5.4Z" fill="currentColor" />
            </svg>
            {t(k)}
          </li>
        ))}
      </ul>
    </section>
  );
}

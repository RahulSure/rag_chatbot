"use client";

import { useEffect, useState } from "react";
import { gangaApi, type MyDiya } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ErrorNote, ago, codeOf, keyOf } from "./shared";

/** The writer's own diyas: still floating or settled, with the blessings and replies each gathered. */
export function MyDiyas({ version }: { version: number }) {
  const { lang, t } = useLanguage();
  const [diyas, setDiyas] = useState<MyDiya[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gangaApi.mine().then(setDiyas).catch((e) => setError(codeOf(e)));
  }, [version]);

  if (error) return <ErrorNote code={error} />;
  if (!diyas) return <p className="text-cosmic-400">{t("ganga.loading")}</p>;
  if (diyas.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-cosmic-300">{t("ganga.mineEmpty")}</p>;
  }

  return (
    <ul className="space-y-4">
      {diyas.map((d) => (
        <li key={d.id} className={`rounded-2xl border bg-surface p-5 ${d.status === "floating" ? "border-gold/40" : "border-line"}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="label-caps text-[0.68rem]">{t(keyOf("ganga.k.", d.kind, "ganga.k.sharing"))}</p>
            <p className="text-sm text-cosmic-500">
              <span className={d.status === "floating" ? "text-gold" : ""}>{t(keyOf("ganga.st.", d.status, "ganga.st.settled"))}</span>
              {" · "}{ago(d.created_at, lang)}
            </p>
          </div>
          <p className="mt-3 whitespace-pre-line font-serif text-lg leading-relaxed text-foreground">{d.text}</p>
          <p className="mt-3 flex gap-5 text-sm text-cosmic-300 lining-nums">
            <span><span aria-hidden="true">🙏 </span>{d.blessings} {t("ganga.blessings")}</span>
            <span><span aria-hidden="true">✉ </span>{d.replies} {t("ganga.replies")}</span>
          </p>
          {d.sadhak_blessed && d.blessings === 0 && d.replies === 0 && (
            <p className="mt-3 rounded-lg bg-gold/10 px-4 py-2.5 text-sm leading-relaxed text-cosmic-200">{t("ganga.sadhakBlessed")}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

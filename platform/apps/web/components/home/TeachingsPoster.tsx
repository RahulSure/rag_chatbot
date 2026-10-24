"use client";

import Link from "next/link";
import type { Topic } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import s from "./home.module.css";

const SHOWN = ["tantra", "mantra", "sadhana", "kundalini", "jyotish", "yantra", "meditation"];

/** List blueprint "One item per poster line": giant words left, the small fact right. */
export function TeachingsPoster({ topics }: { topics: Topic[] }) {
  const { lang, t } = useLanguage();
  const items = SHOWN.map((slug) => topics.find((x) => x.slug === slug)).filter((x): x is Topic => Boolean(x));

  return (
    <section className={s.poster} aria-labelledby="teachings-heading">
      <h2 id="teachings-heading" className={`${s.posterHeading} ${s.display}`}>{t("v3.teachingsTitle")}</h2>
      {/* The poster is the content itself, so it does not wait for a reveal. */}
      <ul className={s.posterList}>
        {items.map((topic) => (
          <li key={topic.slug} className={s.posterItem}>
            <Link href={`/teachings/${topic.slug}`}>
              <span className={`${s.posterWord} ${s.display}`}>{lang === "hi" ? topic.label_hi : topic.label}</span>
              <span className={s.posterDetail}>{lang === "hi" ? topic.label : topic.label_hi}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

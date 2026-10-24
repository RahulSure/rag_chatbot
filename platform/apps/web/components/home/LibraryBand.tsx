"use client";

import { useLanguage } from "@/lib/i18n";
import s from "./home.module.css";

const NAMES_EN = ["Lakshmi", "Saraswati", "Baglamukhi", "Hanuman", "Bhairav", "Kundalini", "Ganesha", "Durga", "Shiva", "Shani", "Apsara", "Guru"];
const NAMES_HI = ["लक्ष्मी", "सरस्वती", "बगलामुखी", "हनुमान", "भैरव", "कुंडलिनी", "गणेश", "दुर्गा", "शिव", "शनि", "अप्सरा", "गुरु"];

/** Proof blueprint "Names running off the edges": one line, cropped by both edges, drifting left. */
export function LibraryBand() {
  const { lang, t } = useLanguage();
  const names = lang === "hi" ? NAMES_HI : NAMES_EN;
  const run = (hidden: boolean) => (
    <div className={`${s.names} ${s.display}`} aria-hidden={hidden || undefined}>
      {names.map((n) => (
        <span key={n} style={{ display: "contents" }}>
          <span>{n}</span>
          <span className={s.dot} />
        </span>
      ))}
    </div>
  );

  return (
    <section aria-labelledby="library-heading">
      <div className={s.band34}>
        <div className={s.track}>
          {run(false)}
          {run(true)}
        </div>
      </div>
      <div className={s.proofText}>
        <h2 id="library-heading" className={`${s.display} ${s.rise}`}>{lang === "hi" ? "पुस्तकालय में" : "In the library"}</h2>
        <p className={s.rise} style={{ "--i": 1 } as React.CSSProperties}>{t("v3.libraryLine")}</p>
      </div>
    </section>
  );
}

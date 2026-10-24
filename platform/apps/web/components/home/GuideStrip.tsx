"use client";

import { useT, type Key } from "@/lib/i18n";
import s from "./home.module.css";

type Row = [Key, Key];

const FIELDS: { color: string; clause: Key; rows: Row[]; checked?: boolean; ready?: boolean }[] = [
  { color: s.fieldSindoor, clause: "v3.how1", rows: [] },
  { color: s.fieldHaldi, clause: "v3.how2", rows: [["v3.cardFor", "v3.cardForVal"], ["v3.cardExp", "v3.cardExpVal"], ["v3.cardDiksha", "v3.cardDikshaVal"]] },
  { color: s.fieldBlue, clause: "v3.how3", rows: [["v3.cardFor", "v3.cardForVal"], ["v3.cardExp", "v3.cardExpVal"], ["v3.cardSource", "v3.cardSourceVal"]], checked: true },
  { color: s.fieldAsh, clause: "v3.how4", rows: [["v3.cardExp", "v3.cardExpVal"], ["v3.cardPractice", "v3.cardPracticeVal"], ["v3.cardTime", "v3.cardTimeVal"]], ready: true },
];

/** How-it-works blueprint "One card, four fields": the same request card, further along in each field. */
export function GuideStrip() {
  const t = useT();
  return (
    <section className={s.strip} aria-labelledby="guide-heading">
      {FIELDS.map((f, i) => (
        <div key={f.clause} className={`${s.field} ${f.color}`}>
          {i === 0 && <h2 id="guide-heading" className={s.stripHeading}>{t("v3.howTitle")}</h2>}
          <div className={s.card} data-ui>
            <div className={s.cardTitle}>{t("v3.cardAsk")}</div>
            <div className={s.cardRow}><span>{t("v3.cardRequest")}</span><span>{i === 0 ? t("v3.cardNew") : t("v3.cardReceived")}</span></div>
            {f.rows.map(([label, value]) => (
              <div key={label} className={s.cardRow}><span>{t(label)}</span><span>{t(value)}</span></div>
            ))}
            {f.checked && <div className={s.cardDone}>{t("v3.cardChecked")}</div>}
            {f.ready && <div className={s.cardDone}>{t("v3.cardReady")}</div>}
          </div>
          <p className={`${s.clause} ${s.rise}`} style={{ "--i": i } as React.CSSProperties}>{t(f.clause)}</p>
        </div>
      ))}
    </section>
  );
}

"use client";

import Link from "next/link";
import replies from "@/lib/showcase-replies.json";
import type { BirthChart, Panchang } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { NorthIndianChart } from "@/components/kundli/NorthIndianChart";
import s from "./home.module.css";

const WEEKDAYS_HI: Record<string, string> = {
  Sunday: "रविवार", Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार",
  Thursday: "गुरुवार", Friday: "शुक्रवार", Saturday: "शनिवार",
};

function Caption({ name, detail }: { name: string; detail: string }) {
  return (
    <div className={s.tileCaption}>
      <span>{name}</span>
      <span>{detail}</span>
    </div>
  );
}

/**
 * Work blueprint "Staggered tiles, empty cells": the free tools as real pieces of
 * the product (data-ui), set among paintings of the tradition.
 */
export function ToolsGrid({ chart, panchang, placeName }: { chart: BirthChart | null; panchang: Panchang | null; placeName: string }) {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const example = replies.find((r) => r.lang === lang) ?? replies[0];

  return (
    <section className={s.tiles} aria-labelledby="tools-heading">
      {/* row one: wide tile, heading, single */}
      <Link href="/kundli" className={`${s.tile} ${s.tileWide} ${s.rise}`}>
        <div className={s.tileMedia}>
          <div className={s.fragment} data-ui>
            <div className={s.fragmentTitle}>{t("v3.toolKundli")} · {placeName}</div>
            {chart && <div className={s.fragmentChart}><NorthIndianChart chart={chart} lang={lang} /></div>}
          </div>
        </div>
        <Caption name={t("nav.kundli")} detail={t("v3.free")} />
      </Link>
      <h2 id="tools-heading" className={`${s.tilesHeading} ${s.display}`}>
        {t("v3.toolsTitle1")}
        <br />
        {t("v3.toolsTitle2")}
      </h2>
      <figure className={`${s.tile} ${s.rise}`} style={{ "--i": 1 } as React.CSSProperties}>
        <div className={s.tileMedia}>
          <img src="/images/yantra.jpg" alt="A painted yantra with the Devi at its centre and rows of goddesses around it" loading="lazy" />
        </div>
        <figcaption><Caption name={t("v3.picYantra")} detail={t("v3.picYantraNote")} /></figcaption>
      </figure>

      {/* row two: singles in columns two and three */}
      <figure className={`${s.tile} ${s.placeYogin} ${s.rise}`}>
        <div className={s.tileMedia}>
          <img src="/images/yogin-chakras.jpg" alt="Manuscript painting of a seated yogin with the chakras along the spine" loading="lazy" />
        </div>
        <figcaption><Caption name={t("v3.picYogin")} detail={t("v3.picYoginNote")} /></figcaption>
      </figure>
      <Link href="/kundli" className={`${s.tile} ${s.placePanchang} ${s.rise}`} style={{ "--i": 1 } as React.CSSProperties}>
        <div className={s.tileMedia}>
          <div className={s.fragment} data-ui>
            <div className={s.fragmentTitle}>{t("v3.toolPanchang")} · {placeName}</div>
            {panchang && (
              <table className={s.fragmentTable}>
                <tbody>
                  <tr><td>{hi ? "वार" : "Day"}</td><td>{hi ? WEEKDAYS_HI[panchang.vara] ?? panchang.vara : panchang.vara}</td></tr>
                  <tr><td>{hi ? "तिथि" : "Tithi"}</td><td>{panchang.tithi.paksha} {panchang.tithi.name}</td></tr>
                  <tr><td>{hi ? "नक्षत्र" : "Nakshatra"}</td><td>{hi ? panchang.nakshatra.name_hi ?? panchang.nakshatra.name : panchang.nakshatra.name}</td></tr>
                  <tr><td>{hi ? "योग" : "Yoga"}</td><td>{panchang.yoga.name}</td></tr>
                  <tr><td>{hi ? "करण" : "Karana"}</td><td>{panchang.karana.name}</td></tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
        <Caption name={t("v3.toolPanchang")} detail={t("v3.free")} />
      </Link>

      {/* row three: single in column one, wide tile in columns three and four */}
      <figure className={`${s.tile} ${s.placeKundalini} ${s.rise}`}>
        <div className={s.tileMedia}>
          <img src="/images/kundalini-tantra.jpg" alt="Kundalini Tantra painting from Rajasthan with sun, moon, chakras and serpents" loading="lazy" />
        </div>
        <figcaption><Caption name={t("v3.picKundalini")} detail={t("v3.picKundaliniNote")} /></figcaption>
      </figure>
      <Link href="/chat" className={`${s.tile} ${s.tileWide} ${s.placeChat} ${s.rise}`} style={{ "--i": 1 } as React.CSSProperties}>
        <div className={s.tileMedia}>
          <div className={s.fragment} data-ui>
            <div className={s.fragmentTitle}>{t("nav.cta")}</div>
            <div className={s.chat}>
              {/* a real first reply recorded from Sadhak (lib/showcase-replies.json) */}
              <div className={s.bubbleUser}>{example.question}</div>
              <div className={s.bubbleBot}>
                <span className={s.bubbleName}>{hi ? "साधक" : "Sadhak"}</span>
                {example.reply}
              </div>
            </div>
          </div>
        </div>
        <Caption name={t("v3.toolChat")} detail={t("v3.open")} />
      </Link>
    </section>
  );
}

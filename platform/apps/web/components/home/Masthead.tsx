"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import s from "./home.module.css";

const LINKS = [
  { href: "/kundli", key: "nav.kundli" },
  { href: "/teachings", key: "nav.explore" },
  { href: "/blog", key: "nav.articles" },
] as const;

/** Hero blueprint "Mosaic masthead, title on axis": four greyscale pictures and flat tiles, header on the band's top edge. */
export function Masthead() {
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={s.masthead}>
      <div className={s.band}>
        <div className={`${s.cell} ${s.drift}`} style={{ gridArea: "p1" }}>
          <img src="/images/jodhpur-lane.jpg" alt="A lane of blue-washed houses in Jodhpur" fetchPriority="high" />
        </div>
        <div className={s.cell} style={{ gridArea: "c1", background: "var(--haldi)" }} />
        <div className={s.cell} style={{ gridArea: "p2" }}>
          <img src="/images/himalaya.jpg" alt="Snow peaks of the Himalaya against a deep blue sky" />
        </div>
        <div className={s.cell} style={{ gridArea: "c2", background: "var(--blue)" }} />
        <div className={`${s.cell} ${s.hidePhone}`} style={{ gridArea: "c3", background: "var(--sindoor)" }} />
        <div className={s.cell} style={{ gridArea: "c4", background: "var(--sindoor)" }} />
        <div className={s.cell} style={{ gridArea: "c5", background: "var(--blue)" }} />
        <div className={`${s.cell} ${s.hidePhone}`} style={{ gridArea: "c6", background: "var(--sindoor)" }} />
        <div className={`${s.cell} ${s.hidePhone}`} style={{ gridArea: "p3" }}>
          <img src="/images/yantra.jpg" alt="A painted yantra with the Devi at its centre, 19th century" />
        </div>
        <div className={`${s.cell} ${s.hidePhone}`} style={{ gridArea: "p4" }}>
          <img src="/images/akash-deep.jpg" alt="Akash deep lamp baskets on bamboo poles at a Varanasi ghat" />
        </div>
      </div>

      <nav className={s.header} aria-label="Primary">
        <Link href="/" className={s.wordmark}>Sadhak</Link>
        <div className={s.tab}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{t(l.key)}</Link>
          ))}
        </div>
        <div className={s.headerEnd}>
          <button type="button" className={s.langToggle} onClick={() => setLang(lang === "en" ? "hi" : "en")}
                  aria-label={t("nav.language")}>
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <Link href="/chat" className={`${s.button} ${s.headerAction}`}>{t("nav.cta")}</Link>
          <button type="button" className={s.menuWord} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {t("v3.menu")}
          </button>
        </div>
        {menuOpen && (
          <div className={s.mobileMenu}>
            <Link href="/chat">{t("nav.cta")}</Link>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>{t(l.key)}</Link>
            ))}
            <Link href="/books">{t("nav.library")}</Link>
            <Link href="/guru">{t("nav.about")}</Link>
          </div>
        )}
      </nav>

      <div className={s.below}>
        <p className={`${s.standfirst} ${s.afterTitle}`}>{t("v3.standfirst")}</p>
        <h1 className={`${s.title} ${s.display}`}>
          <span className={s.line}><span>{t("v3.title1")}</span></span>
          <span className={s.line}><span>{t("v3.title2")}</span></span>
        </h1>
        <Link href="/chat" className={`${s.button} ${s.heroPhoneAction} ${s.afterTitle}`}>{t("nav.cta")}</Link>
      </div>
    </header>
  );
}

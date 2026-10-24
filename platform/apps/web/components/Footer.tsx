"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useT, type Key } from "@/lib/i18n";
import s from "./footer.module.css";

const LINKS: { href: string; label: Key }[] = [
  { href: "/chat", label: "nav.chat" },
  { href: "/kundli", label: "nav.kundli" },
  { href: "/teachings", label: "nav.explore" },
  { href: "/blog", label: "nav.articles" },
  { href: "/books", label: "nav.library" },
  { href: "/guru", label: "nav.about" },
  { href: "/search", label: "nav.search" },
];

// Credits for the found pictures used across the site (see assets/credits.json).
const CREDITS = [
  { title: "Jodhpur, India, Blue City", by: "Vyacheslav Argenberg", licence: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0", url: "https://commons.wikimedia.org/wiki/File:Jodhpur,_India,_Blue_City.jpg", via: "Wikimedia Commons" },
  { title: "Everest, Himalayas", by: "Vyacheslav Argenberg", licence: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0", url: "https://commons.wikimedia.org/wiki/File:Everest,_Himalayas.jpg", via: "Wikimedia Commons" },
  { title: "Mystical Diagram (Yantra)", by: "India, 19th century", licence: "public domain", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/", url: "https://www.artic.edu/artworks/144939", via: "Art Institute of Chicago" },
  { title: "Yogin in meditation", by: "", licence: "public domain", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/", url: "https://commons.wikimedia.org/wiki/File:Yogin_in_meditation_chakras_kundalini_snake.jpg", via: "Wikimedia Commons" },
  { title: "Kundalini Tantra painting (Rajasthan, 18th century)", by: "", licence: "public domain", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/", url: "https://commons.wikimedia.org/wiki/File:Kundalini_Tantra_painting_(Rajasthan,_18th_century).png", via: "Wikimedia Commons" },
  { title: "Varanasi 109 - akash deep", by: "juggadery", licence: "CC BY-SA 2.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0", url: "https://commons.wikimedia.org/wiki/File:Varanasi_109_-_akash_deep_(35317172826).jpg", via: "Wikimedia Commons" },
  { title: "Ganga Aarti in Haridwar", by: "Bhaiyaji Smile 123", licence: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0", url: "https://commons.wikimedia.org/wiki/File:Ganga_Aarti_in_Haridwar.webm", via: "Wikimedia Commons" },
];

function useJodhpurTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Footer() {
  const t = useT();
  const time = useJodhpurTime();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      a.volume = 0.4;
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  return (
    <footer className={s.footer}>
      <div className={`${s.tile} ${s.statement}`}>
        <p>{t("v3.footerStatement")}</p>
        <p className={s.legal}>© {new Date().getFullYear()} Sadhak.ai · {t("footer.rights")}</p>
      </div>
      <nav className={`${s.tile} ${s.nav}`} aria-label="Footer">
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}><Link href={l.href}>{t(l.label)}</Link></li>
          ))}
        </ul>
      </nav>
      <div className={`${s.tile} ${s.time}`}>
        <span className={s.timeCity}>Jodhpur</span>
        <span>
          <span className={s.legal} style={{ color: "#ffffff", display: "block" }}>{t("v3.localTime")}</span>
          <span className={s.timeValue}>{time ?? "--:--"}</span>
        </span>
      </div>
      <div className={`${s.tile} ${s.listen}`}>
        <span className={s.listenTitle}>{t("v3.listen")}</span>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audio} src="/videos/guru-avaahan-mantra.mp3" loop preload="none" onEnded={() => setPlaying(false)} />
        <button type="button" className={s.play} onClick={toggle} aria-pressed={playing}>
          {playing ? t("v3.pause") : t("v3.play")}
        </button>
      </div>

      <div className={s.wordmarkTile} aria-hidden="true">Sadhak</div>
      <Link href="/chat" className={s.invite}>
        <span>{t("nav.cta")}</span>
        <svg width="64" height="40" viewBox="0 0 64 40" fill="none" aria-hidden="true">
          <path d="M2 20h56M40 4l18 16-18 16" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
        </svg>
      </Link>

      <p className={s.credits}>
        {t("v3.pictures")}:{" "}
        {CREDITS.map((c, i) => (
          <span key={c.url}>
            <a href={c.url} rel="noopener noreferrer">“{c.title}”</a>
            {c.by ? ` by ${c.by}` : ""}, <a href={c.licenceUrl} rel="noopener noreferrer">{c.licence}</a>, via {c.via}
            {i < CREDITS.length - 1 ? "; " : "."}
          </span>
        ))}
      </p>
    </footer>
  );
}

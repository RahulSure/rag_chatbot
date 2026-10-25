"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useT, type Key } from "@/lib/i18n";

const EXPLORE: { href: string; label: Key }[] = [
  { href: "/chat", label: "nav.chat" },
  { href: "/kundli", label: "nav.kundli" },
  { href: "/#today", label: "v4.toolPanchang" },
  { href: "/teachings", label: "nav.explore" },
];

const LEARN: { href: string; label: Key }[] = [
  { href: "/blog", label: "nav.articles" },
  { href: "/books", label: "nav.library" },
  { href: "/guru", label: "nav.about" },
  { href: "/search", label: "nav.search" },
];

// Credits for the found pictures used across the site (see public/images/credits.json).
const CREDITS = [
  { title: "Everest, Himalayas", by: "Vyacheslav Argenberg", licence: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0", url: "https://commons.wikimedia.org/wiki/File:Everest,_Himalayas.jpg", via: "Wikimedia Commons" },
  { title: "Mystical Diagram (Yantra), India, 19th century", by: "", licence: "public domain", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/", url: "https://www.artic.edu/artworks/144939", via: "Art Institute of Chicago" },
  // The video and its poster frame.
  { title: "Ganga Aarti in Haridwar", by: "Bhaiyaji Smile 123", licence: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0", url: "https://commons.wikimedia.org/wiki/File:Ganga_Aarti_in_Haridwar.webm", via: "Wikimedia Commons" },
];

function LinkColumn({ title, links }: { title: Key; links: { href: string; label: Key }[] }) {
  const t = useT();
  return (
    <div>
      <p className="label-caps">{t(title)}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-cosmic-300 transition-colors hover:text-gold">{t(l.label)}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const t = useT();
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
    <footer className="border-t border-line bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" className="font-serif text-xl font-semibold uppercase tracking-[0.32em] text-gold">Sadhak</Link>
          <p className="mt-4 max-w-xs leading-relaxed text-cosmic-300">{t("v4.footerTagline")}</p>
        </div>
        <LinkColumn title="v4.footerExplore" links={EXPLORE} />
        <LinkColumn title="v4.footerLearn" links={LEARN} />
        <div>
          <p className="label-caps">{t("v4.footerListen")}</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio ref={audio} src="/videos/guru-avaahan-mantra.mp3" loop preload="none" onEnded={() => setPlaying(false)} />
          <button
            type="button"
            onClick={toggle}
            aria-pressed={playing}
            className="mt-4 flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-gold/50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-background">
              {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} className="ml-0.5" aria-hidden="true" />}
            </span>
            <span>
              <span className="block text-sm text-foreground">{t("v4.footerMantra")}</span>
              <span className="block text-xs text-cosmic-500">{playing ? t("v4.pause") : t("v4.play")}</span>
            </span>
          </button>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-6 text-xs leading-relaxed text-cosmic-500">
          <p>{t("v4.footerDisclaimer")}</p>
          <p>© {new Date().getFullYear()} Sadhak.ai · {t("footer.rights")}</p>
          <p>
            {t("v4.pictures")}:{" "}
            {CREDITS.map((c, i) => (
              <span key={c.url}>
                <a href={c.url} rel="noopener noreferrer" className="underline-offset-2 hover:underline">“{c.title}”</a>
                {c.by ? ` by ${c.by}` : ""},{" "}
                <a href={c.licenceUrl} rel="noopener noreferrer" className="underline-offset-2 hover:underline">{c.licence}</a>, via {c.via}
                {i < CREDITS.length - 1 ? "; " : "."}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}

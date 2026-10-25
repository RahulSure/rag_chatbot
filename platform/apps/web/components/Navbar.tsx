"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage, type Key } from "@/lib/i18n";

const NAV_LINKS: { href: string; label: Key }[] = [
  { href: "/chat", label: "nav.chat" },
  { href: "/kundli", label: "nav.kundli" },
  { href: "/numerology", label: "num.nav" },
  { href: "/#today", label: "v4.toolPanchang" },
  { href: "/teachings", label: "nav.explore" },
  { href: "/blog", label: "nav.articles" },
];

const MORE_LINKS: { href: string; label: Key }[] = [
  { href: "/books", label: "nav.library" },
  { href: "/guru", label: "nav.about" },
  { href: "/search", label: "nav.search" },
];

/** Spaced gold wordmark, a few quiet links, one outlined action. */
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const isActive = (href: string) => !href.includes("#") && pathname.startsWith(href);

  return (
    <nav aria-label="Primary" className="sticky top-0 z-50 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
        <Link href="/" className="font-serif text-xl font-semibold uppercase tracking-[0.32em] text-gold">
          Sadhak
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`text-sm transition-colors hover:text-gold ${isActive(link.href) ? "text-gold" : "text-cosmic-300"}`}
            >
              {t(link.label)}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            aria-label={t("nav.language")}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gold/20 px-2.5 text-sm text-cosmic-300 transition-colors hover:border-gold/50 hover:text-gold"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <ThemeToggle />
          <Link href="/chat" className="btn-ghost ml-2 hidden whitespace-nowrap px-5 py-2 text-sm md:inline-flex">
            {t("nav.cta")}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center text-foreground lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={t("nav.menu")}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-background px-4 pb-5 pt-2 lg:hidden">
          {[...NAV_LINKS, ...MORE_LINKS].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line py-3.5 text-lg text-foreground last:border-b-0"
            >
              {t(link.label)}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

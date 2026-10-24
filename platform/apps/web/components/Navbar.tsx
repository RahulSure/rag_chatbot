"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage, type Key } from "@/lib/i18n";

const NAV_LINKS: { href: string; label: Key }[] = [
  { href: "/kundli", label: "nav.kundli" },
  { href: "/teachings", label: "nav.explore" },
  { href: "/blog", label: "nav.articles" },
  { href: "/books", label: "nav.library" },
];

/** A plain bar: wordmark, a few links, one action. The home page draws its own masthead instead. */
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  if (pathname === "/") return null;

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav aria-label="Primary" className="sticky top-0 z-50 bg-cosmic-950">
      <div className="flex h-14 items-stretch">
        <Link href="/" className="flex items-center bg-foreground px-5 text-lg font-bold uppercase tracking-tight text-background">
          Sadhak
        </Link>

        <div className="hidden items-center gap-7 px-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`font-devanagari transition-opacity hover:opacity-70 ${isActive(link.href) ? "font-medium text-gold" : "text-foreground"}`}
            >
              {t(link.label)}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 pr-4">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            aria-label={t("nav.language")}
            className="h-11 min-w-11 bg-cosmic-900 px-3 text-sm text-foreground transition-transform hover:-translate-y-0.5"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <ThemeToggle />
          <Link href="/chat" className="btn-gold hidden items-center px-5 py-2.5 text-sm sm:inline-flex">
            {t("nav.cta")}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center text-foreground lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={t("nav.menu")}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-1 bg-cosmic-950 px-4 pb-4 lg:hidden">
          {[{ href: "/chat", label: "nav.chat" as Key }, ...NAV_LINKS, { href: "/guru", label: "nav.about" as Key }, { href: "/search", label: "nav.search" as Key }].map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block py-3 text-lg text-foreground font-devanagari">
              {t(link.label)}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage, type Key } from "@/lib/i18n";

const NAV_LINKS: { href: string; label: Key }[] = [
  { href: "/", label: "nav.home" },
  { href: "/chat", label: "nav.chat" },
  { href: "/kundli", label: "nav.kundli" },
  { href: "/teachings", label: "nav.explore" },
  { href: "/blog", label: "nav.articles" },
  { href: "/books", label: "nav.library" },
  { href: "/guru", label: "nav.about" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const toggleLang = () => setLang(lang === "en" ? "hi" : "en");
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const langButton = (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t("nav.language")}
      title={t("nav.language")}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gold/20 px-2 text-xs
                 font-medium text-cosmic-300 transition-colors hover:border-gold/50 hover:text-gold"
    >
      {lang === "en" ? "हिं" : "EN"}
    </button>
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed left-0 right-0 top-0 z-50 border-b border-gold/15 bg-background/85 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Sadhak.ai home">
          <Logo size={30} />
          <div>
            <div className="font-serif text-base font-semibold leading-tight text-foreground">
              Sadhak<span className="text-gold">.ai</span>
            </div>
            <div className="hidden text-[11px] leading-tight text-cosmic-500 sm:block">{t("brand.tagline")}</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-devanagari transition-colors ${
                isActive(link.href)
                  ? "bg-gold/10 font-medium text-gold"
                  : "text-cosmic-300 hover:bg-cosmic-800/60 hover:text-foreground"
              }`}
            >
              {t(link.label)}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {langButton}
          <ThemeToggle />
          <Link
            href="/search"
            aria-label={t("nav.search")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cosmic-400 transition-colors hover:text-gold"
          >
            <Search size={18} />
          </Link>
          <Link href="/chat" className="btn-gold flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-devanagari">
            <MessageCircle size={14} />
            {t("nav.cta")}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          {langButton}
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center text-cosmic-300 hover:text-foreground"
            onClick={() => setOpen(!open)}
            aria-label={t("nav.menu")}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="space-y-1 border-t border-gold/15 bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
          {[...NAV_LINKS, { href: "/search", label: "nav.search" as Key }].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`block rounded-lg px-4 py-3 text-sm font-devanagari transition-colors ${
                isActive(link.href) ? "bg-gold/10 text-gold" : "text-cosmic-300 hover:text-foreground"
              }`}
            >
              {t(link.label)}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

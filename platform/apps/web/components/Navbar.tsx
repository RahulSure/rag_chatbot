"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage, type Key } from "@/lib/i18n";

type NavLink = { href: string; label: Key };

const TOOL_LINKS: NavLink[] = [
  { href: "/kundli", label: "nav.kundli" },
  { href: "/numerology", label: "v4.toolNumerology" },
  { href: "/tarot", label: "v4.toolTarot" },
  { href: "/#today", label: "v4.toolPanchang" },
];

const AFTER_TOOLS: NavLink[] = [
  { href: "/teachings", label: "nav.explore" },
  { href: "/blog", label: "nav.articles" },
];

const MORE_LINKS: NavLink[] = [
  { href: "/books", label: "nav.library" },
  { href: "/guru", label: "nav.about" },
  { href: "/search", label: "nav.search" },
];

/** Spaced gold wordmark, a few quiet links with the free tools in one menu, one outlined action. */
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const { lang, setLang, t } = useLanguage();

  const isActive = (href: string) => !href.includes("#") && pathname.startsWith(href);
  const linkClass = (href: string) =>
    `text-sm transition-colors hover:text-gold ${isActive(href) ? "text-gold" : "text-cosmic-300"}`;

  // Close the menus on navigation, on Escape and on a click outside the tools menu.
  useEffect(() => {
    setToolsOpen(false);
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!toolsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!toolsRef.current?.contains(e.target as Node)) setToolsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setToolsOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [toolsOpen]);

  return (
    <nav aria-label="Primary" className="sticky top-0 z-50 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
        <Link href="/" className="font-serif text-xl font-semibold uppercase tracking-[0.32em] text-gold">
          Sadhak
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          <Link href="/chat" aria-current={isActive("/chat") ? "page" : undefined} className={linkClass("/chat")}>
            {t("nav.chat")}
          </Link>

          <div ref={toolsRef} className="relative">
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              aria-expanded={toolsOpen}
              aria-controls="tools-menu"
              className={`inline-flex items-center gap-1 text-sm transition-colors hover:text-gold ${
                TOOL_LINKS.some((l) => isActive(l.href)) ? "text-gold" : "text-cosmic-300"}`}
            >
              {t("nav.tools")}
              <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>
            {toolsOpen && (
              <ul id="tools-menu" className="absolute left-0 top-full mt-3 w-60 rounded-xl border border-line bg-surface p-2 shadow-cosmic">
                {TOOL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setToolsOpen(false)}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gold/10 ${
                        isActive(l.href) ? "text-gold" : "text-cosmic-200"}`}
                    >
                      {t(l.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {AFTER_TOOLS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined} className={linkClass(link.href)}>
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
          <Link href="/chat" onClick={() => setOpen(false)} className="block border-b border-line py-3.5 text-lg text-foreground">
            {t("nav.chat")}
          </Link>
          <p className="label-caps pb-1 pt-4 text-[0.68rem]">{t("nav.tools")}</p>
          {TOOL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                  className="block border-b border-line py-3.5 pl-3 text-lg text-foreground">
              {t(link.label)}
            </Link>
          ))}
          {[...AFTER_TOOLS, ...MORE_LINKS].map((link) => (
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

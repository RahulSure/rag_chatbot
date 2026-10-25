"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage, type Key } from "@/lib/i18n";
import { TOOL_GROUPS } from "@/lib/tools";

type NavLink = { href: string; label: Key };

const AFTER_TOOLS: NavLink[] = [
  { href: "/teachings", label: "nav.explore" },
  { href: "/blog", label: "nav.articles" },
];

const MORE_LINKS: NavLink[] = [
  { href: "/books", label: "nav.library" },
  { href: "/guru", label: "nav.about" },
  { href: "/search", label: "nav.search" },
];

// The tools that open the menu; the menu itself lists every one of them.
const TOOL_PATHS = TOOL_GROUPS.flatMap((g) => g.tools.map((t) => t.href.split(/[?#]/)[0])).filter((p) => p !== "/");

/** Spaced gold wordmark, a few quiet links with every free tool in one menu, one outlined action. */
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const { lang, setLang, t } = useLanguage();

  const isActive = (href: string) => !href.includes("#") && href !== "/chat" ? pathname.startsWith(href.split("?")[0]) : pathname === href;
  const linkClass = (href: string) =>
    `text-sm transition-colors hover:text-gold ${isActive(href) ? "text-gold" : "text-cosmic-300"}`;
  const inTools = TOOL_PATHS.some((p) => p !== "/chat" && pathname.startsWith(p)) || pathname === "/tools";

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
          <Link href="/chat" aria-current={pathname === "/chat" ? "page" : undefined} className={linkClass("/chat")}>
            {t("nav.chat")}
          </Link>

          <div ref={toolsRef}>
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              aria-expanded={toolsOpen}
              aria-controls="tools-menu"
              className={`inline-flex items-center gap-1 text-sm transition-colors hover:text-gold ${inTools ? "text-gold" : "text-cosmic-300"}`}
            >
              {t("nav.tools")}
              <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>
            {toolsOpen && (
              <div id="tools-menu" className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-cosmic">
                <div className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-4 py-8">
                  {TOOL_GROUPS.map((g) => (
                    <div key={g.title}>
                      <p className="label-caps text-[0.68rem]">{t(g.title)}</p>
                      <ul className="mt-3 space-y-0.5">
                        {g.tools.map((tool) => (
                          <li key={tool.href}>
                            <Link href={tool.href} onClick={() => setToolsOpen(false)}
                                  className="-mx-2 block rounded-md px-2 py-1.5 text-sm text-cosmic-200 transition-colors hover:bg-gold/10 hover:text-foreground">
                              {t(tool.title)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="border-t border-line">
                  <div className="mx-auto max-w-6xl px-4 py-3">
                    <Link href="/tools" onClick={() => setToolsOpen(false)} className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
                      {t("tools.all")} <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
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
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-background px-4 pb-6 pt-2 lg:hidden">
          <Link href="/chat" onClick={() => setOpen(false)} className="block border-b border-line py-3.5 text-lg text-foreground">
            {t("nav.chat")}
          </Link>
          {TOOL_GROUPS.map((g) => (
            <div key={g.title} className="border-b border-line pb-2">
              <p className="label-caps pb-1 pt-4 text-[0.68rem]">{t(g.title)}</p>
              <div className="grid grid-cols-2 gap-x-4">
                {g.tools.filter((tool) => tool.href !== "/chat").map((tool) => (
                  <Link key={tool.href} href={tool.href} onClick={() => setOpen(false)} className="block py-2 text-base text-foreground">
                    {t(tool.title)}
                  </Link>
                ))}
              </div>
            </div>
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

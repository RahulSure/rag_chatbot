"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useT, type Key } from "@/lib/i18n";

const LINKS: { href: string; label: Key }[] = [
  { href: "/", label: "nav.home" },
  { href: "/chat", label: "nav.chat" },
  { href: "/teachings", label: "nav.explore" },
  { href: "/blog", label: "nav.articles" },
  { href: "/books", label: "nav.library" },
  { href: "/guru", label: "nav.about" },
  { href: "/search", label: "nav.search" },
];

export function Footer() {
  const t = useT();

  return (
    <footer className="mt-20 border-t border-gold/15 px-6 py-12">
      <div className="mx-auto max-w-6xl text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Logo />
          <span className="font-serif text-lg font-semibold text-foreground">
            Sadhak<span className="text-gold">.ai</span>
          </span>
        </div>
        <p className="mb-6 text-sm text-cosmic-500">{t("brand.tagline")}</p>

        <nav aria-label="Footer" className="mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-cosmic-400 transition-colors hover:text-gold">
              {t(l.label)}
            </Link>
          ))}
        </nav>

        <p className="mx-auto mb-3 max-w-2xl text-xs leading-relaxed text-cosmic-500">{t("footer.disclaimer")}</p>
        <p className="text-xs text-cosmic-600">
          © {new Date().getFullYear()} Sadhak.ai · {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}

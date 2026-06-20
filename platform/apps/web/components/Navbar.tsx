"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Search, MessageCircle } from "lucide-react";

const NAV_LINKS_EN = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "AI Chat" },
  { href: "/teachings", label: "Teachings" },
  { href: "/blog", label: "Blog" },
  { href: "/guru", label: "About Gurudev" },
  { href: "/search", label: "Search" },
];

const NAV_LINKS_HI = [
  { href: "/", label: "होम" },
  { href: "/chat", label: "प्रश्न पूछें" },
  { href: "/teachings", label: "शिक्षाएं" },
  { href: "/blog", label: "लेख" },
  { href: "/guru", label: "गुरुदेव के बारे में" },
  { href: "/search", label: "खोजें" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");

  useEffect(() => {
    const saved = localStorage.getItem("shrimali_lang") as "en" | "hi" | null;
    if (saved) setLang(saved);
  }, []);

  const toggleLang = () => {
    const next = lang === "en" ? "hi" : "en";
    setLang(next);
    localStorage.setItem("shrimali_lang", next);
  };

  const NAV_LINKS = lang === "hi" ? NAV_LINKS_HI : NAV_LINKS_EN;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gold/10 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl">🕉</span>
          <div>
            <div className="font-serif text-gold font-bold leading-tight text-sm">
              Sadhak<span className="text-gold/60">.ai</span>
            </div>
            <div className="text-cosmic-500 text-xs leading-tight">
              {lang === "hi" ? "साधक का आत्मज्ञान साथी" : "AI Spiritual Companion"}
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm transition-all font-devanagari ${
                pathname === link.href
                  ? "text-gold bg-gold/10"
                  : "text-cosmic-300 hover:text-foreground hover:bg-cosmic-800/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA + Lang toggle */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 rounded-lg border border-gold/20 text-xs text-cosmic-400
                       hover:border-gold/50 hover:text-gold transition-all font-devanagari"
            title="Toggle language"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <Link href="/search" className="text-cosmic-400 hover:text-foreground transition-colors">
            <Search size={18} />
          </Link>
          <Link href="/chat" className="btn-gold text-sm px-4 py-2 rounded-lg flex items-center gap-2 font-devanagari">
            <MessageCircle size={14} />
            {lang === "hi" ? "AI गुरु से पूछें" : "Ask AI Guru"}
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="px-2 py-1 rounded border border-gold/20 text-xs text-cosmic-400 font-devanagari"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <button
            className="text-cosmic-300 hover:text-foreground"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gold/10 bg-background/95 backdrop-blur-md px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm transition-all font-devanagari ${
                pathname === link.href
                  ? "text-gold bg-gold/10"
                  : "text-cosmic-300 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

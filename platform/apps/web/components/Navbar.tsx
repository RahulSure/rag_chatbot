"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search, MessageCircle } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "AI Chat" },
  { href: "/teachings", label: "Teachings" },
  { href: "/blog", label: "Blog" },
  { href: "/books", label: "Books" },
  { href: "/guru", label: "About Gurudev" },
  { href: "/search", label: "Search" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gold/10 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl">🕉</span>
          <div>
            <div className="font-serif text-gold font-bold leading-tight text-sm">Shrimali AI</div>
            <div className="text-cosmic-500 text-xs leading-tight">Spiritual Knowledge Platform</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                pathname === link.href
                  ? "text-gold bg-gold/10"
                  : "text-cosmic-300 hover:text-foreground hover:bg-cosmic-800/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/search" className="text-cosmic-400 hover:text-foreground transition-colors">
            <Search size={18} />
          </Link>
          <Link href="/chat" className="btn-gold text-sm px-4 py-2 rounded-lg flex items-center gap-2">
            <MessageCircle size={14} />
            Ask AI Guru
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-cosmic-300 hover:text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gold/10 bg-background/95 backdrop-blur-md px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm transition-all ${
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

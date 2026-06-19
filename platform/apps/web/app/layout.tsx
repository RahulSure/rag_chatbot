import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { WhatsAppCTA } from "@/components/WhatsAppCTA";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Shrimali AI — Spiritual Knowledge Platform",
    template: "%s | Shrimali AI — Dr. Narayan Dutt Shrimali",
  },
  description:
    "Explore the timeless teachings of Sadgurudev Dr. Narayan Dutt Shrimali on tantra, mantra, sadhana, kundalini, and jyotish. AI-powered spiritual knowledge platform.",
  keywords: [
    "Dr Narayan Dutt Shrimali",
    "Sadgurudev",
    "tantra sadhana",
    "mantra siddhi",
    "kundalini awakening",
    "spiritual platform",
    "Nikhileshwaranand",
    "Siddhashram",
    "jyotish",
    "vedic astrology",
  ],
  authors: [{ name: "Dr. Narayan Dutt Shrimali" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Shrimali AI Spiritual Platform",
    title: "Shrimali AI — Spiritual Knowledge Platform",
    description: "AI-powered wisdom from the teachings of Dr. Narayan Dutt Shrimali",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shrimali AI — Spiritual Knowledge Platform",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
  themeColor: "#c9a84c",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shrimali AI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased bg-background">
        <GalaxyBackground />
        <div className="relative z-10">
          <Navbar />
          <main className="pt-16">{children}</main>
          <WhatsAppCTA />
          <footer className="border-t border-gold/10 py-12 px-6 mt-20">
          <div className="max-w-6xl mx-auto text-center">
            <div className="text-2xl mb-3">🕉</div>
            <p className="font-serif text-gold text-lg mb-2">
              ॐ परम तत्वाय नारायणाय गुरुभ्यो नमः
            </p>
            <p className="text-cosmic-500 text-sm mb-6">
              Dedicated to the eternal teachings of Sadgurudev Dr. Narayan Dutt Shrimali
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-cosmic-400 mb-6">
              {[
                ["/", "Home"],
                ["/chat", "AI Chat"],
                ["/teachings", "Teachings"],
                ["/blog", "Blog"],
                ["/books", "Books"],
                ["/guru", "About Gurudev"],
                ["/search", "Search"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="hover:text-gold transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
            <p className="text-cosmic-700 text-xs">
              © {new Date().getFullYear()} Shrimali AI Spiritual Platform. 
              All teachings attributed to Dr. Narayan Dutt Shrimali.
            </p>
          </div>
        </footer>
        </div>
      </body>
    </html>
  );
}

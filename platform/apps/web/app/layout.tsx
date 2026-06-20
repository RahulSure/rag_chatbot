import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { WhatsAppCTA } from "@/components/WhatsAppCTA";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sadhak.ai — AI Spiritual Companion",
    template: "%s | Sadhak.ai",
  },
  description:
    "Sadhak.ai — your AI-powered spiritual companion. Explore timeless teachings on tantra, mantra, sadhana, kundalini, and jyotish from Sadgurudev Dr. Narayan Dutt Shrimali.",
  keywords: [
    "Sadhak AI",
    "spiritual AI",
    "Dr Narayan Dutt Shrimali",
    "Sadgurudev",
    "tantra sadhana",
    "mantra siddhi",
    "kundalini awakening",
    "spiritual seeker",
    "Nikhileshwaranand",
    "Siddhashram",
    "jyotish",
    "vedic astrology",
    "sadhak",
  ],
  authors: [{ name: "Dr. Narayan Dutt Shrimali" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Sadhak.ai",
    title: "Sadhak.ai — AI Spiritual Companion",
    description: "AI-powered wisdom for every spiritual seeker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sadhak.ai — AI Spiritual Companion",
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
    title: "Sadhak.ai",
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
              © {new Date().getFullYear()} Sadhak.ai — All teachings attributed to Dr. Narayan Dutt Shrimali.
            </p>
          </div>
        </footer>
        </div>
      </body>
    </html>
  );
}

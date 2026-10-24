import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, Playfair_Display } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppBadge } from "@/components/WhatsAppCTA";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n";
import "@/styles/globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Sadhak.ai — Your AI spiritual companion",
    template: "%s | Sadhak.ai",
  },
  description:
    "Sadhak.ai is an AI companion for spiritual seekers. Ask about mantra, meditation, tantra, kundalini and sadhana — answers are grounded in published teachings, with sources shown.",
  keywords: [
    "Sadhak AI",
    "spiritual AI",
    "meditation",
    "mantra",
    "sadhana",
    "tantra",
    "kundalini",
    "Vedic wisdom",
    "spiritual seeker",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Sadhak.ai",
    title: "Sadhak.ai — Your AI spiritual companion",
    description: "Ask about practice, mantra and meditation. Answers grounded in published teachings.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sadhak.ai — Your AI spiritual companion",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sadhak.ai",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script toggles the "dark" class before paint, so hydration must tolerate it.
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${devanagari.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]
                         focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-gold"
            >
              Skip to content
            </a>
            <Navbar />
            <main id="main" className="pt-16">
              {children}
            </main>
            <Footer />
            <WhatsAppBadge />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

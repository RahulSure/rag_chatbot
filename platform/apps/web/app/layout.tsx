import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n";
import "@/styles/globals.css";

// An elegant serif for headings, a quiet sans for reading.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serifDeva = Noto_Serif_Devanagari({ subsets: ["devanagari"], weight: ["500", "600"], variable: "--font-serif-deva", display: "swap" });
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
    "Sadhak.ai is an AI companion for spiritual seekers. Ask about mantra, meditation, tantra, kundalini and sadhana — answers are grounded in published teachings.",
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
    <html lang="en" suppressHydrationWarning className={`dark ${serif.variable} ${sans.variable} ${serifDeva.variable} ${devanagari.variable}`}>
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
            <main id="main">
              {children}
            </main>
            <Footer />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

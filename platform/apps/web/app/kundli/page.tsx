import type { Metadata } from "next";
import { KundliApp } from "@/components/kundli/KundliApp";
import { T } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Free Kundli — Vedic Birth Chart",
  description:
    "Free Vedic birth chart: ascendant (lagna), Moon sign, nakshatra, planets, houses, current dasha and today's panchang. Lahiri ayanamsa.",
};

export default function KundliPage() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-serif text-4xl text-foreground sm:text-5xl">
            <T k="kundli.title" />
          </h1>
          <p className="mx-auto max-w-xl text-cosmic-400">
            <T k="kundli.lead" />
          </p>
        </div>
        <KundliApp />
      </div>
    </div>
  );
}

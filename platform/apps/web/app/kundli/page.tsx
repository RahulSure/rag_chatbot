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
    <div className="min-h-screen px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="label-caps">
            <T k="v4.formLabel" />
          </p>
          <h1 className="mb-4 mt-4 font-serif text-4xl text-foreground sm:text-6xl">
            <T k="kundli.title" />
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-cosmic-300">
            <T k="kundli.lead" />
          </p>
        </div>
        <KundliApp />
      </div>
    </div>
  );
}

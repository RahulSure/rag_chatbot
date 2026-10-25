import type { Metadata } from "next";
import { TarotApp } from "@/components/tarot/TarotApp";
import { T } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Free Tarot Reading — Card of the Day and Three-Card Spread",
  description:
    "Free tarot with the classic Rider–Waite–Smith deck: draw a card of the day or a past, present and path-ahead spread, read as a mirror for reflection.",
};

export default function TarotPage() {
  return (
    <div className="min-h-screen px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="label-caps">
            <T k="tarot.label" />
          </p>
          <h1 className="mb-4 mt-4 font-serif text-4xl text-foreground sm:text-6xl">
            <T k="tarot.title" />
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-cosmic-300">
            <T k="tarot.lead" />
          </p>
        </div>
        <TarotApp />
      </div>
    </div>
  );
}

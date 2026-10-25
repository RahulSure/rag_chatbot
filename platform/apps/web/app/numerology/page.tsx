import type { Metadata } from "next";
import { NumerologyApp } from "@/components/numerology/NumerologyApp";
import { T } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Free Numerology & Lo Shu Grid — Moolank, Bhagyank and Remedies",
  description:
    "Free numerology: moolank, bhagyank, Chaldean name number, personal year and your Lo Shu grid with its planes, missing numbers and remedies.",
};

export default function NumerologyPage() {
  return (
    <div className="min-h-screen px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="label-caps">
            <T k="num.label" />
          </p>
          <h1 className="mb-4 mt-4 font-serif text-4xl text-foreground sm:text-6xl">
            <T k="num.title" />
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-cosmic-300">
            <T k="num.lead" />
          </p>
        </div>
        <NumerologyApp />
      </div>
    </div>
  );
}

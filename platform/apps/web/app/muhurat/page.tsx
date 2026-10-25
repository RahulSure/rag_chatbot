import type { Metadata } from "next";
import { getMuhurat, type Place } from "@/lib/api";
import { MuhuratApp } from "@/components/muhurat/MuhuratApp";
import { T } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Today's Muhurat — Hora, Choghadiya and Rahu Kaal",
  description:
    "Free daily muhurat for your city: sunrise and sunset, the 24 horas, day and night choghadiya, Rahu Kaal, Yamaganda, Gulika, Abhijit and Brahma muhurta.",
};

export const dynamic = "force-dynamic";

// Read for Jodhpur until the visitor picks their own city (the same default as the home page).
const JODHPUR: Place = {
  name: "Jodhpur",
  region: "Rajasthan",
  country: "IN",
  latitude: 26.26841,
  longitude: 73.00594,
  tz: "Asia/Kolkata",
  population: 0,
};

export default async function MuhuratPage() {
  const data = await getMuhurat(JODHPUR).catch(() => null);
  return (
    <div className="min-h-screen px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="label-caps">
            <T k="mu.label" />
          </p>
          <h1 className="mb-4 mt-4 font-serif text-4xl text-foreground sm:text-6xl">
            <T k="mu.title" />
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-cosmic-300">
            <T k="mu.lead" />
          </p>
        </div>
        <MuhuratApp initialPlace={JODHPUR} initialData={data} />
      </div>
    </div>
  );
}

import { getBirthChart, getPanchang, getTopics, type Place } from "@/lib/api";
import { Masthead } from "@/components/home/Masthead";
import { TodayChapter } from "@/components/home/TodayChapter";
import { Listens } from "@/components/home/Listens";
import { GuideStrip } from "@/components/home/GuideStrip";
import { LibraryBand } from "@/components/home/LibraryBand";
import { TeachingsPoster } from "@/components/home/TeachingsPoster";
import { ToolsGrid } from "@/components/home/ToolsGrid";
import { PractiseCta } from "@/components/home/PractiseCta";
import { RevealObserver } from "@/components/home/RevealObserver";
import s from "@/components/home/home.module.css";

export const dynamic = "force-dynamic";

// Jodhpur — Sadgurudev's city — is where "today" is read until the visitor picks their own place.
const JODHPUR: Place = {
  name: "Jodhpur",
  region: "Rajasthan",
  country: "IN",
  latitude: 26.26841,
  longitude: 73.00594,
  tz: "Asia/Kolkata",
  population: 0,
};

function nowInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}` };
}

export default async function HomePage() {
  const now = nowInIndia();
  const [panchang, chart, topics] = await Promise.all([
    getPanchang(JODHPUR).catch(() => null),
    getBirthChart({ date: now.date, time: now.time, place: JODHPUR }).catch(() => null),
    getTopics().catch(() => []),
  ]);

  return (
    <div className={s.page}>
      <Masthead />
      <TodayChapter initialPlace={JODHPUR} initialPanchang={panchang} />
      <Listens />
      <GuideStrip />
      <LibraryBand />
      <TeachingsPoster topics={topics} />
      <ToolsGrid chart={chart} panchang={panchang} placeName={JODHPUR.name} />
      <PractiseCta />
      <RevealObserver />
    </div>
  );
}

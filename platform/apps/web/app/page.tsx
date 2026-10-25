import { getBirthChart, getPanchang, type Place } from "@/lib/api";
import { Hero } from "@/components/home/Hero";
import { TrustRow } from "@/components/home/TrustRow";
import { MeetSadhak } from "@/components/home/MeetSadhak";
import { SadhanaNeeds } from "@/components/home/SadhanaNeeds";
import { TodayPractice } from "@/components/home/TodayPractice";
import { KundliPreview } from "@/components/home/KundliPreview";
import { FreeTools } from "@/components/home/FreeTools";
import { TheTeacher } from "@/components/home/TheTeacher";
import { Faq } from "@/components/home/Faq";
import { WhatsAppSoon } from "@/components/home/WhatsAppSoon";

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
  const [panchang, chart] = await Promise.all([
    getPanchang(JODHPUR).catch(() => null),
    getBirthChart({ date: now.date, time: now.time, place: JODHPUR }).catch(() => null),
  ]);

  return (
    <>
      <Hero />
      <TrustRow />
      <MeetSadhak />
      <SadhanaNeeds />
      <TodayPractice initialPlace={JODHPUR} initialPanchang={panchang} />
      <KundliPreview chart={chart} />
      <FreeTools />
      <TheTeacher />
      <Faq />
      <WhatsAppSoon />
    </>
  );
}

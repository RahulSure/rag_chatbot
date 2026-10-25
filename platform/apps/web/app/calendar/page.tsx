import type { Metadata } from "next";
import type { Place } from "@/lib/api";
import { CalendarApp } from "@/components/day/CalendarApp";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Vrat Calendar — Ekadashi, Pradosh, Purnima, Amavasya and Sankranti",
  description: "Free monthly vrat calendar for your city: Ekadashi, Pradosh, Purnima, Amavasya, Masik Shivaratri, Vinayaka Chaturthi and Sankranti, with moon phases.",
};

const JODHPUR: Place = {
  name: "Jodhpur", region: "Rajasthan", country: "IN", latitude: 26.26841, longitude: 73.00594, tz: "Asia/Kolkata", population: 0,
};

export default function CalendarPage() {
  return (
    <ToolHeader label="cal.label" title="cal.title" lead="cal.lead">
      <CalendarApp initialPlace={JODHPUR} />
    </ToolHeader>
  );
}

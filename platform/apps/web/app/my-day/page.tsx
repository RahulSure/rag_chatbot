import type { Metadata } from "next";
import { MyDayApp } from "@/components/day/MyDayApp";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Your Day — Tara Bala, Chandra Bala and the Week Ahead",
  description: "Is today good for you? Today's tara from your birth nakshatra, chandra bala, chandrashtama and your navtara chakra, free.",
};

export default function MyDayPage() {
  return (
    <ToolHeader label="day.label" title="day.title" lead="day.lead">
      <MyDayApp />
    </ToolHeader>
  );
}

import type { Metadata } from "next";
import { VastuApp } from "@/components/practice/VastuApp";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Puja Room Vastu — Place Your Puja Room, Entrance and Kitchen",
  description: "Free Vastu guide for sadhaks: the ideal zone for the puja room, entrance, kitchen, bedroom, toilet and study, which way to face for japa, and a phone compass.",
};

export default function VastuPage() {
  return (
    <ToolHeader label="vastu.label" title="vastu.title" lead="vastu.lead">
      <VastuApp />
    </ToolHeader>
  );
}

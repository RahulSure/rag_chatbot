import type { Metadata } from "next";
import { VarshaphalApp } from "@/components/day/VarshaphalApp";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Free Varshaphal — Your Tajik Year Chart",
  description: "Free Varshaphal: the exact varsha pravesh (solar return), year lagna, muntha and its house, and the year chart.",
};

export default function VarshaphalPage() {
  return (
    <ToolHeader label="varsha.label" title="varsha.title" lead="varsha.lead">
      <VarshaphalApp />
    </ToolHeader>
  );
}

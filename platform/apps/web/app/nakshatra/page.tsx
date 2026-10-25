import type { Metadata } from "next";
import { NakshatraExplorer } from "@/components/day/NakshatraExplorer";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "The 27 Nakshatras — Deity, Symbol, Lord and Practice",
  description: "Explore all 27 nakshatras: ruling planet, deity, symbol, gana, character and the sadhana each one suits.",
};

export default function NakshatraPage() {
  return (
    <ToolHeader label="nak.label" title="nak.title" lead="nak.lead">
      <NakshatraExplorer />
    </ToolHeader>
  );
}

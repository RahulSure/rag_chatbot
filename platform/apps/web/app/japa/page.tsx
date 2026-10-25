import type { Metadata } from "next";
import { JapaApp } from "@/components/practice/JapaApp";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Mala Counter — Count Your Japa, 108 Beads",
  description: "A free online japa mala counter: 108 beads, a bell at each completed mala, a daily target and streak. Works offline on your phone.",
};

export default function JapaPage() {
  return (
    <ToolHeader label="japa.label" title="japa.title" lead="japa.lead">
      <JapaApp />
    </ToolHeader>
  );
}

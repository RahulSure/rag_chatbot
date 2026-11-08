import type { Metadata } from "next";
import { PalmApp } from "@/components/practice/PalmApp";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Guided Palm Reading — Read Your Own Hand",
  description: "A free, step-by-step palm reading: hand shape, heart, head, life and fate lines, with the classical meaning of each.",
};

export default function PalmPage() {
  return (
    <ToolHeader label="palm.label" title="palm.title" lead="palm.lead">
      <PalmApp />
    </ToolHeader>
  );
}

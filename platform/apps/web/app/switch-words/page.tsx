import type { Metadata } from "next";
import { SwitchWordsApp } from "@/components/practice/SwitchWordsApp";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Switch Words Finder — Naran S. Balakumar's Switch Words",
  description: "Find the switch words Naran S. Balakumar gave for confidence, money, career, marriage, study, fear, sleep and more, exactly as he wrote them.",
};

export default function SwitchWordsPage() {
  return (
    <ToolHeader label="sw.label" title="sw.title" lead="sw.lead">
      <SwitchWordsApp />
    </ToolHeader>
  );
}

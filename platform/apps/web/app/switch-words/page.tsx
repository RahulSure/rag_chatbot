import type { Metadata } from "next";
import { SwitchWordsApp } from "@/components/practice/SwitchWordsApp";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Switch Words Finder — Switch Words for Every Need",
  description: "Find switch words for confidence, money, career, marriage, study, fear, sleep and more, exactly as they were given.",
};

export default function SwitchWordsPage() {
  return (
    <ToolHeader label="sw.label" title="sw.title" lead="sw.lead">
      <SwitchWordsApp />
    </ToolHeader>
  );
}

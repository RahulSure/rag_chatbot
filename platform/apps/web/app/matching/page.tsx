import type { Metadata } from "next";
import { MatchingApp } from "@/components/matching/MatchingApp";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Free Kundli Matching — Ashtakoot Guna Milan out of 36",
  description: "Free kundli matching: all eight kootas (Varna to Nadi) scored out of 36, Nadi and Bhakoot dosha, and Mangal dosha of both partners.",
};

export default function MatchingPage() {
  return (
    <ToolHeader label="match.label" title="match.title" lead="match.lead">
      <MatchingApp />
    </ToolHeader>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/i18n";
import { TOOL_GROUPS } from "@/lib/tools";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Free Tools — Kundli, Matching, Muhurat, Numerology, Tarot and More",
  description: "Every free Sadhak.ai tool: kundli and divisional charts, matching, your day, muhurat, vrat calendar, numerology, tarot, palm reading, mala counter and Vastu.",
};

export default function ToolsPage() {
  return (
    <ToolHeader label="tools.label" title="tools.title" lead="tools.lead">
      <div className="space-y-14">
        {TOOL_GROUPS.map((g) => (
          <section key={g.title} aria-labelledby={`group-${g.title}`}>
            <h2 id={`group-${g.title}`} className="font-serif text-3xl text-foreground"><T k={g.title} /></h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.tools.map((tool) => (
                <li key={tool.href}>
                  <Link href={tool.href} className="cosmic-card flex h-full flex-col p-6">
                    <span className="font-serif text-2xl text-foreground"><T k={tool.title} /></span>
                    <span className="mt-2 leading-relaxed text-cosmic-400"><T k={tool.desc} /></span>
                    <span aria-hidden="true" className="mt-auto pt-4 text-sm text-gold">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ToolHeader>
  );
}

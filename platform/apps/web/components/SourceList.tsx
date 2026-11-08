"use client";

import { ChevronRight } from "lucide-react";
import { SourceNode } from "@/lib/api";

interface SourceGroup {
  label: string;
  href?: string;
  pages: number[];
}

/** One entry per book or website, however many of its pages were used. */
function groupSources(sources: SourceNode[]): SourceGroup[] {
  const groups = new Map<string, SourceGroup>();
  for (const s of sources) {
    const label = s.book || "Source";
    const group = groups.get(label) ?? { label, href: s.url, pages: [] };
    if (!group.href && s.url) group.href = s.url;
    if (s.page && !group.pages.includes(s.page)) group.pages.push(s.page);
    groups.set(label, group);
  }
  return [...groups.values()];
}

/** Collapsed, low-key source line under an answer: "› Sources · 2". */
export function SourceList({ sources, label }: { sources: SourceNode[]; label: string }) {
  const groups = groupSources(sources);
  if (groups.length === 0) return null;

  return (
    <details className="group text-[11px] text-cosmic-500">
      <summary
        className="inline-flex cursor-pointer select-none list-none items-center gap-1 transition-colors
                   hover:text-cosmic-300 [&::-webkit-details-marker]:hidden"
      >
        <ChevronRight size={10} aria-hidden="true" className="transition-transform group-open:rotate-90" />
        {label} · {groups.length}
      </summary>
      <ul className="mt-1 space-y-0.5 pl-4">
        {groups.map((g) => (
          <li key={g.label}>
            {g.href ? (
              // nofollow: we credit the source without passing it search ranking
              <a href={g.href} target="_blank" rel="noopener noreferrer nofollow" className="hover:underline">
                {g.label}
              </a>
            ) : (
              g.label
            )}
            {g.pages.length > 0 && `, p. ${g.pages.sort((a, b) => a - b).join(", ")}`}
          </li>
        ))}
      </ul>
    </details>
  );
}

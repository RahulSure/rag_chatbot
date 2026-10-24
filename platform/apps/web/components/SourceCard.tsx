"use client";

import { BookOpen, ExternalLink, Globe } from "lucide-react";
import { SourceNode } from "@/lib/api";

export function SourceCard({ source }: { source: SourceNode }) {
  const Icon = source.url ? Globe : BookOpen;
  const label = (
    <>
      {source.book || "Source"}
      {source.page ? ` — p. ${source.page}` : ""}
      {source.chapter ? ` — ${source.chapter}` : ""}
    </>
  );

  return (
    <div className="rounded-lg border border-gold/15 bg-cosmic-950/70 px-3 py-2 text-xs">
      <div className="mb-1 flex items-center gap-2 text-gold">
        <Icon size={11} aria-hidden="true" />
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-1 font-medium hover:underline"
          >
            <span className="truncate">{label}</span>
            <ExternalLink size={10} aria-hidden="true" className="flex-shrink-0" />
          </a>
        ) : (
          <span className="font-medium">{label}</span>
        )}
        {source.topic && (
          <span className="ml-auto rounded-full bg-gold/10 px-2 py-0.5 text-[10px] text-cosmic-400">
            {source.topic}
          </span>
        )}
      </div>
      <p className="line-clamp-3 font-devanagari leading-relaxed text-cosmic-400">{source.text_snippet}</p>
    </div>
  );
}

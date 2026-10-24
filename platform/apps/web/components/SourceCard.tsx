"use client";

import { BookOpen } from "lucide-react";
import { SourceNode } from "@/lib/api";

export function SourceCard({ source }: { source: SourceNode }) {
  return (
    <div className="rounded-lg border border-gold/15 bg-cosmic-950/70 px-3 py-2 text-xs">
      <div className="mb-1 flex items-center gap-2 text-gold">
        <BookOpen size={11} aria-hidden="true" />
        <span className="font-medium">
          {source.book || "Source"}
          {source.page ? ` — p. ${source.page}` : ""}
          {source.chapter ? ` — ${source.chapter}` : ""}
        </span>
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

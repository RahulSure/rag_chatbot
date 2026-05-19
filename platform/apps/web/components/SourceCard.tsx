"use client";

import { BookOpen, FileText } from "lucide-react";
import { SourceNode } from "@/lib/api";

export function SourceCard({ source }: { source: SourceNode }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-cosmic-950/50 border border-gold/10 text-xs">
      <div className="flex items-center gap-2 mb-1 text-gold/70">
        <BookOpen size={10} />
        <span className="font-medium">
          {source.book || "Saundarya"}
          {source.page ? ` — Page ${source.page}` : ""}
          {source.chapter ? ` — ${source.chapter}` : ""}
        </span>
        {source.topic && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-gold/10 text-gold/60 text-[10px]">
            {source.topic}
          </span>
        )}
      </div>
      <p className="text-cosmic-400 leading-relaxed line-clamp-3 font-devanagari">
        {source.text_snippet}
      </p>
    </div>
  );
}

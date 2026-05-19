"use client";

import { useState } from "react";
import { Search, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { SearchResult, semanticSearch } from "@/lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await semanticSearch(query, 10);
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-gold text-sm uppercase tracking-widest">Explore</span>
          <h1 className="font-serif text-5xl text-foreground mt-2 mb-4">Semantic Search</h1>
          <p className="text-cosmic-400">
            Search across Sadgurudev's teachings by concept, not just keywords.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-8">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/50">
            <Search size={18} />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teachings... e.g. 'kundalini rising experience'"
            className="w-full pl-14 pr-32 py-4 rounded-2xl bg-cosmic-900/60 border border-gold/25 
                       text-foreground placeholder-cosmic-500 focus:outline-none focus:border-gold/50 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 btn-gold rounded-xl px-5 py-2 text-sm disabled:opacity-40"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Search"}
          </button>
        </form>

        {loading && (
          <div className="text-center py-12 text-cosmic-500">
            <Loader2 size={24} className="animate-spin mx-auto mb-3 text-gold" />
            Searching through Sadgurudev's teachings...
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12 text-cosmic-500">
            <div className="text-4xl mb-3">🔍</div>
            <p>No passages found. Try a different search term.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-cosmic-500 text-sm mb-6">
              Found {results.length} relevant passages
            </p>
            {results.map((result, i) => (
              <div key={i} className="cosmic-card p-6">
                <div className="flex items-center gap-2 mb-3 text-xs text-gold/60">
                  <BookOpen size={10} />
                  <span>{result.book || "Saundarya"}</span>
                  {result.page && <span>— Page {result.page}</span>}
                  {result.chapter && <span>— {result.chapter}</span>}
                  {result.topic && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-gold/10 text-gold/50">
                      {result.topic}
                    </span>
                  )}
                  {result.score && (
                    <span className="text-cosmic-600">{(result.score * 100).toFixed(0)}% match</span>
                  )}
                </div>
                <p className="text-cosmic-200 text-sm leading-relaxed font-devanagari">
                  {result.text_snippet}
                </p>
                <Link
                  href={`/chat?q=${encodeURIComponent(query)}`}
                  className="inline-flex items-center gap-1 text-xs text-gold/50 hover:text-gold mt-4 transition-colors"
                >
                  Ask about this →
                </Link>
              </div>
            ))}
          </div>
        )}

        {!searched && (
          <div className="text-center py-8">
            <p className="text-cosmic-600 text-sm mb-6">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "kundalini awakening signs",
                "mantra for peace of mind",
                "tantra sadhana method",
                "spiritual beauty divine",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); }}
                  className="px-4 py-2 rounded-full border border-gold/20 text-cosmic-400 text-sm hover:border-gold/40 hover:text-foreground transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

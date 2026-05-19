import type { Metadata } from "next";
import Link from "next/link";
import { getTopics } from "@/lib/api";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Spiritual Teachings — Tantra, Mantra, Kundalini & More",
  description:
    "Explore Dr. Narayan Dutt Shrimali's teachings across all spiritual disciplines — tantra, mantra, sadhana, kundalini, jyotish, yantra and more.",
};

export default async function TeachingsPage() {
  const topics = await getTopics().catch(() => []);

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold text-sm uppercase tracking-widest">Knowledge System</span>
          <h1 className="font-serif text-5xl text-foreground mt-2 mb-4">
            Spiritual Teachings
          </h1>
          <p className="text-cosmic-400 max-w-xl mx-auto text-lg">
            Sadgurudev's knowledge spans a vast spectrum of spiritual sciences. 
            Explore each discipline through his actual teachings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/teachings/${topic.slug}`}
              className="cosmic-card p-8 flex items-start gap-5 group"
            >
              <div className="text-4xl flex-shrink-0">{topic.icon || "🕉"}</div>
              <div className="flex-1">
                <h2 className="font-serif text-2xl text-foreground group-hover:text-gold transition-colors mb-1">
                  {topic.label}
                </h2>
                <p className="text-gold/60 text-sm font-devanagari mb-3">{topic.label_hi}</p>
                {topic.description && (
                  <p className="text-cosmic-400 text-sm leading-relaxed mb-4">{topic.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-cosmic-600">
                  {topic.chunk_count > 0 && <span>{topic.chunk_count} passages</span>}
                  {topic.article_count > 0 && <span>{topic.article_count} articles</span>}
                </div>
              </div>
              <ArrowRight size={16} className="text-gold/30 group-hover:text-gold transition-colors flex-shrink-0 mt-2" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

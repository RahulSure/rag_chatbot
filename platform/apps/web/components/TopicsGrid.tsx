import Link from "next/link";
import { getTopics } from "@/lib/api";

export async function TopicsGrid() {
  const topics = await getTopics().catch(() => []);

  return (
    <section className="py-20 px-6 bg-cosmic-950/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-gold text-sm uppercase tracking-widest">Explore</span>
          <h2 className="font-serif text-4xl text-foreground mt-2">Spiritual Topics</h2>
          <p className="text-cosmic-400 mt-3 max-w-lg mx-auto">
            Dive into the vast knowledge system of Sadgurudev across all spiritual disciplines
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/teachings/${topic.slug}`}
              className="cosmic-card p-6 text-center group cursor-pointer block"
            >
              <div className="text-3xl mb-3">{topic.icon || "🕉"}</div>
              <h3 className="font-serif text-lg text-foreground group-hover:text-gold transition-colors">
                {topic.label}
              </h3>
              <p className="text-cosmic-500 text-xs mt-1 font-devanagari">{topic.label_hi}</p>
              {topic.chunk_count > 0 && (
                <p className="text-cosmic-600 text-xs mt-2">
                  {topic.chunk_count} passages
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

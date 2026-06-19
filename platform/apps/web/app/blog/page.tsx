import type { Metadata } from "next";
import { getArticles, getTopics } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spiritual Knowledge Blog",
  description:
    "AI-generated articles on tantra, mantra, sadhana, kundalini, and jyotish — grounded in the teachings of Dr. Narayan Dutt Shrimali.",
};

interface Props {
  searchParams: Promise<{ topic?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { topic, page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const [articles, topics] = await Promise.all([
    getArticles(topic, limit, skip).catch(() => []),
    getTopics().catch(() => []),
  ]);

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-gold text-sm uppercase tracking-widest">Knowledge</span>
          <h1 className="font-serif text-5xl text-foreground mt-2 mb-4">
            Spiritual Knowledge Blog
          </h1>
          <p className="text-cosmic-400 max-w-xl mx-auto">
            Deep-dive articles on the spiritual sciences taught by Sadgurudev,
            grounded in his published books.
          </p>
        </div>

        {/* Topic filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <a
            href="/blog"
            className={`px-4 py-2 rounded-full text-sm transition-all border ${
              !topic
                ? "border-gold bg-gold/15 text-gold"
                : "border-gold/20 text-cosmic-400 hover:text-foreground hover:border-gold/40"
            }`}
          >
            All Topics
          </a>
          {topics.slice(0, 8).map((t) => (
            <a
              key={t.slug}
              href={`/blog?topic=${t.slug}`}
              className={`px-4 py-2 rounded-full text-sm transition-all border font-devanagari ${
                topic === t.slug
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-gold/20 text-cosmic-400 hover:text-foreground hover:border-gold/40"
              }`}
            >
              {t.icon} {t.label}
            </a>
          ))}
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-24 text-cosmic-500">
            <div className="text-5xl mb-4">🪔</div>
            <p>Articles are being generated. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {articles.length === limit && (
          <div className="flex justify-center gap-4 mt-12">
            {page > 1 && (
              <a
                href={`/blog?page=${page - 1}${topic ? `&topic=${topic}` : ""}`}
                className="btn-ghost px-6 py-2 rounded-lg text-sm"
              >
                ← Previous
              </a>
            )}
            <a
              href={`/blog?page=${page + 1}${topic ? `&topic=${topic}` : ""}`}
              className="btn-ghost px-6 py-2 rounded-lg text-sm"
            >
              Next →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

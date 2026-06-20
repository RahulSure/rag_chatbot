import type { Metadata } from "next";
import { getArticles, getTopics } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spiritual Knowledge Blog — Hindi & English",
  description:
    "AI-generated articles in Hindi and English on tantra, mantra, sadhana, kundalini, and jyotish — grounded in the teachings of Dr. Narayan Dutt Shrimali.",
};

interface Props {
  searchParams: Promise<{ topic?: string; page?: string; lang?: string }>;
}

const LANG_OPTIONS = [
  { value: undefined, label: "सभी / All", flag: "🌐" },
  { value: "en",      label: "English",    flag: "🇬🇧" },
  { value: "hi",      label: "हिन्दी",      flag: "🇮🇳" },
];

export default async function BlogPage({ searchParams }: Props) {
  const { topic, page: pageStr, lang } = await searchParams;
  const page = parseInt(pageStr || "1", 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const [articles, topics] = await Promise.all([
    getArticles(topic, limit, skip, lang).catch(() => []),
    getTopics().catch(() => []),
  ]);

  // Build query string helper (preserves existing filters when adding new ones)
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params: Record<string, string> = {};
    if (topic) params.topic = topic;
    if (lang) params.lang = lang;
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined) delete params[k];
      else params[k] = v;
    });
    const qs = new URLSearchParams(params).toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-gold text-sm uppercase tracking-widest">Knowledge</span>
          <h1 className="font-serif text-5xl text-foreground mt-2 mb-4">
            Spiritual Knowledge Blog
          </h1>
          <p className="text-cosmic-400 max-w-xl mx-auto font-devanagari">
            Deep-dive articles on the spiritual sciences taught by Sadgurudev —
            available in <span className="text-gold">Hindi</span> &amp; <span className="text-gold">English</span>.
          </p>
        </div>

        {/* Language filter tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {LANG_OPTIONS.map((opt) => {
            const isActive = lang === opt.value;
            return (
              <a
                key={opt.value ?? "all"}
                href={buildHref({ lang: opt.value, page: undefined })}
                className={`px-4 py-2 rounded-full text-sm transition-all border font-devanagari flex items-center gap-1.5 ${
                  isActive
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-gold/20 text-cosmic-400 hover:text-foreground hover:border-gold/40"
                }`}
              >
                <span>{opt.flag}</span>
                {opt.label}
              </a>
            );
          })}
        </div>

        {/* Topic filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <a
            href={buildHref({ topic: undefined, page: undefined })}
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
              href={buildHref({ topic: t.slug, page: undefined })}
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
            <p className="font-devanagari">
              {lang === "hi"
                ? "हिन्दी लेख जल्द उपलब्ध होंगे।"
                : "Articles are being generated. Check back soon."}
            </p>
            {lang === "hi" && (
              <a href="/blog" className="text-gold text-sm mt-3 inline-block hover:underline">
                सभी लेख देखें →
              </a>
            )}
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
                href={buildHref({ page: String(page - 1) })}
                className="btn-ghost px-6 py-2 rounded-lg text-sm"
              >
                ← Previous
              </a>
            )}
            <a
              href={buildHref({ page: String(page + 1) })}
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

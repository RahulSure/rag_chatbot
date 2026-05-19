import type { Metadata } from "next";
import Link from "next/link";
import { getTopics, getArticles, semanticSearch } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { ArrowLeft, MessageCircle } from "lucide-react";

interface Props {
  params: Promise<{ topic: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const topics = await getTopics();
  const t = topics.find((x) => x.slug === topic);

  return {
    title: `${t?.label || topic} — Dr. Narayan Dutt Shrimali Teachings`,
    description: `Explore Sadgurudev's teachings on ${t?.label || topic}. ${t?.description || ""}`,
    keywords: [t?.label || topic, "Dr Narayan Dutt Shrimali", "spiritual teachings", t?.label_hi || ""],
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const topics = await getTopics();
    return topics.map((t) => ({ topic: t.slug }));
  } catch {
    return [];
  }
}

export default async function TopicPage({ params }: Props) {
  const { topic } = await params;
  const [topics, articles, passages] = await Promise.all([
    getTopics().catch(() => []),
    getArticles(topic, 6).catch(() => []),
    semanticSearch(topic, 5, topic).catch(() => []),
  ]);

  const topicMeta = topics.find((t) => t.slug === topic);
  if (!topicMeta) return <div className="min-h-screen flex items-center justify-center text-cosmic-500">Topic not found</div>;

  // JSON-LD for topic page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${topicMeta.label} Teachings — Dr. Narayan Dutt Shrimali`,
    description: topicMeta.description,
    author: { "@type": "Person", name: "Dr. Narayan Dutt Shrimali" },
    about: { "@type": "Thing", name: topicMeta.label },
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <Link
          href="/teachings"
          className="inline-flex items-center gap-2 text-cosmic-400 hover:text-gold text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> All Topics
        </Link>

        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          <div className="text-6xl">{topicMeta.icon || "🕉"}</div>
          <div>
            <h1 className="font-serif text-5xl text-foreground mb-2">{topicMeta.label}</h1>
            <p className="text-gold font-devanagari text-xl">{topicMeta.label_hi}</p>
            {topicMeta.description && (
              <p className="text-cosmic-400 mt-2 max-w-2xl">{topicMeta.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Articles */}
            {articles.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl text-foreground mb-6">Articles on {topicMeta.label}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Passages */}
            {passages.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl text-foreground mb-6">
                  From Sadgurudev&apos;s Books
                </h2>
                <div className="space-y-4">
                  {passages.map((p, i) => (
                    <div key={i} className="cosmic-card p-5">
                      <p className="text-cosmic-200 text-sm leading-relaxed font-devanagari mb-3">
                        &ldquo;{p.text_snippet}&rdquo;
                      </p>
                      <div className="text-xs text-gold/50">
                        {p.book && <span>{p.book}</span>}
                        {p.page && <span className="ml-2">— Page {p.page}</span>}
                        {p.chapter && <span className="ml-2">— {p.chapter}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="cosmic-card p-6">
              <h3 className="font-serif text-lg text-foreground mb-4">Ask About {topicMeta.label}</h3>
              <p className="text-cosmic-400 text-sm mb-5">
                Get AI-powered answers on {topicMeta.label.toLowerCase()} from Sadgurudev's teachings.
              </p>
              <Link
                href={`/chat?q=${encodeURIComponent(`Explain ${topicMeta.label} according to Sadgurudev's teachings`)}`}
                className="btn-gold w-full flex items-center justify-center gap-2 text-sm py-3 rounded-xl"
              >
                <MessageCircle size={14} />
                Ask AI Guru
              </Link>
            </div>

            {/* Related Topics */}
            <div className="cosmic-card p-6">
              <h3 className="font-serif text-lg text-foreground mb-4">Related Topics</h3>
              <div className="space-y-2">
                {topics
                  .filter((t) => t.slug !== topic)
                  .slice(0, 5)
                  .map((t) => (
                    <Link
                      key={t.slug}
                      href={`/teachings/${t.slug}`}
                      className="flex items-center gap-2 text-cosmic-400 hover:text-gold text-sm transition-colors"
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

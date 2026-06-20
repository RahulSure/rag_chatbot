import { Suspense } from "react";

export const dynamic = "force-dynamic";
import { DailyWisdomSection } from "@/components/DailyWisdom";
import { TopicsGrid } from "@/components/TopicsGrid";
import { ArticleCard } from "@/components/ArticleCard";
import { VideoCarousel } from "@/components/VideoCarousel";
import { EmailCapture } from "@/components/EmailCapture";
import { getArticles, getBooks, getTrendingQueries } from "@/lib/api";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default async function HomePage() {
  const [articles, books, trending] = await Promise.all([
    getArticles(undefined, 3).catch(() => []),
    getBooks().catch(() => []),
    getTrendingQueries(6).catch(() => []),
  ]);

  return (
    <>
      {/* Hero video carousel — primary attraction */}
      <VideoCarousel />

      {/* Daily Wisdom */}
      <Suspense fallback={<div className="h-48" />}>
        <DailyWisdomSection />
      </Suspense>

      {/* Email Capture */}
      <EmailCapture />

      {/* Topics Grid */}
      <Suspense fallback={<div className="h-48" />}>
        <TopicsGrid />
      </Suspense>

      {/* Latest Articles */}
      {articles.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-gold text-sm uppercase tracking-widest">Knowledge</span>
                <h2 className="font-serif text-4xl text-foreground mt-2">Latest Articles</h2>
                <div className="flex gap-3 mt-2">
                  <Link href="/blog?lang=en" className="text-xs text-sky-400/80 hover:text-sky-300 transition-colors">
                    🇬🇧 English
                  </Link>
                  <Link href="/blog?lang=hi" className="text-xs text-amber-400/80 hover:text-amber-300 transition-colors font-devanagari">
                    🇮🇳 हिन्दी
                  </Link>
                </div>
              </div>
              <Link
                href="/blog"
                className="flex items-center gap-2 text-gold text-sm hover:text-gold-light transition-colors"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Books */}
      {books.length > 0 && (
        <section className="py-20 px-6 bg-cosmic-950/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-gold text-sm uppercase tracking-widest">Library</span>
              <h2 className="font-serif text-4xl text-foreground mt-2">Books by Sadgurudev</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {books.map((book) => (
                <div key={book.slug} className="cosmic-card p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={24} className="text-gold" />
                  </div>
                  <h3 className="font-serif text-foreground font-semibold mb-1">{book.name}</h3>
                  <p className="text-cosmic-500 text-xs mb-2">{book.author}</p>
                  {book.description && (
                    <p className="text-cosmic-400 text-xs line-clamp-2">{book.description}</p>
                  )}
                  <div className="mt-3 text-xs text-gold/50">
                    {book.chunk_count > 0 ? `${book.chunk_count} passages` : book.language.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Questions */}
      {trending.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-gold text-sm uppercase tracking-widest">Popular</span>
            <h2 className="font-serif text-4xl text-foreground mt-2 mb-10">
              Questions Seekers Ask
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {trending.map((q) => (
                <Link
                  key={q.query}
                  href={`/chat?q=${encodeURIComponent(q.query)}`}
                  className="px-5 py-3 rounded-2xl border border-gold/20 bg-gold/5 text-cosmic-200 
                             text-sm hover:border-gold/50 hover:text-foreground transition-all font-devanagari"
                >
                  {q.query}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About teaser */}
      <section className="py-20 px-6 bg-cosmic-950/30">
        <div className="max-w-4xl mx-auto cosmic-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent rounded-2xl" />
          <div className="relative">
            <div className="text-5xl mb-6">📿</div>
            <h2 className="font-serif text-4xl text-foreground mb-4">
              Sadgurudev <span className="text-gold">Dr. Narayan Dutt Shrimali</span>
            </h2>
            <p className="text-cosmic-300 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Born on April 21, 1935, Sadgurudev was a Guru of the highest proficiency 
              in mantra, tantra, astrology, and ancient Indian sciences. He authored 
              more than 150 books and dedicated his life to reviving the sacred wisdom 
              of India for all seekers.
            </p>
            <Link href="/guru" className="btn-ghost inline-flex items-center gap-2">
              Read His Life Story <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

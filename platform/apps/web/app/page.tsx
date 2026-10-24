import { Suspense } from "react";

export const dynamic = "force-dynamic";
import { HeroSection } from "@/components/HeroSection";
import { DailyWisdomSection } from "@/components/DailyWisdom";
import { TopicsGrid } from "@/components/TopicsGrid";
import { ArticleCard } from "@/components/ArticleCard";
import { VideoCarousel } from "@/components/VideoCarousel";
import { EmailCapture } from "@/components/EmailCapture";
import { WhatsAppSection } from "@/components/WhatsAppCTA";
import { T } from "@/lib/i18n";
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
      <HeroSection />

      <Suspense fallback={<div className="h-48" />}>
        <DailyWisdomSection />
      </Suspense>

      <Suspense fallback={<div className="h-48" />}>
        <TopicsGrid />
      </Suspense>

      {/* Latest Articles */}
      {articles.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="text-sm uppercase tracking-widest text-gold">
                  <T k="home.articlesEyebrow" />
                </span>
                <h2 className="mt-2 font-serif text-4xl text-foreground">
                  <T k="home.articlesTitle" />
                </h2>
                <div className="mt-2 flex gap-3 text-xs">
                  <Link href="/blog?lang=en" className="text-cosmic-400 transition-colors hover:text-gold">
                    English
                  </Link>
                  <Link href="/blog?lang=hi" className="font-devanagari text-cosmic-400 transition-colors hover:text-gold">
                    हिन्दी
                  </Link>
                </div>
              </div>
              <Link
                href="/blog"
                className="flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold-light"
              >
                <T k="home.viewAll" /> <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Questions */}
      {trending.length > 0 && (
        <section className="bg-cosmic-950/60 px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <span className="text-sm uppercase tracking-widest text-gold">
              <T k="home.popularEyebrow" />
            </span>
            <h2 className="mb-10 mt-2 font-serif text-4xl text-foreground">
              <T k="home.popularTitle" />
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {trending.map((q) => (
                <Link
                  key={q.query}
                  href={`/chat?q=${encodeURIComponent(q.query)}`}
                  className="rounded-2xl border border-gold/25 bg-gold/5 px-5 py-3 text-sm text-cosmic-200
                             font-devanagari transition-colors hover:border-gold/60 hover:text-foreground"
                >
                  {q.query}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Library */}
      {books.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <span className="text-sm uppercase tracking-widest text-gold">
                <T k="home.libraryEyebrow" />
              </span>
              <h2 className="mt-2 font-serif text-4xl text-foreground">
                <T k="home.libraryTitle" />
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {books.map((book) => (
                <div key={book.slug} className="cosmic-card p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
                    <BookOpen size={24} className="text-gold" aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 font-serif font-semibold text-foreground">{book.name}</h3>
                  <p className="mb-2 text-xs text-cosmic-500">{book.author}</p>
                  {book.description && <p className="line-clamp-2 text-xs text-cosmic-400">{book.description}</p>}
                  <div className="mt-3 text-xs text-cosmic-500">
                    {book.chunk_count > 0 ? (
                      <>
                        {book.chunk_count} <T k="home.passages" />
                      </>
                    ) : (
                      book.language.toUpperCase()
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Optional media */}
      <VideoCarousel />

      {/* Featured teacher */}
      <section className="bg-cosmic-950/60 px-6 py-20">
        <div className="cosmic-card relative mx-auto max-w-4xl overflow-hidden p-10 text-center md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
          <div className="relative">
            <span className="text-sm uppercase tracking-widest text-gold">
              <T k="home.teacherEyebrow" />
            </span>
            <h2 className="mb-4 mt-2 font-serif text-3xl text-foreground md:text-4xl">
              <T k="home.teacherName" />
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-cosmic-300">
              <T k="home.teacherBody" />
            </p>
            <Link href="/guru" className="btn-ghost inline-flex items-center gap-2">
              <T k="home.teacherCta" /> <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <EmailCapture />
      <WhatsAppSection />
    </>
  );
}

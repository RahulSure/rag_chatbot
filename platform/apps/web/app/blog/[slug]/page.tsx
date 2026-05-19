import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getArticle, getArticles } from "@/lib/api";
import { ArrowLeft, BookOpen, Clock, ChevronDown } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article Not Found" };

  return {
    title: article.title,
    description: article.meta_description,
    keywords: article.tags,
    authors: [{ name: "Dr. Narayan Dutt Shrimali" }],
    openGraph: {
      title: article.title,
      description: article.meta_description,
      type: "article",
      publishedTime: article.published_at,
      authors: ["Dr. Narayan Dutt Shrimali"],
      tags: article.tags,
    },
    alternates: { canonical: `/blog/${slug}` },
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const articles = await getArticles(undefined, 50);
    return articles.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description,
    author: {
      "@type": "Person",
      name: "Dr. Narayan Dutt Shrimali",
    },
    publisher: {
      "@type": "Organization",
      name: "Shrimali AI Spiritual Platform",
    },
    datePublished: article.published_at,
    keywords: article.tags.join(", "),
    articleSection: article.topic,
  };

  const faqJsonLd =
    article.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faq.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  return (
    <div className="min-h-screen py-12 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <article className="max-w-3xl mx-auto">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-cosmic-400 hover:text-gold text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-6">
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-6">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-cosmic-500 mb-8 pb-8 border-b border-gold/10">
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} />
            <span>Dr. Narayan Dutt Shrimali</span>
          </div>
          {article.published_at && (
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <time dateTime={article.published_at}>
                {new Date(article.published_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </div>
          )}
          {article.source_books.length > 0 && (
            <span className="ml-auto text-xs text-gold/50">
              Source: {article.source_books.join(", ")}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="prose-spiritual mb-12">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.body_mdx}
          </ReactMarkdown>
        </div>

        {/* FAQ */}
        {article.faq.length > 0 && (
          <div className="mb-12">
            <h2 className="font-serif text-2xl text-gold mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {article.faq.map((item, i) => (
                <details key={i} className="cosmic-card p-5 group">
                  <summary className="flex items-center justify-between cursor-pointer text-foreground font-medium">
                    <span>{item.question}</span>
                    <ChevronDown size={16} className="text-gold/50 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-cosmic-300 text-sm mt-4 leading-relaxed font-devanagari">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="cosmic-card p-8 text-center">
          <h3 className="font-serif text-xl text-foreground mb-3">
            Ask a Question About This Topic
          </h3>
          <p className="text-cosmic-400 text-sm mb-5">
            Get AI-powered answers from Sadgurudev's actual books.
          </p>
          <Link
            href={`/chat?q=${encodeURIComponent(`Tell me more about ${article.topic}`)}`}
            className="btn-gold inline-flex items-center gap-2 text-sm"
          >
            Ask the AI Guru
          </Link>
        </div>
      </article>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getBooks } from "@/lib/api";

export const metadata: Metadata = {
  title: "Library — Books behind the answers",
  description: "The published books Sadhak.ai draws its answers from, with passage counts.",
};

export default async function BooksPage() {
  const books = await getBooks().catch(() => []);

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="text-sm uppercase tracking-widest text-gold">Library</span>
          <h1 className="mb-4 mt-2 font-serif text-5xl text-foreground">Books behind the answers</h1>
          <p className="mx-auto max-w-xl text-lg text-cosmic-400">
            Sadhak.ai draws its answers from these published books.
          </p>
        </div>

        {books.length === 0 ? (
          <div className="py-16 text-center text-cosmic-400">
            <BookOpen size={36} className="mx-auto mb-4 text-gold/60" aria-hidden="true" />
            <p className="mb-6">The library list isn&apos;t available right now. You can still ask a question.</p>
            <Link href="/chat" className="btn-gold inline-flex items-center gap-2">
              Ask Sadhak <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <article key={book.slug} className="cosmic-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                  <BookOpen size={22} className="text-gold" aria-hidden="true" />
                </div>
                <h2 className="mb-1 font-serif text-xl font-semibold text-foreground">{book.name}</h2>
                <p className="mb-3 text-sm text-cosmic-500">{book.author}</p>
                {book.description && <p className="mb-3 text-sm text-cosmic-400">{book.description}</p>}
                <div className="flex items-center gap-3 text-xs text-cosmic-500">
                  <span className="rounded-full bg-gold/10 px-2 py-0.5">{book.language.toUpperCase()}</span>
                  {book.chunk_count > 0 && <span>{book.chunk_count} passages</span>}
                </div>
                <Link
                  href={`/chat?q=${encodeURIComponent(`What is ${book.name} about?`)}`}
                  className="mt-5 inline-flex items-center gap-1 text-sm text-gold transition-colors hover:text-gold-light"
                >
                  Ask about this book <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { BookOpen, MessageCircle } from "lucide-react";
import { getBooks } from "@/lib/api";

export const metadata = {
  title: "Books · Shrimali AI",
  description: "Spiritual books of Sadgurudev Dr. Narayan Dutt Shrimali, searchable via the AI Guru.",
};

export default async function BooksPage() {
  const books = await getBooks().catch(() => []);

  return (
    <section className="py-16 px-6 min-h-[70vh]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-gold text-sm uppercase tracking-widest">Library</span>
          <h1 className="font-serif text-4xl text-foreground mt-2">Books by Sadgurudev</h1>
          <p className="text-cosmic-400 mt-3 max-w-xl mx-auto">
            Each book is indexed for the AI Guru — ask a question and get answers grounded
            in these texts.
          </p>
        </div>

        {books.length === 0 ? (
          <p className="text-center text-cosmic-500">No books available right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div key={book.slug} className="cosmic-card p-6 flex flex-col">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                  <BookOpen size={24} className="text-gold" />
                </div>
                <h2 className="font-serif text-xl text-foreground mb-1">{book.name}</h2>
                <p className="text-cosmic-500 text-xs mb-3">{book.author}</p>
                {book.description && (
                  <p className="text-cosmic-400 text-sm mb-4 line-clamp-3">{book.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="text-xs text-gold/60">
                    {book.chunk_count > 0
                      ? `${book.chunk_count} passages`
                      : book.language.toUpperCase()}
                  </span>
                  <Link
                    href={`/chat?q=${encodeURIComponent(book.name + " ke baare mein batao")}`}
                    className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors"
                  >
                    <MessageCircle size={13} /> Ask about this
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

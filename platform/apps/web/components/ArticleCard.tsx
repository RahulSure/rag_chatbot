import Link from "next/link";
import { ArticleListItem } from "@/lib/api";
import { Clock, Tag } from "lucide-react";

export function ArticleCard({ article }: { article: ArticleListItem }) {
  const isHindi = article.language === "hi";

  return (
    <Link href={`/blog/${article.slug}`} className="cosmic-card group block p-6">
      {article.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="mb-4 h-40 w-full rounded-lg object-cover opacity-90 transition-opacity group-hover:opacity-100"
        />
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {article.language && (
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
              isHindi
                ? "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                : "border-sky-600/30 bg-sky-500/10 text-sky-800 dark:text-sky-300"
            }`}
          >
            {isHindi ? "हिन्दी" : "EN"}
          </span>
        )}
        {article.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-cosmic-300">
            <Tag size={8} aria-hidden="true" />
            {tag}
          </span>
        ))}
      </div>
      <h3 className="mb-2 line-clamp-2 font-serif text-lg text-foreground transition-colors group-hover:text-gold">
        {article.title}
      </h3>
      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-cosmic-400">{article.meta_description}</p>
      <div className="flex items-center gap-2 text-xs text-cosmic-500">
        <Clock size={10} aria-hidden="true" />
        {article.published_at
          ? new Date(article.published_at).toLocaleDateString(isHindi ? "hi-IN" : "en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Recently published"}
      </div>
    </Link>
  );
}

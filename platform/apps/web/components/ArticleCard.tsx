import Link from "next/link";
import { ArticleListItem } from "@/lib/api";
import { Clock, Tag } from "lucide-react";

export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <Link href={`/blog/${article.slug}`} className="cosmic-card p-6 group block">
      {article.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.cover_image_url}
          alt={article.title}
          loading="lazy"
          decoding="async"
          className="w-full h-40 object-cover rounded-lg mb-4 opacity-70 group-hover:opacity-90 transition-opacity"
        />
      )}
      <div className="flex items-center gap-2 mb-3">
        {article.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs text-gold/70 bg-gold/10 px-2 py-0.5 rounded-full"
          >
            <Tag size={8} />
            {tag}
          </span>
        ))}
      </div>
      <h3 className="font-serif text-lg text-foreground group-hover:text-gold transition-colors mb-2 line-clamp-2">
        {article.title}
      </h3>
      <p className="text-cosmic-400 text-sm line-clamp-3 leading-relaxed mb-4">
        {article.meta_description}
      </p>
      <div className="flex items-center gap-2 text-xs text-cosmic-600">
        <Clock size={10} />
        {article.published_at
          ? new Date(article.published_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Recently published"}
      </div>
    </Link>
  );
}

import Link from "next/link";
import { getTopics } from "@/lib/api";
import { T } from "@/lib/i18n";

export async function TopicsGrid() {
  const topics = await getTopics().catch(() => []);

  return (
    <section className="bg-cosmic-950/60 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-sm uppercase tracking-widest text-gold">
            <T k="home.topicsEyebrow" />
          </span>
          <h2 className="mt-2 font-serif text-4xl text-foreground">
            <T k="home.topicsTitle" />
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-cosmic-400">
            <T k="home.topicsLead" />
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/teachings/${topic.slug}`}
              className="cosmic-card group block cursor-pointer p-6 text-center"
            >
              <div className="mb-3 text-3xl" aria-hidden="true">
                {topic.icon || "✦"}
              </div>
              <h3 className="font-serif text-lg text-foreground transition-colors group-hover:text-gold">
                {topic.label}
              </h3>
              <p className="mt-1 font-devanagari text-xs text-cosmic-500">{topic.label_hi}</p>
              {topic.chunk_count > 0 && (
                <p className="mt-2 text-xs text-cosmic-600">
                  {topic.chunk_count} <T k="home.passages" />
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import { getDailyWisdom } from "@/lib/api";
import { T } from "@/lib/i18n";
import { Quote } from "lucide-react";

export async function DailyWisdomSection() {
  const wisdom = await getDailyWisdom();

  if (!wisdom) return null;

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <span className="text-sm uppercase tracking-widest text-gold">
            <T k="home.wisdomEyebrow" />
          </span>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            <T k="home.wisdomTitle" />
          </h2>
        </div>

        <figure className="cosmic-card relative p-8 text-center md:p-12">
          <div className="absolute left-6 top-6 text-gold/20" aria-hidden="true">
            <Quote size={36} />
          </div>
          <div className="absolute bottom-6 right-6 rotate-180 text-gold/20" aria-hidden="true">
            <Quote size={36} />
          </div>

          <blockquote className="relative mb-6 font-devanagari font-serif text-xl italic leading-relaxed text-foreground md:text-2xl">
            &ldquo;{wisdom.text}&rdquo;
          </blockquote>

          <div className="gold-divider" />

          <figcaption className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-cosmic-400">
            <span>Dr. Narayan Dutt Shrimali</span>
            {wisdom.book && (
              <>
                <span className="text-gold/40" aria-hidden="true">
                  |
                </span>
                <span>
                  {wisdom.book}
                  {wisdom.page ? `, p. ${wisdom.page}` : ""}
                </span>
              </>
            )}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

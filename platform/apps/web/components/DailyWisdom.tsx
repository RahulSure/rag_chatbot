import { getDailyWisdom } from "@/lib/api";
import { Quote } from "lucide-react";

export async function DailyWisdomSection() {
  const wisdom = await getDailyWisdom();

  if (!wisdom) return null;

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-gold text-sm uppercase tracking-widest">Daily Wisdom</span>
          <h2 className="font-serif text-3xl text-foreground mt-2">
            आज का संदेश
          </h2>
        </div>

        <div className="relative cosmic-card p-8 md:p-12 text-center">
          {/* Decorative quote marks */}
          <div className="absolute top-6 left-8 text-gold/20">
            <Quote size={40} />
          </div>
          <div className="absolute bottom-6 right-8 text-gold/20 rotate-180">
            <Quote size={40} />
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gold/3 pointer-events-none" />

          <p className="relative font-devanagari text-xl md:text-2xl text-foreground leading-relaxed mb-6 font-serif italic">
            &ldquo;{wisdom.text}&rdquo;
          </p>

          <div className="gold-divider" />

          <div className="flex items-center justify-center gap-3 text-sm text-cosmic-400">
            <span>— Sadgurudev Dr. Narayan Dutt Shrimali</span>
            {wisdom.book && (
              <>
                <span className="text-gold/30">|</span>
                <span>
                  {wisdom.book}
                  {wisdom.page ? `, Page ${wisdom.page}` : ""}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

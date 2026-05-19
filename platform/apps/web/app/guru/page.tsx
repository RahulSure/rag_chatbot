import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Star, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "About Sadgurudev Dr. Narayan Dutt Shrimali",
  description:
    "Learn about the life, teachings, and legacy of Dr. Narayan Dutt Shrimali — Sadgurudev Nikhileshwaranand, the foremost authority on mantra, tantra, yantra, and ancient Indian sciences.",
};

const TIMELINE = [
  { year: "1935", label: "Born in Kharantiya, Rajasthan on April 21" },
  { year: "1963", label: "M.A. (Hindi) from Rajasthan University" },
  { year: "1965", label: "Ph.D. from Jodhpur University" },
  { year: "~1970", label: "Left for the Himalayas on a spiritual quest" },
  { year: "1971", label: "Presided over World Astrology Conference, New Delhi" },
  { year: "1979", label: "Founded Mantra Tantra Yantra Vigyan magazine" },
  { year: "1981", label: "Established Siddhashram Sadhak Pariwar" },
  { year: "1982", label: "Honoured with Maha Mahopadhyay by Vice-President Dr. B.D. Jatti" },
  { year: "1987", label: "Awarded Tantra Shiromani — Para-psychological Council, Varanasi" },
  { year: "1988", label: "Awarded Mantra Shiromani — Mantra Sansthan, Ujjain" },
  { year: "1989", label: "Samaj Shiromani — Vice-President Dr. Shankar Dayal Sharma" },
  { year: "1991", label: "Honored by Prime Minister of Nepal K.P. Bhattarai" },
  { year: "1998", label: "Mahasamadhi on July 3 — departed the mortal frame" },
];

const BOOKS_PREVIEW = [
  "Practical Hypnotism", "Mantra Rahasya", "Kundalini Tantra",
  "Practical Palmistry", "The Power of Tantra", "Activation of Third Eye",
  "Himalaya ke Yogiyon ki Gupt Siddhiyan", "Shmashaan Bhairavi",
  "Siddhashram", "Dhyan Dharana aur Samadhi",
];

export default function GuruPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="text-6xl mb-6">📿</div>
          <div className="inline-block px-4 py-1.5 rounded-full border border-gold/30 text-gold text-sm mb-6">
            ॐ परम तत्वाय नारायणाय गुरुभ्यो नमः
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">
            Sadgurudev<br />
            <span className="text-gold">Dr. Narayan Dutt Shrimali</span>
          </h1>
          <p className="text-cosmic-300 text-xl mb-4">
            Swami Nikhileshwaranand Maharaj
          </p>
          <p className="text-cosmic-400 text-base max-w-2xl mx-auto leading-relaxed">
            Academician • Author of 150+ Books • Master of Mantra, Tantra & Yantra • 
            Chief of Siddhashram Sadhak Pariwar • April 21, 1935 – July 3, 1998
          </p>
        </div>
      </section>

      <div className="gold-divider max-w-4xl mx-auto" />

      {/* About */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto prose-spiritual">
          <h2 className="font-serif text-3xl text-gold mb-6">Early Life & Spiritual Quest</h2>
          <p>
            Dr. Narayan Dutt Shrimali was born on April 21, 1935 in the remote desert village 
            of Kharantiya, Rajasthan, into a cultured Brahmin family. From childhood, the material 
            world held little attraction for him — his heart was drawn toward the infinite.
          </p>
          <p>
            After completing his M.A. and Ph.D. in Hindi, he served as Head of Department at 
            Jodhpur University. Yet the call of the divine was irresistible. Donning the saffron 
            robes of a sannyasi, he journeyed to the Himalayas and Tibet on a mission — to 
            recover and revive the ancient wisdom of India&apos;s greatest spiritual tradition.
          </p>
          <p>
            For nearly 18 years, he walked the caves and ashrams of the Himalayas, learning 
            from masters who had kept the living fire of these sciences alive. His Guru, 
            Paramhansa Swami Sachchidanandji, ordered him to return to household life and share 
            these teachings with all.
          </p>

          <h2 className="font-serif text-3xl text-gold mb-6 mt-12">The Mission</h2>
          <p>
            Returning to the world, Sadgurudev began one of the most extraordinary missions in 
            modern Indian spiritual history. He founded <em>Mantra Tantra Yantra Vigyan</em>, 
            a magazine that brought the esoteric sciences of mantra, tantra, and yantra directly 
            into the hands of common people — stripping away secrecy without sacrificing sanctity.
          </p>
          <p>
            He authored more than 150 books covering astrology, Ayurveda, hypnotism, palmistry, 
            alchemy, meditation, Kundalini Tantra, and dozens of spiritual sadhanas. Each book 
            was a transmission — not just information.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-6 bg-cosmic-950/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-gold mb-10 text-center">Life & Legacy Timeline</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gold/20" />
            <div className="space-y-6 pl-12">
              {TIMELINE.map((event) => (
                <div key={event.year} className="relative">
                  <div className="absolute -left-9 w-3 h-3 rounded-full bg-gold border-2 border-background mt-1" />
                  <span className="text-gold text-sm font-mono">{event.year}</span>
                  <p className="text-cosmic-300 text-sm mt-0.5">{event.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Books Preview */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-gold mb-8 text-center">Selected Works</h2>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {BOOKS_PREVIEW.map((book) => (
              <span
                key={book}
                className="px-4 py-2 rounded-full border border-gold/20 bg-gold/5 text-cosmic-300 text-sm"
              >
                {book}
              </span>
            ))}
            <span className="px-4 py-2 rounded-full border border-gold/10 text-cosmic-500 text-sm">
              + 140 more books
            </span>
          </div>
          <div className="text-center">
            <Link href="/books" className="btn-ghost inline-flex items-center gap-2">
              Explore All Books <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl text-foreground mb-4">
            Explore His Teachings
          </h2>
          <p className="text-cosmic-400 mb-8">
            Ask our AI system questions about Sadgurudev's teachings — grounded 
            in his actual published texts.
          </p>
          <Link href="/chat" className="btn-gold inline-flex items-center gap-2">
            Ask the AI Guru <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

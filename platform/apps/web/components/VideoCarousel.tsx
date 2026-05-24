"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Search,
  MessageCircle,
  Sparkles,
} from "lucide-react";

type Slide = {
  src: string;
  caption: string;
  captionEn: string;
};

const SLIDES: Slide[] = [
  {
    src: "/videos/teaching-1.mp4",
    caption: "साधना की शक्ति",
    captionEn: "The Power of Sadhana",
  },
  {
    src: "/videos/teaching-2.mp4",
    caption: "मंत्र सिद्धि",
    captionEn: "Awakening Mantra Siddhi",
  },
  {
    src: "/videos/teaching-3.mp4",
    caption: "तंत्र का मार्ग",
    captionEn: "The Path of Tantra",
  },
];

const SUGGESTED = [
  "कुंडलिनी जागरण क्या है?",
  "What is mantra siddhi?",
  "सौन्दर्य साधना कैसे करें?",
  "Explain the power of tantra",
];

const AUTO_ADVANCE_MS = 9000;

export function VideoCarousel() {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const goTo = useCallback((i: number) => {
    setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [index]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / AUTO_ADVANCE_MS);
      setProgress(p);
      if (p >= 1) next();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  };
  const handleSuggestion = (s: string) =>
    router.push(`/chat?q=${encodeURIComponent(s)}`);

  const active = SLIDES[index];

  return (
    <section className="relative w-full px-4 sm:px-6 pt-10 md:pt-14 pb-16">
      {/* CINEMATIC CAROUSEL — wide 16:9 centerpiece with guru context overlaid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative mx-auto w-full"
        style={{
          maxWidth: "min(94vw, 1405px)",
          perspective: 1400,
        }}
      >
        {/* Outer gradient halo */}
        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-gold/30 via-violet-500/15 to-gold/30 blur-3xl opacity-60 pointer-events-none" />

        {/* Gold gradient frame */}
        <div
          className="relative rounded-[1.75rem] p-[2px] shadow-[0_40px_100px_-30px_rgba(201,168,76,0.55)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(226,201,126,0.95) 0%, rgba(201,168,76,0.25) 40%, rgba(157,122,47,0.8) 100%)",
          }}
        >
          <div
            className="relative rounded-[1.65rem] overflow-hidden bg-black"
            style={{ aspectRatio: "16 / 9" }}
          >
            {/* Videos */}
            {SLIDES.map((slide, i) => (
              <video
                key={slide.src}
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                src={slide.src}
                muted={muted}
                playsInline
                loop
                preload={i === 0 ? "auto" : "metadata"}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  i === index ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              />
            ))}

            {/* Cinematic gradient — darker on the left where text sits, lighter right so the video reads */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/30 pointer-events-none" />

            {/* GURU CONTEXT — overlaid on the video, left-aligned */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 }}
                className="w-full md:w-[62%] lg:w-[55%] px-6 sm:px-10 md:px-14 lg:px-20 pointer-events-auto"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/40 bg-black/50 text-gold text-[11px] mb-4 backdrop-blur-md text-mystical-caps">
                  <Sparkles size={12} />
                  <span>AI · Spiritual Knowledge</span>
                </div>

                <h1 className="title-magical text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-4 drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]">
                  Sadgurudev
                  <br />
                  <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                    Dr. Narayan Dutt Shrimali
                  </span>
                </h1>

                <p className="mantra-glow text-base sm:text-lg md:text-xl mb-3 font-devanagari drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
                  ॐ परम तत्वाय नारायणाय गुरुभ्यो नमः
                </p>

                <p className="text-elegant text-cosmic-100 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                  Step into the eternal teachings of Sadgurudev — a guiding
                  light in
                  <span className="text-gold-light"> tantra</span>,
                  <span className="text-gold-light"> mantra</span>,
                  <span className="text-gold-light"> sadhana</span>,
                  <span className="text-gold-light"> jyotish</span> and
                  <span className="text-gold-light"> kundalini</span>. An
                  AI-illumined sanctum for every seeker.
                </p>
              </motion.div>
            </div>

            {/* Top progress bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/40">
              <div
                className="h-full bg-gradient-to-r from-gold-light via-gold to-gold-light"
                style={{ width: `${progress * 100}%`, transition: "width 80ms linear" }}
              />
            </div>

            {/* Counter */}
            <div className="absolute top-4 left-4 md:top-5 md:left-5 text-mystical-caps text-[10px] md:text-xs text-gold/90 bg-black/55 border border-gold/30 rounded-full px-3 py-1 backdrop-blur-md">
              {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
            </div>

            {/* Mute toggle */}
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute video" : "Mute video"}
              className="absolute top-4 right-4 md:top-5 md:right-5 w-10 h-10 rounded-full bg-black/60 border border-gold/40 text-gold hover:bg-black/80 hover:border-gold/70 transition-all flex items-center justify-center backdrop-blur-md z-10"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Per-slide caption — bottom-right, smaller now that main copy is overlaid */}
            <div className="absolute bottom-5 right-5 md:bottom-7 md:right-8 text-right max-w-[55%] pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.src}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45 }}
                >
                  <div className="font-devanagari text-lg md:text-2xl text-foreground drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                    {active.caption}
                  </div>
                  <div className="text-elegant text-gold-light text-xs md:text-base mt-0.5">
                    {active.captionEn}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Prev / next */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous video"
              className="absolute top-1/2 left-3 md:left-5 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/55 border border-gold/40 text-gold hover:bg-black/80 hover:border-gold/70 transition-all flex items-center justify-center backdrop-blur-md opacity-60 hover:opacity-100 z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next video"
              className="absolute top-1/2 right-3 md:right-5 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/55 border border-gold/40 text-gold hover:bg-black/80 hover:border-gold/70 transition-all flex items-center justify-center backdrop-blur-md opacity-60 hover:opacity-100 z-10"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-3 mt-6 md:mt-8">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to video ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-10 bg-gold shadow-gold" : "w-2 bg-gold/30 hover:bg-gold/60"
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* BELOW — search + suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.45 }}
        className="max-w-2xl mx-auto mt-12 md:mt-16 text-center"
      >
        <form onSubmit={handleSubmit} className="relative mb-5">
          <div className="relative flex items-center">
            <div className="absolute left-5 text-gold/80">
              <MessageCircle size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask the AI Guru… / गुरुदेव से पूछें…"
              className="w-full pl-14 pr-32 py-5 rounded-2xl bg-black/55 border border-gold/40 text-foreground placeholder-cosmic-300 text-base focus:outline-none focus:border-gold/80 focus:shadow-gold transition-all backdrop-blur-md"
            />
            <button
              type="submit"
              className="absolute right-3 btn-gold rounded-xl px-6 py-2.5 text-sm flex items-center gap-2"
            >
              <Search size={16} />
              Ask
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="px-4 py-2 rounded-full border border-gold/30 bg-black/40 text-cosmic-100 text-sm hover:border-gold/70 hover:text-foreground transition-all font-devanagari backdrop-blur-md"
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

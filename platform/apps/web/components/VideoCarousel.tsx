"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { T } from "@/lib/i18n";

type Slide = {
  src: string;
  caption: string;
  captionEn: string;
};

const SLIDES: Slide[] = [
  { src: "/videos/teaching-1.mp4", caption: "साधना की शक्ति", captionEn: "The Power of Sadhana" },
  { src: "/videos/teaching-2.mp4", caption: "मंत्र सिद्धि", captionEn: "Awakening Mantra Siddhi" },
  { src: "/videos/teaching-3.mp4", caption: "तंत्र का मार्ग", captionEn: "The Path of Tantra" },
];

const AUTO_ADVANCE_MS = 9000;

/**
 * "Teachings in motion" — optional media section. The video files are not part of
 * the repo, so a slide that fails to load is dropped, and the whole section stays
 * hidden until at least one video is playable.
 */
export function VideoCarousel() {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<string[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const slides = SLIDES.filter((s) => !failed.includes(s.src));
  const count = slides.length;
  const current = count ? index % count : 0;
  const active = slides[current];

  const goTo = useCallback((i: number) => setIndex(count ? ((i % count) + count) % count : 0), [count]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === current) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [current, count]);

  // Ambient mantra audio — opt-in: only plays after the visitor unmutes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      audio.pause();
    } else {
      audio.volume = 0.35;
      audio.play().catch(() => {});
    }
  }, [muted]);

  useEffect(() => {
    if (count < 2) return;
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
  }, [current, count, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const ready = loaded.some((src) => !failed.includes(src));

  return (
    <section className={`px-4 py-20 sm:px-6 ${ready ? "" : "hidden"}`} aria-label="Teachings in motion">
      {/* Ambient mantra audio */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/videos/guru-avaahan-mantra.mp3" loop preload="none" />

      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="text-sm uppercase tracking-widest text-gold">
            <T k="home.motionEyebrow" />
          </span>
          <h2 className="mt-2 font-serif text-4xl text-foreground">
            <T k="home.motionTitle" />
          </h2>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-black shadow-cosmic" style={{ aspectRatio: "16 / 9" }}>
          {slides.map((slide, i) => (
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
              onLoadedMetadata={() => setLoaded((l) => (l.includes(slide.src) ? l : [...l, slide.src]))}
              onError={() => setFailed((f) => (f.includes(slide.src) ? f : [...f, slide.src]))}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                i === current ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />
          ))}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          {count > 1 && (
            <div className="absolute left-0 right-0 top-0 h-[3px] bg-white/15">
              <div
                className="h-full bg-gold-light"
                style={{ width: `${progress * 100}%`, transition: "width 80ms linear" }}
              />
            </div>
          )}

          {/* Ambient sound toggle */}
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Play ambient mantra" : "Mute ambient mantra"}
            aria-pressed={!muted}
            title={muted ? "Play ambient mantra" : "Mute ambient mantra"}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30
                       bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/75"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {active && (
            <div className="pointer-events-none absolute bottom-5 left-5 right-5 md:bottom-7 md:left-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.src}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="font-serif text-xl text-white drop-shadow md:text-3xl">{active.captionEn}</div>
                  <div className="font-devanagari text-sm text-white/80 md:text-base">{active.caption}</div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous video"
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full
                           border border-white/30 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/75"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next video"
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full
                           border border-white/30 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/75"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {count > 1 && (
          <div className="mt-5 flex justify-center gap-3">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to video ${i + 1}`}
                aria-current={i === current}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-10 bg-gold" : "w-2 bg-gold/30 hover:bg-gold/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

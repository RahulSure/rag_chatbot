"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, MessageCircle, Sparkles } from "lucide-react";

const SUGGESTED = [
  "कुंडलिनी जागरण क्या है?",
  "What is mantra siddhi?",
  "सौन्दर्य साधना कैसे करें?",
  "Explain the power of tantra",
];

export function HeroSection() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestion = (s: string) => {
    router.push(`/chat?q=${encodeURIComponent(s)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden cosmic-bg stars-bg">
      {/* Decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full border border-gold/10 animate-pulse" />
        <div className="absolute w-[800px] h-[800px] rounded-full border border-gold/5" />
        <div className="absolute w-[1000px] h-[1000px] rounded-full border border-gold/5" />
      </div>

      {/* Om symbol glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 text-gold text-sm mb-8">
            <Sparkles size={14} />
            <span>AI-Powered Spiritual Knowledge Platform</span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 leading-tight">
            <span className="text-gold">Sadgurudev</span>
            <br />
            <span className="text-foreground">Dr. Narayan Dutt</span>
            <br />
            <span className="text-foreground">Shrimali</span>
          </h1>

          <p className="text-cosmic-200 text-lg md:text-xl mb-4 font-devanagari">
            ॐ परम तत्वाय नारायणाय गुरुभ्यो नमः
          </p>

          <p className="text-cosmic-300 text-base md:text-lg mb-12 max-w-2xl mx-auto">
            Explore the timeless wisdom of Sadgurudev — tantra, mantra, sadhana, 
            jyotish, and kundalini — through our AI-powered knowledge engine.
          </p>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-8">
            <div className="relative flex items-center">
              <div className="absolute left-5 text-gold opacity-70">
                <MessageCircle size={20} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask the AI Guru... / गुरुदेव से पूछें..."
                className="w-full pl-14 pr-32 py-5 rounded-2xl bg-cosmic-900/80 border border-gold/30 
                           text-foreground placeholder-cosmic-400 text-base focus:outline-none 
                           focus:border-gold/60 focus:shadow-gold transition-all backdrop-blur-md"
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

          {/* Suggested questions */}
          <div className="flex flex-wrap justify-center gap-2 mb-16">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="px-4 py-2 rounded-full border border-gold/20 bg-gold/5 text-cosmic-200 
                           text-sm hover:border-gold/50 hover:text-foreground transition-all font-devanagari"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-12 text-center"
        >
          {[
            { value: "150+", label: "Books & Teachings" },
            { value: "10", label: "Spiritual Topics" },
            { value: "AI", label: "Powered Guru" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-serif text-3xl font-bold text-gold">{stat.value}</div>
              <div className="text-cosmic-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gold/40"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-gold/40" />
        <span className="text-xs">Scroll to explore</span>
      </motion.div>
    </section>
  );
}

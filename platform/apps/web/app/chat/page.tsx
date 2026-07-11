import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatInterface } from "@/components/ChatInterface";

export const metadata: Metadata = {
  title: "AI Chat — Ask Sadgurudev's Teachings",
  description:
    "Ask questions about tantra, mantra, sadhana, kundalini and more. Get AI-powered answers grounded in Dr. Narayan Dutt Shrimali's published books.",
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const { q } = await searchParams;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 text-gold text-sm mb-4">
            <span>🪔</span>
            <span>AI Guru Chat</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground mb-3">
            Ask the AI Guru
          </h1>
          <p className="text-cosmic-400 max-w-lg mx-auto">
            Explore Sadgurudev's teachings on tantra, mantra, sadhana, kundalini, 
            jyotish and spiritual sciences. Ask in Hindi or English.
          </p>
        </div>

        {/* Chat container */}
        <div className="cosmic-card flex flex-col">
          <Suspense fallback={<div className="p-8 text-center text-cosmic-500">Loading AI Guru...</div>}>
            <ChatInterface initialQuestion={q} />
          </Suspense>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-cosmic-600 mt-4">
          Answers are grounded in Sadgurudev's published texts via RAG retrieval. 
          This is not a substitute for personal guidance from a qualified Guru.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { T } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Ask Sadhak — AI Chat on Mantra, Meditation & Sadhana",
  description:
    "Ask questions about mantra, meditation, tantra, kundalini and sadhana. Get AI answers grounded in published texts, with the source passages shown.",
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const { q } = await searchParams;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="mb-3 font-serif text-4xl text-foreground">
            <T k="chat.title" />
          </h1>
          <p className="mx-auto max-w-lg text-cosmic-400">
            <T k="chat.lead" />
          </p>
        </div>

        <div className="cosmic-card flex min-h-[600px] flex-col">
          <Suspense fallback={<div className="p-8 text-center text-cosmic-500">…</div>}>
            <ChatInterface initialQuestion={q} />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-xs text-cosmic-500">
          <T k="chat.disclaimer" />
        </p>
      </div>
    </div>
  );
}

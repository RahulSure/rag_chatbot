import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { T } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Ask Sadhak — AI Chat on Mantra, Meditation & Sadhana",
  description:
    "Ask questions about mantra, meditation, tantra, kundalini and sadhana. Get AI answers grounded in published teachings.",
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const { q } = await searchParams;

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="sr-only">
          <T k="chat.title" />
        </h1>
        <div className="flex h-[calc(100dvh-10rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-cosmic">
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

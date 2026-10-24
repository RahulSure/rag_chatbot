"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Sparkles, BookOpen, Share2, Copy, Check, Clock } from "lucide-react";
import { useStreamChat, ChatMessage } from "@/lib/useStream";
import { useT, type Key } from "@/lib/i18n";
import { SourceCard } from "./SourceCard";

const STARTERS: Key[] = ["chat.follow1", "chat.follow2", "chat.follow3", "chat.follow4"];

export function ChatInterface({ initialQuestion }: { initialQuestion?: string }) {
  const t = useT();
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, error, sendMessage } = useStreamChat(sessionIdRef);

  // True when the last assistant message was a rate-limit response
  const isRateLimited = messages.length > 0 && messages[messages.length - 1]?.isRateLimit === true;

  // Init session id from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      let sid = localStorage.getItem("shrimali_session_id");
      if (!sid) {
        sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("shrimali_session_id", sid);
      }
      sessionIdRef.current = sid;
    }
  }, []);

  // Handle initial question from URL
  useEffect(() => {
    if (initialQuestion && messages.length === 0) {
      sendMessage(initialQuestion);
    }
  }, [initialQuestion]); // eslint-disable-line

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || isLoading) return;
    setInput("");
    await sendMessage(q);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${t("chat.shareText")}:\n\n${text}\n\n— Sadhak.ai`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex h-full max-h-[80vh] flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4 pb-2" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
              <Sparkles size={26} className="text-gold" aria-hidden="true" />
            </div>
            <h3 className="mb-2 font-serif text-2xl text-foreground">{t("chat.emptyTitle")}</h3>
            <p className="mb-8 max-w-md text-cosmic-400">{t("chat.emptyBody")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((k) => (
                <button
                  key={k}
                  onClick={() => sendMessage(t(k))}
                  className="rounded-full border border-gold/25 bg-gold/5 px-4 py-2 text-sm text-cosmic-300
                             transition-colors hover:border-gold/60 hover:text-foreground"
                >
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              copiedId={copiedId}
              onCopy={handleCopy}
              onShare={handleShare}
              onFollowUp={sendMessage}
            />
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-3 text-cosmic-400">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-gold/60"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.6 }}
                />
              ))}
            </div>
            <span className="text-sm">{t("chat.thinking")}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-600/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gold/15 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <label htmlFor="chat-input" className="sr-only">
            {t("chat.placeholder")}
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRateLimited ? t("chat.placeholderLimited") : t("chat.placeholder")}
            className="flex-1 rounded-xl border border-gold/25 bg-cosmic-900/60 px-4 py-3 text-sm text-foreground
                       placeholder-cosmic-500 transition-all focus:border-gold/60 focus:outline-none
                       disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRateLimited}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={isLoading || !input.trim() || isRateLimited}
            className="btn-gold flex items-center gap-2 rounded-xl px-4 py-3 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-cosmic-500">
          {isRateLimited ? t("chat.hintLimited") : t("chat.hint")}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  copiedId,
  onCopy,
  onShare,
  onFollowUp,
}: {
  msg: ChatMessage & { suggestedQuestions?: string[] };
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  onShare: (text: string) => void;
  onFollowUp: (q: string) => void;
}) {
  const t = useT();
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-gold/20 text-gold" : "border border-gold/30 bg-cosmic-800 text-gold"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      <div className={`flex max-w-[85%] flex-col space-y-3 sm:max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {msg.isRateLimit ? (
          <div className="space-y-2 rounded-2xl border border-amber-600/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-semibold">
              <Clock size={14} aria-hidden="true" />
              <span>{t("chat.limitTitle")}</span>
            </div>
            <p className="font-devanagari leading-relaxed">{msg.content}</p>
            <p className="mt-1 text-xs opacity-80">{t("chat.limitNote")}</p>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? "border border-gold/30 bg-gold/15 text-foreground"
                : "border border-gold/15 bg-cosmic-900/60 text-cosmic-100"
            } ${msg.isStreaming ? "cursor-blink" : ""}`}
          >
            <p className="whitespace-pre-wrap font-devanagari">{msg.content}</p>
          </div>
        )}

        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-1 text-xs text-cosmic-500">
              <BookOpen size={10} aria-hidden="true" />
              <span>{t("chat.sources")}</span>
            </div>
            {msg.sources.slice(0, 3).map((src, i) => (
              <SourceCard key={i} source={src} />
            ))}
          </div>
        )}

        {/* Suggested follow-ups */}
        {!isUser && !msg.isStreaming && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs text-cosmic-500">{t("chat.alsoAsk")}</p>
            <div className="flex flex-wrap gap-2">
              {msg.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUp(q)}
                  className="rounded-full border border-gold/25 bg-gold/5 px-3 py-1.5 text-left text-xs text-cosmic-300
                             font-devanagari transition-colors hover:border-gold/60 hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isUser && !msg.isStreaming && msg.content && (
          <div className="flex gap-2">
            <button
              onClick={() => onCopy(msg.id, msg.content)}
              className="flex items-center gap-1 rounded-lg border border-gold/15 px-3 py-1 text-xs text-cosmic-400
                         transition-colors hover:border-gold/40 hover:text-foreground"
            >
              {copiedId === msg.id ? <Check size={10} /> : <Copy size={10} />}
              {copiedId === msg.id ? t("chat.copied") : t("chat.copy")}
            </button>
            <button
              onClick={() => onShare(msg.content)}
              className="flex items-center gap-1 rounded-lg border border-gold/15 px-3 py-1 text-xs text-cosmic-400
                         transition-colors hover:border-gold/40 hover:text-foreground"
            >
              <Share2 size={10} />
              {t("chat.share")}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

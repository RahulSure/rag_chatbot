"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, BookOpen, Share2, Copy, Check, Clock } from "lucide-react";
import { useStreamChat, ChatMessage } from "@/lib/useStream";
import { SourceCard } from "./SourceCard";

const SUGGESTED_FOLLOWUPS = [
  "Tell me more about this",
  "What does the book say about practice?",
  "इसका अभ्यास कैसे करें?",
  "Give me an example from the teachings",
];

export function ChatInterface({ initialQuestion }: { initialQuestion?: string }) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, error, sendMessage, clearChat } = useStreamChat(sessionIdRef);

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

  const handleWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(
      `From Sadgurudev's teachings:\n\n${text}\n\n— Shrimali AI Platform`
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 p-4 pb-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-6xl mb-4">🪔</div>
            <h3 className="font-serif text-2xl text-gold mb-2">Ask the AI Guru</h3>
            <p className="text-cosmic-400 max-w-md mb-8">
              Explore Sadgurudev's teachings on tantra, mantra, sadhana, kundalini,
              jyotish and more. Ask in Hindi or English.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_FOLLOWUPS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-4 py-2 rounded-full border border-gold/20 bg-gold/5 text-cosmic-300 
                             text-sm hover:border-gold/50 hover:text-foreground transition-all"
                >
                  {s}
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
              onWhatsApp={handleWhatsApp}
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
                  className="w-2 h-2 rounded-full bg-gold/50"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.6 }}
                />
              ))}
            </div>
            <span className="text-sm">Sadgurudev's wisdom is being retrieved...</span>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gold/10 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRateLimited ? "Please wait before asking more..." : "Ask about tantra, mantra, sadhana... / पूछें..."}
            className="flex-1 px-4 py-3 rounded-xl bg-cosmic-900/60 border border-gold/20
                       text-foreground placeholder-cosmic-500 focus:outline-none focus:border-gold/50
                       transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || isRateLimited}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isRateLimited}
            className="btn-gold rounded-xl px-4 py-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-xs text-cosmic-600 mt-2 text-center">
          {isRateLimited
            ? "🕐 Limit reached — return in 1 hour for more wisdom."
            : "Answers are grounded in Sadgurudev's published books."}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  copiedId,
  onCopy,
  onWhatsApp,
  onFollowUp,
}: {
  msg: ChatMessage & { suggestedQuestions?: string[] };
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  onWhatsApp: (text: string) => void;
  onFollowUp: (q: string) => void;
}) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
          ${isUser ? "bg-gold/20 text-gold" : "bg-cosmic-800 border border-gold/30 text-gold"}`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className={`max-w-[80%] space-y-3 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Rate-limit notice — special amber card */}
        {msg.isRateLimit ? (
          <div className="px-5 py-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <Clock size={14} />
              <span>Question limit reached</span>
            </div>
            <p className="font-devanagari leading-relaxed">{msg.content}</p>
            <p className="text-xs text-amber-400/70 mt-1">
              Use this time to meditate on the answers you've received. 🙏
            </p>
          </div>
        ) : (
        /* Regular bubble */
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-gold/15 border border-gold/25 text-foreground"
              : "bg-cosmic-900/60 border border-gold/15 text-cosmic-100"
          } ${msg.isStreaming ? "cursor-blink" : ""}`}
        >
          <p className="whitespace-pre-wrap font-devanagari">{msg.content}</p>
        </div>
        )}

        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-1 text-xs text-cosmic-500">
              <BookOpen size={10} />
              <span>Source passages</span>
            </div>
            {msg.sources.slice(0, 3).map((src, i) => (
              <SourceCard key={i} source={src} />
            ))}
          </div>
        )}

        {/* Suggested follow-ups */}
        {!isUser && !msg.isStreaming && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs text-cosmic-500">You might also ask:</p>
            <div className="flex flex-wrap gap-2">
              {msg.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUp(q)}
                  className="px-3 py-1.5 rounded-full text-xs border border-gold/20 bg-gold/5
                             text-cosmic-300 hover:border-gold/50 hover:text-foreground
                             transition-all font-devanagari text-left"
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
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs text-cosmic-400 
                         hover:text-foreground border border-gold/10 hover:border-gold/30 transition-all"
            >
              {copiedId === msg.id ? <Check size={10} /> : <Copy size={10} />}
              {copiedId === msg.id ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => onWhatsApp(msg.content)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs text-green-400 
                         hover:text-green-300 border border-green-800/30 hover:border-green-600/30 transition-all"
            >
              <Share2 size={10} />
              WhatsApp
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

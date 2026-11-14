"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Share2, Copy, Check, Clock, History, Plus, Trash2, X } from "lucide-react";
import { useStreamChat, ChatMessage } from "@/lib/useStream";
import { useT, type Key } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { deleteConversation, getConversation, listConversations, type ConversationSummary } from "@/lib/api";
import { SourceList } from "./SourceList";

const STARTERS: Key[] = ["v4.suggest1", "v4.suggest2", "v4.suggest3", "v4.suggest4"];

export function ChatInterface({ initialQuestion }: { initialQuestion?: string }) {
  const t = useT();
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, error, sendMessage, loadConversation, newChat } = useStreamChat(sessionIdRef);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // True when the last assistant message was a rate-limit response
  const isRateLimited = messages.length > 0 && messages[messages.length - 1]?.isRateLimit === true;

  // Visitors keep a browser-local session id (1-hour memory on the server). Signed-in
  // users' conversations get their id from the server with the first answer instead.
  const anonSessionId = useCallback(() => {
    let sid = localStorage.getItem("shrimali_session_id");
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("shrimali_session_id", sid);
    }
    return sid;
  }, []);

  // Once we know who is here: set up the session, and start fresh if they sign in or out later.
  const seenUserRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (authLoading) return;
    const uid = user?.id ?? null;
    if (seenUserRef.current === undefined) {
      if (!uid && !sessionIdRef.current) sessionIdRef.current = anonSessionId();
    } else if (seenUserRef.current !== uid) {
      setHistoryOpen(false);
      newChat(uid ? undefined : anonSessionId());
      router.replace("/chat");
    }
    seenUserRef.current = uid;
  }, [authLoading, user, anonSessionId, newChat, router]);

  // ?c=<id> opens a saved chat; ?history=1 opens the list (from the account menu).
  const openParam = searchParams.get("c");
  const historyParam = searchParams.get("history");
  useEffect(() => {
    if (authLoading || !user) return;
    if (historyParam) setHistoryOpen(true);
    if (!openParam || openParam === sessionIdRef.current) return;
    getConversation(openParam).then((convo) => {
      if (convo) {
        setNotice(null);
        loadConversation(convo);
      } else {
        setNotice(t("chat.notFound"));
      }
    });
  }, [authLoading, user, openParam, historyParam, loadConversation, t]);

  const openConversation = (id: string) => {
    setHistoryOpen(false);
    router.replace(`/chat?c=${encodeURIComponent(id)}`);
  };

  const startNewChat = () => {
    setHistoryOpen(false);
    setNotice(null);
    newChat(user ? undefined : anonSessionId());
    router.replace("/chat");
  };

  // Handle initial question from URL — send it exactly once. Strict Mode runs
  // effects twice in dev, and `messages` is still empty on the second run.
  const sentInitialRef = useRef<string | null>(null);
  useEffect(() => {
    if (initialQuestion && sentInitialRef.current !== initialQuestion && messages.length === 0) {
      sentInitialRef.current = initialQuestion;
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
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Signed-in toolbar: saved chats and a fresh start */}
      {user && (
        <div className="flex items-center justify-between border-b border-line px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            aria-expanded={historyOpen}
            aria-controls="chat-history"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-cosmic-300 transition-colors hover:bg-gold/10 hover:text-foreground"
          >
            <History size={15} aria-hidden="true" /> {t("chat.historyTitle")}
          </button>
          <button
            type="button"
            onClick={startNewChat}
            disabled={isLoading || messages.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-cosmic-300 transition-colors hover:bg-gold/10 hover:text-foreground disabled:opacity-40"
          >
            <Plus size={15} aria-hidden="true" /> {t("chat.newChat")}
          </button>
        </div>
      )}

      {user && historyOpen && (
        <HistoryPanel
          activeId={sessionIdRef.current}
          onOpen={openConversation}
          onClose={() => setHistoryOpen(false)}
          onDeleted={(id) => id === sessionIdRef.current && startNewChat()}
        />
      )}

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 pb-2 sm:p-6" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <span aria-hidden="true" className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 font-serif text-2xl text-gold">
              स
            </span>
            <h2 className="mb-2 font-serif text-3xl text-foreground sm:text-4xl">{t("v4.askTitle")}</h2>
            <p className="mb-8 max-w-md text-cosmic-400">{t("chat.lead")}</p>
            <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {STARTERS.map((k) => (
                <button
                  key={k}
                  onClick={() => sendMessage(t(k))}
                  className="rounded-xl border border-line px-4 py-3 text-left text-sm leading-snug text-cosmic-200
                             transition-colors hover:border-gold/50 hover:text-foreground"
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

        {notice && (
          <div role="status" className="rounded-xl border border-line px-4 py-3 text-sm text-cosmic-300">
            {notice}
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
      <div className="border-t border-line bg-surface-2/60 p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 rounded-xl border border-line bg-surface p-1.5 transition-colors focus-within:border-gold/60">
          <label htmlFor="chat-input" className="sr-only">
            {t("chat.placeholder")}
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRateLimited ? t("chat.placeholderLimited") : t("chat.placeholder")}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-foreground placeholder:text-cosmic-500
                       focus:outline-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRateLimited}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={isLoading || !input.trim() || isRateLimited}
            className="btn-gold shrink-0 px-3.5 py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp size={18} aria-hidden="true" />
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
      {!isUser && (
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-gold/50 font-serif text-base text-gold"
          aria-hidden="true"
        >
          स
        </span>
      )}

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
            className={`leading-relaxed ${
              isUser
                ? "rounded-2xl rounded-br-md bg-gold/15 px-4 py-3 text-foreground"
                : "pt-1 text-[0.95rem] text-cosmic-100"
            } ${msg.isStreaming ? "cursor-blink" : ""}`}
          >
            <p className="whitespace-pre-wrap font-devanagari">{msg.content}</p>
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
                  className="rounded-lg border border-line px-3 py-1.5 text-left text-xs text-cosmic-300
                             font-devanagari transition-colors hover:border-gold/50 hover:text-foreground"
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
              className="flex items-center gap-1 rounded-lg border border-line px-3 py-1 text-xs text-cosmic-400
                         transition-colors hover:border-gold/40 hover:text-foreground"
            >
              {copiedId === msg.id ? <Check size={10} /> : <Copy size={10} />}
              {copiedId === msg.id ? t("chat.copied") : t("chat.copy")}
            </button>
            <button
              onClick={() => onShare(msg.content)}
              className="flex items-center gap-1 rounded-lg border border-line px-3 py-1 text-xs text-cosmic-400
                         transition-colors hover:border-gold/40 hover:text-foreground"
            >
              <Share2 size={10} />
              {t("chat.share")}
            </button>
          </div>
        )}

        {/* Sources — collapsed and low-key, one entry per site or book */}
        {!isUser && msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
          <SourceList sources={msg.sources} label={t("chat.sources")} />
        )}
      </div>
    </motion.div>
  );
}

/** Saved chats for the signed-in user, newest first. Overlays the chat. */
function HistoryPanel({
  activeId,
  onOpen,
  onClose,
  onDeleted,
}: {
  activeId?: string;
  onOpen: (id: string) => void;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const t = useT();
  const [items, setItems] = useState<ConversationSummary[] | null>(null);

  useEffect(() => {
    listConversations().then(setItems);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const remove = async (id: string) => {
    if (await deleteConversation(id)) {
      setItems((prev) => prev?.filter((c) => c.id !== id) ?? null);
      onDeleted(id);
    }
  };

  return (
    <div id="chat-history" className="absolute inset-0 z-20 flex flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-serif text-xl text-foreground">{t("chat.historyTitle")}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("chat.historyClose")}
          className="rounded-lg p-1.5 text-cosmic-400 transition-colors hover:bg-gold/10 hover:text-foreground"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {items === null ? (
          <p className="px-3 py-6 text-center text-sm text-cosmic-500">…</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-cosmic-500">{t("chat.historyEmpty")}</p>
        ) : (
          <ul>
            {items.map((c) => (
              <li key={c.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpen(c.id)}
                  aria-current={c.id === activeId ? "true" : undefined}
                  className={`min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gold/10 ${
                    c.id === activeId ? "bg-gold/10" : ""
                  }`}
                >
                  <span className="block truncate font-devanagari text-sm text-foreground">{c.title}</span>
                  <span className="block text-xs text-cosmic-500">
                    {new Date(c.updated_at.endsWith("Z") ? c.updated_at : `${c.updated_at}Z`).toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={`${t("chat.delete")}: ${c.title}`}
                  className="rounded-lg p-2 text-cosmic-500 opacity-60 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

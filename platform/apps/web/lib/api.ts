/**
 * Typed API client for the Shrimali AI FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SourceNode {
  page?: number;
  book?: string;
  chapter?: string;
  topic?: string;
  text_snippet: string;
}

export interface QueryResponse {
  answer: string;
  sources: SourceNode[];
  model: string;
  session_id?: string;
  suggested_questions?: string[];
}

export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  tags: string[];
  topic: string;
  status: string;
  published_at?: string;
  cover_image_url?: string;
  language?: string;  // "en" | "hi"
}

export interface Article extends ArticleListItem {
  body_mdx: string;
  faq: { question: string; answer: string }[];
  source_books: string[];
  language?: string;
}

export interface DailyWisdom {
  text: string;
  book?: string;
  page?: number;
  chapter?: string;
  language: string;
  date: string;
}

export interface Topic {
  slug: string;
  label: string;
  label_hi: string;
  description?: string;
  chunk_count: number;
  article_count: number;
  icon?: string;
}

export interface BookMeta {
  slug: string;
  name: string;
  language: string;
  author: string;
  tags: string[];
  chunk_count: number;
  description?: string;
}

export interface SearchResult {
  text_snippet: string;
  book?: string;
  page?: number;
  chapter?: string;
  topic?: string;
  score?: number;
}

export interface TrendingQuery {
  query: string;
  count: number;
}

// ── Query ──────────────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function sendQuery(
  question: string,
  topK = 12,
  sessionId?: string
): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, top_k: topK, stream: false, session_id: sessionId }),
  });
  if (!res.ok) {
    // Parse the FastAPI error detail if available
    let detail: string | undefined;
    try {
      const body = await res.json();
      detail = body?.detail;
    } catch {
      detail = await res.text();
    }
    if (res.status === 429) {
      throw new RateLimitError(detail ?? "Too many questions. Please wait before asking again.");
    }
    throw new Error(detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function createStreamingQuery(
  question: string,
  topK = 5,
  sessionId?: string
): EventSource | null {
  if (typeof window === "undefined") return null;
  const body = JSON.stringify({ question, top_k: topK, stream: true, session_id: sessionId });

  const url = `${API_BASE}/query`;
  return null; // SSE is handled via fetch + ReadableStream below
}

export async function* streamQuery(
  question: string,
  topK = 12,
  sessionId?: string
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, top_k: topK, stream: true, session_id: sessionId }),
  });

  if (!res.ok || !res.body) throw new Error("Stream failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last (possibly incomplete) line in the buffer.
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      // Do NOT trim: tokens carry significant leading/trailing whitespace.
      const raw = line.slice(6);
      if (raw === "[DONE]" || raw.startsWith("[SESSION:") || raw.startsWith("[ERROR]")) {
        if (raw.startsWith("[ERROR]")) throw new Error(raw);
        continue;
      }
      // Content tokens are JSON-encoded by the backend to preserve whitespace.
      yield JSON.parse(raw) as string;
    }
  }
}

// ── Knowledge Base ─────────────────────────────────────────────────────────

export async function getTopics(): Promise<Topic[]> {
  const res = await fetch(`${API_BASE}/topics`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  return res.json();
}

export async function getBooks(): Promise<BookMeta[]> {
  const res = await fetch(`${API_BASE}/books`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  return res.json();
}

// ── Articles ───────────────────────────────────────────────────────────────

export async function getArticles(
  topic?: string,
  limit = 20,
  skip = 0,
  language?: string,
): Promise<ArticleListItem[]> {
  const params = new URLSearchParams({ status: "published", limit: String(limit), skip: String(skip) });
  if (topic) params.set("topic", topic);
  if (language) params.set("language", language);
  const res = await fetch(`${API_BASE}/articles?${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function getArticle(slug: string): Promise<Article | null> {
  const res = await fetch(`${API_BASE}/articles/${slug}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json();
}

// ── Daily Wisdom ───────────────────────────────────────────────────────────

export async function getDailyWisdom(): Promise<DailyWisdom | null> {
  try {
    const res = await fetch(`${API_BASE}/daily-wisdom`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Search ─────────────────────────────────────────────────────────────────

export async function semanticSearch(
  q: string,
  limit = 8,
  topic?: string
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (topic) params.set("topic", topic);
  const res = await fetch(`${API_BASE}/search?${params}`);
  if (!res.ok) return [];
  return res.json();
}

// ── Analytics ──────────────────────────────────────────────────────────────

export async function getTrendingQueries(limit = 10): Promise<TrendingQuery[]> {
  const res = await fetch(`${API_BASE}/analytics/trending?limit=${limit}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return res.json();
}

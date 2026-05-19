"use client";

import { useState, useEffect } from "react";
import {
  Upload, Database, FileText, TrendingUp, CheckCircle,
  XCircle, Loader2, RefreshCw, Trash2, Eye
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Stats {
  queries: { total: number; last_7_days: number; last_30_days: number };
  articles: { total: number; published: number; draft: number; pending_approval: number };
  knowledge_base: { vector_chunks: number };
}

interface Article {
  id: string;
  slug: string;
  title: string;
  status: string;
  topic: string;
  published_at?: string;
}

function useAdminAuth() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);

  const tryAuth = () => {
    if (secret) setAuthed(true);
  };

  return { secret, setSecret, authed, tryAuth };
}

export default function AdminPage() {
  const { secret, setSecret, authed, tryAuth } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [trending, setTrending] = useState<{ query: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "articles" | "upload" | "trending">("overview");

  // Upload form
  const [bookName, setBookName] = useState("");
  const [bookSlug, setBookSlug] = useState("");
  const [language, setLanguage] = useState("hi");
  const [tags, setTags] = useState("spiritual,sadhana");
  const [file, setFile] = useState<File | null>(null);

  // Article generation
  const [artTopic, setArtTopic] = useState("");
  const [artKeyword, setArtKeyword] = useState("");

  const headers = { "X-Admin-Secret": secret };

  const fetchData = async () => {
    if (!authed) return;
    try {
      const [statsRes, articlesRes, trendingRes] = await Promise.all([
        fetch(`${API}/analytics/stats`, { headers }),
        fetch(`${API}/articles?status=draft&limit=20`, { headers }),
        fetch(`${API}/analytics/trending?limit=10`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (articlesRes.ok) setArticles(await articlesRes.json());
      if (trendingRes.ok) setTrending(await trendingRes.json());
    } catch (e) {
      showMsg("error", "Failed to fetch data");
    }
  };

  useEffect(() => { if (authed) fetchData(); }, [authed]); // eslint-disable-line

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !bookName || !bookSlug) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("book_name", bookName);
    fd.append("book_slug", bookSlug);
    fd.append("language", language);
    fd.append("tags", tags);

    try {
      const res = await fetch(`${API}/admin/upload`, { method: "POST", headers, body: fd });
      const data = await res.json();
      showMsg(res.ok ? "success" : "error", data.message || data.detail || "Done");
    } catch (e) {
      showMsg("error", "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API}/articles/${id}/approve`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showMsg("success", `Article ${status}`);
        fetchData();
      }
    } catch {
      showMsg("error", "Failed to update");
    }
  };

  const handleGenerateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTopic || !artKeyword) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/articles/generate`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ topic: artTopic, primary_keyword: artKeyword, language: "en" }),
      });
      const data = await res.json();
      showMsg(res.ok ? "success" : "error", data.status || data.detail);
      if (res.ok) fetchData();
    } catch {
      showMsg("error", "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="cosmic-card p-10 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="font-serif text-2xl text-foreground mb-6">Admin Access</h1>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryAuth()}
            placeholder="Enter admin secret"
            className="w-full px-4 py-3 rounded-xl bg-cosmic-900 border border-gold/20 text-foreground 
                       placeholder-cosmic-500 focus:outline-none focus:border-gold/50 mb-4 text-sm"
          />
          <button onClick={tryAuth} className="btn-gold w-full py-3 rounded-xl">
            Enter Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Admin Dashboard</h1>
            <p className="text-cosmic-500 text-sm">Shrimali AI Platform Control Center</p>
          </div>
          <button onClick={fetchData} className="btn-ghost flex items-center gap-2 text-sm px-4 py-2 rounded-lg">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl border flex items-center gap-2 text-sm ${
            message.type === "success"
              ? "bg-green-900/20 border-green-600/30 text-green-400"
              : "bg-red-900/20 border-red-500/30 text-red-400"
          }`}>
            {message.type === "success" ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gold/10">
          {[
            { id: "overview", label: "Overview", icon: Database },
            { id: "articles", label: "Articles", icon: FileText },
            { id: "upload", label: "Upload Book", icon: Upload },
            { id: "trending", label: "Analytics", icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm transition-all border-b-2 -mb-px ${
                activeTab === id
                  ? "border-gold text-gold"
                  : "border-transparent text-cosmic-400 hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Queries", value: stats.queries.total, sub: `${stats.queries.last_7_days} this week` },
              { label: "Published Articles", value: stats.articles.published, sub: `${stats.articles.draft} drafts` },
              { label: "Pending Approval", value: stats.articles.pending_approval, sub: "articles" },
              { label: "Vector Chunks", value: stats.knowledge_base.vector_chunks, sub: "embedded passages" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="cosmic-card p-6">
                <div className="font-serif text-3xl text-gold mb-1">{value.toLocaleString()}</div>
                <div className="text-foreground text-sm font-medium">{label}</div>
                <div className="text-cosmic-500 text-xs mt-1">{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === "articles" && (
          <div className="space-y-6">
            {/* Generate Article */}
            <div className="cosmic-card p-6">
              <h2 className="font-serif text-xl text-foreground mb-4">Generate Article</h2>
              <form onSubmit={handleGenerateArticle} className="flex flex-col md:flex-row gap-3">
                <input
                  value={artTopic}
                  onChange={(e) => setArtTopic(e.target.value)}
                  placeholder="Topic slug (e.g. kundalini)"
                  className="flex-1 px-4 py-3 rounded-xl bg-cosmic-900 border border-gold/20 text-foreground 
                             placeholder-cosmic-500 focus:outline-none focus:border-gold/40 text-sm"
                />
                <input
                  value={artKeyword}
                  onChange={(e) => setArtKeyword(e.target.value)}
                  placeholder="Primary keyword"
                  className="flex-1 px-4 py-3 rounded-xl bg-cosmic-900 border border-gold/20 text-foreground 
                             placeholder-cosmic-500 focus:outline-none focus:border-gold/40 text-sm"
                />
                <button type="submit" disabled={loading} className="btn-gold px-6 py-3 rounded-xl flex items-center gap-2 text-sm">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  Generate
                </button>
              </form>
            </div>

            {/* Draft articles */}
            <div>
              <h2 className="font-serif text-xl text-foreground mb-4">Pending Articles ({articles.length})</h2>
              {articles.length === 0 ? (
                <p className="text-cosmic-500 text-sm">No draft articles pending approval.</p>
              ) : (
                <div className="space-y-3">
                  {articles.map((art) => (
                    <div key={art.id} className="cosmic-card p-5 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">{art.title}</p>
                        <p className="text-cosmic-500 text-xs mt-0.5">
                          {art.topic} · {art.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={`/blog/${art.slug}`} target="_blank" rel="noopener noreferrer"
                           className="p-2 text-cosmic-400 hover:text-foreground transition-colors">
                          <Eye size={14} />
                        </a>
                        <button onClick={() => handleApprove(art.id, "published")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-900/20 border border-green-600/30 text-green-400 text-xs hover:bg-green-900/40 transition-all">
                          <CheckCircle size={12} /> Publish
                        </button>
                        <button onClick={() => handleApprove(art.id, "rejected")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-xs hover:bg-red-900/40 transition-all">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="max-w-xl">
            <div className="cosmic-card p-8">
              <h2 className="font-serif text-2xl text-foreground mb-6">Upload New Book</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm text-cosmic-400 mb-1.5">PDF File</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-cosmic-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold/10 file:text-gold file:text-sm file:cursor-pointer"
                  />
                </div>
                {[
                  { label: "Book Name", value: bookName, set: setBookName, placeholder: "e.g. Kundalini Tantra" },
                  { label: "Book Slug", value: bookSlug, set: setBookSlug, placeholder: "e.g. kundalini-tantra" },
                  { label: "Language Code", value: language, set: setLanguage, placeholder: "hi or en" },
                  { label: "Tags (comma-separated)", value: tags, set: setTags, placeholder: "spiritual,tantra" },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="block text-sm text-cosmic-400 mb-1.5">{label}</label>
                    <input
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 rounded-xl bg-cosmic-900 border border-gold/20 text-foreground 
                                 placeholder-cosmic-500 focus:outline-none focus:border-gold/40 text-sm"
                    />
                  </div>
                ))}
                <button type="submit" disabled={loading || !file} className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Upload & Ingest
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === "trending" && (
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl text-foreground mb-6">Trending Queries</h2>
            {trending.length === 0 ? (
              <p className="text-cosmic-500 text-sm">No query data yet.</p>
            ) : (
              <div className="space-y-3">
                {trending.map((q, i) => (
                  <div key={q.query} className="cosmic-card p-4 flex items-center gap-4">
                    <span className="text-gold font-mono text-lg w-8 text-center">{i + 1}</span>
                    <span className="flex-1 text-foreground text-sm font-devanagari">{q.query}</span>
                    <span className="text-cosmic-500 text-xs">{q.count}x</span>
                    <a href={`/chat?q=${encodeURIComponent(q.query)}`} target="_blank" rel="noopener noreferrer"
                       className="text-gold/50 hover:text-gold transition-colors">
                      <Eye size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

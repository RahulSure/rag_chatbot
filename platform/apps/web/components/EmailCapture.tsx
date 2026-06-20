"use client";

import { useState } from "react";
import { Bell, Loader2, CheckCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(`${API}/subscribe/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "homepage" }),
      });
      const data = await res.json();
      setStatus("success");
      setMessage(data.message || "You're on the list! 🙏");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="py-16 px-6">
      <div className="max-w-2xl mx-auto cosmic-card p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent rounded-2xl" />
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-5">
            <Bell size={22} className="text-gold" />
          </div>
          <h2 className="font-serif text-2xl text-foreground mb-2">
            Stay Connected with Sadgurudev's Wisdom
          </h2>
          <p className="text-cosmic-400 text-sm mb-6 max-w-md mx-auto">
            Join the Sadhak.ai community — daily teachings, new articles in Hindi &amp; English,
            and early access to WhatsApp wisdom. No spam, only light.
          </p>

          {status === "success" ? (
            <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
              <CheckCircle size={18} />
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-sm mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-2.5 rounded-xl bg-cosmic-900/60 border border-gold/20
                           text-foreground placeholder-cosmic-500 focus:outline-none focus:border-gold/50
                           transition-all text-sm"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-gold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : null}
                Notify Me
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="text-red-400 text-xs mt-3">{message}</p>
          )}
        </div>
      </div>
    </section>
  );
}

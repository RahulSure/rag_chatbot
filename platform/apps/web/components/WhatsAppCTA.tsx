"use client";

import { MessageCircle, Bell } from "lucide-react";

export function WhatsAppCTA() {
  return (
    <>
      {/* Section CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto cosmic-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-green-900/10 rounded-2xl" />
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-6">
              <MessageCircle size={32} className="text-green-400" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Coming Soon
            </div>
            <h2 className="font-serif text-3xl text-foreground mb-4">
              Sadgurudev's Wisdom — Now on WhatsApp
            </h2>
            <p className="text-cosmic-300 mb-8 max-w-lg mx-auto">
              We're building a WhatsApp bot that lets you ask questions from Sadgurudev's
              teachings directly in your chat. No app download needed — just send a message
              and receive divine wisdom instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border border-green-500/30 bg-green-500/5 text-green-400 text-base font-medium cursor-default">
                <MessageCircle size={20} />
                WhatsApp Bot — Stay Tuned 🔜
              </div>
            </div>
            <p className="text-cosmic-600 text-xs mt-6">
              🙏 We'll announce the launch in our community. Subscribe below to be the first to know.
            </p>
          </div>
        </div>
      </section>

      {/* Floating coming soon badge */}
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full
                   bg-green-900/80 border border-green-600/40 backdrop-blur-md shadow-lg
                   text-green-400 text-xs font-medium"
      >
        <MessageCircle size={16} />
        <span>WhatsApp — Coming Soon</span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>
    </>
  );
}

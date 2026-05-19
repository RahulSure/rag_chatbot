"use client";

import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export function WhatsAppCTA() {
  const handleClick = () => {
    const msg = encodeURIComponent(
      "Namaste! I'd like to learn more about Sadgurudev Dr. Narayan Dutt Shrimali's teachings."
    );
    const url = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
  };

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
            <h2 className="font-serif text-3xl text-foreground mb-4">
              Continue the Journey on WhatsApp
            </h2>
            <p className="text-cosmic-300 mb-8 max-w-lg mx-auto">
              Get personalized guidance on sadhana, receive daily wisdom, and connect with 
              a community of seekers on WhatsApp.
            </p>
            <button onClick={handleClick} className="btn-gold inline-flex items-center gap-3 text-base px-8 py-4 rounded-xl">
              <MessageCircle size={20} />
              Continue on WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* Floating button */}
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-600 shadow-lg 
                   flex items-center justify-center text-white hover:bg-green-500 
                   transition-all hover:scale-110 hover:shadow-xl"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle size={24} />
      </button>
    </>
  );
}

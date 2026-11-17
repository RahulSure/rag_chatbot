"use client";

/** A one-shot burst of marigold petals, for the moment a diya is blessed. */

import { motion } from "framer-motion";

const COLORS = ["#f0a020", "#e2563a", "#ffd27a", "#e8891f"];

export function Petals({ count = 14 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 2 * Math.PI + (i % 3) * 0.3;
        const dist = 60 + ((i * 37) % 50);
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-2.5 w-1.5 rounded-full"
            style={{ background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist * 0.7 + 40,
              opacity: 0,
              rotate: 160 + i * 40,
              scale: 0.6,
            }}
            transition={{ duration: 1.3, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

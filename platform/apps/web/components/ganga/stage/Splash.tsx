"use client";

/** Water taking a diya: rings widening from the point of landing, droplets thrown up and falling back. */

import { motion } from "framer-motion";

export function Splash({ left, top }: { left: string; top: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute" style={{ left, top }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={`r${i}`} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#ffe2ae]"
                     style={{ width: 20, height: 7 }}
                     initial={{ scale: 0.4, opacity: 0.7 }}
                     animate={{ scale: 3.2 + i * 1.6, opacity: 0 }}
                     transition={{ duration: 1.1 + i * 0.25, delay: i * 0.12, ease: "easeOut" }} />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI - Math.PI; // upward fan
        const vx = Math.cos(a) * (26 + ((i * 13) % 22));
        const vy = -Math.abs(Math.sin(a)) * (30 + ((i * 17) % 26));
        return (
          <motion.span key={`d${i}`} className="absolute h-1 w-1 rounded-full bg-[#ffe2ae]"
                       initial={{ x: 0, y: 0, opacity: 0.9 }}
                       animate={{ x: [0, vx, vx * 1.25], y: [0, vy, 16], opacity: [0.9, 0.9, 0] }}
                       transition={{ duration: 0.65, times: [0, 0.55, 1], ease: "easeOut", delay: 0.02 * i }} />
        );
      })}
    </div>
  );
}

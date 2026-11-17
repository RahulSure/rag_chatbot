"use client";

/**
 * A written chit, rolled: it appears as a paper scroll along the bottom edge of
 * the sheet that just folded up into it, then shrinks and arcs through the air
 * into the dona waiting for it, where it settles among the flowers.
 * Coordinates are relative to the stage; the parent unmounts it on `onDone`.
 */

import { motion } from "framer-motion";

export interface RollPath {
  /** the sheet's bottom edge: left x, centre y, width */
  from: { x: number; y: number; w: number };
  /** the dona's centre */
  to: { x: number; y: number };
}

const TUCKED = 30; // px length of the scroll once it sits in the dona

export function ChitRoll({ from, to, onDone }: RollPath & { onDone: () => void }) {
  const dx = to.x - (from.x + from.w / 2);
  const dy = to.y - from.y;
  const end = TUCKED / from.w;
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute z-40"
      style={{ left: from.x, top: from.y - 12, width: from.w, height: 24 }}
      initial={{ opacity: 0, scaleY: 0.3, scaleX: 1, x: 0, y: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        scaleY: [0.3, 1, 1, 0.75, 0.6],
        scaleX: [1, 1, 0.92, end * 1.6, end],
        x: [0, 0, 0, dx * 0.55, dx],
        y: [0, 0, -6, Math.min(dy * 0.35, dy) - 70, dy],
        rotate: [0, 0, 0, -14, -32],
      }}
      transition={{ duration: 1.45, times: [0, 0.16, 0.3, 0.72, 1], ease: "easeInOut" }}
      onAnimationComplete={onDone}
    >
      {/* the paper, wound into a cylinder: lit on top, shaded underneath */}
      <div className="h-full w-full rounded-full"
           style={{ background: "linear-gradient(to bottom, #fffaf0, #f2e3c2 30%, #dcc496 62%, #b49668 88%, #8f7550)",
                    boxShadow: "0 6px 14px rgb(0 0 0 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.7)" }} />
      {/* the spiral at each end */}
      <span className="absolute inset-y-[3px] left-0 w-[10px] rounded-full" style={{ background: "radial-gradient(circle at 60% 50%, #b49668 30%, #fbf3df 31%, #fbf3df 45%, #c8ad7c 46%)" }} />
      <span className="absolute inset-y-[3px] right-0 w-[10px] rounded-full" style={{ background: "radial-gradient(circle at 40% 50%, #b49668 30%, #fbf3df 31%, #fbf3df 45%, #c8ad7c 46%)" }} />
      {/* kalava, tied round the middle */}
      <span className="absolute inset-y-[-2px] left-1/2 w-[12px] -translate-x-1/2 rounded-sm"
            style={{ background: "repeating-linear-gradient(60deg, #b3261e 0 3px, #e8b13a 3px 5px, #9a1f18 5px 8px)" }} />
    </motion.div>
  );
}

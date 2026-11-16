/**
 * A diya sitting ON the water, not floating over it: warm light pooling on the
 * surface beneath it (screen-blended into the backdrop), a mirrored reflection
 * that breathes with the ripples, and — when named — a quiet serif caption
 * written on the night rather than a UI pill.
 */

import { DiyaSprite } from "./DiyaSprite";

export function LampOnWater({ size = 66, seed = 0, caption, dim = 1 }: {
  size?: number;
  seed?: number;
  caption?: React.ReactNode;
  /** 1 = near; smaller values haze the lamp into the distance. */
  dim?: number;
}) {
  return (
    <span className="relative block" style={dim < 1 ? { filter: `brightness(${0.75 + dim * 0.25}) saturate(${0.8 + dim * 0.2})`, opacity: 0.82 + dim * 0.18 } : undefined}>
      {/* lamplight pooling on the water */}
      <span aria-hidden="true" className="ganga-lampglow pointer-events-none absolute left-1/2 top-[52%] -translate-x-1/2 mix-blend-screen"
            style={{ width: size * 2.1, height: size * 0.9, borderRadius: "50%", filter: "blur(7px)",
                     background: "radial-gradient(ellipse at center, rgb(255 190 100 / 0.5), rgb(255 150 60 / 0.14) 55%, transparent 75%)",
                     animationDelay: `${-(seed % 5) * 0.6}s` }} />
      <DiyaSprite size={size} seed={seed} />
      {/* the mirrored reflection, breathing with the ripples */}
      <span aria-hidden="true" className="pointer-events-none absolute left-0 top-[68%] block w-full"
            style={{ transform: "scaleY(-1)", transformOrigin: "top center", opacity: 0.32, filter: "blur(1.6px)",
                     maskImage: "linear-gradient(to bottom, rgb(0 0 0 / 0.9), transparent 80%)",
                     WebkitMaskImage: "linear-gradient(to bottom, rgb(0 0 0 / 0.9), transparent 80%)" }}>
        <span className="ganga-reflect block" style={{ animationDelay: `${-(seed % 4) * 0.8}s` }}>
          <DiyaSprite size={size} seed={seed} />
        </span>
      </span>
      {caption !== undefined && (
        <span className="ganga-caption pointer-events-none absolute left-1/2 top-[108%] -translate-x-1/2 whitespace-nowrap text-[13px]">
          {caption}
        </span>
      )}
    </span>
  );
}

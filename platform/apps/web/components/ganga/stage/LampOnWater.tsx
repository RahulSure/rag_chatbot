/**
 * A dona sitting ON the water, not hovering over it: warm light pooling on the
 * surface around it (screen-blended into the backdrop), and a reflection
 * mirrored about the real waterline, so it hangs below the bowl in the river
 * and breathes with the ripples. A named dona gets a quiet serif caption written
 * on the night, not a UI pill.
 */

import { DiyaSprite } from "./DiyaSprite";

// Where the water meets the bowl, as a fraction of the sprite's height (viewBox y = 9 of -32..16).
const WATERLINE = 0.854;

export function LampOnWater({ size = 112, seed = 0, caption, dim = 1, chit = true }: {
  size?: number;
  seed?: number;
  caption?: React.ReactNode;
  /** 1 = near; smaller values haze the dona into the distance. */
  dim?: number;
  chit?: boolean;
}) {
  const origin = `center ${WATERLINE * 100}%`;
  // In the sprite's own coordinates: strongest at the waterline, fading toward the flame,
  // nothing below the waterline (that part would flip up over the bowl).
  const mask = `linear-gradient(to bottom, transparent 0%, rgb(0 0 0 / 0.25) 45%, rgb(0 0 0 / 0.95) ${WATERLINE * 100 - 2}%, transparent ${WATERLINE * 100 + 0.5}%)`;
  return (
    <span className="relative block" style={dim < 1 ? { filter: `brightness(${0.75 + dim * 0.25}) saturate(${0.8 + dim * 0.2})`, opacity: 0.82 + dim * 0.18 } : undefined}>
      {/* lamplight pooling on the water */}
      <span aria-hidden="true" className="ganga-lampglow pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
            style={{ top: `${WATERLINE * 100}%`, width: size * 1.9, height: size * 0.62, borderRadius: "50%", filter: "blur(8px)",
                     background: "radial-gradient(ellipse at center, rgb(255 190 100 / 0.45), rgb(255 150 60 / 0.12) 55%, transparent 75%)",
                     animationDelay: `${-(seed % 5) * 0.6}s` }} />
      {/* the reflection: the same dona flipped about the waterline, softened by the water */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 block"
            style={{ transform: "scaleY(-1)", transformOrigin: origin, opacity: 0.34, filter: "blur(1.4px)",
                     maskImage: mask, WebkitMaskImage: mask }}>
        <span className="ganga-reflect block" style={{ transformOrigin: origin, animationDelay: `${-(seed % 4) * 0.8}s` }}>
          <DiyaSprite size={size} seed={seed} chit={chit} />
        </span>
      </span>
      <span className="relative block">
        <DiyaSprite size={size} seed={seed} chit={chit} />
      </span>
      {caption !== undefined && (
        <span className="ganga-caption pointer-events-none absolute left-1/2 top-[112%] -translate-x-1/2 whitespace-nowrap text-[13px]">
          {caption}
        </span>
      )}
    </span>
  );
}

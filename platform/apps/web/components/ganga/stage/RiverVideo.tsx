"use client";

/**
 * The night river, alive. The loop file is cut so its last frame flows into its
 * first; playback is double-buffered anyway: two <video> layers take turns, and
 * a moment before one ends the other starts from the top and dissolves in over
 * it. The browser never seeks a playing video, so there is no stall, no black
 * frame and no glimpse of the still. The still underneath is the loop's own
 * first frame, so even before playback starts nothing jumps. Reduced motion
 * shows only that still.
 */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const XFADE = 0.45; // seconds the incoming layer takes to dissolve in

export function usePhoto(src: string) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.src = src;
  }, [src]);
  return ok;
}

/** Any seamless loop, double-buffered so it never blinks: the river, the home page's cosmos. */
export function LoopVideo({ src, poster: posterSrc, className = "", fit = "object-[62%_center] sm:object-center" }: {
  src: string; poster: string; className?: string; fit?: string;
}) {
  const still = useReducedMotion() ?? false;
  const poster = usePhoto(posterSrc);
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const [front, setFront] = useState<0 | 1>(0);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // The layers only mount once the still has loaded, so re-arm when it does.
    if (still || failed || !poster) return;
    const vids = [a.current, b.current];
    if (!vids[0] || !vids[1]) return;
    let cur = 0;
    let swapping = false;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    vids[0].play().then(() => setStarted(true)).catch(() => undefined);

    const swap = () => {
      if (swapping) return;
      swapping = true;
      const out = vids[cur]!;
      const next = vids[1 - cur]!;
      next.currentTime = 0;
      next.play().then(() => {
        cur = 1 - cur;
        setFront(cur as 0 | 1);
        // the outgoing layer stays visible underneath until the dissolve is done
        timer = setTimeout(() => {
          out.pause();
          out.currentTime = 0;
          swapping = false;
        }, XFADE * 1000 + 80);
      }).catch(() => { swapping = false; });
    };

    const tick = () => {
      const v = vids[cur]!;
      if (v.duration && v.currentTime >= v.duration - XFADE - 0.05) swap();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // A backgrounded tab freezes rAF; if a layer ran out meanwhile, hand over on its end.
    const onEnded = () => swap();
    vids.forEach((v) => v!.addEventListener("ended", onEnded));
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      vids.forEach((v) => v?.removeEventListener("ended", onEnded));
    };
  }, [still, failed, poster]);

  if (!poster) return null;
  return (
    // `isolate`: the layers' z-order stays inside this box, never over the stage above it
    <div className={`absolute inset-0 isolate ${className}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={posterSrc} alt="" className={`absolute inset-0 h-full w-full object-cover ${fit}`} />
      {!still && !failed && [a, b].map((ref, i) => (
        <video
          key={i}
          ref={ref}
          src={src}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover ${fit}`}
          style={{
            zIndex: front === i ? 2 : 1,
            opacity: started && front === i ? 1 : 0,
            // incoming layer dissolves in; outgoing one hides only once it is covered
            transition: front === i ? `opacity ${started ? XFADE : 1}s linear` : `opacity 0s linear ${XFADE}s`,
          }}
        />
      ))}
    </div>
  );
}

/** The night river at the ghat. */
export function RiverVideo({ className = "" }: { className?: string }) {
  return <LoopVideo src="/ganga/bg-night.mp4" poster="/ganga/bg-night-poster.webp" className={className} />;
}

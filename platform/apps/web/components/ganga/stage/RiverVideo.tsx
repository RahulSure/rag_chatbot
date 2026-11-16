"use client";

/**
 * The night river, alive: the generated loop (water flowing, flames flickering,
 * mist drifting) fades in over its own still once it can play. Without the video
 * file — or under reduced motion — the still breathes alone with its slow camera.
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function usePhoto(src: string) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.src = src;
  }, [src]);
  return ok;
}

export function RiverVideo({ className = "" }: { className?: string }) {
  const still = useReducedMotion() ?? false;
  const photo = usePhoto("/ganga/bg-night.webp");
  const [playing, setPlaying] = useState(false);
  if (!photo) return null;
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ganga/bg-night.webp" alt=""
           className={`absolute inset-0 h-full w-full object-cover object-[62%_center] sm:object-center ${still || playing ? "" : "ganga-kenburns"}`} />
      {!still && (
        <video src="/ganga/bg-night.mp4" autoPlay muted loop playsInline preload="auto"
               onPlaying={() => setPlaying(true)}
               onError={(e) => e.currentTarget.remove()}
               className={`absolute inset-0 h-full w-full object-cover object-[62%_center] transition-opacity duration-1000 sm:object-center ${playing ? "opacity-100" : "opacity-0"}`} />
      )}
    </div>
  );
}

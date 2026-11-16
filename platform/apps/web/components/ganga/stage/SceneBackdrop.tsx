"use client";

/**
 * Everything behind the river's interface: the painted scene, and — when the
 * generated photographs exist in /public/ganga — the cinematic night and dawn
 * backdrops over it, finished with a scrim and vignette so lamps, type and
 * buttons stay readable. The painting remains the fallback if a file is absent.
 */

import { useMotionValue, type MotionValue } from "framer-motion";
import { OverFX } from "./OverFX";
import { RiverVideo, usePhoto } from "./RiverVideo";
import { StageArt } from "./StageArt";

export function SceneBackdrop({ mx, my, still, narrow = false }: {
  mx?: MotionValue<number>; my?: MotionValue<number>; still: boolean; narrow?: boolean;
}) {
  const zero = useMotionValue(0);
  const dawn = usePhoto("/ganga/bg-dawn.webp");
  return (
    <>
      <StageArt mx={mx ?? zero} my={my ?? zero} still={still} narrow={narrow} />
      {/* the living night river; by day, the dawn still */}
      <div className="absolute inset-0 hidden dark:block"><RiverVideo /></div>
      {dawn && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/ganga/bg-dawn.webp" alt="" aria-hidden="true"
             className="ganga-kenburns absolute inset-0 block h-full w-full object-cover object-[62%_center] sm:object-center dark:hidden" />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
           style={{ background: "radial-gradient(ellipse 130% 95% at 50% 40%, transparent 52%, rgb(var(--water-bottom) / 0.5) 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/35 to-transparent" />
      <OverFX />
    </>
  );
}

"use client";

/**
 * Everything behind the river's interface: the painted scene, and — when the
 * generated photographs exist in /public/ganga — the cinematic night and dawn
 * backdrops over it, finished with a scrim and vignette so lamps, type and
 * buttons stay readable. The painting remains the fallback if a file is absent.
 */

import { useEffect, useState } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import { StageArt } from "./StageArt";

/** Render a backdrop photograph only once it has truly loaded; a missing file shows nothing. */
function usePhoto(src: string) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.src = src;
  }, [src]);
  return ok;
}

export function SceneBackdrop({ mx, my, still, narrow = false }: {
  mx?: MotionValue<number>; my?: MotionValue<number>; still: boolean; narrow?: boolean;
}) {
  const zero = useMotionValue(0);
  const night = usePhoto("/ganga/bg-night.webp");
  const dawn = usePhoto("/ganga/bg-dawn.webp");
  return (
    <>
      <StageArt mx={mx ?? zero} my={my ?? zero} still={still} narrow={narrow} />
      {night && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/ganga/bg-night.webp" alt="" aria-hidden="true"
             className="absolute inset-0 hidden h-full w-full object-cover object-[62%_center] sm:object-center dark:block" />
      )}
      {dawn && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/ganga/bg-dawn.webp" alt="" aria-hidden="true"
             className="absolute inset-0 block h-full w-full object-cover object-[62%_center] sm:object-center dark:hidden" />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
           style={{ background: "radial-gradient(ellipse 130% 95% at 50% 40%, transparent 52%, rgb(var(--water-bottom) / 0.5) 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/35 to-transparent" />
    </>
  );
}

"use client";

/**
 * Everything behind the river's interface: the painted scene, and over it the
 * living river for the current theme (night under the moon, or first light),
 * finished with a scrim and vignette so lamps, type and buttons stay readable.
 * The painting remains the fallback if a file is absent.
 */

import { useMotionValue, type MotionValue } from "framer-motion";
import { OverFX } from "./OverFX";
import { DawnRiverVideo, RiverVideo, useIsDark } from "./RiverVideo";
import { StageArt } from "./StageArt";

export function SceneBackdrop({ mx, my, still, narrow = false }: {
  mx?: MotionValue<number>; my?: MotionValue<number>; still: boolean; narrow?: boolean;
}) {
  const zero = useMotionValue(0);
  const dark = useIsDark();
  return (
    <>
      <StageArt mx={mx ?? zero} my={my ?? zero} still={still} narrow={narrow} />
      {/* the living river: by night under the moon, by day at first light — only the one in view loads */}
      {dark === true && <RiverVideo />}
      {dark === false && <DawnRiverVideo />}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
           style={{ background: "radial-gradient(ellipse 130% 95% at 50% 40%, transparent 52%, rgb(var(--water-bottom) / 0.5) 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/35 to-transparent" />
      <OverFX />
    </>
  );
}

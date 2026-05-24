"use client";

import { useEffect, useRef } from "react";

/**
 * Magical sparkling galaxy.
 * Stars drift slowly outward from a galactic core with:
 *  - additive blending (overlapping starlight adds up, like real photons)
 *  - bright white cores wrapped in tinted bloom (proper star look, not bubbles)
 *  - 4-point diffraction spikes on the brightest stars (sparkle effect)
 *  - per-star twinkle + a breathing galactic core glow
 */

type Star = {
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
  hue: "gold" | "pearl" | "violet" | "rose" | "azure";
  phase: number;     // twinkle offset
  sizeMul: number;   // per-star size jitter
  sparkle: boolean;  // diffraction spikes on bright frames
};

const STAR_COUNT = 520;
const Z_FAR = 2200;
const SPEED = 0.5;            // slow, meditative drift
const FOCAL = 320;
const FADE_ALPHA = 0.18;      // lower = trails linger longer

const HUE_RGB: Record<Star["hue"], [number, number, number]> = {
  gold:   [255, 215, 135],
  pearl:  [248, 240, 220],
  violet: [200, 165, 250],
  rose:   [255, 185, 220],
  azure:  [170, 215, 255],
};

function pickHue(): Star["hue"] {
  const r = Math.random();
  if (r < 0.50) return "gold";
  if (r < 0.78) return "pearl";
  if (r < 0.90) return "violet";
  if (r < 0.97) return "rose";
  return "azure";
}

function spawnStar(width: number, height: number, z?: number): Star {
  const spread = Math.max(width, height);
  return {
    x: (Math.random() - 0.5) * spread * 2,
    y: (Math.random() - 0.5) * spread * 2,
    z: z ?? Math.random() * Z_FAR,
    px: 0,
    py: 0,
    hue: pickHue(),
    phase: Math.random() * Math.PI * 2,
    sizeMul: 0.7 + Math.random() * 1.0,
    sparkle: Math.random() < 0.18, // ~18% of stars get diffraction spikes when bright
  };
}

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let cx = width / 2;
    let cy = height / 2;
    let stars: Star[] = [];
    let rafId = 0;
    let running = true;

    const project = (s: Star) => ({
      sx: (s.x / s.z) * FOCAL + cx,
      sy: (s.y / s.z) * FOCAL + cy,
    });

    const seed = () => {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        const star = spawnStar(width, height);
        const { sx, sy } = project(star);
        star.px = sx;
        star.py = sy;
        stars.push(star);
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      cx = width / 2;
      cy = height / 2;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      seed();
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) loop();
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reduceMotion ? 0.15 : SPEED;

    const loop = () => {
      if (!running) return;

      const now = performance.now();

      // ---- Pass 1: trailing fade (source-over so it actually darkens) ----
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(10, 10, 15, ${FADE_ALPHA})`;
      ctx.fillRect(0, 0, width, height);

      // ---- Pass 2: nebula + galactic core (source-over) ----
      const breathe = 0.85 + Math.sin(now * 0.0004) * 0.15;
      const farGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.6);
      farGrad.addColorStop(0, `rgba(201, 168, 76, ${0.10 * breathe})`);
      farGrad.addColorStop(0.35, `rgba(130, 70, 180, ${0.06 * breathe})`);
      farGrad.addColorStop(1, "rgba(10, 10, 15, 0)");
      ctx.fillStyle = farGrad;
      ctx.fillRect(0, 0, width, height);

      // Brighter galactic core glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
      coreGrad.addColorStop(0, `rgba(255, 220, 140, ${0.22 * breathe})`);
      coreGrad.addColorStop(0.5, `rgba(225, 175, 215, ${0.08 * breathe})`);
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, width, height);

      // ---- Pass 3: stars (additive blending — overlapping starlight adds up) ----
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        s.z -= speed;
        if (s.z <= 1) {
          const fresh = spawnStar(width, height, Z_FAR);
          stars[i] = fresh;
          const { sx, sy } = project(fresh);
          fresh.px = sx;
          fresh.py = sy;
          continue;
        }

        const { sx, sy } = project(s);

        if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) {
          s.px = sx;
          s.py = sy;
          continue;
        }

        const depth = 1 - s.z / Z_FAR;
        const twinkle = 0.55 + Math.sin(now * 0.0017 + s.phase) * 0.45;
        const baseAlpha = 0.12 + depth * 0.85;
        const alpha = baseAlpha * twinkle;
        const size = (0.35 + depth * 1.9) * s.sizeMul;
        const [r, g, b] = HUE_RGB[s.hue];

        // Soft outer bloom — small, tinted (no more bubble blob)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.22})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size * 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Mid bloom
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.55})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Bright white core (gives the proper star feel — like a hot pinprick)
        ctx.fillStyle = `rgba(255, 250, 230, ${Math.min(1, alpha * 1.1)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.4, size * 0.55), 0, Math.PI * 2);
        ctx.fill();

        // Drift streak — short and subtle (only if the star actually moved)
        const dx = sx - s.px;
        const dy = sy - s.py;
        if (dx * dx + dy * dy > 0.4) {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.45})`;
          ctx.lineWidth = Math.max(0.4, size * 0.55);
          ctx.beginPath();
          ctx.moveTo(s.px, s.py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }

        // Diffraction spikes — only on bright sparkly stars, intensity follows twinkle
        if (s.sparkle && depth > 0.45 && twinkle > 0.65) {
          const intensity = (twinkle - 0.55) / 0.45; // 0..1 within twinkle peak
          const spikeLen = size * (5 + intensity * 7);
          const spikeAlpha = alpha * intensity * 0.85;

          // Horizontal + vertical (classic 4-point sparkle)
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${spikeAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(sx - spikeLen, sy);
          ctx.lineTo(sx + spikeLen, sy);
          ctx.moveTo(sx, sy - spikeLen);
          ctx.lineTo(sx, sy + spikeLen);
          ctx.stroke();

          // Faint diagonal spikes for the brightest stars (8-point sparkle)
          if (depth > 0.7) {
            const diag = spikeLen * 0.55;
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${spikeAlpha * 0.45})`;
            ctx.beginPath();
            ctx.moveTo(sx - diag, sy - diag);
            ctx.lineTo(sx + diag, sy + diag);
            ctx.moveTo(sx - diag, sy + diag);
            ctx.lineTo(sx + diag, sy - diag);
            ctx.stroke();
          }
        }

        s.px = sx;
        s.py = sy;
      }

      // Reset for the next frame's fade pass
      ctx.globalCompositeOperation = "source-over";

      rafId = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    loop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

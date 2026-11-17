"use client";

/**
 * The sound of the ghat, synthesized in the browser: water as filtered brown noise,
 * a soft temple bell now and then. No audio files; starts only on the visitor's tap.
 */

let ctx: AudioContext | null = null;
let stopFns: (() => void)[] = [];

function bell(at: number) {
  if (!ctx) return;
  for (const [freq, gain] of [[432, 0.1], [864, 0.035], [1296, 0.015]] as const) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + 4);
    osc.connect(amp).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 4.1);
  }
}

export function startAmbience() {
  if (ctx) return;
  try {
    ctx = new AudioContext();
  } catch {
    return; // no audio here; the river stays silent
  }

  // Water: four seconds of brown noise, looped through a low-pass filter.
  const seconds = 4;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  const water = ctx.createGain();
  water.gain.value = 0;
  water.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2); // the river fades in
  noise.connect(filter).connect(water).connect(ctx.destination);
  noise.start();
  stopFns.push(() => noise.stop());

  // A bell from a far temple, at easy intervals.
  let timer: ReturnType<typeof setTimeout>;
  const ringLater = () => {
    timer = setTimeout(() => {
      if (ctx) bell(ctx.currentTime);
      ringLater();
    }, 14000 + Math.random() * 22000);
  };
  bell(ctx.currentTime + 1.2);
  ringLater();
  stopFns.push(() => clearTimeout(timer));
}

/** Tiny game sounds; silent unless the river's sound is on. */
export function sfx(kind: "lift" | "plip" | "chime") {
  if (!ctx) return;
  const now = ctx.currentTime;
  if (kind === "chime") {
    bell(now);
    return;
  }
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  if (kind === "lift") {
    // water letting go: a soft upward sweep
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.16);
    amp.gain.setValueAtTime(0.05, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  } else {
    // plip: a drop striking the surface
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.1);
    amp.gain.setValueAtTime(0.08, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  }
  osc.connect(amp).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

export function stopAmbience() {
  for (const fn of stopFns) {
    try { fn(); } catch { /* already stopped */ }
  }
  stopFns = [];
  ctx?.close().catch(() => undefined);
  ctx = null;
}

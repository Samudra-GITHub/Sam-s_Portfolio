import { useSyncExternalStore } from 'react';

/**
 * Optional UI sound, off by default. Everything is synthesised with Web Audio
 * (no files): a soft tick on hover, a thunk on press, a whoosh on page change.
 * The AudioContext is only created from the toggle click, which is the user
 * gesture browsers require.
 */
const KEY = 'sk-sound';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = false;
const listeners = new Set<() => void>();

try {
  enabled = typeof window !== 'undefined' && window.localStorage.getItem(KEY) === '1';
} catch {
  enabled = false;
}
// A saved "on" cannot make sound until the first gesture creates the context.
let armed = false;

const emit = () => listeners.forEach((l) => l());

function ensure() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  const len = ctx.sampleRate * 0.6;
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

export function setSound(on: boolean) {
  enabled = on;
  try {
    window.localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* storage blocked */
  }
  if (on) {
    const c = ensure();
    void c?.resume();
    armed = true;
    tone(660, 0.07, 'triangle', 0.08);
  }
  emit();
}

export const isSoundOn = () => enabled;

export function useSoundOn(): boolean {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => enabled,
    () => false,
  );
}

function tone(freq: number, dur: number, type: OscillatorType, peak: number, slideTo?: number) {
  if (!enabled || !ctx || !master || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

let lastTick = 0;
/** hover: a quiet, slightly randomised tick, rate-limited */
export function tick() {
  const now = performance.now();
  if (now - lastTick < 55) return;
  lastTick = now;
  tone(520 + Math.random() * 180, 0.06, 'triangle', 0.05);
}

/** press */
export function thunk() {
  tone(180, 0.14, 'sine', 0.16, 70);
}

/** page change / door opening */
export function whoosh() {
  if (!enabled || !ctx || !master || !noise || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 1.2;
  band.frequency.setValueAtTime(220, t);
  band.frequency.exponentialRampToValueAtTime(2600, t + 0.5);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  src.connect(band).connect(g).connect(master);
  src.start(t);
  src.stop(t + 0.6);
}

/** After a reload with sound saved as "on", wake the context on the first gesture. */
if (typeof window !== 'undefined' && enabled) {
  const wake = () => {
    if (!armed) {
      ensure();
      void ctx?.resume();
      armed = true;
    }
    window.removeEventListener('pointerdown', wake);
    window.removeEventListener('keydown', wake);
  };
  window.addEventListener('pointerdown', wake, { once: false });
  window.addEventListener('keydown', wake, { once: false });
}

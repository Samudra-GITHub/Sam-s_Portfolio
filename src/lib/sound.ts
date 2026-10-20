import { useSyncExternalStore } from 'react';

/**
 * The sound system. Off by default, every visit; nothing ever plays until the
 * visitor presses the sound control (the gesture browsers require).
 *
 * Everything is synthesised with Web Audio, so there are no files to load or
 * license:
 *
 *  ambient   a slow, warm pad: four-voice chords (detuned triangles through a
 *            soft low-pass that breathes), long crossfades between them, a
 *            generated room reverb, a faint band of air and, now and then, one
 *            glass note. It never loops: each chord is scheduled as the last
 *            one fades, so there is no seam to hear.
 *  ui        a small, related family: a glass dyad when you navigate, a soft
 *            tactile click when you press a button, glass tones for the hero
 *            drop, a two-note confirmation for the toggle.
 *
 * Graph: voices -> music / ui buses -> master -> limiter -> speakers. The music
 * fades in over ~3s and out over ~0.6s; hidden tabs fade to silence and suspend.
 * The state lives in this module, so it survives client-side route changes and
 * the soundtrack never restarts or doubles when you move between pages.
 */
const MUSIC_LEVEL = 0.3;
const UI_LEVEL = 0.55;

let ctx: AudioContext | null = null;
let master: GainNode;
let music: GainNode;
let ui: GainNode;
let wet: GainNode;
let noise: AudioBuffer;
let enabled = false;
let ambientTimer = 0;
let sparkleTimer = 0;
let chordIndex = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// ---------- the graph ----------
function build(): boolean {
  if (ctx) return true;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return false;
  try {
    ctx = new Ctor({ latencyHint: 'interactive' });
  } catch {
    return false;
  }
  const c = ctx;
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 8;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.2;
  limiter.connect(c.destination);
  master = c.createGain();
  master.gain.value = 1;
  master.connect(limiter);

  // a generated room: two decaying noise channels, slightly different, for width
  const len = Math.floor(c.sampleRate * 4.2);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  const verb = c.createConvolver();
  verb.buffer = ir;
  wet = c.createGain();
  wet.gain.value = 0.55;
  wet.connect(verb).connect(master);

  music = c.createGain();
  music.gain.value = 0;
  music.connect(master);
  music.connect(wet);
  ui = c.createGain();
  ui.gain.value = UI_LEVEL;
  ui.connect(master);
  const uiWet = c.createGain();
  uiWet.gain.value = 0.25;
  ui.connect(uiWet).connect(wet);

  const nlen = c.sampleRate * 2;
  noise = c.createBuffer(1, nlen, c.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;

  document.addEventListener('visibilitychange', onVisibility);
  return true;
}

function ramp(param: AudioParam, to: number, seconds: number) {
  const t = ctx!.currentTime;
  param.cancelScheduledValues(t);
  param.setValueAtTime(param.value, t);
  param.linearRampToValueAtTime(to, t + seconds);
}

// ---------- the ambient pad ----------
// D major colour, all open and unresolved: Dmaj9, Bm11, Gmaj7(#11), Aadd9/E. MIDI notes.
const CHORDS = [
  [50, 57, 64, 66, 69],
  [47, 54, 61, 64, 69],
  [43, 50, 57, 61, 66],
  [45, 52, 59, 64, 71],
];
const HOLD = 13; // seconds each chord sounds before the next arrives
const FADE = 6; // the crossfade, both ways
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function chord() {
  if (!ctx || !enabled) return;
  const c = ctx;
  const t = c.currentTime + 0.05;
  const notes = CHORDS[chordIndex % CHORDS.length];
  chordIndex++;
  const end = t + FADE + HOLD + FADE;

  // one breathing low-pass for the whole chord
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.4;
  lp.frequency.value = 700;
  const lfo = c.createOscillator();
  const lfoAmt = c.createGain();
  lfo.frequency.value = 0.045 + Math.random() * 0.03;
  lfoAmt.gain.value = 380;
  lfo.connect(lfoAmt).connect(lp.frequency);
  lfo.start(t);
  lfo.stop(end);

  const env = c.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(1, t + FADE);
  env.gain.setValueAtTime(1, t + FADE + HOLD);
  env.gain.linearRampToValueAtTime(0, end);
  lp.connect(env).connect(music);

  notes.forEach((m, i) => {
    const pan = c.createStereoPanner ? c.createStereoPanner() : null;
    if (pan) pan.pan.value = (i / (notes.length - 1) - 0.5) * 0.7;
    const g = c.createGain();
    // the bass voice is the quietest: no weight, only warmth
    g.gain.value = (i === 0 ? 0.05 : 0.075) / notes.length;
    for (const detune of [-6, 6]) {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = hz(m);
      o.detune.value = detune + (Math.random() - 0.5) * 3;
      o.connect(g);
      o.start(t);
      o.stop(end + 0.1);
    }
    if (pan) g.connect(pan).connect(lp);
    else g.connect(lp);
  });

  ambientTimer = window.setTimeout(chord, (FADE + HOLD) * 1000);
}

// a faint band of air under everything, so silence between chords still has a room in it
let air: AudioBufferSourceNode | null = null;
function startAir() {
  if (!ctx || air) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2400;
  bp.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.value = 0.006;
  src.connect(bp).connect(g).connect(music);
  src.start();
  air = src;
}

// every so often, one glass note from the chord's scale, far back in the room
const SPARKLE = [74, 76, 78, 81, 83, 86, 88];
function sparkle() {
  if (!ctx || !enabled) return;
  const m = SPARKLE[Math.floor(Math.random() * SPARKLE.length)];
  bell(hz(m), 0.018, 3.5, music, (Math.random() - 0.5) * 0.8);
  sparkleTimer = window.setTimeout(sparkle, 7000 + Math.random() * 9000);
}

function startAmbient() {
  if (!ctx) return;
  ramp(music.gain, MUSIC_LEVEL, 3);
  if (!ambientTimer) chord();
  startAir();
  if (!sparkleTimer) sparkleTimer = window.setTimeout(sparkle, 4000);
}
function stopAmbient(seconds = 0.6) {
  window.clearTimeout(ambientTimer);
  window.clearTimeout(sparkleTimer);
  ambientTimer = 0;
  sparkleTimer = 0;
  if (!ctx) return;
  ramp(music.gain, 0, seconds);
  const a = air;
  air = null;
  if (a) a.stop(ctx.currentTime + seconds + 0.05);
}

function onVisibility() {
  if (!ctx || !enabled) return;
  if (document.hidden) {
    stopAmbient(0.4);
    window.setTimeout(() => document.hidden && void ctx?.suspend(), 500);
  } else {
    void ctx.resume().then(() => enabled && startAmbient());
  }
}

// ---------- the interface voices ----------
/** a glass tone: inharmonic partials with a fast attack and a long, soft tail */
function bell(freq: number, peak: number, decay: number, bus: GainNode = ui, pan = 0) {
  if (!ctx || !enabled || ctx.state !== 'running') return;
  const c = ctx;
  const t = c.currentTime;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  out.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  const p = c.createStereoPanner ? c.createStereoPanner() : null;
  if (p) {
    p.pan.value = pan;
    out.connect(p).connect(bus);
  } else out.connect(bus);
  [
    [1, 1],
    [2.76, 0.35],
    [5.4, 0.12],
  ].forEach(([ratio, amp]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq * ratio;
    g.gain.value = amp;
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + decay + 0.05);
  });
}

/** a tactile click: a few milliseconds of filtered noise and a tiny body */
function clickVoice(peak = 0.12, tone = 2600) {
  if (!ctx || !enabled || ctx.state !== 'running') return;
  const c = ctx;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise;
  const hp = c.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.value = tone;
  hp.Q.value = 1.4;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  src.connect(hp).connect(g).connect(ui);
  src.start(t, Math.random());
  src.stop(t + 0.05);
  const o = c.createOscillator();
  const og = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(320, t);
  o.frequency.exponentialRampToValueAtTime(180, t + 0.05);
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(peak * 0.5, t + 0.003);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o.connect(og).connect(ui);
  o.start(t);
  o.stop(t + 0.08);
}

// one voice at a time per kind, and no machine-gun repeats
const last: Record<string, number> = {};
const gate = (kind: string, ms: number) => {
  const now = performance.now();
  if (now - (last[kind] ?? 0) < ms) return false;
  last[kind] = now;
  return true;
};

/** a navigation link was taken: a soft glass dyad */
export function navTone() {
  if (!gate('nav', 120)) return;
  bell(hz(81), 0.05, 0.9, ui, -0.1);
  window.setTimeout(() => bell(hz(88), 0.035, 1.1, ui, 0.1), 70);
}
/** a button was pressed */
export function click() {
  if (gate('click', 45)) clickVoice();
}
/** a detent, a step, a small state change */
export function tick() {
  if (gate('tick', 60)) clickVoice(0.06, 3400);
}
/** the hero drop is picked up: a light glass tone, higher the higher it is */
export function glassLift(height01 = 0.5) {
  if (!gate('lift', 90)) return;
  const steps = [76, 78, 81, 83, 86];
  const m = steps[Math.max(0, Math.min(steps.length - 1, Math.round(height01 * (steps.length - 1))))];
  bell(hz(m), 0.05, 1.4);
}
/** the hero drop is let go: a lower, softer settle, fuller the faster it was thrown */
export function glassSettle(speed01 = 0) {
  if (!gate('settle', 120)) return;
  bell(hz(69), 0.025 + 0.035 * Math.min(1, speed01), 1.8);
}
/** the old names, kept so nothing that calls them breaks */
export const thunk = click;
export function whoosh() {
  /* page changes are voiced by navTone at the link itself */
}

// ---------- the switch ----------
export function setSound(on: boolean) {
  if (on === enabled) return;
  if (on) {
    if (!build() || !ctx) return; // no Web Audio: stay silent, the site works the same
    enabled = true;
    void ctx.resume().then(() => {
      if (!enabled) return;
      // the confirmation rises
      bell(hz(74), 0.045, 1.2, ui, -0.15);
      window.setTimeout(() => bell(hz(81), 0.04, 1.4, ui, 0.15), 90);
      startAmbient();
    });
  } else {
    // the confirmation falls, then everything goes quiet
    bell(hz(81), 0.04, 0.7, ui, 0.15);
    window.setTimeout(() => bell(hz(74), 0.03, 0.8, ui, -0.15), 80);
    stopAmbient(0.6);
    enabled = false;
    if (ctx) {
      const c = ctx;
      window.setTimeout(() => !enabled && void c.suspend(), 1400);
    }
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

// ---------- one listener for the whole site ----------
// Meaningful actions only: taking a link, pressing a button. Never hover.
let wired = false;
export function initSoundDelegation() {
  if (wired || typeof document === 'undefined') return;
  wired = true;
  document.addEventListener(
    'click',
    (e) => {
      if (!enabled) return;
      const el = e.target as HTMLElement | null;
      if (!el || el.closest('[data-sound="none"]')) return;
      if (el.closest('a[href]')) navTone();
      else if (el.closest('button, [role="tab"], summary, input[type="checkbox"]')) click();
    },
    true,
  );
}

/** for tests and diagnostics: what is the engine doing right now */
export function soundState() {
  return { enabled, context: ctx?.state ?? 'none', music: ctx ? Number(music.gain.value.toFixed(3)) : 0, ambient: Boolean(ambientTimer) };
}
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __sound?: typeof soundState }).__sound = soundState;

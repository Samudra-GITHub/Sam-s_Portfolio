import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { createTrack } from './progress';
import { pointer, STILL } from './input';
import { buildEnvironment, type Environment } from './veil/environment';
import { createPainter, setBrushwork, setMultisample } from './veil/paint';
import { FAR } from './veil/spec';
import { createPerfMonitor, perfEnabled } from './perf';
import { gsap } from '../../lib/gsap';
import { featured } from '../../data/projects';
import { follow } from '../../lib/motion';
import { matches, MQ } from '../../lib/runtime';

/**
 * The Veil Archipelago: the sculpted hero mountain over a cloud sea, with its
 * forest, rivers and falls, and far formations in the haze (built by
 * veil/environment.ts, see docs/HERO_ISLAND_PIPELINE.md). Each featured
 * project sits on one of the far formations. The camera moves between framed
 * shots as the page scrolls. Decorative only: everything here also exists as
 * HTML on the page.
 */

/* ----------------------------------------------------------------- camera */

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** The camera's stops, in page order: [anchor id, camera position, look target]. Hero at the origin, about 30 units across. */
const HOME_SHOTS: Record<string, [THREE.Vector3, THREE.Vector3]> = {
  top: [v(130, 14, 145), v(0, -8, 0)], // arrival: the establishing three-quarter view, falls toward us
  experiments: [v(95, -40, 100), v(15, -28, 15)], // down by the falls
  about: [v(-40, 30, 40), v(-170, 22, -230)], // an overlook across the cloud sea to the far formations
  toolkit: [v(-95, -70, 105), v(0, -36, 0)], // under the roots and hanging lobes
  contact: [v(150, 26, 215), v(-40, -8, -60)], // pull back: the hero in scale with the archipelago
};

/**
 * Each featured project lives on one of the far formations, visited in a sweep
 * around the hero. The camera stands off the island toward the hero, a little
 * above it; the chapter's caption is pinned beside the island on screen.
 */
const FLIGHT = [8, 7, 5, 3, 1, 4, 0, 2, 6]; // indices into FAR, in angular order around the hero
const PROJECT_STOPS = featured.map((p, i) => {
  const f = FAR[FLIGHT[i % FLIGHT.length]];
  const at = v(...f.at);
  const toward = v(-at.x, 0, -at.z).normalize().applyAxisAngle(v(0, 1, 0), THREE.MathUtils.degToRad(i % 2 ? -32 : 32));
  const cam = at.clone().addScaledVector(toward, f.s * 6.2).add(v(0, f.s * 0.9, 0));
  return { id: `p-${p.slug}`, cam, look: at.clone().add(v(0, -f.s * 0.35, 0)), isle: { at, s: f.s } };
});

const STOPS: { id: string; cam: THREE.Vector3; look: THREE.Vector3; isle?: { at: THREE.Vector3; s: number } }[] = [
  { id: 'top', cam: HOME_SHOTS.top[0], look: HOME_SHOTS.top[1] },
  ...PROJECT_STOPS,
  ...(['experiments', 'about', 'toolkit', 'contact'] as const).map((id) => ({ id, cam: HOME_SHOTS[id][0], look: HOME_SHOTS[id][1] })),
];
// the hero travels the whole way (the camera flies while the introduction takes off); others rest first
const track = createTrack(
  STOPS.map((s) => s.id),
  (id) => (id === 'top' ? 0.05 : 0.45),
);

function Rig() {
  const { camera, size } = useThree();
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const ready = useRef(false);
  const tp = useMemo(() => new THREE.Vector3(), []);
  const tl = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const edge = useMemo(() => new THREE.Vector3(), []);
  const anchor = useRef({ key: '', id: '' });

  useEffect(() => {
    track.measure();
    const ro = new ResizeObserver(() => track.measure());
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  useFrame((_, dt) => {
    const compact = size.width < 1000;
    let f = track.progress();
    if (STILL) f = Math.round(f);
    const i = Math.min(STOPS.length - 2, Math.floor(f));
    const k = Math.min(1, f - i);
    tp.lerpVectors(STOPS[i].cam, STOPS[i + 1].cam, k);
    tl.lerpVectors(STOPS[i].look, STOPS[i + 1].look, k);
    // keep the subject clear of the text: the hero sits low and centred under the
    // floating title; later stops sit right of the text panel (high on phones)
    const side = (j: number) => (STOPS[j].id === 'top' ? 0 : 1);
    const s = side(i) + (side(i + 1) - side(i)) * k;
    dir.subVectors(tl, tp);
    const dist = dir.length();
    dir.normalize();
    right.crossVectors(dir, up).normalize();
    if (compact) {
      tl.addScaledVector(up, -dist * (0.16 * s + 0.1 * (1 - s)));
      // portrait screens: step back so the island's width still fits
      const aspect = size.width / size.height;
      tp.addScaledVector(dir, -Math.min(90, dist * (0.85 / Math.min(1, aspect) - 0.85) * 0.45));
    } else {
      tl.addScaledVector(right, -dist * 0.2 * s);
      tl.addScaledVector(up, dist * 0.26 * (1 - s));
    }
    // small cursor parallax, never steering
    tp.addScaledVector(right, pointer.x * 2.4).addScaledVector(up, -pointer.y * 1.2);

    // Lenis already smooths the scroll: this only takes the edge off pointer parallax, so the view tracks input
    const r = STILL || !ready.current ? 0.0001 : 0.08;
    pos.current.set(follow(pos.current.x, tp.x, dt, r), follow(pos.current.y, tp.y, dt, r), follow(pos.current.z, tp.z, dt, r));
    look.current.set(follow(look.current.x, tl.x, dt, r), follow(look.current.y, tl.y, dt, r), follow(look.current.z, tl.z, dt, r));
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    camera.updateMatrixWorld();
    ready.current = true;

    // pin the active project's caption beside its island: screen centre and radius in px
    const stop = STOPS[Math.min(STOPS.length - 1, Math.round(f))];
    const isle = stop.isle;
    if (isle) {
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      ndc.copy(isle.at).project(camera);
      edge.copy(isle.at).addScaledVector(right, isle.s * 1.45).project(camera);
      const x = (ndc.x * 0.5 + 0.5) * size.width;
      const y = (-ndc.y * 0.5 + 0.5) * size.height;
      const r = Math.abs(edge.x - ndc.x) * 0.5 * size.width;
      // written on the chapter itself (a :root property would restyle the whole page), and only when it moves
      const key = `${x.toFixed(0)},${y.toFixed(0)},${r.toFixed(0)}`;
      if (key !== anchor.current.key || stop.id !== anchor.current.id) {
        const el = document.getElementById(stop.id);
        if (el) {
          el.style.setProperty('--isle-x', `${x.toFixed(0)}px`);
          el.style.setProperty('--isle-y', `${y.toFixed(0)}px`);
          el.style.setProperty('--isle-r', `${r.toFixed(0)}px`);
        }
        anchor.current = { key, id: stop.id };
      }
    }
  });
  return null;
}

/* ------------------------------------------------------------ the scene */

/**
 * Quality tiers, best first. The world starts on the first tier its class
 * allows and steps down (never up, so it does not flicker) when the measured
 * frame time misses the 60 FPS budget. Pixel ratio is the main lever: the
 * scene is fill-rate bound on integrated GPUs.
 */
type Tier = { scale: number; brush: boolean; msaa: number };
// scale multiplies the device pixel ratio (capped at 1.5 on desktop, 1.25 on phones).
// Order of sacrifice, measured on an Intel UHD iGPU: brushwork (~8 ms), multisampling (~5 ms), then resolution.
const TIERS: Record<'full' | 'compact', Tier[]> = {
  full: [
    { scale: 1, brush: true, msaa: 4 },
    { scale: 1, brush: false, msaa: 4 },
    { scale: 1, brush: false, msaa: 0 },
    { scale: 0.85, brush: false, msaa: 0 },
    { scale: 0.72, brush: false, msaa: 0 },
  ],
  compact: [
    { scale: 1, brush: false, msaa: 0 },
    { scale: 0.85, brush: false, msaa: 0 },
    { scale: 0.72, brush: false, msaa: 0 },
  ],
};
const pixelRatio = (compact: boolean, t: Tier) => Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.5) * t.scale;

/** One loop for the whole site: the canvas renders from GSAP's ticker, after Lenis has moved the page. */
function Driver() {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const tick = (time: number) => advance(time);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [advance]);
  return null;
}

/** Builds the environment once, then takes over rendering through the painted composer. */
function Veil({ compact, onReady, setDpr }: { compact: boolean; onReady?: () => void; setDpr: (dpr: number) => void }) {
  const { gl, camera, size } = useThree();
  const [env, setEnv] = useState<Environment | null>(null);
  const composer = useRef<EffectComposer | null>(null);
  const frames = useRef(0);
  const tiers = TIERS[compact ? 'compact' : 'full'];
  const tier = useRef(0);
  const samples = useRef<number[]>([]);
  const settled = useRef(false);

  useEffect(() => {
    let live = true;
    buildEnvironment(gl, { low: compact, base: import.meta.env.BASE_URL }).then((e) => {
      if (!live) return;
      const t = TIERS[compact ? 'compact' : 'full'][0];
      composer.current = createPainter(gl, e.scene, camera, { paint: t.brush, low: compact });
      setDpr(pixelRatio(compact, t));
      // compile every shader now, not the first time its object scrolls into view (that stalls the page)
      gl.compileAsync(e.scene, camera)
        .catch(() => {})
        .then(() => live && setEnv(e));
    });
    return () => {
      live = false;
      composer.current?.dispose();
    };
  }, [gl, camera, compact, setDpr]);

  // the composer follows the canvas size and pixel ratio
  const dpr = useThree((s) => s.viewport.dpr);
  useEffect(() => {
    if (!composer.current) return;
    composer.current.setPixelRatio(gl.getPixelRatio());
    composer.current.setSize(size.width, size.height);
  }, [size, dpr, env, gl]);

  // development only: ?perf shows FPS, frame time, draw calls and memory
  const perf = useRef<ReturnType<typeof createPerfMonitor> | null>(null);
  useEffect(() => {
    if (!perfEnabled()) return;
    gl.info.autoReset = false;
    perf.current = createPerfMonitor(gl, () => `${compact ? 'compact' : 'full'} ${tier.current} @${gl.getPixelRatio().toFixed(2)}`);
    return () => perf.current?.dispose();
  }, [gl, compact]);

  // priority 1: R3F stops its own render, this frame draws through the composer
  useFrame((state, dt) => {
    if (!env || !composer.current) return;
    if (perf.current) gl.info.reset();
    env.update(camera, STILL ? 12 : 12 + state.clock.elapsedTime);
    composer.current.render();
    perf.current?.frame();
    frames.current++;
    if (frames.current === 2) onReady?.();

    // adaptive quality. Warm-up: judge 45 frames at a time by their median, skipping a tier when far off budget.
    // After that keep watching in long windows (150 frames), so a heavier stretch of the page can still step
    // down once, but never in quick succession (no visible pumping). Never steps back up.
    if (frames.current < 30 || document.hidden || tier.current >= tiers.length - 1) return;
    samples.current.push(dt * 1000);
    const win = settled.current ? 150 : 45;
    if (samples.current.length < win) return;
    const sorted = [...samples.current].sort((x, y) => x - y);
    const median = sorted[Math.floor(win / 2)];
    samples.current = [];
    if (median > (settled.current ? 19.5 : 18.5)) {
      tier.current = Math.min(tiers.length - 1, tier.current + (!settled.current && median > 30 ? 2 : 1));
      const t = tiers[tier.current];
      setDpr(pixelRatio(compact, t));
      setBrushwork(composer.current, t.brush);
      setMultisample(composer.current, t.msaa);
    } else settled.current = true;
  }, 1);
  return null;
}

export default function World({ onReady }: { onReady?: () => void }) {
  const compact = matches(MQ.compact);
  // the pixel ratio lives in state: a re-render must never reset what adaptive quality chose
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <Canvas
      className="world-canvas"
      dpr={dpr}
      flat
      frameloop="never"
      camera={{ fov: compact ? 50 : 38, near: 0.5, far: 3000, position: STOPS[0].cam.toArray() }}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      aria-hidden="true"
    >
      <Driver />
      <Veil compact={compact} onReady={onReady} setDpr={setDpr} />
      <Rig />
    </Canvas>
  );
}

// keep places and shots in step
if (import.meta.env.DEV) (window as unknown as { __track: unknown }).__track = track;

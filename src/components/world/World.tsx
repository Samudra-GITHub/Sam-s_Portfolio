import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { createTrack } from './progress';
import { pointer, STILL } from './input';
import { buildEnvironment, type Environment } from './veil/environment';
import { createPainter, setBrushwork, setMultisample } from './veil/paint';
import { CAPTION_AT, compositionEnabled, createCompositionOverlay, DETAIL_IN, FRAMING, frameIsland, islandBox, islandDetail, PROJECT_HOLD, screenRect, setIslandBounds, setIslandDetails, STOPS } from './camera';
import { createPerfMonitor, perfEnabled } from './perf';
import { gsap } from '../../lib/gsap';
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

// the hero travels the whole way (the camera flies while the introduction takes off); others rest first
const track = createTrack(
  STOPS.map((s) => s.id),
  // project chapters rest longer: the island is established, the camera moves in, the world comes alive
  (id) => (id === 'top' ? 0.05 : id.startsWith('p-') ? PROJECT_HOLD : 0.45),
);
/**
 * The page position this frame: f, the float stop index the camera follows (the creatures take their cues
 * from it), and the raw phase (stop i, u through its stretch) that paces each project's presentation.
 */
const scroll = { f: 0, i: 0, u: 0 };
const smooth = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** how far the camera has moved in from the establishing shot to the detail shot, for stop j */
const detailWeight = (j: number) => (STILL || scroll.i !== j ? 0 : smooth(scroll.u, DETAIL_IN[0], DETAIL_IN[1]));
/** how far a formation's project world has come alive (0 before its chapter, 1 once presented) */
const stopOfFar = (far: number) => STOPS.findIndex((st) => st.isle?.far === far);
const presentation = (far: number) => {
  const j = stopOfFar(far);
  if (STILL) return 1;
  if (scroll.i > j) return 1;
  if (scroll.i < j) return 0;
  return Math.min(1, scroll.u / PROJECT_HOLD);
};

function Rig() {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const ready = useRef(false);
  const tp = useMemo(() => new THREE.Vector3(), []);
  const tl = useMemo(() => new THREE.Vector3(), []);
  const camA = useMemo(() => new THREE.Vector3(), []);
  const lookA = useMemo(() => new THREE.Vector3(), []);
  const camB = useMemo(() => new THREE.Vector3(), []);
  const lookB = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const anchor = useRef({ key: '', id: '' });
  const reveal = useRef({ i: -1, on: false });
  const dCam = useMemo(() => new THREE.Vector3(), []);
  const dLook = useMemo(() => new THREE.Vector3(), []);
  const overlay = useRef<ReturnType<typeof createCompositionOverlay> | null>(null);

  useEffect(() => {
    track.measure();
    const ro = new ResizeObserver(() => track.measure());
    ro.observe(document.body);
    if (compositionEnabled()) overlay.current = createCompositionOverlay();
    return () => {
      ro.disconnect();
      overlay.current?.dispose();
    };
  }, []);

  /** where stop j puts the camera for this viewport (island shots are composed, the rest authored) */
  const place = (j: number, phone: boolean, outCam: THREE.Vector3, outLook: THREE.Vector3) => {
    const st = STOPS[j];
    if (st.isle) {
      frameIsland(st.isle, cam.fov, size.width / size.height, phone, outCam, outLook);
      // a project world: from the establishing shot, move in to its detail shot as the chapter unfolds
      const d = islandDetail(st.isle.far);
      const w = d ? detailWeight(j) : 0;
      if (d && w > 0) {
        dCam.copy(d.cam);
        dLook.copy(d.look);
        if (phone) {
          // portrait screens: aim at the world's middle, step back so its width still fits, and keep it in the
          // upper half of the frame, above the caption sheet
          dir.subVectors(dCam, dLook);
          if (d.centre) dLook.copy(d.centre);
          const back = Math.min(1.6, 1.05 / Math.sqrt(Math.min(1, size.width / size.height)));
          dCam.copy(dLook).addScaledVector(dir, back);
          dLook.setY(dLook.y - dir.length() * back * 0.035);
        }
        outCam.lerp(dCam, w);
        outLook.lerp(dLook, w);
      }
      return;
    }
    outCam.copy(st.cam);
    outLook.copy(st.look);
    dir.subVectors(outLook, outCam);
    const dist = dir.length();
    dir.normalize();
    right.crossVectors(dir, up).normalize();
    const textual = st.text ? 1 : 0;
    if (phone) {
      // the subject sits in the top of the screen; portrait screens step back so its width still fits
      outLook.addScaledVector(up, -dist * (0.16 * textual + 0.1 * (1 - textual)));
      const aspect = size.width / size.height;
      outCam.addScaledVector(dir, -Math.min(90, dist * (0.85 / Math.min(1, aspect) - 0.85) * 0.45));
    } else if (st.text) {
      outLook.addScaledVector(right, -dist * 0.2); // subject right of the text panel
    } else {
      outLook.addScaledVector(up, dist * 0.26); // the hero sits low, under the floating title
    }
  };

  useFrame((_, dt) => {
    const phone = size.width < 1000;
    let f = track.progress();
    if (STILL) f = Math.round(f);
    scroll.f = f;
    const ph = track.phase();
    scroll.i = ph.i;
    scroll.u = ph.u;
    const i = Math.min(STOPS.length - 2, Math.floor(f));
    const k = Math.min(1, f - i);
    place(i, phone, camA, lookA);
    place(i + 1, phone, camB, lookB);
    tp.lerpVectors(camA, camB, k);
    tl.lerpVectors(lookA, lookB, k);
    // between two islands the camera lifts a little: the move reveals the formations beyond
    const a = STOPS[i], b = STOPS[i + 1];
    if (a.isle && b.isle) tp.y += Math.sin(Math.PI * k) * camA.distanceTo(camB) * 0.12;

    dir.subVectors(tl, tp).normalize();
    right.crossVectors(dir, up).normalize();
    // small cursor parallax, never steering
    tp.addScaledVector(right, pointer.x * 2.4).addScaledVector(up, -pointer.y * 1.2);

    // Lenis already smooths the scroll: this only takes the edge off pointer parallax, so the view tracks input
    const r = STILL || !ready.current ? 0.0001 : 0.08;
    pos.current.set(follow(pos.current.x, tp.x, dt, r), follow(pos.current.y, tp.y, dt, r), follow(pos.current.z, tp.z, dt, r));
    look.current.set(follow(look.current.x, tl.x, dt, r), follow(look.current.y, tl.y, dt, r), follow(look.current.z, tl.z, dt, r));
    camera.position.copy(pos.current);
    camera.lookAt(look.current);

    // phones compose islands into the upper screen (the caption is a sheet below): shift the lens, do not tilt the camera
    const isleW = (a.isle ? 1 - k : 0) + (b.isle ? k : 0);
    const raise = phone ? FRAMING.phone.raise * isleW : 0;
    if (raise > 0.001) cam.setViewOffset(size.width, size.height, 0, size.height * raise, size.width, size.height);
    else if (cam.view?.enabled) cam.clearViewOffset();
    camera.updateMatrixWorld();
    ready.current = true;

    // pin the active project's caption level with its island (written on the chapter, only when it moves)
    const stop = STOPS[Math.min(STOPS.length - 1, Math.round(f))];
    const rect = stop.isle ? screenRect(islandBox(stop.isle.far), camera) : undefined;
    if (rect) {
      const y = rect.cy * size.height;
      const key = y.toFixed(0);
      if (key !== anchor.current.key || stop.id !== anchor.current.id) {
        document.getElementById(stop.id)?.style.setProperty('--isle-y', `${key}px`);
        anchor.current = { key, id: stop.id };
      }
    }
    // the caption follows the world: it appears once the island has been established (and its world lit)
    const revealIdx = scroll.i;
    const rs = STOPS[revealIdx];
    // ...and leaves as the camera departs, so the travel to the next island is never covered
    const want = rs?.isle
      ? STILL || ((!islandDetail(rs.isle.far) ? scroll.u >= 0.02 : scroll.u >= CAPTION_AT) && scroll.u <= PROJECT_HOLD + 0.1)
      : false;
    if (revealIdx !== reveal.current.i || want !== reveal.current.on) {
      if (reveal.current.i >= 0) document.getElementById(STOPS[reveal.current.i].id)?.removeAttribute('data-reveal');
      if (want) document.getElementById(rs.id)?.setAttribute('data-reveal', '');
      reveal.current = { i: want ? revealIdx : -1, on: want };
    }
    overlay.current?.draw({ cam: camera.position, look: look.current, fov: cam.fov, id: stop.id, rect, raise });
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
      setIslandBounds(e.islands);
      setIslandDetails(e.worlds);
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
    env.update(camera, STILL ? 12 : 12 + state.clock.elapsedTime, scroll.f, presentation);
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

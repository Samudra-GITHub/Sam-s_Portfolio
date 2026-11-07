/**
 * Falling leaves: one fixed Canvas 2D layer, no DOM per leaf, driven by the shared GSAP ticker.
 *
 * Leaves are pre-rendered once as small sprites (a lit face and a shaded back for each colour and shape), then
 * only transformed per frame, so a frame costs one drawImage per leaf. Depth sets size, fall speed and drift
 * together, which gives the parallax; a rare "near" leaf is drawn soft and large, as if passing the lens.
 *
 * The layer never takes input (pointer-events: none on the canvas). It stops ticking when there is nothing to
 * draw or the tab is hidden, draws one still frame for reduced motion, and thins out on small or weak devices.
 */
import { gsap } from '../lib/gsap';

/* ------------------------------------------------------------------ palette and shapes */

/** muted gold, warm amber, bronze, a pale translucent gilt, and a rare dark neutral */
const TONES = [
  { face: ['#D9C08A', '#B8995C', '#8E7243'], weight: 4 }, // muted gold
  { face: ['#D7A866', '#B98243', '#87592C'], weight: 3 }, // warm amber
  { face: ['#B48A62', '#8C6239', '#5E4026'], weight: 3 }, // bronze
  { face: ['#F1E6CC', '#D8C59C', '#B7A17A'], weight: 2, alpha: 0.55 }, // translucent gilt
  { face: ['#5A544C', '#3D3934', '#26231F'], weight: 1 }, // dark neutral
] as const;

type ShapeFn = (c: CanvasRenderingContext2D, s: number) => void;

/** a fan, like a ginkgo leaf: the least "autumn template" of leaf outlines */
const fan: ShapeFn = (c, s) => {
  c.moveTo(0, s * 0.5);
  c.bezierCurveTo(-s * 0.08, s * 0.2, -s * 0.5, -s * 0.05, -s * 0.46, -s * 0.32);
  c.quadraticCurveTo(-s * 0.2, -s * 0.52, 0, -s * 0.36);
  c.quadraticCurveTo(s * 0.2, -s * 0.52, s * 0.46, -s * 0.32);
  c.bezierCurveTo(s * 0.5, -s * 0.05, s * 0.08, s * 0.2, 0, s * 0.5);
};
/** a long willow blade */
const blade: ShapeFn = (c, s) => {
  c.moveTo(0, -s * 0.5);
  c.bezierCurveTo(s * 0.2, -s * 0.2, s * 0.17, s * 0.25, 0, s * 0.5);
  c.bezierCurveTo(-s * 0.17, s * 0.25, -s * 0.2, -s * 0.2, 0, -s * 0.5);
};
/** a rounded birch-like oval with a point */
const oval: ShapeFn = (c, s) => {
  c.moveTo(0, -s * 0.5);
  c.bezierCurveTo(s * 0.38, -s * 0.34, s * 0.36, s * 0.3, 0, s * 0.46);
  c.bezierCurveTo(-s * 0.36, s * 0.3, -s * 0.38, -s * 0.34, 0, -s * 0.5);
};
const SHAPES: { fn: ShapeFn; vein: 'fan' | 'mid' }[] = [
  { fn: fan, vein: 'fan' },
  { fn: blade, vein: 'mid' },
  { fn: oval, vein: 'mid' },
];

const SPRITE = 96; // px, drawn once at this size and scaled down per leaf

/** one sprite: a metallic gradient face with a soft sheen and fine veins; `back` is the darker underside */
function sprite(shape: (typeof SHAPES)[number], tone: (typeof TONES)[number], back: boolean, blur: number) {
  const pad = blur * 2 + 4;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SPRITE + pad * 2;
  const c = cv.getContext('2d')!;
  c.translate(cv.width / 2, cv.height / 2);
  if (blur && 'filter' in c) c.filter = `blur(${blur}px)`;
  const s = SPRITE * 0.92;
  const [hi, mid, lo] = tone.face;
  const g = c.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
  if (back) {
    g.addColorStop(0, mid);
    g.addColorStop(1, lo);
  } else {
    g.addColorStop(0, hi);
    g.addColorStop(0.45, mid);
    g.addColorStop(0.62, hi); // a narrow sheen across the face reads as metal leaf
    g.addColorStop(1, lo);
  }
  c.beginPath();
  shape.fn(c, s);
  c.closePath();
  c.globalAlpha = 'alpha' in tone ? tone.alpha : 1;
  c.fillStyle = g;
  c.fill();
  // veins, barely there
  c.globalAlpha *= back ? 0.18 : 0.28;
  c.strokeStyle = back ? hi : lo;
  c.lineWidth = 1.1;
  c.beginPath();
  if (shape.vein === 'fan') {
    for (let i = -3; i <= 3; i++) {
      c.moveTo(0, s * 0.48);
      c.lineTo(i * s * 0.13, -s * 0.36 + Math.abs(i) * s * 0.03);
    }
  } else {
    c.moveTo(0, -s * 0.46);
    c.lineTo(0, s * 0.46);
  }
  c.stroke();
  return cv;
}

/* ------------------------------------------------------------------ the layer */

interface Leaf {
  x: number;
  y: number;
  /** depth: about 0.35 (far) to 1 (near the page); 2+ means passing the lens */
  z: number;
  size: number;
  rot: number;
  spin: number;
  swayPhase: number;
  swayFreq: number;
  swayAmp: number;
  flip: number;
  flipFreq: number;
  vx: number;
  vy: number;
  kind: number;
  near: boolean;
  alpha: number;
}

export interface LeavesOptions {
  reduced: boolean;
  /** small screen or weak hardware: fewer leaves, no lens pass, no blur */
  lite: boolean;
}

export interface Leaves {
  /** how many leaves the layer keeps falling; 0 lets the current ones finish and then idles */
  setDensity(n: number): void;
  /** where new leaves enter, as a weight away from the middle of the screen (0 even, 1 edges only) */
  setEdgeBias(b: number): void;
  /** allow the rare large, soft leaf that passes close to the camera */
  setLens(on: boolean): void;
  /** a choreographed push of wind; x and y in px per frame at 60fps */
  gust(x: number, y: number, duration?: number): void;
  /** release a small cluster from just above the top, for scene changes */
  cluster(n: number, fromX?: number): void;
  dispose(): void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function createLeaves(canvas: HTMLCanvasElement, { reduced, lite }: LeavesOptions): Leaves {
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.5);
  let w = 0, h = 0;
  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (reduced) still();
  };

  // sprites[kind] = { face, back, soft }, where kind walks every shape and tone
  const weighted: number[] = [];
  const sprites: { face: HTMLCanvasElement; back: HTMLCanvasElement; soft?: HTMLCanvasElement }[] = [];
  SHAPES.forEach((shape) =>
    TONES.forEach((tone) => {
      const k = sprites.length;
      sprites.push({ face: sprite(shape, tone, false, 0), back: sprite(shape, tone, true, 0), soft: lite || tone.face[0] === '#5A544C' ? undefined : sprite(shape, tone, false, 7) });
      for (let i = 0; i < tone.weight; i++) weighted.push(k);
    }),
  );

  let density = 0;
  let edgeBias = 0.6;
  let lens = true;
  const leaves: Leaf[] = [];
  const wind = { x: 0.25, y: 0 };
  const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0 };
  let nearTimer = rand(3, 6);

  const spawnX = () => {
    // pull entries towards the edges so the middle of a composition stays open
    const u = Math.random();
    const edge = u < 0.5 ? Math.pow(u * 2, 1 + edgeBias * 2) * 0.5 : 1 - Math.pow((1 - u) * 2, 1 + edgeBias * 2) * 0.5;
    return edge * (w + 80) - 40;
  };

  const make = (opts: { near?: boolean; anywhere?: boolean; x?: number } = {}): Leaf => {
    const near = !!opts.near;
    const z = near ? rand(2.1, 2.8) : Math.pow(Math.random(), 1.2) * 0.55 + 0.45;
    const size = (near ? rand(70, 96) : rand(30, 48)) * z;
    return {
      x: opts.x ?? spawnX(),
      y: opts.anywhere ? rand(-0.1, 0.9) * h : -size - rand(0, 120),
      z,
      size,
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.012, 0.012),
      swayPhase: rand(0, Math.PI * 2),
      swayFreq: rand(0.012, 0.024),
      swayAmp: rand(0.35, 0.9),
      flip: rand(0, Math.PI * 2),
      flipFreq: rand(0.012, 0.028),
      vx: 0,
      vy: 0,
      kind: weighted[(Math.random() * weighted.length) | 0],
      near,
      alpha: near ? 0.7 : 0.55 + z * 0.45,
    };
  };

  const draw = (l: Leaf) => {
    const s = sprites[l.kind];
    const flip = Math.cos(l.flip); // -1..1: the tumble, seen edge-on at 0
    const img = l.near && s.soft ? s.soft : flip >= 0 ? s.face : s.back;
    const sc = (l.size / SPRITE) * dpr;
    const fx = (0.22 + 0.78 * Math.abs(flip)) * sc;
    const cos = Math.cos(l.rot), sin = Math.sin(l.rot);
    // rotate, then squash on the leaf's own x axis for the flip
    ctx.setTransform(cos * fx, sin * fx, -sin * sc, cos * sc, l.x * dpr, l.y * dpr);
    ctx.globalAlpha = l.alpha * (0.75 + 0.25 * Math.abs(flip));
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  };

  const step = (dt: number) => {
    // lens pass: rarely, one big soft leaf crosses close to the camera
    if (!lite && lens && density > 0) {
      nearTimer -= dt / 60;
      if (nearTimer <= 0) {
        leaves.push(make({ near: true }));
        nearTimer = rand(10, 18);
      }
    }
    let live = 0;
    for (const l of leaves) if (!l.near) live++;
    if (live < density && Math.random() < 0.06 * dt) leaves.push(make());

    const pv = Math.hypot(pointer.vx, pointer.vy);
    for (let i = leaves.length - 1; i >= 0; i--) {
      const l = leaves[i];
      l.swayPhase += l.swayFreq * dt;
      l.flip += l.flipFreq * dt;
      l.rot += l.spin * dt;
      // a leaf slows at each end of its swing, the way a real one rocks
      const flutter = 0.55 + 0.45 * Math.abs(Math.cos(l.swayPhase));
      // pointer: a soft push away from a moving cursor, scaled by how fast it moves
      if (pv > 0.2) {
        const dx = l.x - pointer.x, dy = l.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        const r = 140 * Math.min(l.z, 1.4);
        if (d2 < r * r) {
          const f = (1 - Math.sqrt(d2) / r) * 0.045 * Math.min(pv, 30);
          l.vx += pointer.vx * f * 0.06 + (dx / (Math.sqrt(d2) + 1)) * f;
          l.vy += pointer.vy * f * 0.03;
        }
      }
      l.vx *= Math.pow(0.95, dt);
      l.vy *= Math.pow(0.95, dt);
      const depth = l.z;
      l.x += (wind.x * depth + Math.sin(l.swayPhase) * l.swayAmp * depth + l.vx) * dt;
      l.y += ((0.45 + 0.55 * depth) * flutter * (l.near ? 1.9 : 1) + wind.y * depth + l.vy) * dt;
      if (l.y - l.size > h + 40 || l.x < -l.size * 2 - 80 || l.x > w + l.size * 2 + 80 || l.y < -h) leaves.splice(i, 1);
    }
    pointer.vx *= 0.8;
    pointer.vy *= 0.8;
  };

  const render = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // far first, the lens pass last
    leaves.sort((a, b) => a.z - b.z);
    for (const l of leaves) draw(l);
  };

  /* ---- the loop: runs only while there is something to animate and the tab is visible */
  let ticking = false;
  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / (1000 / 60), 3);
    step(dt);
    render();
    if (!leaves.length && density === 0) stop();
  };
  const start = () => {
    if (ticking || reduced || document.hidden) return;
    ticking = true;
    gsap.ticker.add(tick);
  };
  const stop = () => {
    if (!ticking) return;
    ticking = false;
    gsap.ticker.remove(tick);
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  const onPointer = (e: PointerEvent) => {
    const now = performance.now();
    const dtp = Math.max(now - pointer.t, 8) / (1000 / 60);
    if (pointer.t) {
      pointer.vx = (e.clientX - pointer.x) / dtp;
      pointer.vy = (e.clientY - pointer.y) / dtp;
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.t = now;
  };

  /** reduced motion: one composed still frame, never animated */
  function still() {
    leaves.length = 0;
    const spots = [[0.1, 0.22, 0.9], [0.86, 0.16, 0.7], [0.93, 0.62, 1], [0.06, 0.74, 0.55]];
    for (const [px, py, z] of spots) {
      const l = make({ x: px * w });
      l.y = py * h;
      l.z = z;
      l.size = 40 * z;
      l.alpha = 0.8;
      leaves.push(l);
    }
    render();
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);
  if (!lite) window.addEventListener('pointermove', onPointer, { passive: true });

  return {
    setDensity(n) {
      density = reduced ? 0 : Math.round(lite ? n * 0.45 : n);
      if (density > 0 && !leaves.length) for (let i = 0; i < Math.ceil(density * 0.6); i++) leaves.push(make({ anywhere: true }));
      if (density > 0) start();
    },
    setEdgeBias(b) {
      edgeBias = b;
    },
    setLens(on) {
      lens = on;
    },
    gust(x, y, duration = 1.4) {
      if (reduced) return;
      const base = { x: 0.25, y: 0 };
      gsap.timeline()
        .to(wind, { x: base.x + x, y: base.y + y, duration: duration * 0.35, ease: 'power2.out' })
        .to(wind, { x: base.x, y: base.y, duration: duration * 0.65, ease: 'power2.inOut' });
      start();
    },
    cluster(n, fromX) {
      if (reduced) return;
      const cx = fromX ?? rand(0.15, 0.85) * w;
      for (let i = 0; i < (lite ? Math.ceil(n / 2) : n); i++) {
        const l = make({ x: cx + rand(-90, 90) });
        l.y = -l.size - rand(0, 160);
        leaves.push(l);
      }
      start();
    },
    dispose() {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      leaves.length = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { fbm, rng } from '../noise';

/**
 * Vegetation for the floating mountains. Nothing here is a primitive crown:
 * every tree is a branching tube skeleton carrying clusters of alpha-cut leaf
 * cards, in five species with their own growth rules, plus fern fronds and
 * shrubs for the forest floor. All foliage is instanced.
 */

type Rand = () => number;
export interface Placed { m: THREE.Matrix4; c: THREE.Color }

/** painted leaf mass: many small leaf strokes, denser in the middle, ragged at the edge */
export function leafTexture(seed = 7) {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  const r = rng(seed);
  for (let i = 0; i < 420; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.45 * S;
    const x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d * 0.92;
    const len = (12 + r() * 16) * (1.15 - d / (S * 0.6));
    const w = len * (0.3 + r() * 0.15);
    const v = (120 + r() * 135) | 0;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.save();
    g.translate(x, y);
    g.rotate(a + (r() - 0.5) * 1.4);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(len * 0.5, -w, len, 0);
    g.quadraticCurveTo(len * 0.5, w, 0, 0);
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}

/** a fern frond: a rib with paired leaflets shortening toward the tip */
export function frondTexture() {
  const W = 128, H = 512;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  const r = rng(11);
  g.fillStyle = 'rgb(120,120,120)';
  g.fillRect(W / 2 - 2, 0, 4, H);
  for (let y = 12; y < H - 6; y += 9) {
    const t = y / H;
    const len = (W / 2 - 6) * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.75 + r() * 0.25);
    for (const side of [-1, 1]) {
      const v = (150 + r() * 100) | 0;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.save();
      g.translate(W / 2, y);
      g.scale(side, 1);
      g.rotate(-0.5);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(len * 0.5, -5, len, 0);
      g.quadraticCurveTo(len * 0.5, 5, 0, 0);
      g.fill();
      g.restore();
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}

/** a leaf cluster: cards in a flattened ball, normals bent outward from the cluster's heart */
export function clusterGeometry(cards = 24, seed = 3) {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  const heart = new THREE.Vector3(0, -0.35, 0);
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  for (let i = 0; i < cards; i++) {
    const g = new THREE.PlaneGeometry(1, 1);
    const s = 0.7 + r() * 0.55;
    g.scale(s, s, s);
    q.setFromEuler(e.set(r() * Math.PI, r() * Math.PI * 2, r() * Math.PI));
    g.applyQuaternion(q);
    const u = r() * 2 - 1, a = r() * Math.PI * 2, rr = Math.cbrt(r()) * 0.42;
    const c = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(a) * rr, u * rr * 0.7, Math.sqrt(1 - u * u) * Math.sin(a) * rr);
    g.translate(c.x, c.y, c.z);
    const p = g.attributes.position, n = g.attributes.normal;
    const inner = new Float32Array(p.count);
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k).sub(heart);
      inner[k] = Math.min(1, v.length() / 0.75);
      v.normalize();
      n.setXYZ(k, v.x, v.y, v.z);
    }
    g.setAttribute('aInner', new THREE.BufferAttribute(inner, 1));
    parts.push(g);
  }
  return mergeGeometries(parts)!;
}

/** an arching frond strip along +z */
export function frondGeometry() {
  const seg = 8;
  const pos: number[] = [], uv: number[] = [], nor: number[] = [], inner: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const y = Math.sin(t * Math.PI * 0.75) * 0.32 - t * t * 0.18;
    const z = t;
    const w = 0.2;
    pos.push(-w, y, z, w, y, z);
    uv.push(0, 1 - t, 1, 1 - t);
    const n = new THREE.Vector3(0, 1, 0.25 - t * 0.5).normalize();
    nor.push(n.x, n.y, n.z, n.x, n.y, n.z);
    inner.push(0.5 + t * 0.5, 0.5 + t * 0.5);
    if (i < seg) idx.push(i * 2, i * 2 + 1, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aInner', new THREE.Float32BufferAttribute(inner, 1));
  g.setIndex(idx);
  return g;
}

/** a tapering tube along a smooth curve (trunks, branches, roots, vines) */
export function taperTube(points: THREE.Vector3[], r0: number, r1: number, seg = 10, radial = 6, aoBase = 0.55) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(seg, false);
  const pos: number[] = [], nor: number[] = [], ao: number[] = [], idx: number[] = [];
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    curve.getPointAt(t, p);
    const r = r0 + (r1 - r0) * Math.pow(t, 0.8);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      n.copy(frames.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a));
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      nor.push(n.x, n.y, n.z);
      ao.push(aoBase + (1 - aoBase) * t);
    }
  }
  for (let i = 0; i < seg; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aAO', new THREE.Float32BufferAttribute(ao, 1));
  g.setIndex(idx);
  return g;
}

const C = (h: string) => new THREE.Color(h);
const PAL = {
  giant: ['#1f4d43', '#285c4a', '#21544f', '#335c3c'].map(C),
  spire: ['#21483a', '#28503f', '#2f5643', '#25493d'].map(C),
  weeper: ['#6d984b', '#80a656', '#5d8a49', '#93ad5c'].map(C),
  bloom: ['#3f7650', '#4c8355'].map(C),
  blossom: ['#e2878d', '#f0b39e', '#f3e4d0', '#c76a8a'].map(C),
  shrub: ['#2d5c43', '#3b6d47', '#57854d', '#2e6a66', '#8a9a52', '#365e57'].map(C),
  rust: ['#8a5a3c', '#a06a40'].map(C),
  fern: ['#3c7a4b', '#4e8a51', '#2f6a55', '#5f9655'].map(C),
};

export class Flora {
  trunks: THREE.BufferGeometry[] = [];
  vines: THREE.BufferGeometry[] = [];
  leaves: Placed[] = [];
  blossoms: Placed[] = [];
  fronds: Placed[] = [];
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();

  private r: Rand;
  constructor(r: Rand) {
    this.r = r;
  }

  private pick(list: THREE.Color[]) {
    const c = list[Math.floor(this.r() * list.length)].clone();
    return c.offsetHSL((this.r() - 0.5) * 0.02, (this.r() - 0.5) * 0.08, (this.r() - 0.5) * 0.05);
  }
  leaf(at: THREE.Vector3, scale: THREE.Vector3, color: THREE.Color, tilt = 0.25, into: Placed[] = this.leaves) {
    const r = this.r;
    this.q.setFromEuler(this.e.set((r() - 0.5) * tilt, r() * Math.PI * 2, (r() - 0.5) * tilt));
    into.push({ m: new THREE.Matrix4().compose(at.clone(), this.q.clone(), scale.clone()), c: color });
  }

  giant(base: THREE.Vector3, s: number) {
    const r = this.r;
    const H = (10 + r() * 5) * s;
    const lean = new THREE.Vector3(r() - 0.5, 0, r() - 0.5).multiplyScalar(0.14 * H);
    const pts = [0, 0.35, 0.7, 1].map((t) => base.clone().add(new THREE.Vector3(0, H * t, 0)).addScaledVector(lean, t * t));
    this.trunks.push(taperTube(pts, 0.55 * s, 0.2 * s, 12, 8));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + r();
      const d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      this.trunks.push(taperTube([base.clone().addScaledVector(d, 2 * s).add(new THREE.Vector3(0, -0.7 * s, 0)), base.clone().addScaledVector(d, 0.8 * s).add(new THREE.Vector3(0, 0.5 * s, 0)), base.clone().add(new THREE.Vector3(0, 2.4 * s, 0))], 0.08 * s, 0.32 * s, 6, 5, 0.4));
    }
    const col = this.pick(PAL.giant);
    const nb = 5 + Math.floor(r() * 3);
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * Math.PI * 2 + r() * 0.7;
      const len = (2.8 + r() * 2.2) * s;
      const dir = new THREE.Vector3(Math.cos(a), 0.3 + r() * 0.35, Math.sin(a)).normalize();
      const t0 = 0.72 + r() * 0.25;
      const start = base.clone().add(new THREE.Vector3(0, H * t0, 0)).addScaledVector(lean, t0 * t0);
      const end = start.clone().addScaledVector(dir, len);
      const mid = start.clone().addScaledVector(dir, len * 0.5).add(new THREE.Vector3(0, 0.5 * s, 0));
      this.trunks.push(taperTube([start, mid, end], 0.18 * s, 0.05 * s, 6, 5, 0.7));
      for (let k = 0; k < 8; k++) {
        const ang = r() * Math.PI * 2, rad = Math.sqrt(r()) * 1.9 * s;
        const at = end.clone().add(new THREE.Vector3(Math.cos(ang) * rad, (r() - 0.3) * 0.5 * s, Math.sin(ang) * rad));
        const k2 = (0.8 + r() * 0.45) * s;
        this.leaf(at, new THREE.Vector3(2.4 * k2, 1.15 * k2, 2.4 * k2), col.clone().offsetHSL(0, 0, (r() - 0.5) * 0.04));
      }
    }
    const top = pts[3];
    for (let k = 0; k < 3; k++) this.leaf(top.clone().add(new THREE.Vector3((r() - 0.5) * 2 * s, 0.6 * s, (r() - 0.5) * 2 * s)), new THREE.Vector3(2.2, 1.2, 2.2).multiplyScalar(s), col);
  }

  spire(base: THREE.Vector3, s: number) {
    const r = this.r;
    const H = (8 + r() * 6) * s;
    const top = base.clone().add(new THREE.Vector3((r() - 0.5) * 0.6 * s, H, (r() - 0.5) * 0.6 * s));
    this.trunks.push(taperTube([base, base.clone().lerp(top, 0.5), top], 0.3 * s, 0.05 * s, 8, 6));
    const col = this.pick(PAL.spire);
    for (let t = 0.2; t <= 0.98; t += 0.075) {
      const y = base.clone().lerp(top, t);
      const rad = (1 - t) * 2.3 * s + 0.35 * s;
      const n = Math.max(3, Math.round(rad * 2.4 / s));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 7 + r() * 0.4;
        const at = y.clone().add(new THREE.Vector3(Math.cos(a) * rad * 0.62, -0.15 * s, Math.sin(a) * rad * 0.62));
        const w = (0.75 + rad * 0.42 / s) * s;
        this.leaf(at, new THREE.Vector3(w, 0.55 * s, w), col.clone().offsetHSL(0, 0, (t - 0.5) * 0.06), 0.5);
      }
    }
    this.leaf(top.clone().add(new THREE.Vector3(0, 0.3 * s, 0)), new THREE.Vector3(0.6, 1.4, 0.6).multiplyScalar(s), col);
  }

  weeper(base: THREE.Vector3, s: number) {
    const r = this.r;
    const H = (6.5 + r() * 3) * s;
    const a0 = r() * Math.PI * 2;
    const side = new THREE.Vector3(Math.cos(a0), 0, Math.sin(a0));
    const pts = [0, 0.4, 0.8, 1].map((t) => base.clone().add(new THREE.Vector3(0, H * t, 0)).addScaledVector(side, Math.sin(t * 1.4) * 2.6 * s));
    this.trunks.push(taperTube(pts, 0.42 * s, 0.14 * s, 10, 7));
    const top = pts[3];
    const col = this.pick(PAL.weeper);
    for (let i = 0; i < 11; i++) {
      const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * 2.4 * s;
      this.leaf(top.clone().add(new THREE.Vector3(Math.cos(a) * rad, (r() - 0.2) * 1.0 * s - rad * 0.25, Math.sin(a) * rad)), new THREE.Vector3(2.1, 1.3, 2.1).multiplyScalar(s * (0.8 + r() * 0.4)), col);
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + r() * 0.3;
      const start = top.clone().add(new THREE.Vector3(Math.cos(a) * 2.5 * s, -0.4 * s, Math.sin(a) * 2.5 * s));
      const L = (2.5 + r() * 3.5) * s;
      const sway = new THREE.Vector3(r() - 0.5, 0, r() - 0.5).multiplyScalar(0.8 * s);
      const end = start.clone().add(new THREE.Vector3(0, -L, 0)).add(sway);
      this.vines.push(taperTube([start, start.clone().lerp(end, 0.5).addScaledVector(sway, -0.6), end], 0.05 * s, 0.015 * s, 6, 4, 0.8));
      for (let k = 1; k <= 3; k++) this.leaf(start.clone().lerp(end, k / 3.4), new THREE.Vector3(0.38, 0.85, 0.38).multiplyScalar(s), col.clone().offsetHSL(0, 0, 0.03), 0.2);
    }
  }

  bloom(base: THREE.Vector3, s: number) {
    const r = this.r;
    const H = (4 + r() * 2.5) * s;
    const top = base.clone().add(new THREE.Vector3((r() - 0.5) * 1.5 * s, H, (r() - 0.5) * 1.5 * s));
    const mid = base.clone().lerp(top, 0.5).add(new THREE.Vector3((r() - 0.5) * 1.2 * s, 0, (r() - 0.5) * 1.2 * s));
    this.trunks.push(taperTube([base, mid, top], 0.3 * s, 0.1 * s, 8, 6));
    const col = this.pick(PAL.bloom);
    const bl = PAL.blossom[Math.floor(r() * PAL.blossom.length)];
    for (let i = 0; i < 8; i++) {
      const a = r() * Math.PI * 2, u = r() * 2 - 1, rad = 1.5 * s;
      const at = top.clone().add(new THREE.Vector3(Math.cos(a) * Math.sqrt(1 - u * u) * rad, u * rad * 0.6 + 0.4 * s, Math.sin(a) * Math.sqrt(1 - u * u) * rad));
      this.leaf(at, new THREE.Vector3(1.6, 1.3, 1.6).multiplyScalar(s), col);
    }
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, u = r() * 1.6 - 0.6, rad = 2.1 * s;
      const at = top.clone().add(new THREE.Vector3(Math.cos(a) * Math.sqrt(1 - u * u) * rad, u * rad * 0.65 + 0.5 * s, Math.sin(a) * Math.sqrt(1 - u * u) * rad));
      this.leaf(at, new THREE.Vector3(0.42, 0.36, 0.42).multiplyScalar(s), bl.clone().offsetHSL(0, 0, (r() - 0.5) * 0.08), 1, this.blossoms);
    }
  }

  shrub(base: THREE.Vector3, s: number, palette: THREE.Color[] = PAL.shrub) {
    const r = this.r;
    const col = this.r() < 0.06 ? this.pick(PAL.rust) : this.pick(palette);
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const k = (0.7 + r() * 0.9) * s;
      this.leaf(base.clone().add(new THREE.Vector3((r() - 0.5) * 1.2 * s, 0.35 * k, (r() - 0.5) * 1.2 * s)), new THREE.Vector3(1.5 * k, 1 * k, 1.5 * k), col);
    }
    if (r() < 0.12) for (let i = 0; i < 6; i++) this.leaf(base.clone().add(new THREE.Vector3((r() - 0.5) * 1.4 * s, (0.6 + r() * 0.5) * s, (r() - 0.5) * 1.4 * s)), new THREE.Vector3(0.3, 0.28, 0.3).multiplyScalar(s), this.pick(PAL.blossom), 1, this.blossoms);
  }

  fern(base: THREE.Vector3, s: number) {
    const r = this.r;
    const col = this.pick(PAL.fern);
    const n = 6 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.4;
      this.q.setFromEuler(this.e.set(-0.25 - r() * 0.35, a, 0, 'YXZ'));
      const L = (1.3 + r() * 1.1) * s;
      this.fronds.push({ m: new THREE.Matrix4().compose(base.clone(), this.q.clone(), new THREE.Vector3(L, L, L)), c: col.clone().offsetHSL(0, 0, (r() - 0.5) * 0.06) });
    }
  }
}

export interface ScatterOptions {
  seed: number;
  /** world-space river polylines to keep clear */
  rivers?: THREE.Vector3[][];
  counts?: Partial<Record<'giant' | 'spire' | 'weeper' | 'bloom' | 'shrub' | 'fern', number>>;
  scale?: number;
  /** world y above which the ground counts as high crag (spires) */
  highY?: number;
}

/** Forest distribution on a terrain mesh: clumped by a forest mask, species by altitude, rivers kept open. */
export function scatterForest(geo: THREE.BufferGeometry, o: ScatterOptions) {
  const r = rng(o.seed);
  const flora = new Flora(r);
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const flat: number[] = [], ledge: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const ny = nor.getY(i);
    if (ny > 0.72) flat.push(i);
    else if (ny > 0.55 && pos.getY(i) > -4) ledge.push(i); // real ledges only, not every tilted cliff facet
  }
  const shuffle = (a: number[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  };
  shuffle(flat);
  shuffle(ledge);
  const s = o.scale ?? 1;
  const want = { giant: 26, spire: 46, weeper: 18, bloom: 14, shrub: 700, fern: 460, ...o.counts };
  const got = { giant: 0, spire: 0, weeper: 0, bloom: 0, shrub: 0, fern: 0 };
  const trees: THREE.Vector3[] = [], ground: THREE.Vector3[] = [];
  const clear = (p: THREE.Vector3, list: THREE.Vector3[], d: number) => list.every((q) => q.distanceToSquared(p) > d * d);
  const nearRiver = (p: THREE.Vector3, d: number) =>
    (o.rivers ?? []).some((rv) => rv.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < d));
  const p = new THREE.Vector3();
  const highY = o.highY ?? 12;

  for (const i of flat) {
    p.fromBufferAttribute(pos, i);
    const base = p.clone().add(new THREE.Vector3(0, -0.25 * s, 0));
    const mask = fbm(p.x * 0.035, 0.5, p.z * 0.035, o.seed + 5, 3);
    if (nearRiver(p, 2.2 * s)) continue;
    const high = p.y > highY;
    // trees
    if (mask > -0.15 || high) {
      const roll = r();
      if (high && got.spire < want.spire && roll < 0.75 && clear(p, trees, 3 * s)) { flora.spire(base, s * (0.8 + r() * 0.4)); got.spire++; trees.push(p.clone()); continue; }
      if (!high && got.giant < want.giant && roll < 0.22 && mask > 0.05 && clear(p, trees, 6.5 * s)) { flora.giant(base, s * (0.85 + r() * 0.35)); got.giant++; trees.push(p.clone()); continue; }
      if (got.spire < want.spire && roll < 0.5 && clear(p, trees, 3.4 * s)) { flora.spire(base, s * (0.75 + r() * 0.4)); got.spire++; trees.push(p.clone()); continue; }
      if (!high && got.weeper < want.weeper && roll < 0.62 && nearRiver(p, 9 * s) && clear(p, trees, 4.5 * s)) { flora.weeper(base, s * (0.85 + r() * 0.3)); got.weeper++; trees.push(p.clone()); continue; }
    } else if (got.bloom < want.bloom && r() < 0.12 && clear(p, trees, 4 * s)) {
      flora.bloom(base, s * (0.8 + r() * 0.4)); got.bloom++; trees.push(p.clone()); continue;
    }
    // forest floor
    if (got.shrub < want.shrub && r() < 0.55 && clear(p, ground, 1.5 * s)) { flora.shrub(base, s); got.shrub++; ground.push(p.clone()); continue; }
    if (got.fern < want.fern && clear(p, ground, 1.2 * s)) { flora.fern(base.clone().add(new THREE.Vector3(0, 0.1 * s, 0)), s); got.fern++; ground.push(p.clone()); }
  }
  // the rim and the ledges: shrubs and ferns spilling over the edge
  for (const i of ledge.slice(0, 420)) {
    p.fromBufferAttribute(pos, i);
    if (!clear(p, ground, 2.4 * s)) continue;
    if (r() < 0.6) flora.shrub(p.clone(), s * 0.85);
    else flora.fern(p.clone(), s * 0.9);
    ground.push(p.clone());
  }
  return { flora, got };
}

export function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, list: Placed[]) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
  list.forEach((it, i) => {
    mesh.setMatrixAt(i, it.m);
    mesh.setColorAt(i, it.c);
  });
  mesh.count = list.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { fbm, rng } from './noise';

/**
 * Procedural floating landmass: a lathe-built body pushed into an irregular,
 * layered silhouette by noise, painted with vertex colour (strata, mineral
 * seams, moss creeping over the rim, cool shadow underneath), crowned with
 * clustered canopy and hung with roots and vines.
 */

export const PALETTE = {
  mist: new THREE.Color('#e9eee8'),
  canopyDeep: new THREE.Color('#193f35'),
  emerald: new THREE.Color('#28785d'),
  jade: new THREE.Color('#58a987'),
  teal: new THREE.Color('#318e91'),
  glint: new THREE.Color('#80d5cf'),
  stone: new THREE.Color('#8c725b'),
  stoneDark: new THREE.Color('#5a4636'),
  ochre: new THREE.Color('#d29a54'),
  orchid: new THREE.Color('#77618e'),
  shadow: new THREE.Color('#3f4a4c'),
  bark: new THREE.Color('#6b5440'),
};

export interface IslandOptions {
  seed: number;
  radius: number;
  depth: number;
  /** canopy density, trees per unit of top area */
  density?: number;
  /** angles (radians) on the rim where waterfalls pour over */
  falls?: number[];
  detail?: 'high' | 'low';
}

export interface Island {
  rock: THREE.BufferGeometry;
  hang: THREE.BufferGeometry;
  canopy: { matrices: THREE.Matrix4[]; colors: THREE.Color[] };
  trunks: THREE.Matrix4[];
  falls: { top: THREE.Vector3; out: THREE.Vector3; length: number; width: number }[];
}

export function buildIsland(o: IslandOptions): Island {
  const { seed, radius: R, depth: D, density = 1, falls = [], detail = 'high' } = o;
  const rand = rng(seed);
  const hi = detail === 'high';

  /* --- silhouette: how far the cliff reaches out at each angle and height --- */
  const reach = (theta: number, y: number) => {
    const cx = Math.cos(theta), sz = Math.sin(theta);
    const broad = fbm(cx * 1.3 + 3, y * 0.12, sz * 1.3, seed, 3) * 0.32;
    // stepped ledges: strata stand proud of the cliff face in bands
    const band = Math.floor((y + fbm(cx, y * 0.2, sz, seed + 5, 2) * 1.5) * 1.1);
    const ledge = (((band * 2654435761) >>> 0) % 7) / 7 - 0.5;
    return 1 + broad + ledge * 0.07;
  };
  const topY = (x: number, z: number) => {
    const r = Math.hypot(x, z) / R;
    return fbm(x * 0.11, 0, z * 0.11, seed + 9, 4) * 1.4 * (1 - r * r * 0.6) + 0.5 * (1 - r * r);
  };

  /* --- profile: flat crown, a cliff that bellies out, a long tapering underside --- */
  const prof: THREE.Vector2[] = [];
  const crown = hi ? 14 : 7;
  for (let i = 0; i <= crown; i++) prof.push(new THREE.Vector2(Math.max(0.001, (i / crown) * R), 0));
  const body = hi ? 46 : 18;
  for (let i = 1; i <= body; i++) {
    const t = i / body;
    // the cliff: near-vertical for the first stretch, then a deep inverted cone
    const r = t < 0.22 ? R * (1 - t * 0.15) : R * 0.97 * Math.pow(1 - (t - 0.22) / 0.78, 1.35);
    prof.push(new THREE.Vector2(Math.max(0.001, r), -D * t));
  }
  const geo = new THREE.LatheGeometry(prof, hi ? 150 : 56);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const theta = Math.atan2(v.z, v.x);
    const r = Math.hypot(v.x, v.z);
    if (v.y > -0.001) {
      // crown: rolling ground, rim pushed out with the cliff
      const s = reach(theta, 0);
      v.set(v.x * s, topY(v.x, v.z), v.z * s);
    } else {
      const s = reach(theta, v.y);
      const deep = -v.y / D;
      // the underside hangs in uneven lobes
      const lobe = 1 + fbm(Math.cos(theta) * 2.2, 7, Math.sin(theta) * 2.2, seed + 3, 3) * 0.55 * deep;
      const twist = fbm(v.x * 0.3, v.y * 0.3, v.z * 0.3, seed + 11, 3) * 0.6 * (r / R);
      v.set(v.x * s + twist, v.y * lobe, v.z * s - twist);
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  /* --- paint --- */
  const nrm = geo.attributes.normal as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ny = nrm.getY(i);
    const n1 = fbm(v.x * 0.35, v.y * 0.35, v.z * 0.35, seed + 21, 3);
    if (v.y > -0.35 && ny > 0.45) {
      c.copy(PALETTE.canopyDeep).lerp(PALETTE.emerald, 0.35 + n1 * 0.5);
    } else {
      const strata = Math.sin(v.y * 2.4 + n1 * 3.2);
      c.copy(PALETTE.stone);
      if (strata > 0.55) c.lerp(PALETTE.ochre, (strata - 0.55) * 1.6);
      else if (strata < -0.6) c.lerp(PALETTE.stoneDark, (-strata - 0.6) * 1.8);
      // mineral seams
      const seam = Math.abs(fbm(v.x * 0.5 + 9, v.y * 0.9, v.z * 0.5, seed + 33, 3));
      if (seam < 0.05) c.lerp(PALETTE.teal, (0.05 - seam) * 12);
      // moss and drip below the rim
      const moss = Math.max(0, 1 + v.y / (D * 0.16) + n1 * 0.6);
      if (moss > 0) c.lerp(PALETTE.emerald, Math.min(0.85, moss * 0.6));
      // the underside cools into shadow
      const deep = Math.min(1, Math.max(0, -v.y / D - 0.35) * 1.6);
      c.lerp(PALETTE.shadow, deep * 0.55);
    }
    // painterly breakup: small lightness jitter
    const j = 1 + fbm(v.x * 2.1, v.y * 2.1, v.z * 2.1, seed + 41, 2) * 0.14;
    col[i * 3] = c.r * j;
    col[i * 3 + 1] = c.g * j;
    col[i * 3 + 2] = c.b * j;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const surface = (theta: number, frac: number) => {
    const x0 = Math.cos(theta) * frac * R, z0 = Math.sin(theta) * frac * R;
    const s = reach(theta, 0);
    return new THREE.Vector3(x0 * s, topY(x0, z0), z0 * s);
  };

  /* --- canopy: clusters of crowns, denser toward the rim, a few emergent giants --- */
  const matrices: THREE.Matrix4[] = [];
  const colors: THREE.Color[] = [];
  const trunks: THREE.Matrix4[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pickColor = () => {
    const r = rand();
    const base = r < 0.3 ? PALETTE.canopyDeep.clone().lerp(PALETTE.emerald, 0.45) : r < 0.72 ? PALETTE.emerald.clone() : r < 0.95 ? PALETTE.jade.clone() : r < 0.985 ? PALETTE.ochre.clone() : PALETTE.orchid.clone();
    return base.offsetHSL((rand() - 0.5) * 0.03, (rand() - 0.5) * 0.08, (rand() - 0.5) * 0.06);
  };
  const crownAt = (p: THREE.Vector3, size: number, flat = 1) => {
    e.set(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4);
    q.setFromEuler(e);
    matrices.push(new THREE.Matrix4().compose(p, q, new THREE.Vector3(size, size * 0.78 * flat, size)));
    colors.push(pickColor());
  };
  const trees = Math.round(R * R * 1.15 * density * (hi ? 1 : 0.45));
  for (let i = 0; i < trees; i++) {
    const theta = rand() * Math.PI * 2;
    const frac = Math.sqrt(rand()) * 0.97;
    const base = surface(theta, frac);
    const h = 0.6 + rand() * 1.1;
    const size = 0.75 + rand() * 0.9;
    trunks.push(new THREE.Matrix4().compose(base.clone().add(new THREE.Vector3(0, h / 2, 0)), new THREE.Quaternion(), new THREE.Vector3(0.14, h, 0.14)));
    const top = base.clone().add(new THREE.Vector3(0, h + size * 0.4, 0));
    crownAt(top, size);
    const extra = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < extra; k++) {
      crownAt(top.clone().add(new THREE.Vector3((rand() - 0.5) * size * 1.4, (rand() - 0.4) * size * 0.8, (rand() - 0.5) * size * 1.4)), size * (0.5 + rand() * 0.4));
    }
  }
  // emergent giants: tall trunks, broad flattened crowns
  const giants = hi ? 4 : 1;
  for (let i = 0; i < giants; i++) {
    const base = surface(rand() * Math.PI * 2, 0.2 + rand() * 0.55);
    const h = 3.6 + rand() * 2.2;
    trunks.push(new THREE.Matrix4().compose(base.clone().add(new THREE.Vector3(0, h / 2, 0)), new THREE.Quaternion(), new THREE.Vector3(0.32, h, 0.32)));
    const top = base.clone().add(new THREE.Vector3(0, h, 0));
    for (let k = 0; k < 5; k++) crownAt(top.clone().add(new THREE.Vector3((rand() - 0.5) * 2.6, rand() * 0.6, (rand() - 0.5) * 2.6)), 1.3 + rand() * 0.7, 0.55);
  }
  // rim overhang: foliage spilling over the cliff edge
  const rim = Math.round(R * 7 * (hi ? 1 : 0.5));
  for (let i = 0; i < rim; i++) {
    const theta = rand() * Math.PI * 2;
    const p = surface(theta, 1.0);
    p.y -= rand() * 0.9;
    crownAt(p, 0.45 + rand() * 0.55);
  }

  /* --- roots and vines hanging from the underside --- */
  const hangParts: THREE.BufferGeometry[] = [];
  const paint = (g: THREE.BufferGeometry, color: THREE.Color) => {
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) color.toArray(arr, i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
  };
  const roots = hi ? 9 : 4;
  for (let i = 0; i < roots; i++) {
    const theta = rand() * Math.PI * 2;
    const yStart = -D * (0.15 + rand() * 0.4);
    const rr = R * 0.9 * Math.pow(1 - (-yStart / D - 0.0) * 0.9, 1.2) * reach(theta, yStart);
    const start = new THREE.Vector3(Math.cos(theta) * rr, yStart, Math.sin(theta) * rr);
    const len = D * (0.35 + rand() * 0.6);
    const pts = [start];
    for (let k = 1; k <= 5; k++) {
      const t = k / 5;
      pts.push(new THREE.Vector3(start.x * (1 - t * 0.35) + (rand() - 0.5) * 0.8, yStart - len * t, start.z * (1 - t * 0.35) + (rand() - 0.5) * 0.8));
    }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), hi ? 24 : 8, 0.05 + rand() * 0.09, 5, false);
    hangParts.push(paint(tube, PALETTE.bark.clone().offsetHSL(0, 0, (rand() - 0.5) * 0.08)));
  }
  const vines = hi ? 22 : 6;
  for (let i = 0; i < vines; i++) {
    const theta = rand() * Math.PI * 2;
    const p = surface(theta, 1.0);
    const len = 0.8 + rand() * D * 0.22;
    const out = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)).multiplyScalar(0.25);
    const pts = [p.clone(), p.clone().add(out).add(new THREE.Vector3(0, -len * 0.5, 0)), p.clone().add(out.multiplyScalar(0.6)).add(new THREE.Vector3(0, -len, 0))];
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.025 + rand() * 0.02, 3, false);
    hangParts.push(paint(tube, (rand() < 0.5 ? PALETTE.jade : PALETTE.emerald).clone()));
  }
  const hang = mergeGeometries(hangParts.map((g) => g.toNonIndexed()), false) ?? new THREE.BufferGeometry();
  hangParts.forEach((g) => g.dispose());

  /* --- waterfall anchors --- */
  const fallList = falls.map((theta, i) => {
    const top = surface(theta, 1.0);
    top.y = Math.min(top.y, 0.2) - 0.05;
    return { top, out: new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)), length: D * (i === 0 ? 1.5 : 0.9), width: i === 0 ? 1.5 : 0.6 };
  });

  return { rock: geo, hang, canopy: { matrices, colors }, trunks, falls: fallList };
}

/** A lumpy crown shape, shared by every canopy instance. */
export function crownGeometry(seed = 7) {
  const g = new THREE.IcosahedronGeometry(1, 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + fbm(v.x * 1.6, v.y * 1.6, v.z * 1.6, seed, 3) * 0.32;
    v.multiplyScalar(k);
    // flatten the underside a little, like a real crown
    if (v.y < 0) v.y *= 0.7;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Soft stepped light ramp: the painterly banding, not a hard cel cut. */
export function rampTexture() {
  const data = new Uint8Array([125, 125, 125, 255, 170, 170, 170, 255, 218, 218, 218, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** A soft round sprite drawn once on a canvas (mist, spores, cloud puffs). */
export function softSprite(kind: 'dot' | 'cloud' = 'dot', seed = 1) {
  const size = kind === 'cloud' ? 256 : 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const rand = rng(seed);
  const puff = (x: number, y: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  if (kind === 'dot') puff(size / 2, size / 2, size / 2, 1);
  else for (let i = 0; i < 14; i++) puff(size * (0.25 + rand() * 0.5), size * (0.4 + rand() * 0.25), size * (0.12 + rand() * 0.16), 0.5);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

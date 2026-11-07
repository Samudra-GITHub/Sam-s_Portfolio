import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { noise3, rng } from '../noise';
import { buildGrid, meshGrid } from './terrain';
import { COMMON, leafMaterial, type Common } from './shaders';
import { clusterGeometry, Flora, frondGeometry, frondTexture, instanced, leafTexture } from './flora';

/**
 * Fauna of the Veil Archipelago: five original species (see docs/CREATURES.md),
 * made with the same pipeline as the islands. Bodies are signed-distance
 * sculpts meshed by surface nets with baked AO; fins, wings and antennae are
 * parametric sheets whose UVs drive their motion in the vertex shader. Colour
 * and glow are baked per vertex; lighting is the shared painted model.
 *
 * Every species is built in its own frame: +x forward, +y up, units match the
 * world (a hero tree is 10 to 15 tall).
 */

type P = [number, number, number];
type RGB = [number, number, number];
type Paint = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => [number, number, number, number];

const hex = (h: string): RGB => {
  const c = new THREE.Color(h);
  return [c.r, c.g, c.b];
};
const mix3 = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sat = (x: number) => Math.min(1, Math.max(0, x));
const sstep = (a: number, b: number, x: number) => {
  const t = sat((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------- distance kit */

const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
/** ellipsoid (bound, not exact) */
function ell(x: number, y: number, z: number, c: P, r: P) {
  const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2];
  const k0 = Math.hypot(px, py, pz);
  const k1 = Math.hypot(px / r[0], py / r[1], pz / r[2]);
  return k1 > 1e-6 ? (k0 * (k0 - 1)) / k1 : -Math.min(r[0], r[1], r[2]);
}
/** a capsule whose radius tapers from r1 at a to r2 at b */
function cone(x: number, y: number, z: number, a: P, b: P, r1: number, r2: number) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2];
  const l2 = bx * bx + by * by + bz * bz;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const px = x - a[0], py = y - a[1], pz = z - a[2];
  const yv = px * bx + py * by + pz * bz;
  const zv = yv - l2;
  const qx = px * l2 - bx * yv, qy = py * l2 - by * yv, qz = pz * l2 - bz * yv;
  const x2 = qx * qx + qy * qy + qz * qz;
  const y2 = yv * yv * l2;
  const z2 = zv * zv * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(zv) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(yv) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + yv * rr) * il2 - r1;
}
/** a tapering chain of segments through points */
function chain(x: number, y: number, z: number, pts: P[], r0: number, r1: number, k = 0.02) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1);
    d = smin(d, cone(x, y, z, pts[i], pts[i + 1], r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1), k);
  }
  return d;
}

/** mesh a distance function and bake colour/glow per vertex */
function sculpt(sdf: (x: number, y: number, z: number) => number, min: P, max: P, cell: number, paint: Paint, aoRays = 8) {
  const g = meshGrid(buildGrid((x, y, z) => -sdf(x, y, z), min, max, cell), 1, aoRays);
  const pos = g.attributes.position, nor = g.attributes.normal;
  const col = new Float32Array(pos.count * 3), glow = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const [r, gg, b, w] = paint(pos.getX(i), pos.getY(i), pos.getZ(i), nor.getX(i), nor.getY(i), nor.getZ(i));
    col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b;
    glow[i] = w;
  }
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
  return g;
}

/**
 * A membrane sheet over (u, v) in [0,1]². `v` is the distance from the root
 * (the motion amplitude grows with it); `u` runs along the root edge, and the
 * ribs follow it.
 */
function sheet(fn: (u: number, v: number, out: THREE.Vector3) => void, nu: number, nv: number, paint: (u: number, v: number) => [number, number, number, number]) {
  const pos: number[] = [], uv: number[] = [], col: number[] = [], glow: number[] = [], ao: number[] = [], idx: number[] = [];
  const p = new THREE.Vector3();
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv;
      fn(u, v, p);
      pos.push(p.x, p.y, p.z);
      uv.push(u, v);
      const [r, g, b, w] = paint(u, v);
      col.push(r, g, b);
      glow.push(w);
      ao.push(0.7 + 0.3 * v);
    }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 1));
  g.setAttribute('aAO', new THREE.Float32BufferAttribute(ao, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const mirrorZ = (g: THREE.BufferGeometry) => {
  const m = g.clone().scale(1, 1, -1);
  const ix = m.index!.array as Uint32Array | Uint16Array;
  for (let i = 0; i < ix.length; i += 3) {
    const t = ix[i + 1];
    ix[i + 1] = ix[i + 2];
    ix[i + 2] = t;
  }
  m.computeVertexNormals();
  return m;
};

/* --------------------------------------------------------------- material */

const FAUNA_VS = /* glsl */ `
attribute vec3 aCol; attribute float aGlow; attribute float aAO;
uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uWave; uniform float uLift; uniform vec2 uNeck;
// scroll cues (0..1): a flock scatters, a grazer looks up, wings beat wider
uniform float uScatter; uniform float uAlert; uniform float uBoost;
varying vec3 vWP; varying vec3 vN; varying vec3 vCol; varying float vGlow; varying float vAO; varying vec2 vUv;
void main(){
  #if defined(FLOCK)
  // a flock flies on the GPU: the instance matrix holds each bird's flight, not its pose, and is uploaded
  // once. Per-frame uploads of a buffer the GPU is still drawing from stall ANGLE (measured: 11 ms a frame).
  // col 0: flock anchor, flock index; col 1: circle radius, height, angular speed, phase; col 2: bank, scale
  vec4 A = instanceMatrix[0], B = instanceMatrix[1], S = instanceMatrix[2];
  vec3 ctr = A.xyz + vec3(sin(uTime * 0.07 + A.w) * 12.0, sin(uTime * 0.3 + A.w) * 4.0, cos(uTime * 0.05 + A.w) * 12.0);
  float fa = uTime * B.z + B.w;
  // scattering, each bird swings wider and climbs by its own amount
  float sc = uScatter * (0.6 + 0.4 * fract(B.w * 7.3));
  vec3 at = ctr + vec3(cos(fa) * B.x * (1.0 + 1.6 * sc), B.y + sin(fa * 1.7) * 0.8 + sc * (14.0 + B.x * 1.5), sin(fa) * B.x * (1.0 + 1.6 * sc));
  // heading along the circle it flies, banked into the turn (Euler YXZ: yaw, bank, roll)
  float yw = -fa - 1.5707963, bk = S.x, rl = 0.35;
  mat3 Ry = mat3(cos(yw), 0.0, -sin(yw), 0.0, 1.0, 0.0, sin(yw), 0.0, cos(yw));
  mat3 Rx = mat3(1.0, 0.0, 0.0, 0.0, cos(bk), sin(bk), 0.0, -sin(bk), cos(bk));
  mat3 Rz = mat3(cos(rl), sin(rl), 0.0, -sin(rl), cos(rl), 0.0, 0.0, 0.0, 1.0);
  mat3 R = Ry * Rx * Rz * S.y;
  mat4 m = modelMatrix * mat4(vec4(R[0], 0.0), vec4(R[1], 0.0), vec4(R[2], 0.0), vec4(at, 1.0));
  float ph = B.w * 3.0;
  #else
  #ifdef USE_INSTANCING
  mat4 m = modelMatrix * instanceMatrix;
  #else
  mat4 m = modelMatrix;
  #endif
  // each individual moves on its own phase
  float ph = dot(m[3].xyz, vec3(0.37, 0.11, 0.23));
  #endif
  vec3 p = position;
  vec3 nrm = normal;
  #ifdef SHEET
  // membranes: a wave travels along u, its amplitude grows away from the root (v); uLift folds the whole
  // sheet up and down about the root (wingbeat), uWave sets how many waves run along it (fin ripple)
  float s = sin(uTime * uFreq + uv.x * uWave + ph);
  float bend = (uAmp * pow(uv.y, 1.3) * s + uLift * uv.y * s) * (1.0 + 1.5 * uBoost);
  p.y += bend;
  #endif
  #ifdef GRAZE
  // the head dips to graze and lifts again, hinged at the neck; the body stays still
  float w = smoothstep(uNeck.x, uNeck.x + 1.2, p.x);
  float ga = (sin(uTime * 0.32 + ph) * 0.5 + 0.5) * 0.42 * w;
  // alerted, the head comes up above the line of the back, each animal a beat after the last
  float al = clamp(uAlert * 1.5 - fract(ph * 0.31) * 0.5, 0.0, 1.0);
  ga = mix(ga, -0.22 * w, al * al * (3.0 - 2.0 * al));
  vec2 q = p.xy - uNeck;
  float cg = cos(ga), sg = sin(ga);
  p.xy = uNeck + vec2(q.x * cg + q.y * sg, -q.x * sg + q.y * cg);
  nrm.xy = vec2(nrm.x * cg + nrm.y * sg, -nrm.x * sg + nrm.y * cg);
  #endif
  vec4 wp = m * vec4(p, 1.0);
  vWP = wp.xyz; vN = normalize(mat3(m) * nrm); vCol = aCol; vGlow = aGlow; vAO = aAO; vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FAUNA_FS = /* glsl */ `
${COMMON}
uniform vec3 uGlowCol; uniform float uRibs; uniform float uSheen; uniform float uBoost;
varying vec3 vWP; varying vec3 vN; varying vec3 vCol; varying float vGlow; varying float vAO; varying vec2 vUv;
void main(){
  vec3 n = normalize(vN);
  vec3 V = normalize(uCam - vWP);
  #ifdef SHEET
  if (dot(n, V) < 0.0) n = -n;
  #endif
  vec3 alb = vCol;
  float brush = snoise(vWP * 3.0) * 0.45;
  #ifdef SHEET
  float fr = fract(vUv.x * uRibs);
  float rib = 1.0 - smoothstep(0.03, 0.12, min(fr, 1.0 - fr));
  alb *= 1.0 - rib * 0.35;
  #endif
  float sh = shadowAt(vWP, 0.002);
  vec3 col = paint(alb, n, vWP, vAO, brush, sh);
  #ifdef SHEET
  // thin tissue: the sun shines through it
  float back = pow(max(dot(-V, uSun), 0.0), 2.0);
  col += alb * uSunCol * back * 0.55 * sh * (1.0 - rib * 0.6);
  #endif
  // wet eyes and hard plates catch a small highlight
  vec3 H = normalize(uSun + V);
  col += uSunCol * pow(max(dot(n, H), 0.0), 40.0) * uSheen * sh;
  col += uGlowCol * vGlow * (0.75 + 0.25 * sin(uTime * 1.7 + vWP.x * 0.5 + vWP.z * 0.3)) * (1.0 + 1.6 * uBoost);
  gl_FragColor = vec4(fogApply(col, vWP), 1.0);
}`;

export interface Motion {
  amp?: number;
  freq?: number;
  wave?: number;
  lift?: number;
  ribs?: number;
  sheen?: number;
  /** grazing pivot (x, y) in the species frame */
  neck?: [number, number];
}
export function faunaMaterial(c: Common, sheetMode: boolean, m: Motion = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: FAUNA_VS,
    fragmentShader: FAUNA_FS,
    defines: { ...(sheetMode ? { SHEET: '' } : {}), ...(m.neck ? { GRAZE: '' } : {}) },
    side: sheetMode ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: {
      ...c,
      uGlowCol: { value: new THREE.Color('#5fd0c0').multiplyScalar(1.4) },
      uAmp: { value: m.amp ?? 0 },
      uFreq: { value: m.freq ?? 1 },
      uWave: { value: m.wave ?? 0 },
      uLift: { value: m.lift ?? 0 },
      uRibs: { value: m.ribs ?? 0 },
      uSheen: { value: m.sheen ?? 0.15 },
      uNeck: { value: new THREE.Vector2(...(m.neck ?? [0, 0])) },
      uScatter: { value: 0 },
      uAlert: { value: 0 },
      uBoost: { value: 0 },
    },
  });
}

export interface Species {
  id: string;
  name: string;
  kind: string;
  /** approximate size in world units, for the concept sheet */
  size: string;
  group: THREE.Group;
}

/* ---------------------------------------------------- 1. Veil Drifter */

/** large aerial: a slow cuttlefish-like glider with a fin skirt and two trailing ribbons */
export function veilDrifter(c: Common): Species {
  const r = rng(301);
  const R = (x: number) => (x < 0 ? 0.35 + (1.7 - 0.35) * sat((x + 7) / 7) : 1.7 + (1.25 - 1.7) * sat(x / 5.6));
  const nod: P[] = [];
  for (let x = -4.2; x <= 4.4; x += 1.1) nod.push([x, R(x) * 0.74, 0]);
  const tips: [P, P][] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const s: P = [6.4, Math.sin(a) * 0.55 - 0.15, Math.cos(a) * 0.7];
    tips.push([s, [s[0] + 1.1 + r() * 0.5, s[1] - 0.5 - r() * 0.3, s[2] * 1.25]]);
  }
  const sdf = (x: number, y: number, z: number) => {
    const yy = y / 0.74; // flattened top to bottom
    let d = smin(cone(x, yy, z, [-7, 0, 0], [0, 0, 0], 0.35, 1.7), cone(x, yy, z, [0, 0, 0], [5.6, 0, 0], 1.7, 1.25), 0.8) * 0.74;
    d = smin(d, ell(x, y, z, [6.1, -0.05, 0], [1.05, 0.85, 1.1]), 0.6);
    for (const [a, b] of tips) d = smin(d, cone(x, y, z, a, b, 0.13, 0.04), 0.18);
    for (const n of nod) d = smin(d, ell(x, y, z, n, [0.28, 0.2, 0.22]), 0.12);
    return d;
  };
  const back = hex('#3f5a7c'), belly = hex('#e6d9c0'), speck = hex('#6fc7b9'), peach = hex('#e9a988');
  const body = sculpt(sdf, [-7.6, -2, -2.1], [8.2, 2, 2.1], 0.15, (x, y, z, _nx, ny) => {
    let col = mix3(belly, back, sstep(-0.35, 0.25, ny));
    const sp = noise3(x * 2.4, y * 2.4, z * 2.4, 4);
    if (sp > 0.45 && ny > -0.1) col = mix3(col, speck, 0.7);
    if (x > 6.6) col = mix3(col, peach, sstep(6.6, 7.2, x));
    let glow = 0;
    for (const n of nod) if (Math.hypot(x - n[0], y - n[1], z - n[2]) < 0.34) { col = speck; glow = 0.55; }
    return [col[0], col[1], col[2], glow];
  });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(body, faunaMaterial(c, false, { sheen: 0.25 })));

  // fin skirt: along the body from the tail to behind the head
  const finIn = hex('#eab08c'), finOut = hex('#68bfb3');
  const fin = sheet((u, v, o) => {
    const x = -5.6 + u * 10.8;
    const span = 7.6 * Math.pow(Math.sin(Math.PI * u), 0.75) * (1 - 0.09 * Math.pow(Math.sin(u * Math.PI * 9), 2) * v);
    o.set(x - v * v * 0.8, -0.2 - v * v * span * 0.1, R(x) * 0.85 + v * span);
  }, 56, 14, (_u, v) => {
    const col = mix3(finIn, finOut, sstep(0.2, 1, v));
    return [col[0], col[1], col[2], v > 0.92 ? 0.25 : 0];
  });
  const finMat = faunaMaterial(c, true, { amp: 0.9, freq: 1.1, wave: Math.PI * 3, ribs: 20 });
  g.add(new THREE.Mesh(fin, finMat), new THREE.Mesh(mirrorZ(fin), finMat));

  // two trailing ribbons (here v runs down the length, so they ripple more toward the end)
  const ribMat = faunaMaterial(c, true, { amp: 0.7, freq: 1.3, wave: Math.PI * 2, ribs: 3 });
  for (const side of [-1, 1]) {
    const rib = sheet((u, v, o) => {
      const w = 0.55 * (1 - v * 0.75);
      o.set(-6.6 - v * 11, Math.sin(v * 5) * 0.3 - v * 0.6, side * (0.45 + v * 0.6) + (u - 0.5) * w);
    }, 4, 40, (_u, v) => {
      const col = mix3(finIn, finOut, v);
      return [col[0], col[1], col[2], v > 0.95 ? 0.4 : 0];
    });
    g.add(new THREE.Mesh(rib, ribMat));
  }
  return { id: 'drifter', name: 'Veil Drifter', kind: 'Large aerial', size: '14 long, 18 across the fins', group: g };
}

/* -------------------------------------------------------- 2. Spinlets */

/** small aerial: a samara-like flyer with two long and two short blades; flies in flocks */
export function spinlet(c: Common): Species {
  const amber = hex('#d9933f'), rust = hex('#9c4f2a'), dark = hex('#3b2a22'), cream = hex('#efe0c2');
  const body = sculpt(
    (x, y, z) => smin(smin(cone(x, y, z, [-0.2, 0, 0], [0.08, 0, 0], 0.012, 0.03), ell(x, y, z, [0.1, 0.004, 0], [0.07, 0.042, 0.045]), 0.03), ell(x, y, z, [0.18, 0.006, 0], [0.035, 0.03, 0.03]), 0.02),
    [-0.26, -0.09, -0.09], [0.3, 0.09, 0.09], 0.02,
    (x, _y, _z, _nx, ny) => {
      const col = mix3(cream, dark, sstep(-0.2, 0.4, ny) * 0.8);
      return x > 0.22 ? [0.08, 0.06, 0.05, 0] : [col[0], col[1], col[2], 0];
    },
    6,
  );
  const blade = (span: number, chord: number, rootX: number, sweep: number) =>
    sheet((u, v, o) => {
      // u: across the chord (leading edge to trailing), v: out along the span
      const w = chord * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, v * 1.15))) * (v > 0.9 ? 1 - (v - 0.9) * 6 : 1);
      o.set(rootX - v * sweep - u * w, v * span * 0.12, 0.035 + v * span);
    }, 3, 8, (u, v) => {
      let col = mix3(amber, rust, sstep(0.3, 1, u));
      if (v > 0.82) col = mix3(col, dark, sstep(0.82, 0.95, v));
      return [col[0], col[1], col[2], 0];
    });
  const fore = blade(0.5, 0.13, 0.08, 0.06), hind = blade(0.24, 0.09, -0.06, 0.04);
  const wingMat = faunaMaterial(c, true, { lift: 0.09, freq: 14, ribs: 9 });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(body, faunaMaterial(c, false)));
  for (const w of [fore, hind]) g.add(new THREE.Mesh(w, wingMat), new THREE.Mesh(mirrorZ(w), wingMat));
  return { id: 'spinlet', name: 'Spinlets', kind: 'Small aerial, flocks', size: '0.5 across, flocks of 40 to 80', group: g };
}

/* ----------------------------------------------------- 3. Shingleback */

/** canopy dweller: round, bark-plated, prehensile tail, clings under boughs */
export function shingleback(c: Common): Species {
  const tail: P[] = [[-0.62, 0.02, 0], [-1.05, -0.08, 0], [-1.42, 0.08, 0], [-1.5, 0.42, 0], [-1.3, 0.6, 0], [-1.1, 0.48, 0], [-1.16, 0.32, 0]];
  const legs: [P, P][] = [];
  for (const sx of [0.38, -0.38]) for (const sz of [1, -1]) legs.push([[sx, -0.3, sz * 0.34], [sx + 0.12 * Math.sign(sx), -0.74, sz * 0.42]]);
  const eyes: P[] = [[0.97, 0.16, 0.17], [0.97, 0.16, -0.17]];
  // overlapping plates: a sawtooth along the body, offset row by row around it
  const plate = (x: number, y: number, z: number) => {
    const a = Math.atan2(y + 0.05, z) * 3.2;
    const row = Math.floor(a);
    const s = (((x * 5.5 + (row % 2) * 0.5) % 1) + 1) % 1;
    const across = Math.abs(a - row - 0.5) * 2; // 0 mid-plate, 1 at the seam between rows
    return { s, across, on: sstep(-0.3, 0.05, y) };
  };
  const sdf = (x: number, y: number, z: number) => {
    const pl = plate(x, y, z);
    let d = ell(x, y, z, [0, 0, 0], [0.78, 0.6, 0.6]) - 0.05 * pl.s * pl.on;
    d = smin(d, ell(x, y, z, [0.74, 0.06, 0], [0.34, 0.29, 0.29]), 0.12);
    d = smin(d, cone(x, y, z, [0.9, 0.02, 0], [1.12, -0.03, 0], 0.15, 0.07), 0.06);
    d = smin(d, chain(x, y, z, tail, 0.2, 0.05, 0.05), 0.1);
    for (const [a, b] of legs) {
      d = smin(d, cone(x, y, z, a, b, 0.12, 0.075), 0.08);
      d = smin(d, cone(x, y, z, b, [b[0] + 0.12, b[1] - 0.04, b[2]], 0.04, 0.012), 0.02);
    }
    for (const e of eyes) d = smin(d, ell(x, y, z, e, [0.075, 0.08, 0.075]), 0.02);
    return d;
  };
  const bark = hex('#5a3f2c'), bark2 = hex('#7d5f42'), moss = hex('#5f7f3d'), belly = hex('#c9b08c'), eye = hex('#17120f');
  const body = sculpt(sdf, [-1.85, -0.9, -0.72], [1.25, 0.85, 0.72], 0.04, (x, y, z, _nx, ny) => {
    for (const e of eyes) if (Math.hypot(x - e[0], y - e[1], z - e[2]) < 0.1) return [eye[0], eye[1], eye[2], 0];
    const pl = plate(x, y, z);
    let col = mix3(bark, bark2, sstep(0.1, 0.9, pl.s) * (1 - pl.across * 0.4));
    col = mix3(col, moss, sstep(0.82, 0.97, pl.s) * pl.on * 0.8);
    if (pl.s > 0.95 && pl.on > 0.5) col = col.map((v) => v * 0.72) as RGB; // the lip of each plate
    col = mix3(belly, col, sstep(-0.45, 0.05, ny + y * 0.6));
    if (x > 0.5 && pl.on < 0.5) col = mix3(col, belly, 0.5);
    return [col[0], col[1], col[2], 0];
  });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(body, faunaMaterial(c, false, { sheen: 0.35 })));
  return { id: 'shingleback', name: 'Shingleback', kind: 'Canopy dweller', size: '1.5 long', group: g };
}

/* -------------------------------------------------------- 4. Mossback */

/** large terrestrial: a slow grazer, shovel-snouted, with a living garden on its back */
export function mossback(c: Common): Species {
  const legs: [P, P][] = [];
  for (const sx of [1.85, -1.75]) for (const sz of [1.25, -1.25]) legs.push([[sx, 2.7, sz], [sx * 1.05, 0.45, sz * 1.06]]);
  const eyes: P[] = [[4.72, 3.02, 0.62], [4.72, 3.02, -0.62]];
  const tusks: [P, P][] = [[[4.6, 2.0, 0.55], [5.55, 2.55, 0.78]], [[4.6, 2.0, -0.55], [5.55, 2.55, -0.78]]];
  const sdf = (x: number, y: number, z: number) => {
    let d = ell(x, y, z, [0, 3.4, 0], [3.2, 1.9, 2.0]);
    d = smin(d, ell(x, y, z, [-0.4, 4.35, 0], [2.4, 1.15, 1.6]), 0.9);
    for (const [a, b] of legs) {
      d = smin(d, cone(x, y, z, a, b, 0.78, 0.6), 0.5);
      d = smin(d, ell(x, y, z, [b[0], 0.28, b[2]], [0.85, 0.3, 0.85]), 0.25);
    }
    d = smin(d, cone(x, y, z, [2.6, 3.7, 0], [3.95, 2.95, 0], 1.05, 0.78), 0.6);
    d = smin(d, ell(x, y, z, [4.3, 2.65, 0], [0.95, 0.78, 0.82]), 0.4);
    d = smin(d, ell(x, y, z, [5.15, 2.08, 0], [0.78, 0.22, 0.88]), 0.25);
    for (const [a, b] of tusks) d = smin(d, cone(x, y, z, a, b, 0.13, 0.04), 0.06);
    d = smin(d, cone(x, y, z, [-3.0, 3.7, 0], [-4.0, 2.3, 0], 0.42, 0.1), 0.3);
    for (const e of eyes) d = smin(d, ell(x, y, z, e, [0.13, 0.13, 0.13]), 0.05);
    return d;
  };
  const hide = hex('#545c68'), belly = hex('#8a9294'), moss = hex('#4f7a45'), moss2 = hex('#7b9a4c'), ivory = hex('#e8dcc2'), eye = hex('#14110f');
  const body = sculpt(sdf, [-4.5, -0.1, -2.5], [6.3, 6.0, 2.5], 0.15, (x, y, z, _nx, ny) => {
    for (const e of eyes) if (Math.hypot(x - e[0], y - e[1], z - e[2]) < 0.16) return [eye[0], eye[1], eye[2], 0];
    for (const [a, b] of tusks) {
      const t = sat(((x - a[0]) * (b[0] - a[0]) + (y - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2));
      if (Math.hypot(x - (a[0] + (b[0] - a[0]) * t), y - (a[1] + (b[1] - a[1]) * t), z - (a[2] + (b[2] - a[2]) * t)) < 0.17 && x > 4.7) return [ivory[0], ivory[1], ivory[2], 0];
    }
    let col = mix3(belly, hide, sstep(-0.5, 0.1, ny));
    col = mix3(col, col.map((v) => v * 0.74) as RGB, sstep(0.3, 0.9, Math.sin(y * 7 + noise3(x, y, z, 9) * 3)) * 0.6); // hide folds
    const m = sstep(0.45, 0.8, ny + noise3(x * 0.8, y * 0.8, z * 0.8, 3) * 0.25) * sstep(3.9, 4.6, y);
    col = mix3(col, mix3(moss, moss2, sat(noise3(x * 1.7, y, z * 1.7, 5) * 0.5 + 0.5)), m);
    return [col[0], col[1], col[2], 0];
  });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(body, faunaMaterial(c, false, { sheen: 0.1, neck: [2.5, 3.6] })));

  // the garden on its back, grown with the island flora
  const r = rng(77);
  const flora = new Flora(r);
  const pos = body.attributes.position, nor = body.attributes.normal;
  const spots: THREE.Vector3[] = [];
  for (let tries = 0; tries < 4000 && spots.length < 46; tries++) {
    const i = Math.floor(r() * pos.count);
    if (nor.getY(i) < 0.8 || pos.getY(i) < 4.7) continue;
    const p = new THREE.Vector3().fromBufferAttribute(pos, i);
    if (spots.some((q) => q.distanceTo(p) < 0.45)) continue;
    spots.push(p);
    if (spots.length % 3) flora.shrub(p.clone().add(new THREE.Vector3(0, -0.05, 0)), 0.42);
    else flora.fern(p.clone(), 0.5);
  }
  const lm = leafMaterial(c, leafTexture());
  g.add(instanced(clusterGeometry(15, 3), lm, flora.leaves));
  if (flora.blossoms.length) g.add(instanced(clusterGeometry(8, 5), lm, flora.blossoms));
  g.add(instanced(frondGeometry(), leafMaterial(c, frondTexture()), flora.fronds));
  return { id: 'mossback', name: 'Mossback', kind: 'Large terrestrial', size: '6 tall, 10 long', group: g };
}

/* ------------------------------------------------------ 5. Lumen Moth */

/** bioluminescent: a moth whose eyespots and veins glow the teal of the mineral seams it feeds on */
export function lumenMoth(c: Common): Species {
  const fur = hex('#3e3430'), furLight = hex('#7d6a58'), wingA = hex('#4b3f55'), wingB = hex('#7a6478'), teal = hex('#7fe3d2'), dark = hex('#1f1a24');
  const body = sculpt(
    (x, y, z) => {
      const fuzz = noise3(x * 90, y * 90, z * 90, 2) * 0.006;
      let d = cone(x, y, z, [-0.17, 0, 0], [0.05, 0, 0], 0.02, 0.05) - fuzz;
      d = smin(d, ell(x, y, z, [0.1, 0.005, 0], [0.07, 0.065, 0.065]) - fuzz, 0.03);
      d = smin(d, ell(x, y, z, [0.18, 0, 0], [0.045, 0.045, 0.05]), 0.02);
      return d;
    },
    [-0.22, -0.1, -0.1], [0.25, 0.1, 0.1], 0.02,
    (x, _y, _z, _nx, ny) => {
      let col = mix3(fur, furLight, sstep(-0.2, 0.6, ny));
      if (x < -0.03) col = mix3(col, dark, sat(Math.sin(x * 90) * 0.5 + 0.5) * 0.4); // banded abdomen
      return [col[0], col[1], col[2], x < -0.14 ? 0.3 : 0];
    },
    6,
  );
  // wings: u across the chord, v out along the span; the eyespot ring and the veins glow
  const wing = (span: number, chord: number, rootX: number, sweep: number, spot: [number, number]) =>
    sheet((u, v, o) => {
      const w = chord * (0.45 + 0.75 * Math.sin(Math.PI * Math.min(1, 0.15 + v * 0.95)));
      o.set(rootX - v * sweep - u * w, v * span * 0.05, 0.05 + v * span);
    }, 10, 10, (u, v) => {
      let col = mix3(wingA, wingB, sstep(0.2, 1, v) * 0.7);
      const d = Math.hypot(u - spot[0], (v - spot[1]) * 1.3);
      let glow = 0;
      if (d < 0.1) col = dark;
      else if (d < 0.17) { col = teal; glow = 1; }
      const vein = Math.abs(((v * 7) % 1) - 0.5) > 0.46 && v > 0.15 ? 1 : 0;
      if (vein) glow = Math.max(glow, 0.35);
      if (v > 0.93) col = mix3(col, dark, 0.6);
      return [col[0], col[1], col[2], glow];
    });
  const fore = wing(0.4, 0.21, 0.13, 0.12, [0.45, 0.65]);
  const hind = wing(0.28, 0.19, 0.0, 0.15, [0.5, 0.6]);
  const antenna = sheet((u, v, o) => {
    o.set(0.2 + v * 0.2, 0.03 + v * 0.1, 0.03 + v * 0.14 + (u - 0.5) * 0.05 * Math.sin(Math.PI * v));
  }, 2, 6, () => [furLight[0], furLight[1], furLight[2], 0.15]);
  const wingMat = faunaMaterial(c, true, { lift: 0.03, freq: 2.2, ribs: 14 });
  const antMat = faunaMaterial(c, true, { ribs: 20 });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(body, faunaMaterial(c, false)));
  for (const w of [fore, hind]) g.add(new THREE.Mesh(w, wingMat), new THREE.Mesh(mirrorZ(w), wingMat));
  g.add(new THREE.Mesh(antenna, antMat), new THREE.Mesh(mirrorZ(antenna), antMat));
  return { id: 'moth', name: 'Lumen Moth', kind: 'Bioluminescent', size: '0.6 across', group: g };
}

export const SPECIES = [veilDrifter, spinlet, shingleback, mossback, lumenMoth];

/** merge all meshes of a species sharing one material (fewer draw calls for crowds) */
export function mergeByMaterial(g: THREE.Group) {
  const by = new Map<THREE.Material, THREE.BufferGeometry[]>();
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh) return;
    const mat = m.material as THREE.Material;
    if (!by.has(mat)) by.set(mat, []);
    by.get(mat)!.push(m.geometry.clone().applyMatrix4(m.matrixWorld));
  });
  return [...by].map(([mat, geos]) => ({ mat, geo: mergeGeometries(geos)! }));
}

/* ------------------------------------------------------------- the world */

export interface FaunaSites {
  /** ground on the hero's canopy floor */
  heroTop: THREE.Vector3[];
  /** shaded cliff faces under the hero, with their normals */
  heroCliff: { p: THREE.Vector3; n: THREE.Vector3 }[];
  /** a clearing on a large far formation, and the scale of that formation's plants */
  herd: { at: THREE.Vector3[]; scale: number; face?: THREE.Vector3 };
}

/**
 * One InstancedMesh per part of a species, all sharing one instance matrix
 * buffer, so a whole crowd costs one draw call per part.
 */
function crowd(proto: THREE.Group, count: number, flock = false) {
  const matrix = new THREE.InstancedBufferAttribute(new Float32Array(count * 16), 16);
  // a flock's materials read the matrix as flight parameters (FLOCK); they share the species' uniforms
  const flockOf = new Map<THREE.Material, THREE.Material>();
  const asFlock = (mat: THREE.ShaderMaterial) => {
    if (!flockOf.has(mat)) flockOf.set(mat, new THREE.ShaderMaterial({ vertexShader: mat.vertexShader, fragmentShader: mat.fragmentShader, uniforms: mat.uniforms, defines: { ...mat.defines, FLOCK: '' }, side: mat.side }));
    return flockOf.get(mat)!;
  };
  const parts: THREE.InstancedMesh[] = [];
  proto.updateMatrixWorld(true);
  proto.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh) return;
    const im = new THREE.InstancedMesh(m.geometry, flock ? asFlock(m.material as THREE.ShaderMaterial) : m.material, count);
    im.instanceMatrix = matrix;
    im.frustumCulled = false;
    parts.push(im);
  });
  const group = new THREE.Group();
  parts.forEach((pt) => group.add(pt));
  return { group, matrix, set: (i: number, mtx: THREE.Matrix4) => mtx.toArray(matrix.array, i * 16) };
}

const triCount = (o: THREE.Object3D) => {
  let t = 0;
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh || !m.geometry.index) return;
    const n = (m as unknown as THREE.InstancedMesh).isInstancedMesh ? (m as unknown as THREE.InstancedMesh).count : 1;
    t += (m.geometry.index.count / 3) * n;
  });
  return t;
};

/**
 * Where the scroll cues happen, as stop indices along the page (the same float the camera follows):
 * the herd's island stop, the About overlook (with its camera and target) and the Toolkit view.
 */
export interface FaunaCues {
  herd: number;
  about: { at: number; cam: THREE.Vector3; look: THREE.Vector3 };
  toolkit: number;
}

/** the fauna materials under an object (they carry the scroll-cue uniforms) */
const shaderMats = (o: THREE.Object3D) => {
  const out: THREE.ShaderMaterial[] = [];
  o.traverse((x) => {
    const m = (x as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
    // fauna materials only: the Mossback's back carries flora materials too
    if (m?.isShaderMaterial && m.uniforms.uScatter && !out.includes(m)) out.push(m);
  });
  return out;
};
const sstep01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Place every species in the scene; returns the per-frame update, which takes the scroll position. */
export function populate(c: Common, scene: THREE.Scene, site: FaunaSites, cues: FaunaCues, low = false) {
  const r = rng(905);
  const root = new THREE.Group();
  root.name = 'fauna';
  scene.add(root);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  // Veil Drifters: slow loops around the whole archipelago, high above the cloud sea
  const drifter = veilDrifter(c).group;
  const drifters = Array.from({ length: low ? 1 : 2 }, (_, i) => {
    const g = i ? drifter.clone() : drifter;
    g.scale.setScalar(i ? 3 : 2.2); // at camera distance a 14-unit animal is a speck
    root.add(g);
    return g;
  });
  // the first loops behind the hero, crossing the arrival view but never nearer than ~90 to any stop's camera;
  // the second sweeps the far formations
  const drifterAt = (a: number, i: number, out: THREE.Vector3) =>
    i === 0
      ? out.set(-20 + Math.cos(a) * 120, 58 + Math.sin(a * 2) * 6, -120 + Math.sin(a) * 70)
      : out.set(-120 + Math.cos(a) * 260, 70 + Math.sin(a * 2) * 10, -200 + Math.sin(a) * 230);

  // Spinlets: two flocks wheeling in the open sky beside the hero. Over the hero they would sit behind the title
  // and tagline in the arrival view; these two patches of open sky either side of it (World raises that view's
  // look by a quarter of its distance) keep them clear of the text
  const FLOCK_AT = [new THREE.Vector3(62, 38, -62), new THREE.Vector3(-62, 38, 42)];
  const spin = spinlet(c).group;
  Array.from({ length: low ? 1 : 2 }, (_, f) => {
    const n = low ? 24 : 40;
    const cr = crowd(spin, n, true);
    // each bird's flight, read by the FLOCK vertex shader (column-major: anchor+flock, circle, bank+scale)
    const a = FLOCK_AT[f];
    for (let i = 0; i < n; i++) {
      m4.set(a.x, 4 + r() * 10, (r() - 0.5) * 0.6, 0, a.y, (r() - 0.5) * 5, 5, 0, a.z, 0.5 + r() * 0.6, 0, 0, f, r() * Math.PI * 2, 0, 1);
      cr.set(i, m4);
    }
    cr.matrix.needsUpdate = true;
    root.add(cr.group);
    return cr;
  });

  // Shinglebacks on the canopy floor
  const shingle = shingleback(c).group;
  site.heroTop.slice(0, 2).forEach((p, i) => {
    const g = i ? shingle.clone() : shingle;
    g.scale.setScalar(2.5);
    g.position.copy(p).add(new THREE.Vector3(0, 0.74 * 2.5, 0));
    g.rotation.y = r() * Math.PI * 2;
    root.add(g);
  });

  // Mossbacks: a small herd grazing a clearing on a large far formation
  const moss = mossback(c).group;
  site.herd.at.slice(0, low ? 2 : 3).forEach((p, i) => {
    const g = i ? moss.clone() : moss;
    g.position.copy(p).add(new THREE.Vector3(0, -0.2 * site.herd.scale, 0));
    g.scale.setScalar(site.herd.scale);
    // side-on to the lens where we know it (a profile reads at a distance), facing either way, a little turned
    const f = site.herd.face;
    g.rotation.y = f ? Math.atan2(f.x, f.z) + (i % 2) * Math.PI + (r() - 0.5) * 0.9 : r() * Math.PI * 2;
    root.add(g);
  });

  // Lumen Moths: resting flat on the shaded cliffs under the hero, wings pulsing
  const moth = lumenMoth(c).group;
  const mothCount = Math.min(site.heroCliff.length, low ? 12 : 24);
  if (mothCount) {
    const cr = crowd(moth, mothCount);
    for (let i = 0; i < mothCount; i++) {
      const { p, n } = site.heroCliff[i];
      q.setFromUnitVectors(up, n).multiply(new THREE.Quaternion().setFromAxisAngle(up, r() * Math.PI * 2));
      cr.set(i, m4.compose(p.clone().addScaledVector(n, 0.15), q, sc.setScalar(7 + r() * 3)));
    }
    cr.matrix.needsUpdate = true;
    root.add(cr.group);
  }

  // the Drifter's pass across the About overlook: from right of the view to left, in front of the far formations
  const ad = cues.about.look.clone().sub(cues.about.cam).normalize();
  const ar = new THREE.Vector3().crossVectors(ad, up).normalize();
  const p2 = new THREE.Vector3(), p3 = new THREE.Vector3();
  const crossing = (s: number, t: number, out: THREE.Vector3) =>
    out.copy(cues.about.cam).addScaledVector(ad, 170).addScaledVector(ar, 110 - 220 * s).addScaledVector(up, 16 + Math.sin(t * 0.5) * 4);
  const spinMats = shaderMats(spin), mossMats = shaderMats(moss), mothMats = shaderMats(moth);
  let lastT = 0, alert = 0;

  return {
    root,
    triangles: () => triCount(root),
    update(t: number, f = 0) {
      const dt = Math.min(0.1, Math.max(0, t - lastT));
      lastT = t;
      const near = (at: number, w: number) => Math.max(0, 1 - Math.abs(f - at) / w);

      // the About overlook: the near Drifter leaves its loop and crosses the view, right to left as you scroll
      const ab = sstep01(near(cues.about.at, 0.9));
      const along = Math.min(1, Math.max(0, (f - cues.about.at + 0.9) / 1.8));
      drifters.forEach((g, i) => {
        const a = t * (i ? 0.01 : 0.022) + i * Math.PI;
        drifterAt(a, i, p0);
        drifterAt(a + 0.004, i, p1);
        if (i === 0 && ab > 0) {
          crossing(along, t, p2);
          crossing(along + 0.004, t, p3);
          p0.lerp(p2, ab);
          p1.lerp(p3, ab);
        }
        g.position.copy(p0);
        g.rotation.set(0, Math.atan2(-(p1.z - p0.z), p1.x - p0.x), Math.sin(a * 2) * 0.05);
      });

      // leaving the arrival view, the flocks break apart and climb; they gather again once out of sight
      const scatter = sstep01((f - 0.05) / 0.55) * sstep01((3 - f) / 1.5);
      for (const m of spinMats) m.uniforms.uScatter.value = scatter;

      // while the camera travels in to the herd's island they look up; at rest they go back to grazing
      const moving = Math.abs(f - cues.herd) > 0.02 && Math.abs(f - cues.herd) < 0.8 ? 1 : 0;
      alert += (moving - alert) * (1 - Math.exp(-dt / (moving > alert ? 0.5 : 2.5)));
      for (const m of mossMats) m.uniforms.uAlert.value = alert;

      // the Toolkit view: the moths under the hero glow brighter and open their wings wider
      const boost = sstep01(near(cues.toolkit, 0.8));
      for (const m of mothMats) m.uniforms.uBoost.value = boost;
    },
  };
}

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COMMON, type Common } from '../shaders';

/**
 * A small kit for the project worlds: architecture built from boxes and turned
 * profiles, baked into one vertex-coloured mesh per material (one draw call),
 * lit by the same painted light and fog as the islands.
 *
 * Every vertex carries a colour, a glow amount and a glow channel. The channels
 * are switched on by the world's choreography (`uOn`, four of them), so lights,
 * signs and screens can come alive one after another as the visitor scrolls.
 */

export type RGB = [number, number, number];
export const hex = (h: string): RGB => {
  const c = new THREE.Color(h);
  return [c.r, c.g, c.b];
};

/** glow channels a world can switch on in sequence */
export const CH = { none: 0, a: 1, b: 2, c: 3, d: 4 } as const;
/** a run of lights that come on one after another (uSeq): step k of the run */
export const SEQ = (k: number) => 5 + k;

export interface Part {
  col: RGB;
  /** 0..1: how much of the colour is light the surface emits once its channel is on */
  glow?: number;
  /** which uOn channel (1..4) switches the glow; 0 glows always */
  ch?: number;
  /** ambient occlusion baked into the part (1 = open) */
  ao?: number;
  /** > 0 makes the part pulse in height with a pulse material (its phase); see archMaterial({ pulse }) */
  aux?: number;
  /** 0..1: a polished surface (vinyl, lacquer, glass, steel) catches the sun and the sky */
  gloss?: number;
}

const _up = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _n = new THREE.Matrix3(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();

export class Builder {
  private pos: number[] = [];
  private nor: number[] = [];
  private col: number[] = [];
  private glow: number[] = [];
  private ao: number[] = [];
  private aux: number[] = [];
  private gloss: number[] = [];
  private idx: number[] = [];

  /** append a geometry under a transform, coloured as one part; `aoY` darkens it toward its foot */
  add(g: THREE.BufferGeometry, m: THREE.Matrix4, p: Part, aoY?: [number, number]) {
    const base = this.pos.length / 3;
    const gp = g.attributes.position, gn = g.attributes.normal;
    _n.getNormalMatrix(m);
    for (let i = 0; i < gp.count; i++) {
      _v.fromBufferAttribute(gp, i);
      const ly = _v.y;
      _v.applyMatrix4(m);
      this.pos.push(_v.x, _v.y, _v.z);
      _v.fromBufferAttribute(gn, i).applyMatrix3(_n).normalize();
      this.nor.push(_v.x, _v.y, _v.z);
      this.col.push(...p.col);
      this.glow.push(p.glow ?? 0, p.ch ?? 0);
      const foot = aoY ? THREE.MathUtils.smoothstep(ly, aoY[0], aoY[1]) : 1;
      this.ao.push((p.ao ?? 1) * (0.55 + 0.45 * foot));
      this.aux.push(p.aux ?? 0);
      this.gloss.push(p.gloss ?? 0);
    }
    const gi = g.index;
    if (gi) for (let i = 0; i < gi.count; i++) this.idx.push(base + gi.getX(i));
    else for (let i = 0; i < gp.count; i++) this.idx.push(base + i);
    g.dispose();
  }

  /**
   * A box: centre, size, yaw (radians), part. Its edges are rounded over (one segment) so they catch the
   * light the way a made thing does; `bevel` sets the radius (0 for a hard edge: tiles, panes).
   */
  box(c: THREE.Vector3Like, size: [number, number, number], yaw: number, p: Part, pitch = 0, roll = 0, bevel?: number) {
    const lo = Math.min(...size);
    const r = bevel ?? Math.min(0.09, lo * 0.2);
    _q.setFromEuler(_e.set(pitch, yaw, roll, 'YXZ'));
    if (r < 0.012) {
      _m.compose(_v.set(c.x, c.y, c.z), _q, _s.set(...size));
      // the foot of each box sits in shade
      this.add(new THREE.BoxGeometry(1, 1, 1), _m.clone(), p, [-0.5, 0.2]);
      return;
    }
    const g = new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(r, lo * 0.45));
    _m.compose(_v.set(c.x, c.y, c.z), _q, _s.set(1, 1, 1));
    this.add(g, _m.clone(), p, [-size[1] / 2, -size[1] / 2 + Math.min(size[1], 1.2) * 0.6]);
  }

  /** a weathered boulder: an icosphere pushed about by noise, flattened on top, half sunk where it sits */
  rock(c: THREE.Vector3Like, r: number, p: Part, seed = 1, squash = 0.7) {
    const g0 = new THREE.IcosahedronGeometry(1, 2);
    g0.deleteAttribute('normal');
    g0.deleteAttribute('uv');
    const g = mergeVertices(g0);
    g0.dispose();
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i);
      const n = Math.sin(_v.x * 3.1 + seed) * Math.sin(_v.y * 2.7 + seed * 1.7) * Math.sin(_v.z * 3.7 + seed * 0.6);
      _v.multiplyScalar(1 + n * 0.28 + Math.sin(_v.x * 7 + _v.z * 5 + seed) * 0.05);
      if (_v.y > 0.35) _v.y = 0.35 + (_v.y - 0.35) * 0.45;
      pos.setXYZ(i, _v.x * r, _v.y * r * squash, _v.z * r);
    }
    g.computeVertexNormals();
    _q.setFromEuler(_e.set(0, seed * 2.3, 0));
    _m.compose(_v.set(c.x, c.y, c.z), _q, _s.set(1, 1, 1));
    this.add(g, _m.clone(), p, [-r * squash, r * squash * 0.4]);
  }

  /** a turned solid (cylinder, cone, disc): base centre, radii, height */
  cyl(c: THREE.Vector3Like, rTop: number, rBot: number, h: number, seg: number, p: Part, open = false) {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open);
    _m.makeTranslation(c.x, c.y + h / 2, c.z);
    this.add(g, _m.clone(), p, [-h / 2, -h / 2 + Math.min(h, 1.2)]);
  }

  /** a profile turned about the y axis (cups, saucers, lamp globes) */
  lathe(c: THREE.Vector3Like, profile: [number, number][], seg: number, p: Part, scale = 1) {
    const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
    g.computeVertexNormals();
    _m.compose(_v.set(c.x, c.y, c.z), _q.identity(), _s.setScalar(scale));
    this.add(g, _m.clone(), p);
  }

  /** a cylinder lying along z (speaker cones, dials, wheels): centre, radius, depth */
  disc(c: THREE.Vector3Like, r: number, depth: number, seg: number, p: Part, yaw = 0) {
    const g = new THREE.CylinderGeometry(r, r, depth, seg);
    _q.setFromEuler(_e.set(Math.PI / 2, yaw, 0, 'YXZ'));
    _m.compose(_v.set(c.x, c.y, c.z), _q, _s.set(1, 1, 1));
    this.add(g, _m.clone(), p);
  }

  /** a slim strut from a to b (lattices, masts, arms) */
  rod(a: THREE.Vector3, b: THREE.Vector3, r: number, p: Part, seg = 5) {
    const d = b.clone().sub(a);
    const g = new THREE.CylinderGeometry(r, r, d.length(), seg, 1, true);
    _q.setFromUnitVectors(_up, d.clone().normalize());
    _m.compose(a.clone().add(b).multiplyScalar(0.5), _q, _s.set(1, 1, 1));
    this.add(g, _m.clone(), p);
  }

  sphere(c: THREE.Vector3Like, r: number, p: Part, seg = 10) {
    const g = new THREE.SphereGeometry(r, seg, Math.max(4, seg >> 1));
    _m.makeTranslation(c.x, c.y, c.z);
    this.add(g, _m.clone(), p);
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aGlow', new THREE.Float32BufferAttribute(this.glow, 2));
    g.setAttribute('aAO', new THREE.Float32BufferAttribute(this.ao, 1));
    g.setAttribute('aAux', new THREE.Float32BufferAttribute(this.aux, 1));
    g.setAttribute('aGloss', new THREE.Float32BufferAttribute(this.gloss, 1));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }

  get triangles() {
    return this.idx.length / 3;
  }
}

/* ------------------------------------------------------------ materials */

const ARCH_VS = /* glsl */ `
attribute vec3 aCol; attribute vec2 aGlow; attribute float aAO; attribute float aAux; attribute float aGloss;
uniform float uTime; uniform float uBase; uniform float uLevel;
varying vec3 vWP; varying vec3 vN; varying vec3 vCol; varying vec2 vGlow; varying float vAO; varying float vGloss; varying float vMeter;
void main(){
  vec3 pos = position;
  vMeter = 1.0;
#ifdef PULSE
  // LED level meters: aux = column number + the segment's height in its column (0..1). Each column follows
  // its own beat; a segment is lit while the level stands above it, scaled by how far the world has woken.
  if (aAux > 0.0) {
    float col = floor(aAux), h = fract(aAux);
    float k = 0.5 + 0.5 * sin(uTime * (2.1 + fract(col * 0.37) * 2.6) + col * 5.3);
    float beat = pow(0.5 + 0.5 * sin(uTime * 7.4), 6.0);
    k = 0.1 + 0.62 * k * k + 0.18 * beat + 0.1 * sin(uTime * 13.0 + col * 2.3);
    float level = mix(0.08, clamp(k, 0.08, 1.0), uLevel);
    vMeter = step(h, level);
  }
#endif
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vCol = aCol; vGlow = aGlow; vAO = aAO; vGloss = aGloss;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const ARCH_FS = /* glsl */ `
${COMMON}
uniform vec4 uOn; uniform vec3 uWarm; uniform vec2 uSeq;
varying vec3 vWP; varying vec3 vN; varying vec3 vCol; varying vec2 vGlow; varying float vAO; varying float vGloss; varying float vMeter;
void main(){
  vec3 n = normalize(vN);
  float brush = snoise(vWP * 2.0) * 0.4;
  float sh = shadowAt(vWP, 0.002);
  // painted breakup: a broad tonal drift and a finer mottle, so no surface is one flat colour
  float tone = snoise(vWP * 0.31 + 3.7) * 0.07 + snoise(vWP * 1.9) * 0.035;
  vec3 alb = vCol * (1.0 + tone * (1.0 - vGlow.x));
  vec3 col = paint(alb, n, vWP, vAO, brush, sh);
  // polished surfaces: the sky at a glancing angle, a tight sun glint where the light lands
  vec3 V = normalize(uCam - vWP);
  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  float glint = pow(max(dot(reflect(-uSun, n), V), 0.0), 48.0) * sh;
  col += vGloss * (uSkyCol * (0.12 + 0.9 * fres) + uSunCol * glint * 0.9);
  // switched light: channel 0 always on, 1..4 follow the choreography
  int ch = int(vGlow.y + 0.5);
  float on = ch == 0 ? 1.0 : ch == 1 ? uOn.x : ch == 2 ? uOn.y : ch == 3 ? uOn.z : ch == 4 ? uOn.w
    : clamp(uSeq.x * uSeq.y - float(ch - 5), 0.0, 1.0);
  // a warm interior flicker, very slight, so lit windows read as lived in
  float life = 0.94 + 0.06 * sin(uTime * 2.3 + vWP.x * 0.7 + vWP.z * 0.4);
  // an unlit meter segment is dark glass with its colour just showing
  col *= mix(0.32, 1.0, vMeter);
  col = mix(col, vCol * uWarm * life, vGlow.x * on * vMeter);
  gl_FragColor = vec4(fogApply(col, vWP), 1.0);
}`;

/** the architecture material: painted light, plus switched glow; `pulse` (a local base height) animates level meters */
export function archMaterial(c: Common, o: { pulse?: number; warm?: [number, number, number]; steps?: number } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: ARCH_VS,
    fragmentShader: ARCH_FS,
    defines: o.pulse !== undefined ? { PULSE: '' } : {},
    uniforms: {
      ...c,
      uOn: { value: new THREE.Vector4() },
      uWarm: { value: new THREE.Vector3(...(o.warm ?? [1.55, 1.3, 1.0])) },
      uSeq: { value: new THREE.Vector2(0, o.steps ?? 1) },
      uBase: { value: o.pulse ?? 0 },
      uLevel: { value: 0 },
    },
  });
}

const SCREEN_VS = /* glsl */ `
varying vec2 vUv; varying vec3 vWP;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;

const SCREEN_FS = /* glsl */ `
${COMMON}
uniform sampler2D uA; uniform sampler2D uB; uniform float uMix; uniform float uOn; uniform vec4 uFitA; uniform vec4 uFitB; uniform float uWipe;
varying vec2 vUv; varying vec3 vWP;
void main(){
  // each picture is fitted to the panel: cropped (a page from its top, a frame about its middle), never stretched
  vec3 a = texture2D(uA, vUv * uFitA.xy + uFitA.zw).rgb, b = texture2D(uB, vUv * uFitB.xy + uFitB.zw).rgb;
  // a crossfade, or (uWipe) a front that sweeps across the picture, as a reconstruction would
  float m = uWipe > 0.5 ? smoothstep(vUv.x - 0.04, vUv.x + 0.04, uMix * 1.1 - 0.05) : smoothstep(0.0, 1.0, uMix);
  vec3 col = mix(a, b, m);
  if (uWipe > 0.5) col += vec3(0.85, 1.0, 0.3) * 0.5 * (1.0 - smoothstep(0.0, 0.012, abs(vUv.x - (uMix * 1.1 - 0.05)))) * step(0.01, uMix) * step(uMix, 0.99);
  // powering on: a bright line opens from the middle, then the picture warms up
  float open = smoothstep(0.0, 0.35, uOn);
  float band = step(abs(vUv.y - 0.5), open * 0.5);
  vec3 off = vec3(0.04, 0.035, 0.03);
  float warm = smoothstep(0.3, 1.0, uOn);
  vec3 lit = mix(vec3(0.9, 0.85, 0.75) * band, col * 1.05, warm);
  col = mix(off, lit, band);
  // a faint glass sheen, and the panel's own light falling off at its very edge
  col += 0.035 * smoothstep(0.6, 1.0, vUv.y + vUv.x * 0.3);
  vec2 e = min(vUv, 1.0 - vUv);
  col *= 0.9 + 0.1 * smoothstep(0.0, 0.04, min(e.x, e.y));
  // alpha 0 keeps the picture out of the brushwork pass, so pages and type stay crisp
  gl_FragColor = vec4(fogApply(col, vWP), 0.0);
}`;

/**
 * How a picture fills a panel of aspect `panel` without stretching (uv scale and offset): a picture wider
 * than the panel loses its sides, a taller one (a page) is shown from its top.
 */
export function fit(out: THREE.Vector4, t: THREE.Texture | null, panel: number) {
  const img = t?.image as { width?: number; height?: number } | undefined;
  const asp = img?.width && img.height ? img.width / img.height : panel;
  if (asp > panel) out.set(panel / asp, 1, (1 - panel / asp) / 2, 0);
  else out.set(1, asp / panel, 0, 1 - asp / panel);
  return out;
}

/** a display panel showing real project screenshots, crossfading between two, with a power-on */
export function screenMaterial(c: Common) {
  return new THREE.ShaderMaterial({
    vertexShader: SCREEN_VS,
    fragmentShader: SCREEN_FS,
    uniforms: {
      ...c,
      uA: { value: null as THREE.Texture | null },
      uB: { value: null as THREE.Texture | null },
      uMix: { value: 0 },
      uOn: { value: 0 },
      uFitA: { value: new THREE.Vector4(1, 1, 0, 0) },
      uFitB: { value: new THREE.Vector4(1, 1, 0, 0) },
      uWipe: { value: 0 },
    },
  });
}

const STEAM_VS = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime; uniform vec3 uCam;
varying vec2 vUv; varying float vSeed; varying vec3 vWP;
void main(){
  vUv = uv; vSeed = aSeed.w;
  // each wisp is a vertical card turned toward the camera about its own axis
  vec3 base = aSeed.xyz;
  vec3 toCam = normalize(vec3(uCam.x - base.x, 0.0, uCam.z - base.z));
  vec3 side = vec3(toCam.z, 0.0, -toCam.x);
  vec3 p = base + side * position.x + vec3(0.0, position.y, 0.0);
  // it leans and sways as it rises
  p += side * sin(uTime * 1.3 + aSeed.w * 6.0 + position.y * 2.2) * 0.12 * position.y;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const STEAM_FS = /* glsl */ `
${COMMON}
uniform float uOn;
varying vec2 vUv; varying float vSeed; varying vec3 vWP;
void main(){
  float t = uTime * 0.55 + vSeed * 9.0;
  float y = vUv.y;
  // a thin plume that widens and thins out as it climbs, broken up by drifting noise
  float w = 0.16 + y * 0.32;
  float x = (vUv.x - 0.5 + sin(y * 5.0 - t * 2.0) * 0.12 * y) / w;
  float body = exp(-x * x * 2.5);
  float n = snoise(vec3(vUv.x * 3.0, y * 4.0 - t, vSeed * 10.0)) * 0.5 + 0.5;
  float a = body * smoothstep(0.0, 0.12, y) * (1.0 - smoothstep(0.45, 1.0, y)) * (0.35 + 0.65 * n);
  a *= 0.55 * uOn;
  if (a < 0.01) discard;
  vec3 col = mix(vec3(0.96, 0.94, 0.92), uSunCol * 0.6, 0.15);
  gl_FragColor = vec4(fogApply(col, vWP), a);
}`;

/** rising steam over a set of points: one draw call for every cup */
export function steam(c: Common, at: THREE.Vector3[], height: number, width: number) {
  const g = new THREE.BufferGeometry();
  const pos: number[] = [], uv: number[] = [], seed: number[] = [], idx: number[] = [];
  at.forEach((p, i) => {
    const b = i * 4, s = (i * 0.618) % 1;
    for (const [x, y] of [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]]) {
      pos.push(x * width, y * height, 0);
      uv.push(x + 0.5, y);
      seed.push(p.x, p.y, p.z, s);
    }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 4));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    vertexShader: STEAM_VS,
    fragmentShader: STEAM_FS,
    uniforms: { ...c, uOn: { value: 1 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return mesh;
}

/** a flat textured card lit by the painted light (signs, boards) */
const CARD_FS = /* glsl */ `
${COMMON}
uniform sampler2D uMap; uniform float uOn; uniform float uReveal; uniform vec3 uLit;
varying vec2 vUv; varying vec3 vWP;
void main(){
  vec4 t = texture2D(uMap, vUv);
  if (t.a < 0.4) discard;
  // letters light one after another, left to right, as uReveal runs from 0 to 1
  float lit = smoothstep(vUv.x - 0.06, vUv.x, uReveal * 1.12 - 0.06) * uOn;
  vec3 col = mix(t.rgb * 0.55, t.rgb * uLit, lit);
  // alpha 0: lettering stays out of the brushwork pass
  gl_FragColor = vec4(fogApply(col, vWP), 0.0);
}`;

export function cardMaterial(c: Common, map: THREE.Texture, lit = new THREE.Vector3(1.6, 1.45, 1.2)) {
  return new THREE.ShaderMaterial({
    vertexShader: SCREEN_VS,
    fragmentShader: CARD_FS,
    uniforms: { ...c, uMap: { value: map }, uOn: { value: 0 }, uReveal: { value: 0 }, uLit: { value: lit } },
    side: THREE.DoubleSide,
  });
}

/** smoothstep on [a, b] */
export const ease = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

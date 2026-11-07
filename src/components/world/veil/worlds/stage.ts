import * as THREE from 'three';
import { COMMON, type Common } from '../shaders';
import { archMaterial, Builder, cardMaterial, CH, ease, type Part, type RGB, screenMaterial } from './kit';

/**
 * What every project world shares: the pad it stands on, the shape it hands back to the environment,
 * and the pieces most of them use (a stone plinth, lamps that light first, a display showing the project's
 * own screenshots, painted signs). Each world file only builds what is particular to its project.
 */

export interface Pad {
  /** world-space centre of the pad (ground level) */
  p: THREE.Vector3;
  /** horizontal unit vector the world faces: toward the project shot's lens */
  face: THREE.Vector3;
}

export interface ProjectWorld {
  group: THREE.Group;
  /** the detail shot, world space: where the camera moves in to once the island is established */
  detail: { cam: THREE.Vector3; look: THREE.Vector3; centre?: THREE.Vector3 };
  triangles: number;
  /** a: 0..1 progress of the presentation (0 before arrival, 1 fully active) */
  update(t: number, a: number): void;
}

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** a group standing on the pad, turned so local +z faces the lens */
export function placeGroup(name: string, pad: Pad) {
  const group = new THREE.Group();
  group.name = name;
  group.position.copy(pad.p);
  group.rotation.y = Math.atan2(pad.face.x, pad.face.z);
  return group;
}

/**
 * The detail shot, given in the world's own frame (+z toward the lens). `look` sits left of the world's middle so
 * the world fills the right of a desktop frame beside the caption; `centre` is its true middle, which phones
 * (caption below, not beside) aim at instead.
 */
export function detailShot(group: THREE.Group, cam: THREE.Vector3, look: THREE.Vector3, centre = V(0.6, 2.4, -0.8)) {
  group.updateMatrixWorld(true);
  const m = group.matrixWorld;
  return { cam: cam.applyMatrix4(m), look: look.applyMatrix4(m), centre: centre.applyMatrix4(m) };
}

/** a stone terrace that levels the ground, stepping down at the front */
export function plinth(b: Builder, w: number, d: number, top: RGB, side: RGB) {
  b.box(V(0, -1.4, 0), [w, 2.8, d], 0, { col: side });
  b.box(V(0, -0.05, 0), [w - 0.6, 0.1, d - 0.6], 0, { col: top });
  b.box(V(0, -0.35, d / 2 + 0.3), [6, 0.3, 1.2], 0, { col: top });
  b.box(V(0, -0.7, d / 2 + 1.2), [6, 0.3, 1.2], 0, { col: side });
}

/** lamp posts (channel c: the first lights to come on) */
export function lamps(b: Builder, at: [number, number][], pole: RGB, globe: RGB, h = 2.5) {
  for (const [x, z] of at) {
    b.cyl(V(x, 0, z), 0.06, 0.08, h, 6, { col: pole });
    b.sphere(V(x, h + 0.15, z), 0.24, { col: globe, glow: 1, ch: CH.c }, 10);
  }
}

/**
 * Pictures arrive after the build's warm-up draw, so each would upload to the GPU the first time its world
 * comes into view (a stalled frame mid-scroll). The environment hands in its renderer, and every texture is
 * uploaded the moment it exists instead, while the visitor is still at the top of the page.
 */
let upload: ((t: THREE.Texture) => void) | null = null;
export const setTextureUploader = (f: ((t: THREE.Texture) => void) | null) => (upload = f);
export const uploadTexture = (t: THREE.Texture) => {
  upload?.(t);
  return t;
};

const loader = new THREE.TextureLoader();
export function texture(url: string) {
  const t = loader.load(url, uploadTexture);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * A display on a stand, angled toward the visitor, walking through real screenshots of the project.
 * The frame goes into the world's builder; the picture is its own mesh.
 */
export function kiosk(
  c: Common,
  b: Builder,
  group: THREE.Group,
  o: { x: number; z: number; yaw: number; w: number; h: number; y?: number; frame: RGB; trim: RGB; pages: string[]; period?: number; wipe?: boolean; round?: boolean },
) {
  const y = o.y ?? 0.6 + o.h / 2 + 0.6;
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), o.yaw);
  const at = (lx: number, ly: number, lz: number) => V(lx, ly, lz).applyQuaternion(q).add(V(o.x, 0, o.z));
  if (!o.round) {
    b.box(at(0, (y - o.h / 2) / 2, -0.05), [0.18, y - o.h / 2, 0.18], o.yaw, { col: o.trim });
    b.box(at(0, 0.06, 0), [1.4, 0.12, 0.9], o.yaw, { col: o.frame });
    b.box(at(0, y, -0.08), [o.w + 0.3, o.h + 0.25, 0.14], o.yaw, { col: o.frame });
    b.box(at(0, y + o.h / 2 + 0.16, -0.08), [o.w + 0.3, 0.06, 0.18], o.yaw, { col: o.trim, glow: 0.5, ch: CH.d });
  }
  const mat = screenMaterial(c);
  mat.uniforms.uWipe.value = o.wipe ? 1 : 0;
  const geo = o.round ? new THREE.CircleGeometry(o.w / 2, 48) : new THREE.PlaneGeometry(o.w, o.h);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(at(0, y, o.round ? 0 : 0.0));
  mesh.rotation.y = o.yaw;
  group.add(mesh);
  const pages = o.pages.map(texture);
  mat.uniforms.uA.value = pages[0];
  mat.uniforms.uB.value = pages[1 % pages.length];
  const period = o.period ?? 6;
  return {
    mesh,
    mat,
    /** on: the power-on (0..1); for a wipe display the pages go in pairs (before, after) */
    update(t: number, on: number) {
      mat.uniforms.uOn.value = on;
      const k = t / period, i = Math.floor(k), f = k - i;
      if (o.wipe) {
        const n = Math.max(1, pages.length >> 1), j = i % n;
        mat.uniforms.uA.value = pages[2 * j];
        mat.uniforms.uB.value = pages[2 * j + 1];
        // hold the cloudy frame, sweep the clear one across, hold, then cut to the next pair
        mat.uniforms.uMix.value = ease(f, 0.25, 0.7) * on;
      } else {
        mat.uniforms.uA.value = pages[i % pages.length];
        mat.uniforms.uB.value = pages[(i + 1) % pages.length];
        mat.uniforms.uMix.value = ease(f, 0.82, 1);
      }
    },
  };
}

/** a painted sign or board: a canvas drawn once (and again when a web font arrives) on a lit card */
export function canvasCard(
  c: Common,
  size: [number, number],
  px: [number, number],
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  lit?: THREE.Vector3,
  fonts: string[] = [],
  /** something to wait for before asking for the fonts (a stylesheet that declares them) */
  after: Promise<unknown> = Promise.resolve(),
) {
  const paint = () => {
    const cv = document.createElement('canvas');
    cv.width = px[0];
    cv.height = px[1];
    draw(cv.getContext('2d')!, px[0], px[1]);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  const mat = cardMaterial(c, paint(), lit);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
  if (fonts.length && typeof document !== 'undefined' && document.fonts) {
    after
      .then(() => Promise.all(fonts.map((f) => document.fonts.load(f))))
      .then(() => {
        mat.uniforms.uMap.value.dispose();
        mat.uniforms.uMap.value = uploadTexture(paint());
      })
      .catch(() => {});
  }
  return { mesh, mat };
}

/** a font stack the site itself already loads, for signs */
export const SANS = "'Space Grotesk Variable', 'Space Grotesk', system-ui, sans-serif";
export const MONO = "'IBM Plex Mono', ui-monospace, monospace";

/**
 * Small labelled plates in one draw call: each label is a quad cut from a shared canvas strip.
 * The plates light one after another with `uReveal` (left to right through the strip, i.e. in list order).
 */
export function labels(
  c: Common,
  items: { text: string; at: THREE.Vector3; yaw?: number }[],
  o: { w: number; h: number; ink: string; paper: string; font?: string; px?: number },
) {
  const cw = 512, ch = Math.round((cw * o.h) / o.w);
  const draw = () => {
    const cv = document.createElement('canvas');
    cv.width = cw * items.length;
    cv.height = ch;
    const g = cv.getContext('2d')!;
    items.forEach((it, i) => {
      g.fillStyle = o.paper;
      g.fillRect(i * cw + 6, 6, cw - 12, ch - 12);
      g.fillStyle = o.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      let px = o.px ?? Math.round(ch * 0.46);
      g.font = `600 ${px}px ${o.font ?? SANS}`;
      while (g.measureText(it.text).width > cw * 0.86 && px > 12) g.font = `600 ${(px -= 2)}px ${o.font ?? SANS}`;
      g.fillText(it.text, i * cw + cw / 2, ch / 2 + 2);
    });
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const n = items.length;
  items.forEach((it, i) => {
    const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), it.yaw ?? 0);
    const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
    corners.forEach(([x, y]) => {
      const p = V(x * o.w, y * o.h, 0).applyQuaternion(q).add(it.at);
      pos.push(p.x, p.y, p.z);
      uv.push((i + x + 0.5) / n, y + 0.5);
    });
    const k = i * 4;
    idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  const mat = cardMaterial(c, draw(), new THREE.Vector3(1.35, 1.3, 1.25));
  if (typeof document !== 'undefined' && document.fonts)
    document.fonts.ready.then(() => {
      mat.uniforms.uMap.value.dispose();
      mat.uniforms.uMap.value = uploadTexture(draw());
    });
  return { mesh: new THREE.Mesh(g, mat), mat };
}

/* ---------------------------------------------------------------- ripples */

const RIPPLE_VS = /* glsl */ `
varying vec2 vUv; varying vec3 vWP;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const RIPPLE_FS = /* glsl */ `
${COMMON}
uniform float uOn; uniform vec3 uCol; uniform float uRate;
varying vec2 vUv; varying vec3 vWP;
void main(){
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  // rings travel outward and fade, three in flight at once
  float w = fract(r * 3.0 - uTime * uRate);
  float ring = smoothstep(0.0, 0.08, w) * (1.0 - smoothstep(0.08, 0.22, w));
  float a = ring * (1.0 - r) * uOn * 0.8;
  if (a < 0.01) discard;
  gl_FragColor = vec4(fogApply(uCol, vWP), a);
}`;

/** sound or signal travelling out from a point: a flat disc of rings, one draw call */
export function ripples(c: Common, radius: number, col: THREE.Color, rate = 0.6) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: RIPPLE_VS,
    fragmentShader: RIPPLE_FS,
    uniforms: { ...c, uOn: { value: 0 }, uCol: { value: col }, uRate: { value: rate } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return { mesh: new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat), mat };
}

/* ---------------------------------------------------------------- sky screen */

const SKY_FS = /* glsl */ `
${COMMON}
uniform float uOn; uniform float uDay;
varying vec2 vUv; varying vec3 vWP;
vec3 sky(float d, float y){
  // dawn, noon, dusk, night, round again
  vec3 top[4]; vec3 hor[4];
  top[0] = vec3(0.36, 0.42, 0.66); hor[0] = vec3(0.98, 0.72, 0.55);
  top[1] = vec3(0.16, 0.42, 0.86); hor[1] = vec3(0.70, 0.86, 0.98);
  top[2] = vec3(0.28, 0.18, 0.44); hor[2] = vec3(0.98, 0.52, 0.32);
  top[3] = vec3(0.03, 0.05, 0.14); hor[3] = vec3(0.10, 0.14, 0.30);
  float k = fract(d) * 4.0; int i = int(k); float f = smoothstep(0.0, 1.0, fract(k));
  vec3 t0 = i == 0 ? top[0] : i == 1 ? top[1] : i == 2 ? top[2] : top[3];
  vec3 t1 = i == 0 ? top[1] : i == 1 ? top[2] : i == 2 ? top[3] : top[0];
  vec3 h0 = i == 0 ? hor[0] : i == 1 ? hor[1] : i == 2 ? hor[2] : hor[3];
  vec3 h1 = i == 0 ? hor[1] : i == 1 ? hor[2] : i == 2 ? hor[3] : hor[0];
  return mix(mix(h0, h1, f), mix(t0, t1, f), smoothstep(0.0, 1.0, y));
}
void main(){
  float d = uDay;
  vec3 col = sky(d, vUv.y);
  // the sun (by day) or the moon (by night) crosses on an arc
  float ang = fract(d * 2.0) * 3.14159;
  vec2 c = vec2(0.5 - cos(ang) * 0.42, 0.12 + sin(ang) * 0.7);
  float night = step(0.5, fract(d * 1.0 + 0.125));
  float disc = 1.0 - smoothstep(0.05, 0.06, length((vUv - c) * vec2(1.6, 1.0)));
  col = mix(col, night > 0.5 ? vec3(0.92, 0.94, 1.0) : vec3(1.0, 0.92, 0.7), disc);
  // drifting clouds on their own clock
  float n = snoise(vec3(vUv.x * 3.0 - uTime * 0.05, vUv.y * 6.0, d)) * 0.5 + 0.5;
  col = mix(col, vec3(1.0) * (0.55 + 0.45 * (1.0 - night)), smoothstep(0.62, 0.8, n) * 0.55 * smoothstep(0.25, 0.6, vUv.y));
  float open = smoothstep(0.0, 0.35, uOn);
  float band = step(abs(vUv.y - 0.5), open * 0.5);
  col = mix(vec3(0.04), mix(vec3(0.9) * band, col, smoothstep(0.3, 1.0, uOn)), band);
  gl_FragColor = vec4(fogApply(col, vWP), 1.0);
}`;

/** a display running a procedural sky through the times of day (SkyCast animates its sky the same way) */
export function skyScreen(c: Common, w: number, h: number) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: RIPPLE_VS,
    fragmentShader: SKY_FS,
    uniforms: { ...c, uOn: { value: 0 }, uDay: { value: 0.1 } },
  });
  return { mesh: new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat), mat };
}

/* ---------------------------------------------------------------- the standard order of events */

/**
 * The shared choreography, on the presentation value a (0..1): lamps, then the building's light, then its
 * accents and sign, then the product on its display. Worlds add their own beats on top.
 */
export function beats(a: number) {
  return {
    // timed against the camera: it moves in over a 0.13..0.74, so the world wakes as it arrives
    lamps: ease(a, 0.3, 0.42),
    windows: ease(a, 0.36, 0.5),
    accents: ease(a, 0.46, 0.56),
    sign: ease(a, 0.48, 0.62),
    screen: ease(a, 0.56, 0.72),
    /** the world's own signature motion (spins up, plays, sweeps) */
    life: ease(a, 0.4, 0.75),
    seq: ease(a, 0.45, 0.8),
  };
}

/** the world's main material and builder in one, for the common case */
export function builder(c: Common, o?: Parameters<typeof archMaterial>[1]) {
  return { b: new Builder(), mat: archMaterial(c, o) };
}

export type { Part };

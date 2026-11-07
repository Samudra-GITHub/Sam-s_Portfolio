import * as THREE from 'three';
import { COMMON, type Common } from '../shaders';
import { archMaterial, Builder, cardMaterial, CH, ease, fit, type Part, type RGB, screenMaterial } from './kit';

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

/**
 * How finely the worlds are drawn, set once by the environment for the device: texture filtering (the GPU's
 * own anisotropy limit on desktop) and how many canvas pixels signs and labels get per unit (2 on desktop, so
 * lettering stays sharp on 4K and high-density screens; 1 on phones and tablets).
 */
const quality = { aniso: 4, text: 1 };
export const setWorldQuality = (q: Partial<typeof quality>) => Object.assign(quality, q);
export const worldQuality = () => quality;

/** a canvas of logical size w x h, backed by `text` times as many pixels, drawn in logical units */
export function sharpCanvas(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const k = quality.text;
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * k);
  cv.height = Math.round(h * k);
  const g = cv.getContext('2d')!;
  g.scale(k, k);
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = quality.aniso;
  return t;
}

/** a group standing on the pad, turned so local +z faces the lens; it sits a little proud of the ground, so
 * the island's turf never pushes up through a terrace */
export function placeGroup(name: string, pad: Pad) {
  const group = new THREE.Group();
  group.name = name;
  group.position.copy(pad.p);
  group.position.y += 0.4;
  group.rotation.y = Math.atan2(pad.face.x, pad.face.z);
  return group;
}

/** a tiny deterministic random sequence, so a world builds the same every visit */
export function rng(seed: number) {
  let a = seed | 0 || 1;
  return () => ((a = (a * 1664525 + 1013904223) | 0), ((a >>> 8) & 0xffff) / 0x10000);
}

/** a colour nudged in value (and a touch in warmth): stone, timber and paving are never one flat tone */
export function vary(c: RGB, k: number, warm = 0): RGB {
  return [c[0] * (1 + k + warm), c[1] * (1 + k), c[2] * (1 + k - warm)];
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

/**
 * A stone terrace that levels the ground: a deep footing in coursed stone (so a falling slope shows built
 * wall, not a floating slab), a kerb of dressed blocks of uneven length, paving laid in rows of varied tone
 * over darker joints, two steps at the front, and weathered boulders where the terrace meets the hillside.
 */
export function plinth(b: Builder, w: number, d: number, top: RGB, side: RGB, seed = 7) {
  const r = rng(seed);
  // laid stone reads a little deeper than the palette's flat swatch
  top = vary(top, -0.24, 0.03);
  side = vary(side, -0.1, 0.02);
  // the footing: courses of stone, each a slightly different tone, stepping in as they rise
  for (let k = 0; k < 4; k++) {
    const y = -0.5 - k * 0.9, inset = (3 - k) * -0.06;
    b.box(V(0, y, 0), [w - inset * 2 - 0.1, 0.92, d - inset * 2 - 0.1], 0, { col: vary(side, (r() - 0.5) * 0.12 - k * 0.04, 0.02) }, 0, 0, 0.05);
  }
  // the joints between the paving stones
  b.box(V(0, -0.1, 0), [w - 0.5, 0.12, d - 0.5], 0, { col: vary(side, -0.18) }, 0, 0, 0);
  // the kerb: dressed blocks running round the edge, a touch higher than the paving
  const kerb = (x0: number, z0: number, dx: number, dz: number, len: number) => {
    let s = 0;
    while (s < len - 0.05) {
      const l = Math.min(len - s, 1.1 + r() * 1.3);
      const cx = x0 + dx * (s + l / 2), cz = z0 + dz * (s + l / 2);
      const sz: [number, number, number] = dx ? [l - 0.05, 0.34, 0.55] : [0.55, 0.34, l - 0.05];
      b.box(V(cx, 0.02 + r() * 0.03, cz), sz, 0, { col: vary(side, 0.1 + (r() - 0.5) * 0.14, 0.03) }, 0, 0, 0.06);
      s += l;
    }
  };
  kerb(-w / 2, -d / 2 + 0.28, 1, 0, w);
  kerb(-w / 2 + 0.28, -d / 2 + 0.55, 0, 1, d - 1.1);
  kerb(w / 2 - 0.28, -d / 2 + 0.55, 0, 1, d - 1.1);
  // the front kerb leaves a gap for the steps
  kerb(-w / 2, d / 2 - 0.28, 1, 0, w / 2 - 3.1);
  kerb(3.1, d / 2 - 0.28, 1, 0, w / 2 - 3.1);
  // paving: rows of stones of random length, each its own tone
  const pw = w - 1.3, pd = d - 1.3, row = 1.25;
  for (let z = -pd / 2; z < pd / 2 - 0.05; z += row) {
    const rz = Math.min(row, pd / 2 - z);
    let x = -pw / 2 + (Math.round(z / row) % 2 ? 0 : -0.5);
    while (x < pw / 2 - 0.05) {
      const l = 1.0 + r() * 1.1, x0 = Math.max(x, -pw / 2), x1 = Math.min(x + l, pw / 2);
      if (x1 - x0 > 0.1) b.box(V((x0 + x1) / 2, -0.02, z + rz / 2), [x1 - x0 - 0.06, 0.08, rz - 0.06], 0, { col: vary(top, (r() - 0.5) * 0.11, (r() - 0.5) * 0.04) }, 0, 0, 0);
      x += l;
    }
  }
  // the steps, worn a little paler where feet go
  b.box(V(0, -0.3, d / 2 + 0.35), [6, 0.3, 1.1], 0, { col: vary(top, 0.03) }, 0, 0, 0.05);
  b.box(V(0, -0.62, d / 2 + 1.2), [6.4, 0.32, 1.1], 0, { col: vary(side, 0.06) }, 0, 0, 0.05);
  for (const s of [-1, 1]) b.box(V(s * 3.3, -0.3, d / 2 + 0.75), [0.5, 0.75, 1.9], 0, { col: vary(side, 0.08) }, 0, 0, 0.06);
  // boulders where the terrace meets the hill, greyed and greened by weather
  const moss = (c: RGB): RGB => [c[0] * 0.78, c[1] * 0.9, c[2] * 0.68];
  for (const [x, z, s] of [[-w / 2 - 0.4, -d / 2 + 1.6, 1.3], [-w / 2 + 0.6, -d / 2 - 0.3, 0.9], [w / 2 + 0.3, -d / 2 + 0.8, 1.1], [w / 2 + 0.5, d / 2 - 1.8, 0.8], [-w / 2 - 0.2, d / 2 - 0.6, 0.95]] as const) {
    b.rock(V(x, -0.55, z), s, { col: moss(vary(side, (r() - 0.5) * 0.2)) }, seed + x * 3.1 + z);
  }
}

/**
 * Lantern posts (channel c: the first lights to come on): a stepped foot, a tapering post with a collar, and
 * a small glazed lantern under a cap, its light behind four glazing bars.
 */
export function lamps(b: Builder, at: [number, number][], pole: RGB, globe: RGB, h = 2.5) {
  for (const [x, z] of at) {
    b.cyl(V(x, 0, z), 0.17, 0.21, 0.22, 10, { col: pole });
    b.cyl(V(x, 0.22, z), 0.05, 0.075, h - 0.22, 8, { col: pole, gloss: 0.15 });
    b.cyl(V(x, h * 0.62, z), 0.085, 0.085, 0.08, 8, { col: pole });
    b.cyl(V(x, h - 0.02, z), 0.13, 0.1, 0.08, 8, { col: pole });
    b.box(V(x, h + 0.2, z), [0.2, 0.32, 0.2], 0, { col: globe, glow: 1, ch: CH.c }, 0, 0, 0.03);
    for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.box(V(x + ox * 0.115, h + 0.2, z + oz * 0.115), [0.035, 0.36, 0.035], 0, { col: pole }, 0, 0, 0);
    b.cyl(V(x, h + 0.38, z), 0.02, 0.19, 0.16, 8, { col: pole, gloss: 0.2 });
    b.sphere(V(x, h + 0.57, z), 0.035, { col: pole }, 6);
  }
}

/* ---------------------------------------------------------------- light spill */

const SPILL_VS = /* glsl */ `
varying vec2 vUv; varying vec3 vWP;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SPILL_FS = /* glsl */ `
${COMMON}
uniform float uOn; uniform vec3 uCol;
varying vec2 vUv; varying vec3 vWP;
void main(){
  vec2 p = vUv * 2.0 - 1.0;
  float a = exp(-dot(p, p) * 2.6) * uOn;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uCol * a, 1.0);
}`;

/** soft light thrown by a lit thing onto the ground or the wall behind it: one additive quad */
export function spill(c: Common, w: number, h: number, col: THREE.Color) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: SPILL_VS,
    fragmentShader: SPILL_FS,
    uniforms: { ...c, uOn: { value: 0 }, uCol: { value: col } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return { mesh: new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat), mat };
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
  t.anisotropy = quality.aniso;
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
    // a stepped foot, a pair of uprights, a deep bezel with a housing behind it and a lit trim along the top
    const foot = y - o.h / 2;
    b.box(at(0, 0.08, 0), [Math.min(o.w, 2.0), 0.16, 1.0], o.yaw, { col: o.frame });
    b.box(at(0, 0.22, -0.02), [Math.min(o.w, 2.0) - 0.3, 0.12, 0.7], o.yaw, { col: o.frame, gloss: 0.15 });
    for (const s of [-1, 1]) b.box(at(s * Math.min(0.55, o.w * 0.22), foot / 2 + 0.14, -0.1), [0.14, foot - 0.1, 0.16], o.yaw, { col: o.trim, gloss: 0.25 });
    b.box(at(0, y, -0.12), [o.w + 0.26, o.h + 0.26, 0.22], o.yaw, { col: o.frame, gloss: 0.3 });
    b.box(at(0, y, -0.32), [o.w * 0.8, o.h * 0.75, 0.24], o.yaw, { col: o.frame });
    b.box(at(0, y - o.h / 2 - 0.08, 0.0), [o.w * 0.3, 0.04, 0.02], o.yaw, { col: o.trim, glow: 0.7, ch: CH.d }, 0, 0, 0);
    b.box(at(0, y + o.h / 2 + 0.17, -0.12), [o.w + 0.26, 0.05, 0.24], o.yaw, { col: o.trim, glow: 0.5, ch: CH.d }, 0, 0, 0.02);
  }
  const mat = screenMaterial(c);
  mat.uniforms.uWipe.value = o.wipe ? 1 : 0;
  const geo = o.round ? new THREE.CircleGeometry(o.w / 2, 64) : new THREE.PlaneGeometry(o.w, o.h);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(at(0, y, o.round ? 0 : 0.0));
  mesh.rotation.y = o.yaw;
  group.add(mesh);
  // the screen's light on the ground in front of it
  const glow = spill(c, o.w * 1.6, o.w * 1.1, new THREE.Color(0.16, 0.17, 0.2));
  glow.mesh.position.copy(at(0, 0.03, o.w * 0.45));
  glow.mesh.rotation.set(-Math.PI / 2, 0, o.yaw);
  group.add(glow.mesh);
  const pages = o.pages.map(texture);
  mat.uniforms.uA.value = pages[0];
  mat.uniforms.uB.value = pages[1 % pages.length];
  const period = o.period ?? 6;
  const aspect = o.w / o.h;
  return {
    mesh,
    mat,
    /** on: the power-on (0..1); for a wipe display the pages go in pairs (before, after) */
    update(t: number, on: number) {
      mat.uniforms.uOn.value = on;
      glow.mat.uniforms.uOn.value = on;
      fit(mat.uniforms.uFitA.value, mat.uniforms.uA.value, aspect);
      fit(mat.uniforms.uFitB.value, mat.uniforms.uB.value, aspect);
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
  const paint = () => sharpCanvas(px[0], px[1], draw);
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
  const cw = 512 * quality.text, ch = Math.round((cw * o.h) / o.w);
  const draw = () => {
    const cv = document.createElement('canvas');
    cv.width = cw * items.length;
    cv.height = ch;
    const g = cv.getContext('2d')!;
    items.forEach((it, i) => {
      g.fillStyle = o.paper;
      g.fillRect(i * cw + 6 * quality.text, 6 * quality.text, cw - 12 * quality.text, ch - 12 * quality.text);
      g.fillStyle = o.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      let px = o.px ?? Math.round(ch * 0.46);
      g.font = `600 ${px}px ${o.font ?? SANS}`;
      while (g.measureText(it.text).width > cw * 0.86 && px > 12 * quality.text) g.font = `600 ${(px -= 2)}px ${o.font ?? SANS}`;
      g.fillText(it.text, i * cw + cw / 2, ch / 2 + 2);
    });
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = quality.aniso;
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

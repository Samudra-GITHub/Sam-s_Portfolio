import * as THREE from 'three';
import { FAR } from './veil/spec';
import { featured } from '../../data/projects';

/**
 * Camera choreography. Every stop is either an authored shot (the hero, the
 * later sections) or an island shot. Island shots are not coordinates: they
 * are a direction (azimuth and elevation, chosen per island) and a framing
 * rule. The camera distance comes from the island's real bounds, the field of
 * view and the viewport aspect, so the whole silhouette sits centred with
 * breathing room on any screen.
 */

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface IslandShot {
  /** index into FAR */
  far: number;
  /** degrees around the island, measured from the direction toward the hero */
  az: number;
  /** degrees above the horizontal: canopy and underside both read at 8 to 22 */
  el: number;
  /** how far (degrees) the camera may turn from `az` to clear neighbours; default 60 */
  turn?: number;
}
export interface Stop {
  id: string;
  cam: THREE.Vector3;
  look: THREE.Vector3;
  isle?: IslandShot;
  /** text sections push the subject right of their panel on desktop */
  text?: boolean;
}

/** Hero at the origin, about 30 units across. */
const HOME: Record<string, [THREE.Vector3, THREE.Vector3]> = {
  top: [v(130, 14, 145), v(0, -8, 0)], // arrival: the establishing three-quarter view, falls toward us
  experiments: [v(95, -40, 100), v(15, -28, 15)], // down by the falls
  about: [v(-40, 30, 40), v(-170, 22, -230)], // an overlook across the cloud sea to the far formations
  toolkit: [v(-95, -70, 105), v(0, -36, 0)], // under the roots and hanging lobes
  contact: [v(150, 26, 215), v(-40, -8, -60)], // pull back: the hero in scale with the archipelago
};

/** In angular order around the hero, each with its own angle: no two islands are shot the same way. */
const ISLAND_SHOTS: IslandShot[] = [
  { far: 8, az: 28, el: 14 }, // broad three-quarter, sun side
  { far: 7, az: -34, el: 20 }, // small island: higher, looking down into the canopy
  { far: 5, az: 40, el: 10 }, // tall mass: lower, the underside towers
  { far: 3, az: -22, el: 24 }, // tiny spire: steep, canopy-led
  { far: 1, az: 18, el: 12 },
  { far: 4, az: -44, el: 16, turn: 15 }, // the giant: wide, raking light across the cliffs (turned further, it sinks into the cloud bank)
  { far: 0, az: 32, el: 18 },
  { far: 2, az: -16, el: 9 }, // low, the hanging lobes against the sky
  { far: 6, az: 36, el: 15 },
];

export const STOPS: Stop[] = [
  { id: 'top', cam: HOME.top[0], look: HOME.top[1] },
  ...featured.map((p, i) => ({ id: `p-${p.slug}`, cam: new THREE.Vector3(), look: new THREE.Vector3(), isle: ISLAND_SHOTS[i % ISLAND_SHOTS.length] })),
  ...(['experiments', 'about', 'toolkit', 'contact'] as const).map((id) => ({ id, cam: HOME[id][0], look: HOME[id][1], text: true })),
];

/** The hero formation at the origin (rock, canopy and hanging lobes), so island shots keep it out of the way too. */
const HERO_BOX = new THREE.Box3(v(-24, -60, -24), v(24, 24, 24));

/** Real island bounds, filled in when the environment is built; estimated from the spec until then. */
const bounds: (THREE.Box3 | undefined)[] = [];
export const setIslandBounds = (b: THREE.Box3[]) => b.forEach((x, i) => (bounds[i] = x));
export function islandBox(far: number) {
  const known = bounds[far];
  if (known) return known;
  const f = FAR[far];
  const c = v(...f.at);
  return new THREE.Box3(c.clone().add(v(-1.1 * f.s, -1.9 * f.s, -1.1 * f.s)), c.clone().add(v(1.1 * f.s, 1.2 * f.s, 1.1 * f.s)));
}

/**
 * Framing targets. The island's bounding sphere fills `fillV` of the visible
 * height and at most `fillH` of the width. Phones frame into the upper part
 * of the screen (the caption is a sheet below) via a view offset.
 */
export const FRAMING = {
  desktop: { fillV: 0.72, fillH: 0.42, raise: 0, lift: 0.07 },
  phone: { fillV: 0.44, fillH: 0.8, raise: 0.22, lift: 0 },
};

const _c = new THREE.Vector3(), _s = new THREE.Sphere(), _d = new THREE.Vector3();
const probe = new THREE.PerspectiveCamera();
const chosen = new Map<string, number>();

/** Camera pose for one azimuth offset (radians added to the shot's own). */
function pose(shot: IslandShot, dAz: number, fovDeg: number, aspect: number, phone: boolean, outCam: THREE.Vector3, outLook: THREE.Vector3) {
  const box = islandBox(shot.far);
  box.getBoundingSphere(_s);
  box.getCenter(_c);
  // a box's sphere is loose on the long axes: the visible silhouette is closer to this
  const r = _s.radius * 0.82;
  const f = phone ? FRAMING.phone : FRAMING.desktop;
  const vf = THREE.MathUtils.degToRad(fovDeg) / 2;
  const hf = Math.atan(Math.tan(vf) * aspect);
  const dist = Math.max(r / Math.sin(vf * f.fillV), r / Math.sin(hf * f.fillH));
  // direction: from the island toward the hero, turned by the shot's azimuth, raised by its elevation
  const az = Math.atan2(-_c.z, -_c.x) + THREE.MathUtils.degToRad(shot.az) + dAz;
  const el = THREE.MathUtils.degToRad(shot.el);
  _d.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
  outLook.copy(_c);
  // the box reaches down to the thinnest drip tips, so its centre sits below the visual mass; the nav also
  // covers the top of the screen. Aim a little higher than the box centre so the silhouette reads centred.
  outLook.y += 2 * dist * Math.tan(vf) * f.lift;
  outCam.copy(_c).addScaledVector(_d, dist);
  outCam.y += 2 * dist * Math.tan(vf) * f.lift;
  return dist;
}

/**
 * How cluttered a pose is: other formations overlapping the subject's breathing
 * room on screen. Anything nearer than the subject (it would cut across the
 * silhouette) counts three times.
 */
function clutter(shot: IslandShot, cam: THREE.Vector3, look: THREE.Vector3, fovDeg: number, aspect: number) {
  probe.fov = fovDeg;
  probe.aspect = aspect;
  probe.near = 0.5;
  probe.far = 3000;
  probe.position.copy(cam);
  probe.lookAt(look);
  probe.updateProjectionMatrix();
  probe.updateMatrixWorld();
  const me = screenRect(islandBox(shot.far), probe);
  const padX = (me.x1 - me.x0) * 0.6, padY = (me.y1 - me.y0) * 0.35;
  const mx0 = me.x0 - padX, mx1 = me.x1 + padX, my0 = me.y0 - padY, my1 = me.y1 + padY;
  const myDist = cam.distanceTo(look);
  let score = 0;
  for (let i = -1; i < FAR.length; i++) {
    if (i === shot.far) continue;
    const box = i < 0 ? HERO_BOX : islandBox(i);
    box.getCenter(_c);
    if (_c.clone().sub(cam).dot(_d.subVectors(look, cam)) <= 0) continue; // behind the camera
    const o = screenRect(box, probe);
    const ox = Math.max(0, Math.min(mx1, o.x1) - Math.max(mx0, o.x0));
    const oy = Math.max(0, Math.min(my1, o.y1) - Math.max(my0, o.y0));
    score += ox * oy * (box.distanceToPoint(cam) < myDist ? 3 : 1);
  }
  return score;
}

/**
 * Camera position and target that compose this island for the given lens and
 * aspect. The authored azimuth is a preference: the camera may turn (up to 60°, or the shot's own `turn`)
 * either way when that clears neighbouring formations out of the frame. The
 * choice is made once per island and viewport shape, then cached.
 */
export function frameIsland(shot: IslandShot, fovDeg: number, aspect: number, phone: boolean, outCam: THREE.Vector3, outLook: THREE.Vector3) {
  const key = `${shot.far}|${fovDeg}|${aspect.toFixed(2)}|${phone}|${bounds[shot.far] ? 1 : 0}`;
  let dAz = chosen.get(key);
  if (dAz === undefined) {
    let best = Infinity;
    dAz = 0;
    for (const deg of [0, -15, 15, -30, 30, -45, 45, -60, 60]) {
      if (Math.abs(deg) > (shot.turn ?? 60)) continue;
      const d = THREE.MathUtils.degToRad(deg);
      pose(shot, d, fovDeg, aspect, phone, outCam, outLook);
      // a small preference for the authored angle, so ties keep it
      const s = clutter(shot, outCam, outLook, fovDeg, aspect) + Math.abs(deg) * 0.0004;
      if (s < best) { best = s; dAz = d; }
    }
    chosen.set(key, dAz);
  }
  return pose(shot, dAz, fovDeg, aspect, phone, outCam, outLook);
}

/**
 * Where the lens stands in every project shot of a formation, at the common screen shapes (desktop and phone,
 * with World's field of view for each). For placing things where those shots will see them; uses the
 * estimated bounds until the real ones are set.
 */
export function lensesFor(far: number) {
  const out: THREE.Vector3[] = [];
  const look = new THREE.Vector3();
  for (const shot of ISLAND_SHOTS) {
    if (shot.far !== far) continue;
    for (const [fov, aspect, phone] of [[38, 1.6, false], [38, 1.78, false], [38, 1.33, false], [50, 0.75, true], [50, 0.46, true]] as const) {
      const cam = new THREE.Vector3();
      frameIsland(shot, fov, aspect, phone, cam, look);
      out.push(cam);
    }
  }
  return out;
}

/** Screen-space rectangle (0..1, y down) of a box as this camera sees it: used to verify framing. */
export function screenRect(box: THREE.Box3, camera: THREE.Camera) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < 8; i++) {
    _d.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
    const x = _d.x * 0.5 + 0.5, y = -_d.y * 0.5 + 0.5;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

export const compositionEnabled = () => import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('frame');

/** Development-only composition overlay (`?frame`): thirds, centre, the island's screen rect, camera numbers. */
export function createCompositionOverlay() {
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:9998;pointer-events:none';
  document.body.appendChild(cv);
  const g = cv.getContext('2d')!;
  return {
    draw(info: { cam: THREE.Vector3; look: THREE.Vector3; fov: number; id: string; rect?: ReturnType<typeof screenRect>; raise: number }) {
      const w = (cv.width = innerWidth), h = (cv.height = innerHeight);
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgb(255 255 255 / 0.35)';
      g.lineWidth = 1;
      g.beginPath();
      for (const t of [1 / 3, 2 / 3]) {
        g.moveTo(w * t, 0); g.lineTo(w * t, h);
        g.moveTo(0, h * t); g.lineTo(w, h * t);
      }
      g.stroke();
      const cy = h * (0.5 - info.raise);
      g.strokeStyle = 'rgb(255 80 80 / 0.9)';
      g.beginPath(); g.moveTo(w / 2 - 12, cy); g.lineTo(w / 2 + 12, cy); g.moveTo(w / 2, cy - 12); g.lineTo(w / 2, cy + 12); g.stroke();
      let text = `${info.id}  fov ${info.fov.toFixed(0)}\ncam ${info.cam.toArray().map((n) => n.toFixed(0)).join(', ')}\nlook ${info.look.toArray().map((n) => n.toFixed(0)).join(', ')}`;
      if (info.rect) {
        const r = info.rect;
        g.strokeStyle = 'rgb(120 255 200 / 0.95)';
        g.strokeRect(r.x0 * w, r.y0 * h, (r.x1 - r.x0) * w, (r.y1 - r.y0) * h);
        text += `\nisland ${(r.x1 - r.x0).toFixed(2)}w x ${(r.y1 - r.y0).toFixed(2)}h  centre ${(r.cx - 0.5).toFixed(3)}, ${(r.cy - 0.5 + info.raise).toFixed(3)}`;
      }
      (window as unknown as { __frame: unknown }).__frame = { id: info.id, rect: info.rect, raise: info.raise };
      g.font = '11px ui-monospace, monospace';
      g.fillStyle = 'rgb(10 20 18 / 0.8)';
      const lines = text.split('\n');
      g.fillRect(w - 330, 8, 322, lines.length * 15 + 10);
      g.fillStyle = '#d8f7e8';
      lines.forEach((l, i) => g.fillText(l, w - 322, 24 + i * 15));
    },
    dispose() {
      cv.remove();
    },
  };
}

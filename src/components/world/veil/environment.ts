import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from '../noise';
import { buildGrid, meshGrid, mountainDensity, type MountainSpec } from './terrain';
import type { TerrainJob, TerrainResult } from './terrain.worker';
import { FAR, HERO, HERO_BOUNDS, HERO_SCALE } from './spec';
import { COMMON, commonUniforms, barkMaterial, crystalMaterial, leafDepthMaterial, leafMaterial, rockMaterial, solidDepthMaterial } from './shaders';
import { clusterGeometry, frondGeometry, frondTexture, instanced, leafTexture, scatterForest, taperTube } from './flora';

/**
 * The Veil Archipelago environment: the sculpted hero mountain (baked in
 * Blender, see docs/HERO_ISLAND_PIPELINE.md) with its forest, rivers and
 * waterfalls, roots and crystals, nine far formations, the cloud sea, sky and
 * spores, and a sun shadow map rendered once. Plain three.js: the site mounts
 * it in the R3F canvas, the lab page (/lab/hero-island.html) renders it alone.
 */

export interface EnvironmentOptions {
  /** phone budget: lighter rock LOD, fewer plants and clouds, smaller shadow map */
  low?: boolean;
  /** 'baked' (default) loads the sculpted rock; 'field' generates the unsculpted one */
  rock?: 'baked' | 'field';
  /** public base URL (import.meta.env.BASE_URL) */
  base?: string;
  onStatus?: (s: string) => void;
}

export interface Environment {
  scene: THREE.Scene;
  common: ReturnType<typeof commonUniforms>;
  /** call once per frame before rendering */
  update(camera: THREE.Camera, time: number): void;
}

const S = HERO_SCALE;

/** the sculpted rock: meshopt GLB (positions, normals, UV, AO in COLOR_0) + object-space normal map (WebP) */
async function loadBakedRock(lod: 0 | 1, base: string, say: (s: string) => void) {
  say('Loading the sculpted rock…');
  const [gltf, normal] = await Promise.all([
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`${base}world/hero/rock_lod${lod}.glb`),
    new THREE.TextureLoader().loadAsync(`${base}world/hero/rock_normal.webp`),
  ]);
  normal.colorSpace = THREE.NoColorSpace;
  normal.flipY = false;
  normal.anisotropy = 8;
  let geo: THREE.BufferGeometry | null = null;
  gltf.scene.traverse((o) => {
    if (!geo && (o as THREE.Mesh).isMesh) geo = (o as THREE.Mesh).geometry;
  });
  if (!geo) throw new Error('no mesh in rock GLB');
  const g = geo as THREE.BufferGeometry;
  const col = g.getAttribute('color');
  const ao = new Float32Array(g.attributes.position.count);
  for (let i = 0; i < ao.length; i++) ao[i] = col ? Math.pow(col.getX(i), 0.8) : 1;
  g.setAttribute('aAO', new THREE.BufferAttribute(ao, 1));
  g.computeBoundingSphere();
  return { geo: g, normal };
}

/** Mesh terrain jobs in two module workers; falls back to the main thread if workers are unavailable. */
async function meshInWorkers(jobs: TerrainJob[]): Promise<THREE.BufferGeometry[]> {
  const toGeo = (r: TerrainResult) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(r.position, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(r.normal, 3));
    g.setAttribute('aAO', new THREE.BufferAttribute(r.ao, 1));
    g.setIndex(new THREE.BufferAttribute(r.index, 1));
    g.computeBoundingSphere();
    return g;
  };
  const out: THREE.BufferGeometry[] = [];
  let workers: Worker[] = [];
  try {
    workers = [0, 1].map(() => new Worker(new URL('./terrain.worker.ts', import.meta.url), { type: 'module' }));
  } catch {
    for (const j of jobs) {
      out[j.id] = meshGrid(buildGrid(mountainDensity(j.spec), j.min, j.max, j.cell), j.scale, j.aoRays);
      await frame();
    }
    return out;
  }
  const queue = [...jobs];
  await Promise.all(
    workers.map(
      (w) =>
        new Promise<void>((resolve, reject) => {
          const next = () => {
            const j = queue.shift();
            if (!j) return resolve();
            w.postMessage(j);
          };
          w.onmessage = (e: MessageEvent<TerrainResult>) => {
            out[e.data.id] = toGeo(e.data);
            next();
          };
          w.onerror = (e) => reject(e);
          next();
        }),
    ),
  );
  workers.forEach((w) => w.terminate());
  return out;
}

async function frame() {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
}


export async function buildEnvironment(renderer: THREE.WebGLRenderer, opts: EnvironmentOptions = {}): Promise<Environment> {
  const low = !!opts.low;
  const say = opts.onStatus ?? (() => {});
  const scene = new THREE.Scene();
  const shadowScene = new THREE.Scene();
  const c = commonUniforms();
  const sun = c.uSun.value;

  // ---------------- the hero mountain ----------------
  // default: the Blender-sculpted bake (public/world/hero); ?rock=field generates the unsculpted field in the browser
  let heroGeo: THREE.BufferGeometry;
  let rockMat: THREE.ShaderMaterial;
  const baked = opts.rock !== 'field' ? await loadBakedRock(low ? 1 : 0, opts.base ?? '/', say).catch(() => null) : null;
  if (baked) {
    heroGeo = baked.geo;
    rockMat = rockMaterial(c, S, undefined, baked.normal);
  } else {
    say('Carving the mountain…');
    await frame();
    const cell = low ? 0.04 : 0.024;
    const grid = buildGrid(mountainDensity(HERO), HERO_BOUNDS[0], HERO_BOUNDS[1], cell);
    say('Meshing and baking occlusion…');
    await frame();
    heroGeo = meshGrid(grid, S, low ? 10 : 18);
    rockMat = rockMaterial(c, S);
  }
  const hero = new THREE.Mesh(heroGeo, rockMat);
  scene.add(hero);
  const solidDepth = solidDepthMaterial();
  shadowScene.add(new THREE.Mesh(heroGeo, solidDepth));

  // ---------------- rivers and waterfalls ----------------
  say('Running the water…');
  await frame();
  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  const surfaceAt = (x: number, z: number) => {
    ray.set(new THREE.Vector3(x, 80, z), down);
    const hit = ray.intersectObject(hero, false)[0];
    return hit && hit.face && hit.face.normal.y > 0.3 ? hit.point : null;
  };
  const waterMat = (opacity: number, speed: number, breakup: number, len: number) =>
    new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 wp = modelMatrix*vec4(position,1.0); vWP = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: /* glsl */ `${COMMON}
        uniform float uOpacity; uniform float uSpeed; uniform float uBreak; uniform float uLen;
        varying vec2 vUv; varying vec3 vWP;
        void main(){
          float x = vUv.x, y = vUv.y;
          float edge = smoothstep(0.0, 0.2, x) * (1.0 - smoothstep(0.8, 1.0, x));
          float streak = snoise(vec3(x * 11.0, y * uLen * 0.07 - uTime * uSpeed, 0.0)) * 0.5 + 0.5;
          float fine = snoise(vec3(x * 38.0, y * uLen * 0.22 - uTime * uSpeed * 1.7, 3.0)) * 0.5 + 0.5;
          float body = mix(streak, fine, 0.45);
          float brk = smoothstep(0.2, 0.95, y) * uBreak;
          float a = edge * (0.5 + 0.5 * body);
          a *= smoothstep(0.18, 0.55, body + edge * 0.5 - brk * 0.45);
          a *= 1.0 - smoothstep(0.7, 1.0, y) * uBreak;
          float sh = shadowAt(vWP, 0.002);
          vec3 deep = vec3(0.16, 0.38, 0.42), foam = vec3(0.95, 0.98, 0.97);
          vec3 col = mix(deep, foam, clamp(body * 0.75 + 0.2 + brk * 0.4, 0.0, 1.0));
          col *= mix(vec3(0.6, 0.68, 0.78), vec3(1.0, 0.99, 0.95), sh);
          col = mix(col, foam * 1.1, (1.0 - smoothstep(0.0, 0.06, y)) * 0.8);
          gl_FragColor = vec4(fogApply(col, vWP), a * uOpacity);
        }`,
      uniforms: { ...c, uOpacity: { value: opacity }, uSpeed: { value: speed }, uBreak: { value: breakup }, uLen: { value: len } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  const ribbon = (pts: THREE.Vector3[], widths: number[], side: THREE.Vector3[]) => {
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    let L = 0;
    pts.forEach((p, i) => {
      if (i) L += p.distanceTo(pts[i - 1]);
      const w = widths[i] / 2;
      pos.push(p.x - side[i].x * w, p.y - side[i].y * w, p.z - side[i].z * w, p.x + side[i].x * w, p.y + side[i].y * w, p.z + side[i].z * w);
      uv.push(0, L, 1, L);
      if (i < pts.length - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 2);
    });
    for (let i = 1; i < uv.length; i += 2) uv[i] /= L;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return { g, L };
  };

  const riversWorld: THREE.Vector3[][] = [];
  const falls: { lip: THREE.Vector3; dir: THREE.Vector3; width: number; drop: number }[] = [];
  for (const rv of HERO.rivers) {
    const pts: THREE.Vector3[] = [];
    let lip: THREE.Vector3 | null = null;
    let done = false;
    // walk the channel until the ground runs out: that point is the lip of the fall
    for (let i = 0; i < rv.length - 1 && !done; i++) {
      const [ax, az] = rv[i], [bx, bz] = rv[i + 1];
      const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.015);
      for (let k = 0; k < n; k++) {
        const t = k / n;
        const hit = surfaceAt((ax + (bx - ax) * t) * S, (az + (bz - az) * t) * S);
        if (hit && hit.y > -4) {
          pts.push(hit.clone().add(new THREE.Vector3(0, 0.3, 0)));
          lip = hit.clone();
        } else if (lip) {
          done = true;
          break;
        }
      }
    }
    if (pts.length < 4 || !lip) continue;
    riversWorld.push(pts);
    const dir = pts[pts.length - 1].clone().sub(pts[pts.length - 4]).setY(0).normalize();
    const sides = pts.map((_, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      return b.clone().sub(a).setY(0).normalize().cross(new THREE.Vector3(0, 1, 0));
    });
    const widths = pts.map((_, i) => 1.2 + 1.6 * (i / pts.length));
    const { g, L } = ribbon(pts, widths, sides);
    scene.add(new THREE.Mesh(g, waterMat(0.9, 0.35, 0, L)));
    falls.push({ lip, dir, width: 3.2 + falls.length * 0.6, drop: 70 });
  }
  // a fall pouring out of the cave mouth
  {
    const cv = HERO.caves[0];
    const mouth = new THREE.Vector3(cv[0], cv[1] - cv[3] * 0.45, cv[2]).multiplyScalar(S);
    const dir = new THREE.Vector3(cv[0], 0, cv[2]).normalize();
    falls.push({ lip: mouth.addScaledVector(dir, cv[3] * S * 0.6), dir, width: 2.2, drop: 60 });
  }
  const mistPuffs: { p: THREE.Vector3; s: number; o: number }[] = [];
  falls.forEach((f, fi) => {
    const side = f.dir.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    const T = Math.sqrt((2 * f.drop) / 9.8), v = 3.6;
    const layers = [
      { off: 0, w: 1, op: 0.95, sp: 0.9 },
      { off: 0.7, w: 0.6, op: 0.75, sp: 1.25 },
      { off: -0.5, w: 1.25, op: 0.45, sp: 0.7 },
    ];
    for (const ly of layers) {
      const pts: THREE.Vector3[] = [], widths: number[] = [], sides: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const tau = (i / 40) * T;
        pts.push(f.lip.clone().addScaledVector(f.dir, 0.6 + ly.off + v * tau).add(new THREE.Vector3(0, -0.5 * 9.8 * tau * tau, 0)));
        widths.push(f.width * ly.w * (1 + 0.9 * (i / 40)));
        sides.push(side);
      }
      const { g, L } = ribbon(pts, widths, sides);
      scene.add(new THREE.Mesh(g, waterMat(ly.op, ly.sp * (1 + fi * 0.1), 1, L)));
      if (ly.off === 0)
        pts.forEach((p, i) => {
          if (i > 30 && i % 4 === 0) mistPuffs.push({ p: p.clone(), s: 14 + (i / 40) * 22, o: 0.16 + (i / 40) * 0.2 });
        });
    }
    mistPuffs.push({ p: f.lip.clone().addScaledVector(f.dir, 1.5).add(new THREE.Vector3(0, -2, 0)), s: 5, o: 0.25 });
  });

  // ---------------- forest ----------------
  say('Growing the forest…');
  await frame();
  const { flora } = scatterForest(heroGeo, {
    seed: 7,
    rivers: riversWorld,
    highY: 11,
    counts: low ? { giant: 14, spire: 24, weeper: 10, bloom: 8, shrub: 260, fern: 140 } : undefined,
  });
  const leafTex = leafTexture();
  const frondTex = frondTexture();
  const clusterGeo = clusterGeometry(15, 3).scale(1.12, 1.12, 1.12); // fewer, larger cards: alpha-cut overdraw is the foliage cost
  const blossomGeo = clusterGeometry(8, 5);
  const fGeo = frondGeometry();
  const leafMat = leafMaterial(c, leafTex);
  const frondMat = leafMaterial(c, frondTex);
  const leafDepth = leafDepthMaterial(leafTex);
  const frondDepth = leafDepthMaterial(frondTex);
  const addFoliage = (geo: THREE.BufferGeometry, mat: THREE.Material, depth: THREE.Material, list: typeof flora.leaves, parent: THREE.Object3D, shadowParent?: THREE.Object3D) => {
    const m = instanced(geo, mat, list);
    parent.add(m);
    if (shadowParent) {
      const d = new THREE.InstancedMesh(geo, depth, Math.max(1, list.length));
      d.instanceMatrix = m.instanceMatrix;
      d.count = list.length;
      d.frustumCulled = false;
      shadowParent.add(d);
    }
    return m;
  };
  addFoliage(clusterGeo, leafMat, leafDepth, flora.leaves, scene, shadowScene);
  addFoliage(blossomGeo, leafMat, leafDepth, flora.blossoms, scene, shadowScene);
  addFoliage(fGeo, frondMat, frondDepth, flora.fronds, scene, shadowScene);
  const bark = barkMaterial(c);
  const trunkGeo = mergeGeometries(flora.trunks)!;
  scene.add(new THREE.Mesh(trunkGeo, bark));
  shadowScene.add(new THREE.Mesh(trunkGeo, solidDepth));
  if (flora.vines.length) scene.add(new THREE.Mesh(mergeGeometries(flora.vines)!, barkMaterial(c, '#2f4a33', '#5d7a45')));

  // ---------------- roots, hanging moss, crystals ----------------
  {
    const r = rng(19);
    const pos = heroGeo.attributes.position, nor = heroGeo.attributes.normal;
    const roots: THREE.BufferGeometry[] = [], moss: THREE.BufferGeometry[] = [], crystals: THREE.BufferGeometry[] = [];
    const p = new THREE.Vector3(), n = new THREE.Vector3();
    let nr = 0, nl = 0, nm = 0, nc = 0;
    const order = [...Array(pos.count).keys()].sort(() => r() - 0.5);
    for (const i of order) {
      p.fromBufferAttribute(pos, i);
      n.fromBufferAttribute(nor, i);
      const out = new THREE.Vector3(n.x, 0, n.z).normalize();
      if (nr < 90 && p.y > -16 && p.y < 3 && n.y < 0.15 && n.y > -0.7 && r() < 0.5) {
        const L = 5 + r() * 17;
        const j = () => new THREE.Vector3(r() - 0.5, 0, r() - 0.5).multiplyScalar(2.2);
        const a = p.clone().addScaledVector(n, -0.3);
        roots.push(taperTube([a, a.clone().addScaledVector(out, 0.8).add(new THREE.Vector3(0, -L * 0.25, 0)).add(j()), a.clone().addScaledVector(out, 1.1).add(new THREE.Vector3(0, -L * 0.6, 0)).add(j()), a.clone().addScaledVector(out, 1.3).add(new THREE.Vector3(0, -L, 0)).add(j())], 0.12 + r() * 0.16, 0.025, 12, 5, 0.5));
        nr++;
      } else if (nl < 26 && p.y < -38 && n.y < -0.4 && r() < 0.3) {
        const L = 3 + r() * 8;
        roots.push(taperTube([p.clone(), p.clone().add(new THREE.Vector3((r() - 0.5) * 1.5, -L * 0.5, (r() - 0.5) * 1.5)), p.clone().add(new THREE.Vector3((r() - 0.5) * 2.5, -L, (r() - 0.5) * 2.5))], 0.1 + r() * 0.08, 0.02, 8, 5, 0.4));
        nl++;
      } else if (nm < 65 && p.y > -3 && n.y < 0.4 && n.y > -0.3 && r() < 0.4) {
        const L = 2.5 + r() * 7;
        const e = p.clone().addScaledVector(out, 0.6).add(new THREE.Vector3((r() - 0.5) * 0.8, -L, (r() - 0.5) * 0.8));
        moss.push(taperTube([p.clone(), p.clone().lerp(e, 0.5).addScaledVector(out, 0.5), e], 0.06, 0.012, 8, 4, 0.7));
        for (let k = 1; k <= 4; k++) flora.leaf(p.clone().lerp(e, k / 4.6), new THREE.Vector3(0.45, 1.1, 0.45), new THREE.Color('#3f6e45').offsetHSL(0, 0, (r() - 0.5) * 0.06), 0.15);
        nm++;
      } else if (nc < 9 && p.y < -8 && p.y > -40 && n.y < 0.2 && n.y > -0.5 && r() < 0.04) {
        const k = 7 + Math.floor(r() * 7);
        for (let q = 0; q < k; q++) {
          const h = 2.5 + r() * 6.5, rb = 0.45 + r() * 0.6;
          const g = new THREE.CylinderGeometry(rb * 0.2, rb, h, 6, 1);
          const tip = new Float32Array(g.attributes.position.count);
          for (let v = 0; v < tip.length; v++) tip[v] = (g.attributes.position.getY(v) + h / 2) / h;
          g.setAttribute('aTip', new THREE.BufferAttribute(tip, 1));
          g.translate(0, h / 2 - 0.4, 0);
          const axis = n.clone().add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.9)).normalize();
          g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis));
          g.translate(p.x + (r() - 0.5) * 2.6, p.y + (r() - 0.5) * 2.6, p.z + (r() - 0.5) * 2.6);
          g.deleteAttribute('uv');
          crystals.push(g);
        }
        nc++;
      }
    }
    scene.add(new THREE.Mesh(mergeGeometries(roots)!, barkMaterial(c, '#3c2f27', '#6d5845')));
    scene.add(new THREE.Mesh(mergeGeometries(moss)!, barkMaterial(c, '#2d4630', '#58744a')));
    if (crystals.length) scene.add(new THREE.Mesh(mergeGeometries(crystals.map((g) => g.toNonIndexed()))!, crystalMaterial(c)));
    // the moss tufts were added after the foliage mesh was built
    if (nm) addFoliage(clusterGeo, leafMat, leafDepth, flora.leaves.slice(-nm * 4), scene);
  }

  // ---------------- distant formations ----------------
  say('Raising the far mountains…');
  await frame();
  const far = FAR;
  const farPalettes = [
    { strata: ['#a98a6b', '#c5b495', '#8a6048', '#6f7779', '#7c6550'] },
    { strata: ['#9c8270', '#b9ab92', '#7d5a4a', '#66707a', '#6f5b4c'], under: '#3f3b45' },
  ];
  // mesh all nine off the main thread (two workers), then dress them here one per frame
  const specs = far.map((f) => {
    const r = rng(f.seed);
    const spec: MountainSpec = {
      seed: f.seed,
      depth: 1.2 + r() * 1.0,
      plan: 0.05 + r() * 0.25,
      strata: 7 + r() * 4,
      crags: Array.from({ length: 1 + Math.floor(r() * 3) }, () => [(r() - 0.5) * 1.1, (r() - 0.5) * 1.1, 0.15 + r() * 0.6, 0.16 + r() * 0.22] as [number, number, number, number]),
      lobes: Array.from({ length: 1 + Math.floor(r() * 2) }, () => [(r() - 0.5) * 1, (r() - 0.5) * 1, -0.4 - r() * 0.4, 0.6 + r() * 0.6, 0.18 + r() * 0.12] as [number, number, number, number, number]),
      caves: [],
      rivers: [],
    };
    return spec;
  });
  // two levels each: full detail only when the camera visits that island (a project stop), coarse otherwise
  const meshes = await meshInWorkers(
    specs.flatMap((spec, i) => [
      { id: i * 2, spec, min: [-1.6, -2.4, -1.6], max: [1.6, 1.1, 1.6], cell: low ? 0.07 : 0.04, scale: far[i].s, aoRays: 8 },
      { id: i * 2 + 1, spec, min: [-1.6, -2.4, -1.6], max: [1.6, 1.1, 1.6], cell: 0.09, scale: far[i].s, aoRays: 6 },
    ] as TerrainJob[]),
  );
  const clusterLo = clusterGeometry(7, 5).scale(1.3, 1.3, 1.3);
  for (const [i, f] of far.entries()) {
    await frame();
    const hiGeo = meshes[i * 2], loGeo = meshes[i * 2 + 1];
    const rock = rockMaterial(c, f.s, farPalettes[f.seed % 2], undefined, true);
    const { flora: ff } = scatterForest(hiGeo, {
      seed: f.seed,
      scale: Math.max(1.2, f.s / 26),
      highY: f.s * 0.4,
      counts: { giant: 8, spire: 16, weeper: 0, bloom: 0, shrub: low ? 40 : 110, fern: 0 },
    });
    const trunks = new THREE.Mesh(mergeGeometries(ff.trunks)!, bark);
    const hi = new THREE.Group();
    hi.add(new THREE.Mesh(hiGeo, rock));
    addFoliage(clusterGeo, leafMat, leafDepth, ff.leaves, hi);
    hi.add(trunks);
    const lo = new THREE.Group();
    lo.add(new THREE.Mesh(loGeo, rock));
    addFoliage(clusterLo, leafMat, leafDepth, ff.leaves, lo);
    lo.add(trunks.clone());
    const lod = new THREE.LOD();
    lod.position.set(...f.at);
    lod.addLevel(hi, 0);
    lod.addLevel(lo, f.s * 9);
    scene.add(lod);
  }

  // ---------------- clouds and mist ----------------
  const cloudTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;
    const g = cv.getContext('2d')!;
    const r = rng(23);
    for (let q = 0; q < 4; q++) {
      const ox = (q % 2) * 256, oy = Math.floor(q / 2) * 256;
      for (let i = 0; i < 46; i++) {
        // keep every blob inside its atlas cell, or the puff gets a hard edge
        const x = ox + 64 + r() * 128;
        const rad = 16 + r() * 40 * (1 - Math.abs(x - ox - 128) / 140);
        const y = Math.max(oy + rad + 4, oy + 172 - Math.abs(r() + r() - 1) * 84 - rad * 0.2);
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,255,255,0.55)');
        gr.addColorStop(0.6, 'rgba(255,255,255,0.25)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  })();
  const cloudMat = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      attribute vec4 aCloud;
      uniform vec3 uSun;
      varying vec2 vUv; varying vec3 vWP; varying vec2 vLocal; varying vec4 vCloud; varying float vSide;
      void main(){
        vec3 center = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float sx = length(instanceMatrix[0].xyz), sy = length(instanceMatrix[1].xyz);
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 wp = center + right * position.x * sx + up * position.y * sy;
        vWP = wp; vLocal = position.xy; vCloud = aCloud;
        vSide = dot(right, uSun) * position.x * 2.0;
        vec2 cellUV = vec2(mod(aCloud.x, 2.0), floor(aCloud.x / 2.0));
        vec2 u = vec2(aCloud.w > 0.5 ? 1.0 - uv.x : uv.x, uv.y); // mirrored half the time
        vUv = (u + cellUV) * 0.5;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */ `${COMMON}
      uniform sampler2D uMap;
      varying vec2 vUv; varying vec3 vWP; varying vec2 vLocal; varying vec4 vCloud; varying float vSide;
      void main(){
        float a = texture2D(uMap, vUv).a;
        if (a < 0.004) discard;
        float h = vLocal.y + 0.5;
        float n = snoise(vWP * 0.025) * 0.5 + 0.5;
        float lit = clamp(smoothstep(0.1, 0.9, h + (n - 0.5) * 0.5 + vCloud.z) + vSide * 0.25, 0.0, 1.0);
        vec3 shade = vec3(0.5, 0.58, 0.7);
        vec3 light = mix(vec3(1.02), uSunCol * 0.6, 0.45);
        vec3 col = mix(shade, light, lit);
        col = fogApply(col, vWP);
        a *= smoothstep(6.0, 30.0, length(vWP - uCam));
        gl_FragColor = vec4(col, smoothstep(0.0, 0.85, a * 1.3) * vCloud.y);
      }`,
    uniforms: { ...c, uMap: { value: cloudTex } },
    transparent: true,
    depthWrite: false,
  });
  const puffs: { p: THREE.Vector3; s: number; o: number; lit?: number }[] = [];
  {
    const r = rng(31);
    for (let i = 0; i < (low ? 220 : 420); i++) {
      const a = r() * Math.PI * 2, d = 40 + Math.pow(r(), 0.7) * 760;
      puffs.push({ p: new THREE.Vector3(Math.cos(a) * d, -98 + (r() - 0.5) * 18, Math.sin(a) * d), s: (30 + Math.pow(r(), 2) * 120) * (1 + d * 0.0012), o: 0.55 + r() * 0.45 });
    }
    for (let i = 0; i < 30; i++) {
      const a = r() * Math.PI * 2, d = 95 + r() * 190;
      puffs.push({ p: new THREE.Vector3(Math.cos(a) * d, -26 - r() * 26, Math.sin(a) * d), s: 22 + r() * 30, o: 0.45 + r() * 0.3 });
    }
    for (const f of far)
      for (let i = 0; i < 5; i++) puffs.push({ p: new THREE.Vector3(f.at[0] + (r() - 0.5) * f.s * 2.4, f.at[1] - f.s * (0.9 + r() * 0.8), f.at[2] + (r() - 0.5) * f.s * 2.4), s: f.s * (1.1 + r()), o: 0.7 });
    for (const m of mistPuffs) puffs.push({ ...m, lit: 0.35 });
    // towering cloud banks on the horizon: the far layer of the atmosphere
    for (let i = 0; i < 34; i++) {
      const a = -2.6 + r() * 3.4, d = 820 + r() * 420;
      const sz = 220 + r() * 260;
      puffs.push({ p: new THREE.Vector3(Math.cos(a) * d, -40 + sz * 0.22 + r() * 60, Math.sin(a) * d), s: sz, o: 0.9, lit: 0.1 });
    }
  }
  {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.InstancedMesh(geo, cloudMat, puffs.length);
    const attr = new Float32Array(puffs.length * 4);
    const r = rng(37);
    puffs.forEach((pf, i) => {
      mesh.setMatrixAt(i, new THREE.Matrix4().compose(pf.p, new THREE.Quaternion(), new THREE.Vector3(pf.s, pf.s * 0.62, 1)));
      attr.set([Math.floor(r() * 4), pf.o, pf.lit ?? 0, r() < 0.5 ? 1 : 0], i * 4);
    });
    geo.setAttribute('aCloud', new THREE.InstancedBufferAttribute(attr, 4));
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    scene.add(mesh);
  }

  // the cloud floor: one continuous sea under the puffs, shaded by its own relief
  {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000, 1, 1).rotateX(-Math.PI / 2).translate(0, -112, 0),
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `varying vec3 vWP; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */ `${COMMON}
          varying vec3 vWP;
          float f2(vec2 p){ return snoise(vec3(p, 0.0)) * 0.55 + snoise(vec3(p * 2.1, 1.3)) * 0.28 + snoise(vec3(p * 4.3, 2.7)) * 0.14; }
          void main(){
            vec2 p = vWP.xz * 0.006;
            float h = f2(p);
            float e = 0.03;
            vec2 g = vec2(f2(p + vec2(e, 0.0)) - h, f2(p + vec2(0.0, e)) - h) / e;
            vec3 n = normalize(vec3(-g.x * 0.5, 1.0, -g.y * 0.5));
            float lit = clamp(dot(n, uSun) * 0.6 + 0.45 + h * 0.35, 0.0, 1.0);
            vec3 col = mix(vec3(0.52, 0.6, 0.72), mix(vec3(1.0), uSunCol * 0.58, 0.4), lit);
            gl_FragColor = vec4(fogApply(col, vWP), 1.0);
          }`,
        uniforms: { ...c },
      }),
    );
    scene.add(floor);
  }

  // ---------------- sky ----------------
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(2000, 48, 24),
    new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `${COMMON}
        varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          vec3 zen = vec3(0.1, 0.36, 0.78), hor = vec3(0.64, 0.81, 0.96), low = vec3(0.6, 0.76, 0.92);
          vec3 col = mix(hor, zen, pow(smoothstep(-0.02, 0.7, d.y), 0.7));
          col = mix(col, low, 1.0 - smoothstep(-0.25, 0.0, d.y));
          col = mix(uFogCol, col, smoothstep(-0.02, 0.1, d.y)); // the horizon melts into the same haze as the cloud floor
          float sd = max(dot(d, uSun), 0.0);
          col += uSunCol * (0.18 * pow(sd, 6.0) + 0.5 * pow(sd, 90.0));
          float cl = snoise(vec3(d.x * 2.6, d.y * 10.0, d.z * 2.6)) * 0.55 + snoise(d * 8.0) * 0.25;
          col = mix(col, vec3(0.97, 0.98, 1.0), smoothstep(0.45, 0.9, cl) * smoothstep(0.04, 0.3, d.y) * 0.3); // a few clean cirrus streaks
          gl_FragColor = vec4(col, 1.0);
        }`,
      uniforms: { ...c },
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  sky.renderOrder = -1;
  scene.add(sky);

  // ---------------- drifting spores ----------------
  {
    const r = rng(43);
    const n = low ? 400 : 1100;
    const p = new Float32Array(n * 3), sz = new Float32Array(n), tint = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      p.set([(r() - 0.5) * 140, -30 + r() * 70, (r() - 0.5) * 140], i * 3);
      sz[i] = 0.12 + r() * 0.3;
      tint[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    g.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));
    const pts = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `attribute float aSize; attribute float aTint; varying float vTint; uniform float uTime;
          void main(){ vec3 q = position; q.y += sin(uTime * 0.3 + position.x) * 0.6; vTint = aTint;
            vec4 mv = modelViewMatrix * vec4(q, 1.0); gl_PointSize = aSize * 700.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `varying float vTint; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
            vec3 col = mix(vec3(1.0, 0.92, 0.7), vec3(0.6, 0.95, 0.85), step(0.7, vTint)); gl_FragColor = vec4(col, (1.0 - d * 2.0) * 0.55); }`,
        uniforms: { uTime: c.uTime },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    pts.renderOrder = 4;
    scene.add(pts);
  }

  // ---------------- sun shadows (rendered once: the sun does not move) ----------------
  const SH = low ? 1024 : 2048;
  const shadowRT = new THREE.WebGLRenderTarget(SH, SH);
  shadowRT.depthTexture = new THREE.DepthTexture(SH, SH);
  shadowRT.depthTexture.type = THREE.UnsignedIntType;
  // hardware depth compare: each shadow tap is a filtered 2x2 PCF
  shadowRT.depthTexture.compareFunction = THREE.LessEqualCompare;
  shadowRT.depthTexture.minFilter = shadowRT.depthTexture.magFilter = THREE.LinearFilter;
  const sunCam = new THREE.OrthographicCamera(-72, 72, 72, -72, 1, 520);
  sunCam.position.copy(sun).multiplyScalar(240).add(new THREE.Vector3(0, -12, 0));
  sunCam.lookAt(0, -12, 0);
  sunCam.updateMatrixWorld();
  c.uShadowMatrix.value.multiplyMatrices(sunCam.projectionMatrix, sunCam.matrixWorldInverse);
  c.uShadowMap.value = shadowRT.depthTexture;
  c.uShadowTexel.value = 1 / SH;
  renderer.setRenderTarget(shadowRT);
  renderer.render(shadowScene, sunCam);
  renderer.setRenderTarget(null);

  // warm-up: draw every object and every LOD level once into a tiny target, so geometry and
  // textures are on the GPU before the page scrolls (otherwise each first sight stalls a frame)
  {
    const rt = new THREE.WebGLRenderTarget(4, 4);
    const cam = new THREE.PerspectiveCamera(60, 1, 0.5, 3000);
    const culled: THREE.Object3D[] = [];
    const lods: THREE.LOD[] = [];
    scene.traverse((o) => {
      if (o.frustumCulled) culled.push(o);
      o.frustumCulled = false;
      if ((o as THREE.LOD).isLOD) lods.push(o as THREE.LOD);
    });
    lods.forEach((l) => {
      l.autoUpdate = false;
      l.levels.forEach((lv) => (lv.object.visible = true));
    });
    renderer.setRenderTarget(rt);
    renderer.render(scene, cam);
    renderer.setRenderTarget(null);
    culled.forEach((o) => (o.frustumCulled = true));
    lods.forEach((l) => {
      l.autoUpdate = true;
      l.update(cam);
    });
    rt.dispose();
  }

  say('');
  return {
    scene,
    common: c,
    update(camera, time) {
      c.uTime.value = time;
      c.uCam.value.copy(camera.position);
      sky.position.copy(camera.position);
    },
  };
}

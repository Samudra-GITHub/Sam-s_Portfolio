import * as THREE from 'three';
import { fbm, noise3 } from '../noise';

/**
 * Volumetric terrain for the floating mountains.
 *
 * A mountain is a density field (positive = rock), not a spun profile: that is
 * what allows overhangs, caves, hanging lobes, strata ledges and erosion flutes.
 * The field is sampled on a grid, meshed with naive surface nets, normals come
 * from the field gradient and ambient occlusion is baked per vertex by marching
 * the field. The same code can run offline (Node) to bake GLBs for production.
 */

export type Density = (x: number, y: number, z: number) => number;

export interface MountainSpec {
  seed: number;
  /** depth of the underside below the plateau, in radii */
  depth: number;
  /** oval-ness of the plan */
  plan: number;
  /** strata per unit height (terraces and ledges) */
  strata: number;
  /** [x, z, height, width] karst crags on the plateau */
  crags: [number, number, number, number][];
  /** [x, z, top y, length, width] hanging lobes under the mass */
  lobes: [number, number, number, number, number][];
  /** [x, y, z, r] carved caves / arches */
  caves: [number, number, number, number][];
  /** river channels as raw x/z polylines (carved into the plateau) */
  rivers: [number, number][][];
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const vx = bx - ax, vz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(px - ax - vx * t, pz - az - vz * t);
}

export function mountainDensity(s: MountainSpec): Density {
  const S = s.seed;
  const topMax = 0.32 + Math.max(0, ...s.crags.map((c) => c[2]));
  const rMax = 1.25 + s.plan + 0.35;
  return (x, y, z) => {
    if (y > topMax + 0.1 || Math.hypot(x, z) > rMax) return -0.5;
    // domain warp: no straight lines anywhere
    const wx = x + 0.2 * fbm(x * 1.2, y * 1.2, z * 1.2, S, 3);
    const wy = y + 0.08 * fbm(x * 1.2 + 7.1, y * 1.2, z * 1.2, S + 1, 2);
    const wz = z + 0.2 * fbm(x * 1.2, y * 1.2, z * 1.2 + 3.7, S + 2, 3);
    const r = Math.hypot(wx, wz);
    const th = Math.atan2(wz, wx);
    const ct = Math.cos(th), st = Math.sin(th);

    // plateau with karst crags, terraced by the strata
    let top = 0.16 + 0.07 * fbm(wx * 1.8, 3.3, wz * 1.8, S + 3, 4);
    for (const [cx, cz, h, w] of s.crags) {
      const dd = Math.hypot(wx - cx, wz - cz) / w;
      if (dd < 1) top += h * Math.pow(1 - dd, 0.5) * (0.8 + 0.4 * noise3(wx * 5, wz * 5, 1, S + 9));
    }
    const tq = top * s.strata;
    const tf = tq - Math.floor(tq);
    top = (Math.floor(tq) + smooth(Math.min(1, tf * 2.6))) / s.strata;
    for (const river of s.rivers) {
      let dmin = 9;
      for (let i = 0; i < river.length - 1; i++) dmin = Math.min(dmin, segDist(x, z, river[i][0], river[i][1], river[i + 1][0], river[i + 1][1]));
      top -= 0.045 * Math.exp(-(dmin * dmin) / (0.055 * 0.055));
    }
    const dTop = top - wy;

    // the body: oval plan, overhanging lip, strata ledges, vertical erosion flutes, tapering underside
    const plan = 1 + s.plan * Math.cos(2 * th + 0.6) + 0.14 * fbm(ct * 1.3 + 5, st * 1.3, wy * 0.6, S + 4, 3);
    const t = Math.max(0, -wy) / s.depth;
    // a broken chunk, not a cone: stays massive, then rounds off; bulges and recesses at every height
    let rad = t >= 1 ? -0.2 : plan * (1 - Math.pow(t, 2.1)) * (1 + 0.06 * (1 - t));
    rad += 0.24 * fbm(ct * 2.2 + 1.7, wy * 2.4, st * 2.2, S + 12, 3) * (0.35 + t);
    rad += 0.09 * Math.exp(-(((wy - 0.04) / 0.1) ** 2));
    const band = wy * s.strata * 1.3 + 0.5 * fbm(wx * 2.2, wy * 2.2, wz * 2.2, S + 5, 2);
    const fb = band - Math.floor(band);
    rad += 0.05 * fb * fb * (1 - t * 0.5);
    rad -= 0.1 * Math.max(0, fbm(ct * 5.5, wy * 1.2, st * 5.5, S + 6, 3)) * (0.3 + t);
    let d = Math.min(dTop, rad - r);

    for (const [lx, lz, ly, len, w] of s.lobes) {
      const yr = (ly - wy) / len;
      if (yr > 1 || yr < -0.4) continue;
      const lr = w * (yr < 0 ? 1 : 1 - Math.pow(yr, 1.4)) * (1 + 0.3 * fbm(wx * 4, wy * 3, wz * 4, S + 11, 2));
      d = Math.max(d, Math.min(lr - Math.hypot(wx - lx, wz - lz), ly + 0.12 - wy));
    }
    for (const [cx, cy, cz, cr] of s.caves) d = Math.min(d, Math.hypot(x - cx, (y - cy) * 1.5, z - cz) - cr);

    // fracture and fine relief
    d += 0.02 * fbm(x * 9, y * 9, z * 9, S + 8, 2);
    return d;
  };
}

export interface Grid {
  nx: number;
  ny: number;
  nz: number;
  min: THREE.Vector3;
  cell: number;
  v: Float32Array;
}

export function buildGrid(d: Density, min: [number, number, number], max: [number, number, number], cell: number): Grid {
  const nx = Math.ceil((max[0] - min[0]) / cell) + 1;
  const ny = Math.ceil((max[1] - min[1]) / cell) + 1;
  const nz = Math.ceil((max[2] - min[2]) / cell) + 1;
  const v = new Float32Array(nx * ny * nz);
  let o = 0;
  for (let k = 0; k < nz; k++) {
    const z = min[2] + k * cell;
    for (let j = 0; j < ny; j++) {
      const y = min[1] + j * cell;
      for (let i = 0; i < nx; i++) {
        const border = i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1;
        v[o++] = border ? -1 : d(min[0] + i * cell, y, z);
      }
    }
  }
  return { nx, ny, nz, min: new THREE.Vector3(...min), cell, v };
}

export function sampleGrid(g: Grid, x: number, y: number, z: number) {
  const fx = Math.min(g.nx - 1.001, Math.max(0, (x - g.min.x) / g.cell));
  const fy = Math.min(g.ny - 1.001, Math.max(0, (y - g.min.y) / g.cell));
  const fz = Math.min(g.nz - 1.001, Math.max(0, (z - g.min.z) / g.cell));
  const i = fx | 0, j = fy | 0, k = fz | 0;
  const tx = fx - i, ty = fy - j, tz = fz - k;
  const { nx, ny, v } = g;
  const at = (a: number, b: number, c: number) => v[a + nx * (b + ny * c)];
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(at(i, j, k), at(i + 1, j, k), tx), l(at(i, j + 1, k), at(i + 1, j + 1, k), tx), ty),
    l(l(at(i, j, k + 1), at(i + 1, j, k + 1), tx), l(at(i, j + 1, k + 1), at(i + 1, j + 1, k + 1), tx), ty),
    tz,
  );
}

const CORNERS = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];

/** Naive surface nets, normals from the field gradient, AO baked by marching the field. */
export function meshGrid(g: Grid, scale: number, aoRays = 18): THREE.BufferGeometry {
  const { nx, ny, nz, v, cell, min } = g;
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const cellVert = new Int32Array(nx * ny * nz).fill(-1);
  const pos: number[] = [];
  const c = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        for (let q = 0; q < 8; q++) {
          const o = CORNERS[q];
          c[q] = v[at(i + o[0], j + o[1], k + o[2])];
          if (c[q] > 0) mask |= 1 << q;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [a, b] of EDGES) {
          if (c[a] > 0 === c[b] > 0) continue;
          const t = c[a] / (c[a] - c[b]);
          const pa = CORNERS[a], pb = CORNERS[b];
          sx += pa[0] + (pb[0] - pa[0]) * t;
          sy += pa[1] + (pb[1] - pa[1]) * t;
          sz += pa[2] + (pb[2] - pa[2]) * t;
          n++;
        }
        cellVert[at(i, j, k)] = pos.length / 3;
        pos.push(min.x + (i + sx / n) * cell, min.y + (j + sy / n) * cell, min.z + (k + sz / n) * cell);
      }

  const idx: number[] = [];
  const quad = (a: number, b: number, cc: number, d: number) => {
    if (a < 0 || b < 0 || cc < 0 || d < 0) return;
    idx.push(a, b, cc, a, cc, d);
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const s0 = v[at(i, j, k)] > 0;
        if (s0 !== v[at(i + 1, j, k)] > 0) quad(cellVert[at(i, j - 1, k - 1)], cellVert[at(i, j, k - 1)], cellVert[at(i, j, k)], cellVert[at(i, j - 1, k)]);
        if (s0 !== v[at(i, j + 1, k)] > 0) quad(cellVert[at(i - 1, j, k - 1)], cellVert[at(i - 1, j, k)], cellVert[at(i, j, k)], cellVert[at(i, j, k - 1)]);
        if (s0 !== v[at(i, j, k + 1)] > 0) quad(cellVert[at(i - 1, j - 1, k)], cellVert[at(i, j - 1, k)], cellVert[at(i, j, k)], cellVert[at(i - 1, j, k)]);
      }

  // normals from the gradient (outward = towards decreasing density)
  const count = pos.length / 3;
  const nor = new Float32Array(count * 3);
  const h = cell;
  for (let q = 0; q < count; q++) {
    const x = pos[q * 3], y = pos[q * 3 + 1], z = pos[q * 3 + 2];
    let gx = sampleGrid(g, x - h, y, z) - sampleGrid(g, x + h, y, z);
    let gy = sampleGrid(g, x, y - h, z) - sampleGrid(g, x, y + h, z);
    let gz = sampleGrid(g, x, y, z - h) - sampleGrid(g, x, y, z + h);
    const l = Math.hypot(gx, gy, gz) || 1;
    gx /= l; gy /= l; gz /= l;
    nor[q * 3] = gx; nor[q * 3 + 1] = gy; nor[q * 3 + 2] = gz;
  }
  // wind every triangle to agree with the gradient
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], cc = idx[t + 2];
    const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2];
    const wx = pos[cc * 3] - pos[a * 3], wy = pos[cc * 3 + 1] - pos[a * 3 + 1], wz = pos[cc * 3 + 2] - pos[a * 3 + 2];
    const fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx;
    const nn = (nor[a * 3] + nor[b * 3] + nor[cc * 3]) * fx + (nor[a * 3 + 1] + nor[b * 3 + 1] + nor[cc * 3 + 1]) * fy + (nor[a * 3 + 2] + nor[b * 3 + 2] + nor[cc * 3 + 2]) * fz;
    if (nn < 0) { idx[t + 1] = cc; idx[t + 2] = b; }
  }

  // ambient occlusion: march rays over the hemisphere through the field
  const dirs: THREE.Vector3[] = [];
  for (let q = 0; q < aoRays * 2; q++) {
    const yy = 1 - (q + 0.5) / aoRays; // fibonacci sphere, upper and lower halves
    const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
    const a = q * 2.39996;
    dirs.push(new THREE.Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr));
  }
  const steps = [1.5, 3, 6, 11, 18].map((s) => s * cell);
  const ao = new Float32Array(count);
  for (let q = 0; q < count; q++) {
    const x = pos[q * 3], y = pos[q * 3 + 1], z = pos[q * 3 + 2];
    const n0 = nor[q * 3], n1 = nor[q * 3 + 1], n2 = nor[q * 3 + 2];
    let occ = 0, tot = 0;
    for (const dvec of dirs) {
      const cos = dvec.x * n0 + dvec.y * n1 + dvec.z * n2;
      if (cos < 0.15) continue;
      let hit = 0;
      for (let si = 0; si < steps.length; si++) {
        const s = steps[si];
        if (sampleGrid(g, x + dvec.x * s, y + dvec.y * s, z + dvec.z * s) > 0) { hit = 1 - si * 0.12; break; }
      }
      occ += hit * cos;
      tot += cos;
    }
    ao[q] = Math.pow(1 - occ / Math.max(tot, 1e-4), 1.4);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos.map((p) => p * scale), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('aAO', new THREE.BufferAttribute(ao, 1));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

import type { MountainSpec } from './terrain';

/** The hero mountain. Shared by the lab page and the offline bake (scripts/export-hero.mjs). */
export const HERO_SCALE = 30; // world units per mountain radius
export const HERO_BOUNDS: [[number, number, number], [number, number, number]] = [[-1.6, -2.0, -1.6], [1.6, 1.05, 1.6]];
export const HERO: MountainSpec = {
  seed: 41,
  depth: 1.5,
  plan: 0.16,
  strata: 9,
  crags: [
    [0.42, -0.3, 0.62, 0.3],
    [0.72, -0.02, 0.34, 0.18],
    [-0.35, -0.55, 0.3, 0.22],
    [0.05, 0.62, 0.18, 0.25],
  ],
  lobes: [
    [0.5, 0.38, -0.55, 0.95, 0.3],
    [-0.55, 0.15, -0.75, 0.85, 0.27],
    [0.12, -0.52, -0.95, 0.75, 0.24],
    [-0.2, 0.55, -0.9, 0.55, 0.17],
    [0.72, -0.25, -0.7, 0.5, 0.15],
  ],
  caves: [
    [0.98, -0.16, 0.38, 0.2],
    [-0.2, -0.62, 0.98, 0.24],
  ],
  rivers: [
    [[-0.15, 0.05], [0.25, 0.35], [0.62, 0.62], [1.2, 1.0]],
    [[0.15, -0.08], [0.55, 0.12], [0.95, 0.3], [1.5, 0.5]],
    [[0.25, -0.62], [0.2, -0.95], [0.18, -1.6]],
  ],
};

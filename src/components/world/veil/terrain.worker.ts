/// <reference lib="webworker" />
import { buildGrid, meshGrid, mountainDensity, type MountainSpec } from './terrain';

/**
 * Meshes far formations off the main thread. Generating them took about
 * 12 s of main-thread time on load (the page could not scroll meanwhile).
 */
export interface TerrainJob {
  id: number;
  spec: MountainSpec;
  min: [number, number, number];
  max: [number, number, number];
  cell: number;
  scale: number;
  aoRays: number;
}
export interface TerrainResult {
  id: number;
  position: Float32Array;
  normal: Float32Array;
  ao: Float32Array;
  index: Uint32Array;
}

self.onmessage = (e: MessageEvent<TerrainJob>) => {
  const j = e.data;
  const geo = meshGrid(buildGrid(mountainDensity(j.spec), j.min, j.max, j.cell), j.scale, j.aoRays);
  const position = geo.attributes.position.array as Float32Array;
  const normal = geo.attributes.normal.array as Float32Array;
  const ao = geo.attributes.aAO.array as Float32Array;
  const index = Uint32Array.from(geo.index!.array);
  const out: TerrainResult = { id: j.id, position, normal, ao, index };
  (self as unknown as Worker).postMessage(out, [position.buffer, normal.buffer, ao.buffer, index.buffer]);
};

// Export the hero mountain's base rock mesh for the Blender sculpt pass.
// Usage: node scripts/export-hero.mjs [cell]   ->  art/hero-island/rock_base.ply
// Runs the same TypeScript generator the lab page uses, through Vite's SSR loader.
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';

const cell = Number(process.argv[2] ?? 0.02);
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { buildGrid, meshGrid, mountainDensity } = await vite.ssrLoadModule('/src/components/world/veil/terrain.ts');
  const { HERO, HERO_BOUNDS, HERO_SCALE } = await vite.ssrLoadModule('/src/components/world/veil/spec.ts');
  const t0 = Date.now();
  const grid = buildGrid(mountainDensity(HERO), HERO_BOUNDS[0], HERO_BOUNDS[1], cell);
  const geo = meshGrid(grid, HERO_SCALE, 18);
  const pos = geo.attributes.position.array, nor = geo.attributes.normal.array, ao = geo.attributes.aAO.array;
  const idx = geo.index.array;
  const nv = pos.length / 3, nf = idx.length / 3;

  // binary little-endian PLY: position, normal, AO in the red channel
  const header = `ply\nformat binary_little_endian 1.0\nelement vertex ${nv}\nproperty float x\nproperty float y\nproperty float z\nproperty float nx\nproperty float ny\nproperty float nz\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nelement face ${nf}\nproperty list uchar int vertex_indices\nend_header\n`;
  const vsize = 6 * 4 + 3, fsize = 1 + 3 * 4;
  const buf = Buffer.alloc(header.length + nv * vsize + nf * fsize);
  let o = buf.write(header, 0, 'latin1');
  for (let i = 0; i < nv; i++) {
    for (let k = 0; k < 3; k++) o = buf.writeFloatLE(pos[i * 3 + k], o);
    for (let k = 0; k < 3; k++) o = buf.writeFloatLE(nor[i * 3 + k], o);
    const a = Math.round(Math.min(1, Math.max(0, ao[i])) * 255);
    o = buf.writeUInt8(a, o); o = buf.writeUInt8(a, o); o = buf.writeUInt8(a, o);
  }
  for (let f = 0; f < nf; f++) {
    o = buf.writeUInt8(3, o);
    for (let k = 0; k < 3; k++) o = buf.writeInt32LE(idx[f * 3 + k], o);
  }
  mkdirSync('art/hero-island', { recursive: true });
  writeFileSync('art/hero-island/rock_base.ply', buf);
  console.log(`rock_base.ply: ${nv} verts, ${nf} tris, cell ${cell}, ${Date.now() - t0} ms`);
} finally {
  await vite.close();
}

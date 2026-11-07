import * as THREE from 'three';
import type { Common } from '../shaders';
import { Builder, CH, hex, SEQ } from './kit';
import { beats, builder, canvasCard, detailShot, kiosk, lamps, type Pad, placeGroup, type ProjectWorld, SANS, V } from './stage';

/**
 * PRAHARI: mine safety data, with a copilot that cannot make numbers up. An open pit cut into the terrace,
 * its benches stepping down, with sensor posts on the rim that report in one after another until one
 * crosses its limit and turns red. A safety-yellow headframe turns its sheave over the shaft, and the
 * control room's display shows the product's own sign-in screen, from the repository's README.
 * Illustrative: no reading or score on this island comes from the product.
 */

const DARK = hex('#2b2a24'), CREAM = hex('#f2ede1'), AMBER = hex('#f2b632');
const BENCH = [hex('#a38f6c'), hex('#8d7a5b'), hex('#786750'), hex('#655744')];
const STONE = hex('#b4aa98'), STONE_DARK = hex('#7c7464'), STEEL = hex('#5d5b52');

export function prahariWorld(c: Common, pad: Pad, base = '/'): ProjectWorld {
  const group = placeGroup('prahari', pad);
  const { b, mat } = builder(c, { steps: 6, warm: [1.25, 1.2, 1.0] });

  // ---- the terrace with the pit cut into its left half: solid on the right, benches stepping down on the left
  const PW = 10.4, D = 14;
  b.box(V(5.3, -1.4, 0), [10.4, 2.8, D], 0, { col: STONE_DARK });
  b.box(V(5.3, -0.05, 0), [10, 0.1, D - 0.6], 0, { col: STONE });
  // the pit sits in a raised berm, so its benches read above the island's own ground
  const LIFT = 2.4;
  const pc = V(-5.0, LIFT, 0);
  b.box(pc.clone().add(V(0, -2.6 - LIFT / 2, 0)), [PW + 0.6, 0.4 + LIFT, D], 0, { col: STONE_DARK });
  for (let k = 0; k < 4; k++) {
    const outer = (PW + 0.6) / 2 - k * 1.15, inner = outer - 1.15, y = -k * 0.6;
    const hgt = 2.4 - k * 0.6 + 0.2, cy = y - hgt / 2;
    const col = BENCH[k];
    const dz = D / 2 - k * 1.15, dzi = dz - 1.15;
    // the bench: a ring of four slabs between this level and the next one down
    b.box(pc.clone().add(V(0, cy, dzi + (dz - dzi) / 2)), [outer * 2, hgt, dz - dzi], 0, { col });
    b.box(pc.clone().add(V(0, cy, -(dzi + (dz - dzi) / 2))), [outer * 2, hgt, dz - dzi], 0, { col });
    b.box(pc.clone().add(V(outer - 0.575, cy, 0)), [1.15, hgt, dzi * 2], 0, { col });
    b.box(pc.clone().add(V(-(outer - 0.575), cy, 0)), [1.15, hgt, dzi * 2], 0, { col });
    if (k === 3) b.box(pc.clone().add(V(0, y - 0.6 - 0.15, 0)), [inner * 2, 0.3, dzi * 2], 0, { col: BENCH[3] });
  }
  // a haul road ramping down the benches
  b.box(pc.clone().add(V(-1.0, -1.1, 4.2)), [5.6, 0.12, 0.9], 0, { col: hex('#b9a785') }, 0, 0.42);

  // ---- sensors on the rim: five report in turn, then the sixth crosses its limit
  const rim: [number, number][] = [[-9.6, 6.4], [-5.0, 6.6], [-0.6, 6.2], [-0.6, -6.2], [-9.6, -6.4], [-0.6, 0.2]];
  rim.forEach(([x, z], k) => {
    b.box(V(x, LIFT + 0.7, z), [0.14, 1.4, 0.14], 0, { col: CREAM });
    b.box(V(x, LIFT + 1.2, z + 0.1), [0.36, 0.3, 0.12], 0, { col: DARK });
    if (k < 5) b.sphere(V(x, LIFT + 1.55, z), 0.17, { col: hex('#7ee08a'), glow: 1, ch: SEQ(k) }, 8);
    else b.sphere(V(x, LIFT + 1.55, z), 0.22, { col: hex('#ff4a33'), glow: 1, ch: CH.d }, 10);
  });

  // ---- the headframe: safety-yellow legs over the shaft collar, and the winding house behind
  const hf = V(3.2, 0, -3.8), HH = 9.2;
  b.box(hf.clone().add(V(0, 0.3, 0)), [3, 0.6, 3], 0, { col: CREAM });
  for (const s of [-1, 1]) {
    b.rod(hf.clone().add(V(s * 1.3, 0.6, 1.2)), hf.clone().add(V(s * 0.45, HH, 0)), 0.14, { col: AMBER }, 6);
    b.rod(hf.clone().add(V(s * 1.3, 0.6, -1.2)), hf.clone().add(V(s * 0.45, HH, 0)), 0.14, { col: AMBER }, 6);
    for (let y = 2; y < HH - 1; y += 2.2) {
      const f = (y - 0.6) / (HH - 0.6), x = s * (1.3 - 0.85 * f), z = 1.2 * (1 - f);
      b.rod(hf.clone().add(V(x, y, z)), hf.clone().add(V(x, y, -z)), 0.06, { col: AMBER }, 4);
      b.rod(hf.clone().add(V(-x, y, z)), hf.clone().add(V(x, y + 1.1, z)), 0.05, { col: AMBER }, 4);
    }
    // the back stay, leaning toward the winding house
    b.rod(hf.clone().add(V(s * 0.45, HH - 0.4, 0)), hf.clone().add(V(s * 1.2, 0.6, 4.2 - 8.0)), 0.12, { col: AMBER }, 6);
  }
  b.box(hf.clone().add(V(0, HH + 0.1, 0)), [1.4, 0.3, 1.0], 0, { col: AMBER });
  b.sphere(hf.clone().add(V(0, HH + 1.5, 0)), 0.16, { col: hex('#ff4a33'), glow: 1, ch: CH.b }, 8);
  const wh = V(7.4, 0, -4.8);
  b.box(wh.clone().add(V(0, 1.6, 0)), [4.6, 3.2, 3.6], 0, { col: DARK });
  b.box(wh.clone().add(V(0, 3.35, 0)), [4.9, 0.3, 3.9], 0, { col: CREAM });
  b.box(wh.clone().add(V(0, 1.9, 1.82)), [3.6, 1.2, 0.06], 0, { col: hex('#ffe3a3'), glow: 0.8, ch: CH.a });
  b.rod(wh.clone().add(V(-2.2, 2.6, 0)), hf.clone().add(V(0, HH, -0.6)), 0.03, { col: STEEL }, 4);

  // the sheave: a wheel with spokes, turning as the cage runs
  const wb = new Builder();
  wb.add(new THREE.TorusGeometry(0.95, 0.09, 6, 28), new THREE.Matrix4(), { col: DARK });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    wb.rod(V(0, 0, 0), V(Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0), 0.04, { col: DARK }, 4);
  }
  wb.disc(V(0, 0, 0), 0.18, 0.3, 10, { col: AMBER });
  const sheave = new THREE.Mesh(wb.build(), mat);
  sheave.position.copy(hf).add(V(0, HH + 0.9, 0));
  sheave.rotation.y = Math.PI / 2;
  group.add(sheave);

  lamps(b, [[1.4, 6.4], [9.3, 5.4], [9.3, -1.0], [1.4, -6.4]], DARK, hex('#ffe3a3'));

  const screen = kiosk(c, b, group, {
    x: 6.6, z: 2.6, yaw: -0.45, w: 2.6, h: 2.7, frame: DARK, trim: AMBER, period: 8,
    pages: [`${base}world/prahari/login.webp`],
  });

  const sign = canvasCard(c, [4.2, 0.62], [1024, 152], (g, w, h) => {
    g.fillStyle = '#2b2a24';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2b632';
    g.font = `700 104px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '14px';
    g.fillText('PRAHARI', w / 2, h / 2 + 5);
  }, new THREE.Vector3(1.3, 1.3, 1.3), [`700 104px ${SANS}`]);
  sign.mesh.position.copy(wh).add(V(0, 2.85, 1.86));
  group.add(sign.mesh);

  const arch = new THREE.Mesh(b.build(), mat);
  group.add(arch);

  const detail = detailShot(group, V(-0.5, 16, 22), V(-2.4, 1.6, -1.4));
  let turn = 0, last = 0;
  return {
    group,
    detail,
    triangles: b.triangles + wb.triangles + 4,
    update(t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, k.screen);
      mat.uniforms.uSeq.value.x = k.seq;
      sign.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      sign.mat.uniforms.uReveal.value = k.sign;
      screen.update(t, k.screen);
      const dt = Math.min(0.1, Math.max(0, t - last));
      last = t;
      turn += dt * 1.4 * k.life;
      sheave.rotation.z = turn;
    },
  };
}

import * as THREE from 'three';
import type { Common } from '../shaders';
import { Builder, CH, hex, SEQ } from './kit';
import { beats, builder, canvasCard, detailShot, kiosk, labels, lamps, type Pad, placeGroup, plinth, type ProjectWorld, SANS, V } from './stage';

/**
 * RINTI AI: an AI companion that plans its research. An observatory in the app's cobalt and paper, its dome
 * slit lit in lime. In front, the research pipeline the project really runs (plan, search, read, check
 * claims, write) stands as five beacons that light in order; source cards circle above the dome; a display
 * shows the app's own sign-in and sign-up screens, from the repository's README.
 */

const COBALT = hex('#1e3ae8'), PAPER = hex('#fdf9f1'), LIME = hex('#d8f827'), INK = hex('#111215');
const STONE = hex('#cfd3dc'), STONE_DARK = hex('#8d93a3');
const STAGES = ['plan', 'search', 'read', 'check claims', 'write'];

export function rintiWorld(c: Common, pad: Pad, base = '/'): ProjectWorld {
  const group = placeGroup('rinti-ai', pad);
  const { b, mat } = builder(c, { steps: STAGES.length, warm: [1.2, 1.3, 1.1] });

  plinth(b, 21, 14, STONE, STONE_DARK);

  // ---- the observatory: a paper drum with a cobalt band, a cobalt dome, a lime slit
  const o = V(-1.2, 0, -3.6);
  b.cyl(o, 3.6, 3.7, 3.8, 40, { col: PAPER });
  b.cyl(o.clone().add(V(0, 3.4, 0)), 3.72, 3.72, 0.45, 40, { col: COBALT, glow: 0.35, ch: CH.b });
  b.lathe(o.clone().add(V(0, 3.85, 0)), Array.from({ length: 10 }, (_, i) => {
    const a = (i / 9) * (Math.PI / 2);
    return [Math.cos(a) * 3.6, Math.sin(a) * 3.4] as [number, number];
  }), 40, { col: COBALT });
  // the slit, open toward the sky and the visitor
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * (Math.PI / 2) * 0.92;
    b.box(o.clone().add(V(0, 3.85 + Math.sin(a) * 3.42, Math.cos(a) * 3.62)), [0.7, 0.5, 0.16], 0, { col: LIME, glow: 0.9, ch: CH.a }, -a);
  }
  // door and two windows, warm inside
  b.box(o.clone().add(V(0, 1.25, 3.66)), [1.4, 2.5, 0.1], 0, { col: hex('#f6e7b8'), glow: 0.75, ch: CH.a });
  for (const a of [-0.75, 0.75]) b.box(o.clone().add(V(Math.sin(a) * 3.66, 2.1, Math.cos(a) * 3.66)), [0.8, 1.2, 0.1], a, { col: hex('#f6e7b8'), glow: 0.75, ch: CH.a });

  // ---- the research pipeline: five beacons on an arc, joined by a cobalt line
  const beacon = STAGES.map((_, k) => {
    const a = (-0.62 + (k / (STAGES.length - 1)) * 1.24);
    return V(-1.2 + Math.sin(a) * 8.0, 0, -3.6 + Math.cos(a) * 8.0);
  });
  beacon.forEach((p, k) => {
    b.box(p.clone().add(V(0, 0.15, 0)), [1.1, 0.3, 1.1], 0, { col: INK });
    b.box(p.clone().add(V(0, 1.35, 0)), [0.62, 2.1, 0.62], 0, { col: PAPER });
    b.sphere(p.clone().add(V(0, 2.75, 0)), 0.42, { col: LIME, glow: 1, ch: SEQ(k) }, 14);
    if (k) b.rod(beacon[k - 1].clone().add(V(0, 0.35, 0)), p.clone().add(V(0, 0.35, 0)), 0.07, { col: COBALT, glow: 0.4, ch: SEQ(k) });
  });
  const plates = labels(c, STAGES.map((text, k) => ({ text, at: beacon[k].clone().add(V(0, 1.2, 0.33)), yaw: Math.atan2(beacon[k].x + 1.2, beacon[k].z + 3.6) * 0.6 })), {
    w: 1.5, h: 0.42, ink: '#fdf9f1', paper: '#1e3ae8', font: SANS,
  });
  group.add(plates.mesh);

  lamps(b, [[-3.4, 6.4], [3.4, 6.4], [-9.3, 5.4], [9.3, 5.4]], INK, LIME);

  const screen = kiosk(c, b, group, {
    x: 7.4, z: 0.8, yaw: -0.5, w: 2.3, h: 2.6, frame: INK, trim: LIME, period: 5,
    pages: ['login', 'register'].map((n) => `${base}world/rinti/${n}.webp`),
  });

  // ---- sources: paper cards circling above the dome, each with a few lines of cobalt "text"
  const sb = new Builder();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const p = V(Math.cos(a) * 5.4, 0.5 * Math.sin(a * 2), Math.sin(a) * 5.4);
    const yaw = -a + Math.PI / 2;
    sb.box(p, [1.3, 0.9, 0.04], yaw, { col: PAPER, glow: 0.25, ch: CH.b }, 0.08);
    for (let l = 0; l < 3; l++) sb.box(p.clone().add(V(0, 0.22 - l * 0.18, 0)), [0.9 - l * 0.2, 0.06, 0.05], yaw, { col: COBALT }, 0.08);
  }
  const sources = new THREE.Mesh(sb.build(), mat);
  sources.position.copy(o).add(V(0, 9.2, 0));
  group.add(sources);

  const sign = canvasCard(c, [3.6, 0.7], [1024, 200], (g, w, h) => {
    g.fillStyle = '#1e3ae8';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#fdf9f1';
    g.font = `700 120px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '8px';
    g.fillText('RINTI AI', w / 2, h / 2 + 6);
  }, new THREE.Vector3(1.25, 1.25, 1.25), [`700 120px ${SANS}`]);
  sign.mesh.position.copy(o).add(V(0, 3.0, 3.73));
  group.add(sign.mesh);

  const arch = new THREE.Mesh(b.build(), mat);
  group.add(arch);

  const detail = detailShot(group, V(0.5, 12.5, 23), V(-3.4, 2.8, -1.4));
  return {
    group,
    detail,
    triangles: b.triangles + sb.triangles + STAGES.length * 2 + 4,
    update(t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, k.screen);
      mat.uniforms.uSeq.value.x = k.seq;
      plates.mat.uniforms.uOn.value = 1;
      plates.mat.uniforms.uReveal.value = k.seq;
      sign.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      sign.mat.uniforms.uReveal.value = k.sign;
      screen.update(t, k.screen);
      // the sources gather (rise and close in) as the research runs, and keep circling
      sources.rotation.y = t * 0.12;
      const s = 0.55 + 0.45 * k.life;
      sources.scale.setScalar(s);
      sources.position.y = o.y + 6.5 + 2.7 * k.life;
      sources.visible = k.life > 0.01;
    },
  };
}

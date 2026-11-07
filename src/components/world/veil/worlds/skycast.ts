import * as THREE from 'three';
import type { Common } from '../shaders';
import { Builder, CH, hex } from './kit';
import { beats, builder, canvasCard, detailShot, lamps, type Pad, placeGroup, plinth, type ProjectWorld, SANS, skyScreen, V } from './stage';

/**
 * SKYCAST: the sky, on a slow loop. A weather station on the smallest spire, in paper, ink and cobalt: a
 * lattice mast with a spinning anemometer and a wind vane, a louvred instrument screen and a rain gauge.
 * Its display runs a sky through the times of day, as the app animates its own sky behind the forecast.
 * The repository has no screenshots, so the display draws the sky and shows no readings: nothing on this
 * island pretends to be live weather data.
 */

const PAPER = hex('#fdf9f1'), INK = hex('#111215'), COBALT = hex('#1e3ae8');
const STONE = hex('#d2cfc6'), STONE_DARK = hex('#94918a'), STEEL = hex('#a7adb4');

export function skycastWorld(c: Common, pad: Pad): ProjectWorld {
  const group = placeGroup('skycast', pad);
  const { b, mat } = builder(c, { warm: [1.2, 1.25, 1.35] });

  plinth(b, 15, 11, STONE, STONE_DARK);

  // ---- the mast: a three-legged lattice, braced every metre and a half
  const m = V(2.6, 0, -2.2), H = 9.6, R = 0.5;
  const leg = (k: number, y: number) => V(m.x + Math.cos((k / 3) * Math.PI * 2) * R, y, m.z + Math.sin((k / 3) * Math.PI * 2) * R);
  for (let k = 0; k < 3; k++) b.rod(leg(k, 0), leg(k, H), 0.05, { col: STEEL });
  for (let y = 0; y < H - 0.5; y += 1.4) for (let k = 0; k < 3; k++) b.rod(leg(k, y), leg(k + 1, y + 1.4), 0.025, { col: STEEL }, 4);
  b.cyl(V(m.x, 0, m.z), 0.9, 1.0, 0.3, 12, { col: INK });
  b.cyl(V(m.x, H, m.z), 0.75, 0.75, 0.12, 12, { col: INK });
  // a cobalt beacon at the top, and a side arm for the vane
  b.sphere(V(m.x, H + 0.3, m.z), 0.16, { col: COBALT, glow: 1, ch: CH.b }, 8);
  b.rod(V(m.x, H - 1.2, m.z), V(m.x - 1.6, H - 1.2, m.z), 0.04, { col: STEEL });
  b.cyl(V(m.x - 1.6, H - 1.25, m.z), 0.05, 0.05, 0.5, 6, { col: STEEL });

  // the anemometer: three cups on arms, turning with the wind
  const ab = new Builder();
  ab.cyl(V(0, -0.15, 0), 0.08, 0.1, 0.4, 8, { col: INK });
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2, e = V(Math.cos(a) * 0.9, 0.12, Math.sin(a) * 0.9);
    ab.rod(V(0, 0.12, 0), e, 0.03, { col: STEEL }, 4);
    const cup = new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    ab.add(cup, new THREE.Matrix4().compose(e, new THREE.Quaternion().setFromAxisAngle(V(Math.sin(a), 0, -Math.cos(a)), Math.PI / 2), V(1, 1, 1)), { col: PAPER });
  }
  const anemo = new THREE.Mesh(ab.build(), mat);
  anemo.position.set(m.x, H + 0.55, m.z);
  group.add(anemo);
  // the vane: a cobalt tail and a pointer
  const vb = new Builder();
  vb.box(V(0.35, 0, 0), [1.0, 0.05, 0.05], 0, { col: INK });
  vb.box(V(0.85, 0, 0), [0.4, 0.38, 0.03], 0, { col: COBALT });
  vb.box(V(-0.25, 0, 0), [0.24, 0.1, 0.1], 0, { col: INK });
  const vane = new THREE.Mesh(vb.build(), mat);
  vane.position.set(m.x - 1.6, H - 0.7, m.z);
  group.add(vane);

  // guy wires from two thirds up the mast to anchors in the terrace
  for (const [ax, az] of [[5.7, -2.0], [1.0, 0.5], [1.2, -4.9]]) {
    b.rod(V(m.x, H * 0.66, m.z), V(ax, 0.1, az), 0.012, { col: STEEL }, 3);
    b.box(V(ax, 0.08, az), [0.3, 0.16, 0.3], 0, { col: INK });
  }
  // a solar panel on the mast, tilted to the sun, feeding the logger box under it
  b.box(V(m.x + 0.75, H * 0.45, m.z + 0.2), [1.3, 0.05, 0.9], 0.6, { col: hex('#1d2a6b'), gloss: 0.7 }, -0.7);
  b.box(V(m.x + 0.5, H * 0.3, m.z + 0.45), [0.5, 0.6, 0.25], 0.6, { col: PAPER });

  // ---- the equipment hut: paper walls, an ink roof falling to the back, a cobalt door, a vent
  const hu = V(5.2, 0, 1.4);
  b.box(hu.clone().add(V(0, 1.1, 0)), [2.4, 2.2, 2.0], 0, { col: PAPER });
  b.box(hu.clone().add(V(0, 2.32, 0)), [2.7, 0.14, 2.4], 0, { col: INK }, -0.12);
  b.box(hu.clone().add(V(-0.4, 0.95, 1.01)), [0.8, 1.7, 0.06], 0, { col: COBALT }, 0, 0, 0.02);
  for (let i = 0; i < 4; i++) b.box(hu.clone().add(V(0.6, 1.3 + i * 0.14, 1.02)), [0.6, 0.04, 0.03], 0, { col: hex('#c8c4ba') }, 0, 0, 0);
  b.box(hu.clone().add(V(0.6, 1.55, 1.02)), [0.7, 0.66, 0.02], 0, { col: hex('#c8c4ba') }, 0, 0, 0);

  // ---- the instrument screen: a louvred white box on legs, and a rain gauge
  const ss = V(-3.4, 0, -2.6);
  for (const [x, z] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]]) b.box(ss.clone().add(V(x, 0.6, z)), [0.1, 1.2, 0.1], 0, { col: PAPER });
  b.box(ss.clone().add(V(0, 1.9, 0)), [1.7, 1.4, 1.3], 0, { col: PAPER });
  for (let i = 0; i < 6; i++) {
    b.box(ss.clone().add(V(0, 1.35 + i * 0.22, 0.66)), [1.6, 0.04, 0.04], 0, { col: hex('#c8c4ba') }, 0.3, 0, 0);
    for (const sx of [-1, 1]) b.box(ss.clone().add(V(sx * 0.86, 1.35 + i * 0.22, 0)), [0.04, 0.04, 1.2], 0, { col: hex('#c8c4ba') }, 0, 0, 0);
  }
  b.box(ss.clone().add(V(0, 2.7, 0)), [1.95, 0.12, 1.55], 0, { col: INK }, 0.08);
  b.cyl(V(-0.9, 0, 0.4), 0.28, 0.28, 1.0, 14, { col: STEEL });
  b.cyl(V(-0.9, 1.0, 0.4), 0.34, 0.28, 0.12, 14, { col: INK });

  // ---- the sky display, on a cobalt frame, front left
  const d = V(-3.0, 0, 2.4), dy = 0.42;
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), dy);
  const dp = (x: number, y: number, z: number) => V(x, y, z).applyQuaternion(q).add(d);
  for (const s of [-1.3, 1.3]) b.box(dp(s, 0.75, -0.06), [0.14, 1.5, 0.14], dy, { col: INK });
  b.box(dp(0, 2.55, -0.08), [3.6, 2.3, 0.14], dy, { col: INK });
  b.box(dp(0, 3.77, -0.08), [3.6, 0.07, 0.18], dy, { col: COBALT, glow: 0.6, ch: CH.d });
  const sky = skyScreen(c, 3.3, 2.0);
  sky.mesh.position.copy(dp(0, 2.55, 0.0));
  sky.mesh.rotation.y = dy;
  group.add(sky.mesh);

  lamps(b, [[-3.2, 4.8], [3.2, 4.8], [6.6, 4.2]], INK, hex('#e9efff'), 2.2);

  const sign = canvasCard(c, [3.0, 0.5], [1024, 170], (g, w, h) => {
    g.fillStyle = '#fdf9f1';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1e3ae8';
    g.font = `700 120px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '10px';
    g.fillText('SKYCAST', w / 2, h / 2 + 6);
  }, new THREE.Vector3(1.2, 1.2, 1.2), [`700 120px ${SANS}`]);
  sign.mesh.position.copy(dp(0, 4.15, -0.02));
  sign.mesh.rotation.y = dy;
  group.add(sign.mesh);

  const arch = new THREE.Mesh(b.build(), mat);
  // the still architecture casts the world's sun shadow (see environment.ts); moving parts do not
  arch.name = 'arch';
  group.add(arch);

  const detail = detailShot(group, V(-3.8, 11, 21), V(-0.8, 4.8, -1.2));
  let spin = 0, last = 0;
  return {
    group,
    detail,
    triangles: b.triangles + ab.triangles + vb.triangles + 8,
    update(t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, k.screen);
      sign.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      sign.mat.uniforms.uReveal.value = k.sign;
      sky.mat.uniforms.uOn.value = k.screen;
      // a slow day: one full turn of the sky every 40 s, starting at dawn
      sky.mat.uniforms.uDay.value = 0.05 + t / 40;
      const dt = Math.min(0.1, Math.max(0, t - last));
      last = t;
      // the wind gets up as the station wakes; gusts come and go
      const gust = 0.6 + 0.4 * Math.sin(t * 0.7) * Math.sin(t * 0.23);
      spin += dt * (0.4 + 5.5 * k.life * gust);
      anemo.rotation.y = spin;
      vane.rotation.y = 0.6 + Math.sin(t * 0.21) * 0.5 + Math.sin(t * 0.9) * 0.08;
    },
  };
}

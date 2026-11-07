import * as THREE from 'three';
import type { Common } from '../shaders';
import { Builder, CH, hex, SEQ } from './kit';
import { beats, builder, canvasCard, detailShot, kiosk, lamps, type Pad, placeGroup, plinth, type ProjectWorld, SANS, V } from './stage';

/**
 * AKASHALENS: getting the ground back from under the clouds. A small ground station in ink and paper with
 * lime signal lights: a dish that swings onto its pass, and a great lens on a stand. Through the lens the
 * repository's own dataset pairs play: a cloudy satellite frame, then the clear frame of the same ground
 * swept across it. These are the training images from the repo's dataset folder, not output of its model.
 */

const INK = hex('#111215'), PAPER = hex('#fdf9f1'), LIME = hex('#d8f827');
const STONE = hex('#b9bcb5'), STONE_DARK = hex('#7f837c'), STEEL = hex('#9aa0a6');

export function akashaWorld(c: Common, pad: Pad, base = '/'): ProjectWorld {
  const group = placeGroup('akasha-lens', pad);
  const { b, mat } = builder(c, { steps: 6, warm: [1.1, 1.35, 1.0] });

  plinth(b, 21, 14, STONE, STONE_DARK);

  // ---- the station: an ink block with a paper roof edge, a row of lit consoles behind its glass
  const st = V(-4.6, 0, -4.2);
  b.box(st.clone().add(V(0, 1.7, 0)), [7, 3.4, 4], 0, { col: INK });
  b.box(st.clone().add(V(0, 3.5, 0)), [7.4, 0.24, 4.4], 0, { col: PAPER });
  b.box(st.clone().add(V(0, 1.9, 2.02)), [5.6, 1.5, 0.06], 0, { col: hex('#bfe36a'), glow: 0.7, ch: CH.a });
  for (let i = 0; i < 4; i++) b.box(st.clone().add(V(-2.1 + i * 1.4, 1.9, 2.06)), [0.08, 1.5, 0.06], 0, { col: INK });
  b.box(st.clone().add(V(0, 3.18, 2.04)), [7, 0.1, 0.1], 0, { col: LIME, glow: 0.6, ch: CH.b });
  // a mast of signal lights on the roof, lit in order
  b.cyl(st.clone().add(V(2.6, 3.6, -1.0)), 0.06, 0.08, 3.4, 6, { col: STEEL });
  for (let k = 0; k < 6; k++) b.sphere(st.clone().add(V(2.6, 4.0 + k * 0.5, -1.0)), 0.13, { col: LIME, glow: 1, ch: SEQ(k) }, 8);

  // ---- the dish's pedestal and yoke base (the dish itself turns)
  const dp = V(4.2, 0, -3.4);
  b.cyl(dp, 1.1, 1.4, 0.5, 20, { col: INK });
  b.cyl(dp.clone().add(V(0, 0.5, 0)), 0.42, 0.55, 2.6, 14, { col: PAPER });
  // cable trench from dish to station
  b.box(V(0, 0.04, -2.0), [9, 0.08, 0.3], 0, { col: INK });

  const db = new Builder();
  // yoke
  db.box(V(0, 0.2, 0), [1.6, 0.4, 0.9], 0, { col: PAPER });
  for (const x of [-0.7, 0.7]) db.box(V(x, 0.95, 0), [0.18, 1.5, 0.5], 0, { col: PAPER });
  // the bowl, a paraboloid, and its feed on three struts; built pointing up, then tilted
  const bowl = new Builder();
  const prof: [number, number][] = [];
  for (let i = 0; i <= 10; i++) {
    const r = (i / 10) * 3.1;
    prof.push([r, (r * r) / (4 * 2.4)]);
  }
  for (let i = 10; i >= 0; i--) prof.push([(i / 10) * 3.1, (((i / 10) * 3.1) ** 2) / (4 * 2.4) - 0.08]);
  bowl.lathe(V(0, 0, 0), prof, 36, { col: PAPER });
  const focus = V(0, 2.4, 0);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    bowl.rod(V(Math.cos(a) * 2.9, 0.88, Math.sin(a) * 2.9), focus, 0.04, { col: STEEL });
  }
  bowl.cyl(focus.clone().add(V(0, -0.3, 0)), 0.16, 0.24, 0.5, 10, { col: INK });
  bowl.sphere(focus.clone().add(V(0, 0.25, 0)), 0.12, { col: LIME, glow: 1, ch: CH.b }, 8);
  const dish = new THREE.Group();
  const yoke = new THREE.Mesh(db.build(), mat);
  const bowlMesh = new THREE.Mesh(bowl.build(), mat);
  bowlMesh.position.y = 1.6;
  dish.add(yoke, bowlMesh);
  dish.position.copy(dp).add(V(0, 3.1, 0));
  group.add(dish);

  // ---- the lens: a ring on a stand, its glass showing the dataset, front left
  const lensAt = V(-5.4, 0, 2.6), lensYaw = 0.38, lensY = 3.0, lensR = 2.3;
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), lensYaw);
  const lp = (x: number, y: number, z: number) => V(x, y, z).applyQuaternion(q).add(lensAt);
  b.add(new THREE.TorusGeometry(lensR + 0.15, 0.26, 10, 48), new THREE.Matrix4().compose(lp(0, lensY, 0), q, V(1, 1, 1)), { col: INK });
  b.add(new THREE.TorusGeometry(lensR + 0.42, 0.05, 6, 48), new THREE.Matrix4().compose(lp(0, lensY, 0.05), q, V(1, 1, 1)), { col: LIME, glow: 0.8, ch: CH.b });
  for (const s of [-1, 1]) b.box(lp(s * 1.5, (lensY - lensR) / 2 + 0.1, -0.05), [0.24, lensY - lensR + 0.6, 0.3], lensYaw, { col: INK }, 0, s * 0.35);
  b.box(lp(0, 0.12, 0), [3.8, 0.24, 1.2], lensYaw, { col: INK });
  const glass = kiosk(c, b, group, {
    x: lensAt.x, z: lensAt.z, yaw: lensYaw, w: lensR * 2, h: lensR * 2, y: lensY, round: true, wipe: true, period: 7,
    frame: INK, trim: LIME,
    pages: [1, 2, 3].flatMap((k) => [`${base}world/akasha/cloudy${k}.webp`, `${base}world/akasha/clear${k}.webp`]),
  });

  lamps(b, [[-3.4, 6.4], [3.4, 6.4], [9.3, 5.4], [9.3, -0.8]], INK, LIME);

  const sign = canvasCard(c, [5.2, 0.62], [1024, 122], (g, w, h) => {
    g.fillStyle = '#111215';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#fdf9f1';
    g.font = `700 84px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '9px';
    g.fillText('AKASHALENS', w / 2, h / 2 + 4);
  }, new THREE.Vector3(1.25, 1.25, 1.25), [`700 84px ${SANS}`]);
  sign.mesh.position.copy(st).add(V(0, 2.95, 2.08));
  group.add(sign.mesh);

  const arch = new THREE.Mesh(b.build(), mat);
  group.add(arch);

  const detail = detailShot(group, V(-1.0, 5.2, 23), V(-2.8, 3.3, -1.2));
  return {
    group,
    detail,
    triangles: b.triangles + db.triangles + bowl.triangles + 100,
    update(t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, k.screen);
      mat.uniforms.uSeq.value.x = k.seq;
      sign.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      sign.mat.uniforms.uReveal.value = k.sign;
      glass.update(t, k.screen);
      // the dish swings from stow (facing up) onto its pass, then tracks slowly across the sky
      dish.rotation.y = -0.6 + 1.0 * k.life + Math.sin(t * 0.08) * 0.25 * k.life;
      bowlMesh.rotation.x = 0.15 + 0.75 * k.life;
    },
  };
}

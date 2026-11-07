import * as THREE from 'three';
import type { Common } from '../shaders';
import { Builder, CH, hex, SEQ } from './kit';
import { beats, builder, canvasCard, detailShot, kiosk, lamps, type Pad, placeGroup, plinth, type ProjectWorld, SANS, V } from './stage';

/**
 * PORTFOLIO: this site, standing inside itself. The instrument the site was built around (the SK monogram
 * at the centre, three rings, three bodies) as a great orrery on a paper dais, turning faster as
 * the island wakes; nine small lights round the dais for the nine featured projects; and a display showing
 * this site's own pages, captured from the build you are looking at.
 */

const INK = hex('#111215'), PAPER = hex('#fdf9f1'), LIME = hex('#d8f827'), VERM = hex('#ff5226'), COBALT = hex('#1e3ae8');
const STONE = hex('#cdd0c8'), STONE_DARK = hex('#8e918a');

export function portfolioWorld(c: Common, pad: Pad, base = '/'): ProjectWorld {
  const group = placeGroup('personal-portfolio', pad);
  const { b, mat } = builder(c, { steps: 9, warm: [1.2, 1.3, 1.05] });

  plinth(b, 21, 14, STONE, STONE_DARK);

  // ---- the dais: paper, an ink inlay, a lime ring that lights, nine project lights round its edge
  const o = V(-2.0, 0, -1.4);
  b.cyl(o, 6.3, 6.5, 0.22, 64, { col: hex('#e6e1d6') });
  b.cyl(o.clone().add(V(0, 0.22, 0)), 5.8, 6.0, 0.3, 64, { col: PAPER });
  b.cyl(o.clone().add(V(0, 0.5, 0)), 5.1, 5.1, 0.03, 64, { col: INK, gloss: 0.4 });
  // the dial: hour ticks inlaid round the ink face
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2, r = k % 3 ? 4.75 : 4.6;
    b.box(o.clone().add(V(Math.cos(a) * r, 0.54, Math.sin(a) * r)), [k % 3 ? 0.3 : 0.6, 0.02, 0.05], -a, { col: PAPER }, 0, 0, 0);
  }
  b.add(new THREE.TorusGeometry(5.45, 0.07, 6, 64), new THREE.Matrix4().compose(o.clone().add(V(0, 0.53, 0)), new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2), V(1, 1, 1)), { col: LIME, glow: 0.8, ch: CH.b });
  // nine project lights on small ink pedestals round the edge, each a lens in a collar
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + 0.35, p = o.clone().add(V(Math.cos(a) * 5.75, 0.52, Math.sin(a) * 5.75));
    b.cyl(p, 0.2, 0.24, 0.3, 12, { col: INK, gloss: 0.3 });
    b.cyl(p.clone().add(V(0, 0.3, 0)), 0.17, 0.17, 0.05, 12, { col: hex('#c9ccd2'), gloss: 0.6 });
    b.sphere(p.clone().add(V(0, 0.38, 0)), 0.13, { col: LIME, glow: 1, ch: SEQ(k) }, 12);
  }
  // the column the instrument stands on: a stepped foot, a fluted shaft, a collar under the rings
  b.cyl(o.clone().add(V(0, 0.5, 0)), 0.62, 0.85, 0.3, 24, { col: INK, gloss: 0.3 });
  b.cyl(o.clone().add(V(0, 0.8, 0)), 0.42, 0.5, 0.25, 24, { col: INK, gloss: 0.3 });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    b.box(o.clone().add(V(Math.cos(a) * 0.2, 2.35, Math.sin(a) * 0.2)), [0.07, 2.9, 0.07], -a, { col: INK, gloss: 0.4 }, 0, 0, 0.02);
  }
  b.cyl(o.clone().add(V(0, 1.05, 0)), 0.16, 0.2, 2.7, 16, { col: INK, gloss: 0.3 });
  b.cyl(o.clone().add(V(0, 3.75, 0)), 0.3, 0.2, 0.18, 16, { col: hex('#c9ccd2'), gloss: 0.6 });
  // a fixed meridian ring the moving rings turn inside
  b.add(new THREE.TorusGeometry(4.55, 0.06, 8, 96), new THREE.Matrix4().makeTranslation(o.x, 4.4, o.z), { col: hex('#c9ccd2'), gloss: 0.6 });
  b.add(new THREE.TorusGeometry(4.55, 0.035, 6, 96), new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(o.x, 4.4, o.z), { col: hex('#c9ccd2'), gloss: 0.6 });

  // ---- the instrument: three tilted rings, each carrying a body, round the monogram
  const centre = o.clone().add(V(0, 4.4, 0));
  const rings: { pivot: THREE.Object3D; spin: THREE.Mesh; rate: number }[] = [];
  const spec: [number, number, number, [number, number, number], number][] = [
    [2.2, 0.35, 0.1, LIME, 0.55],
    [3.1, -0.25, 0.95, VERM, -0.38],
    [4.0, 0.12, -0.7, COBALT, 0.26],
  ];
  for (const [r, tilt, yaw, col, rate] of spec) {
    const rb = new Builder();
    rb.add(new THREE.TorusGeometry(r, 0.07, 8, 96), new THREE.Matrix4().makeRotationX(Math.PI / 2), { col: PAPER, gloss: 0.35 });
    // graduations on the ring, and a body in a collar riding it
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      rb.box(V(Math.cos(a) * r, 0, Math.sin(a) * r), [0.05, k % 6 ? 0.12 : 0.24, 0.16], -a, { col: hex('#c9ccd2') }, 0, 0, 0);
    }
    rb.add(new THREE.TorusGeometry(0.42, 0.04, 6, 24), new THREE.Matrix4().makeTranslation(r, 0, 0), { col: hex('#c9ccd2'), gloss: 0.6 });
    rb.sphere(V(r, 0, 0), 0.34, { col, glow: 0.35, ch: CH.a, gloss: 0.5 }, 24);
    const spin = new THREE.Mesh(rb.build(), mat);
    const pivot = new THREE.Object3D();
    pivot.position.copy(centre);
    pivot.rotation.set(tilt, yaw, 0, 'YXZ');
    pivot.add(spin);
    group.add(pivot);
    rings.push({ pivot, spin, rate });
  }
  // the monogram: an ink disc with SK, turned to the visitor
  const mono = canvasCard(c, [1.7, 1.7], [512, 512], (g, w, h) => {
    g.fillStyle = '#111215';
    g.beginPath();
    g.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#d8f827';
    g.lineWidth = 10;
    g.beginPath();
    g.arc(w / 2, h / 2, w / 2 - 22, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#fdf9f1';
    g.font = `700 220px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('SK', w / 2, h / 2 + 10);
  }, new THREE.Vector3(1.25, 1.25, 1.25), [`700 220px ${SANS}`]);
  mono.mesh.position.copy(centre);
  group.add(mono.mesh);
  b.sphere(centre.clone().add(V(0, 0, -0.06)), 0.86, { col: INK }, 20);

  lamps(b, [[-3.4, 6.4], [3.4, 6.4], [-9.3, 5.4], [9.3, 5.4], [9.3, -1.2]], INK, LIME);

  const screen = kiosk(c, b, group, {
    x: 7.2, z: 1.8, yaw: -0.42, w: 4.0, h: 2.5, frame: INK, trim: LIME,
    pages: ['arrival', 'island', 'about'].map((n) => `${base}world/portfolio/${n}.webp`),
  });

  const sign = canvasCard(c, [3.8, 0.56], [1024, 150], (g, w, h) => {
    g.fillStyle = '#111215';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8f827';
    g.font = `700 96px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '12px';
    g.fillText('PORTFOLIO', w / 2, h / 2 + 5);
  }, new THREE.Vector3(1.3, 1.3, 1.3), [`700 96px ${SANS}`]);
  // on a low ink wall at the front of the dais
  b.box(o.clone().add(V(0, 0.55, 6.6)), [4.4, 1.1, 0.3], 0, { col: INK });
  sign.mesh.position.copy(o).add(V(0, 0.6, 6.77));
  group.add(sign.mesh);

  const arch = new THREE.Mesh(b.build(), mat);
  // the still architecture casts the world's sun shadow (see environment.ts); moving parts do not
  arch.name = 'arch';
  group.add(arch);

  const detail = detailShot(group, V(3.5, 7.6, 22.5), V(-1.2, 3.6, -1.2), V(0.4, 2.8, -0.8));
  let phase = 0, last = 0;
  return {
    group,
    detail,
    triangles: b.triangles + 3 * 600 + 4,
    update(t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, k.screen);
      mat.uniforms.uSeq.value.x = k.seq;
      mono.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      mono.mat.uniforms.uReveal.value = k.sign;
      sign.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      sign.mat.uniforms.uReveal.value = k.sign;
      screen.update(t, k.screen);
      // the instrument idles, then turns properly once the island is awake (as scrolling turns it on the site)
      const dt = Math.min(0.1, Math.max(0, t - last));
      last = t;
      phase += dt * (0.15 + 0.85 * k.life);
      for (const r of rings) r.spin.rotation.y = phase * r.rate * 2.2;
    },
  };
}

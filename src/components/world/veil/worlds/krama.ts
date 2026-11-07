import * as THREE from 'three';
import type { Common } from '../shaders';
import { Builder, CH, hex, SEQ } from './kit';
import { beats, builder, canvasCard, detailShot, kiosk, lamps, type Pad, placeGroup, plinth, type ProjectWorld, SANS, V } from './stage';

/**
 * KRAMA: luxury sneakers, told as a story. A gallery in the brand's vermilion with its outlined wordmark
 * on the roof, an ink room lit inside like a vitrine, one sneaker as big as a car turning on a plinth, the
 * drops stacked in boxes, and a display walking through the storefront's own pages (home, product, shop,
 * admin) from the repository's README.
 */

const VERM = hex('#ff5226'), INK = hex('#111215'), PAPER = hex('#fdf9f1');
const STONE = hex('#d8d2c8'), STONE_DARK = hex('#9a938a'), GUM = hex('#c9a27a');

/** a sneaker, about 4.8 long, heel at -x, built at the origin on its sole */
function sneaker(b: Builder) {
  const S = (c: THREE.Vector3, s: THREE.Vector3, col: [number, number, number], rot = new THREE.Euler()) =>
    b.add(new THREE.SphereGeometry(1, 20, 12), new THREE.Matrix4().compose(c, new THREE.Quaternion().setFromEuler(rot), s), { col });
  // outsole and midsole: a long rounded slab, gum then paper
  b.box(V(0, 0.12, 0), [4.2, 0.24, 1.55], 0, { col: GUM });
  S(V(2.1, 0.12, 0), V(0.5, 0.12, 0.78), GUM);
  S(V(-2.1, 0.12, 0), V(0.4, 0.12, 0.76), GUM);
  b.box(V(0, 0.42, 0), [4.1, 0.36, 1.6], 0, { col: PAPER });
  S(V(2.05, 0.42, 0), V(0.5, 0.18, 0.8), PAPER);
  S(V(-2.05, 0.46, 0), V(0.45, 0.22, 0.8), PAPER);
  // the upper: a long low body rising to the collar at the heel
  S(V(0.6, 0.78, 0), V(1.9, 0.5, 0.74), PAPER);
  S(V(-1.2, 1.15, 0), V(1.1, 0.75, 0.72), PAPER);
  // vermilion panel along the side and a heel tab
  S(V(-0.2, 0.9, 0), V(1.5, 0.32, 0.76), VERM);
  b.box(V(-2.15, 1.45, 0), [0.22, 0.7, 0.5], 0, { col: VERM }, 0, -0.2);
  // the collar opening and tongue
  S(V(-1.25, 1.83, 0), V(0.62, 0.12, 0.42), INK);
  b.box(V(-0.5, 1.55, 0), [0.7, 0.5, 0.5], 0, { col: PAPER }, 0, 0.5);
  // laces across the vamp
  for (let i = 0; i < 5; i++) b.box(V(-0.1 + i * 0.36, 1.33 - i * 0.07, 0), [0.08, 0.06, 0.82], 0, { col: INK }, 0, 0.2);
}

export function kramaWorld(c: Common, pad: Pad, base = '/'): ProjectWorld {
  const group = placeGroup('krama', pad);
  const { b, mat } = builder(c, { steps: 5, warm: [1.35, 1.3, 1.25] });

  plinth(b, 21, 14, STONE, STONE_DARK);

  // ---- the gallery: vermilion walls around a tall portal, an ink room inside lit like a vitrine
  const g0 = V(0.6, 0, -4.4), W = 11, H = 6.4, D = 5;
  b.box(g0.clone().add(V(0, H / 2, -D / 2)), [W, H, 0.4], 0, { col: VERM });
  for (const s of [-1, 1]) b.box(g0.clone().add(V((s * W) / 2, H / 2, 0)), [0.4, H, D], 0, { col: VERM });
  for (const s of [-1, 1]) b.box(g0.clone().add(V(s * 3.6, H / 2, D / 2)), [3.8, H, 0.4], 0, { col: VERM });
  b.box(g0.clone().add(V(0, H - 0.8, D / 2)), [3.4, 1.6, 0.4], 0, { col: VERM });
  b.box(g0.clone().add(V(0, H + 0.15, 0)), [W + 0.4, 0.3, D + 0.4], 0, { col: INK });
  // inside: the back wall glows, three pedestals hold the drop
  b.box(g0.clone().add(V(0, 2.4, -D / 2 + 0.25)), [3.2, 4.8, 0.06], 0, { col: hex('#fff3e6'), glow: 0.85, ch: CH.a });
  b.box(g0.clone().add(V(0, 0.04, 0)), [W - 0.8, 0.08, D - 0.6], 0, { col: INK });
  for (let i = 0; i < 3; i++) {
    const p = g0.clone().add(V(-1.0 + i * 1.0, 0, -0.9 + (i % 2) * 0.4));
    b.box(p.clone().add(V(0, 0.55, 0)), [0.7, 1.1, 0.7], 0, { col: PAPER });
    b.box(p.clone().add(V(0, 1.22, 0)), [0.5, 0.24, 0.24], 0, { col: VERM });
  }
  // spot lights along the portal head, coming on one by one
  for (let i = 0; i < 5; i++) b.sphere(g0.clone().add(V(-1.4 + i * 0.7, H - 1.7, D / 2 + 0.24)), 0.12, { col: hex('#fff3e6'), glow: 1, ch: SEQ(i) }, 8);

  // ---- the plinth for the sneaker: an ink drum with a paper ring that lights
  const sp = V(-5.8, 0, 2.6);
  b.cyl(sp, 2.9, 3.0, 0.55, 40, { col: INK });
  b.cyl(sp.clone().add(V(0, 0.55, 0)), 3.0, 3.0, 0.04, 40, { col: PAPER, glow: 0.65, ch: CH.b });
  b.cyl(sp.clone().add(V(0, 0.56, 0)), 2.75, 2.75, 0.06, 40, { col: INK });
  const sb = new Builder();
  sneaker(sb);
  const shoe = new THREE.Mesh(sb.build(), mat);
  shoe.position.copy(sp).add(V(0, 0.62, 0));
  group.add(shoe);

  // ---- the drops: shoe boxes stacked by the display
  const bx = V(3.6, 0, 3.6);
  for (const [x, y, z, r] of [[0, 0, 0, 0.1], [0.1, 0.62, 0.05, -0.15], [1.2, 0, -0.4, 0.4], [0.05, 1.24, 0, 0.25]]) {
    b.box(bx.clone().add(V(x, y + 0.27, z)), [1.1, 0.54, 0.7], r, { col: INK });
    b.box(bx.clone().add(V(x, y + 0.57, z)), [1.16, 0.08, 0.76], r, { col: VERM });
  }

  lamps(b, [[-3.4, 6.4], [3.4, 6.4], [-9.3, 5.4], [9.3, 5.4], [-9.3, -1.0]], INK, PAPER);

  const screen = kiosk(c, b, group, {
    x: 7.4, z: 1.2, yaw: -0.45, w: 4.0, h: 2.5, frame: INK, trim: VERM,
    pages: ['home', 'product', 'shop', 'admin'].map((n) => `${base}world/krama/${n}.webp`),
  });

  // the wordmark on the roof, outlined as the storefront sets it over the product
  const sign = canvasCard(c, [7.4, 1.7], [1024, 236], (g, w, h) => {
    g.font = `700 210px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '14px';
    g.lineWidth = 9;
    g.strokeStyle = '#fdf9f1';
    g.strokeText('KRAMA', w / 2, h / 2 + 10);
  }, new THREE.Vector3(1.35, 1.35, 1.35), [`700 210px ${SANS}`]);
  sign.mesh.position.copy(g0).add(V(0, H + 1.2, D / 2 - 0.4));
  group.add(sign.mesh);

  const arch = new THREE.Mesh(b.build(), mat);
  group.add(arch);

  const detail = detailShot(group, V(-8.5, 4.6, 19), V(-1.2, 2.4, -1.2));
  return {
    group,
    detail,
    triangles: b.triangles + sb.triangles + 4,
    update(t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, k.screen);
      mat.uniforms.uSeq.value.x = k.seq;
      sign.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      sign.mat.uniforms.uReveal.value = k.sign;
      screen.update(t, k.screen);
      // the shoe turns slowly on its plinth, presenting its side to the lens as the gallery opens
      shoe.rotation.y = 0.9 - 1.2 * k.life + t * 0.18 * k.life;
    },
  };
}

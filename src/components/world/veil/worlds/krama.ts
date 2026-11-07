import * as THREE from 'three';
import type { Common } from '../shaders';
import { Builder, CH, hex, type RGB, SEQ } from './kit';
import { beats, builder, canvasCard, detailShot, kiosk, lamps, type Pad, placeGroup, plinth, type ProjectWorld, SANS, spill, V } from './stage';

/**
 * KRAMA: luxury sneakers, told as a story. A gallery in the brand's vermilion, finned like a boutique front,
 * with its outlined wordmark on the roof and an ink room lit inside like a vitrine; one sneaker as big as a car
 * turning on a stepped plinth; the drops stacked in boxes; and a display walking through the storefront's own
 * pages (home, product, shop, admin) from the repository's README.
 */

const VERM = hex('#ff5226'), INK = hex('#111215'), PAPER = hex('#fdf9f1');
const STONE = hex('#cfc8bc'), STONE_DARK = hex('#8f887e'), GUM = hex('#c39a6e'), BONE = hex('#efe9dd');

/* ------------------------------------------------------------------ the sneaker */

/** the half-width of the footprint along the shoe (x from heel -2.4 to toe 2.45), the last's own shape */
function halfWidth(x: number) {
  const t = (x + 2.4) / 4.85;
  // heel cup, a narrow waist under the arch, the wide forefoot, the rounded toe
  const w = 0.6 + 0.12 * Math.sin(Math.PI * Math.min(1, t / 0.25)) * (t < 0.25 ? 1 : 0)
    - 0.1 * Math.exp(-((t - 0.42) ** 2) / 0.012) + 0.18 * Math.exp(-((t - 0.72) ** 2) / 0.03);
  const toe = t > 0.86 ? Math.sqrt(Math.max(0, 1 - ((t - 0.86) / 0.145) ** 2)) : 1;
  const heel = t < 0.06 ? Math.sqrt(Math.max(0, 1 - ((0.06 - t) / 0.065) ** 2)) : 1;
  return Math.max(0.04, w * toe * heel);
}

function footprint(inset = 0) {
  const s = new THREE.Shape();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const x = -2.4 + (i / N) * 4.85;
    const z = Math.max(0.03, halfWidth(x) - inset);
    if (i === 0) s.moveTo(x, z);
    else s.lineTo(x, z);
  }
  for (let i = N; i >= 0; i--) {
    const x = -2.4 + (i / N) * 4.85;
    s.lineTo(x, -Math.max(0.03, halfWidth(x) - inset));
  }
  return s;
}

/** a slab in the footprint's shape, y0 to y0 + h, its edges rounded */
function sole(b: Builder, y0: number, h: number, inset: number, col: RGB, bevel: number, gloss = 0) {
  const g = new THREE.ExtrudeGeometry(footprint(inset + bevel), { depth: h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 4 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + bevel, 0);
  b.add(g, new THREE.Matrix4(), { col, gloss });
}

/** a side silhouette (x along the shoe, y up) extruded across it, rounded, then pinched to the footprint */
function body(b: Builder, pts: [number, number][], col: RGB, puff: number, grow = 0, gloss = 0) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const depth = 0.7;
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: puff, bevelSize: puff * 0.6, bevelSegments: 4, curveSegments: 6, steps: 1 });
  g.translate(0, 0, -depth / 2);
  const p = g.attributes.position;
  const half = depth / 2 + puff;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // narrow to the last: full width at the sole, drawn in over the instep and toward the toe
    const w = (halfWidth(x) + grow) * (1 - 0.32 * THREE.MathUtils.smoothstep(y, 0.7, 2.1));
    p.setZ(i, (z / half) * w);
  }
  g.computeVertexNormals();
  b.add(g, new THREE.Matrix4(), { col, gloss });
}

/** a sneaker about 4.9 long, heel at -x, standing on the origin */
function sneaker(b: Builder) {
  // gum outsole with a tread line, a tall bone midsole with a sidewall groove
  sole(b, 0, 0.18, 0, GUM, 0.05, 0.1);
  sole(b, 0.16, 0.46, 0.02, BONE, 0.09, 0.15);
  sole(b, 0.36, 0.035, -0.012, hex('#d9d1c2'), 0.012);
  // the upper: one rounded volume, from the heel counter up to the collar and down the throat to the toe
  const upper: [number, number][] = [
    [-2.3, 0.56], [-2.42, 0.95], [-2.38, 1.5], [-2.2, 1.98], [-1.85, 2.02], [-1.5, 1.8], [-1.15, 1.86],
    [-0.75, 1.82], [-0.2, 1.6], [0.5, 1.34], [1.2, 1.12], [1.8, 0.98], [2.2, 0.86], [2.38, 0.66], [2.3, 0.56],
  ];
  body(b, upper, PAPER, 0.24, -0.06);
  // a vermilion mudguard round the foot of the upper, and a toe cap
  body(b, [[-2.34, 0.56], [-2.44, 0.88], [-1.6, 0.86], [-0.4, 0.82], [0.8, 0.8], [1.9, 0.82], [2.34, 0.7], [2.3, 0.56]], VERM, 0.22, -0.02, 0.12);
  body(b, [[1.2, 0.6], [1.25, 1.02], [1.8, 0.99], [2.22, 0.88], [2.4, 0.66], [2.32, 0.56]], hex('#f4efe5'), 0.25, -0.02);
  // the heel counter, wrapped in vermilion, with a pull tab
  body(b, [[-2.32, 0.58], [-2.44, 1.0], [-2.4, 1.55], [-1.9, 1.5], [-1.7, 0.9], [-1.8, 0.58]], VERM, 0.25, 0.0, 0.12);
  b.box(V(-2.42, 2.05, 0), [0.1, 0.5, 0.36], 0, { col: VERM }, 0, -0.18, 0.04);
  // the collar: padded, lined in ink
  b.add(new THREE.TorusGeometry(0.42, 0.13, 8, 20), new THREE.Matrix4().compose(V(-1.72, 1.9, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0.14, 0)), V(1.35, 1, 0.95)), { col: PAPER });
  b.add(new THREE.CircleGeometry(0.46, 20), new THREE.Matrix4().compose(V(-1.72, 1.94, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.14)), V(1.3, 0.9, 1)), { col: INK });
  // the tongue, rising out of the throat, with its label
  body(b, [[-1.35, 1.6], [-1.3, 2.2], [-1.0, 2.25], [-0.55, 1.75], [-0.7, 1.55]], PAPER, 0.08, -0.38);
  b.box(V(-1.12, 2.12, 0), [0.26, 0.16, 0.06], 0, { col: VERM }, 0, 0.5, 0.02);
  // eyestays down the throat, and laces crossing between them
  for (let i = 0; i < 6; i++) {
    const f = i / 5, x = -0.95 + f * 1.9, y = 1.82 - f * 0.62;
    const w = halfWidth(x) * (1 - 0.32 * THREE.MathUtils.smoothstep(y, 0.7, 2.1)) * 0.62;
    for (const s of [-1, 1]) b.sphere(V(x, y + 0.04, s * w), 0.06, { col: INK, gloss: 0.4 }, 8);
    b.rod(V(x, y + 0.08, -w), V(x + 0.18, y + 0.03, w), 0.04, { col: INK }, 6);
    b.rod(V(x + 0.18, y + 0.03, -w), V(x, y + 0.08, w), 0.04, { col: INK }, 6);
  }
}

/* ------------------------------------------------------------------ the world */

export function kramaWorld(c: Common, pad: Pad, base = '/'): ProjectWorld {
  const group = placeGroup('krama', pad);
  const { b, mat } = builder(c, { steps: 5, warm: [1.35, 1.3, 1.25] });

  plinth(b, 21, 14, STONE, STONE_DARK, 3);

  // ---- the gallery: a finned vermilion front around a deep ink portal, a cantilevered roof
  const g0 = V(0.6, 0, -4.4), W = 11, H = 6.2, D = 5;
  b.box(g0.clone().add(V(0, 0.25, 0)), [W + 0.5, 0.5, D + 0.5], 0, { col: hex('#3a3634') });
  b.box(g0.clone().add(V(0, H / 2 + 0.25, -D / 2)), [W, H - 0.5, 0.4], 0, { col: VERM });
  for (const s of [-1, 1]) b.box(g0.clone().add(V((s * W) / 2, H / 2 + 0.25, 0)), [0.4, H - 0.5, D], 0, { col: VERM });
  for (const s of [-1, 1]) b.box(g0.clone().add(V(s * 3.65, H / 2 + 0.25, D / 2)), [3.7, H - 0.5, 0.4], 0, { col: VERM });
  b.box(g0.clone().add(V(0, H - 0.6, D / 2)), [3.6, 1.2, 0.4], 0, { col: VERM });
  // vertical fins across the front, catching the light in a rhythm
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
    const x = s * (2.15 + i * 0.6);
    b.box(g0.clone().add(V(x, H / 2 + 0.25, D / 2 + 0.3)), [0.14, H - 0.7, 0.36], 0, { col: hex('#e8461c') }, 0, 0, 0.04);
  }
  // the portal: a deep ink frame, its head lined with spots that come on one by one
  b.box(g0.clone().add(V(0, H - 1.25, D / 2 + 0.5)), [4.0, 0.3, 1.0], 0, { col: INK, gloss: 0.2 });
  for (const s of [-1, 1]) b.box(g0.clone().add(V(s * 1.9, (H - 1.25) / 2 + 0.25, D / 2 + 0.5)), [0.26, H - 1.6, 1.0], 0, { col: INK, gloss: 0.2 });
  for (let i = 0; i < 5; i++) b.sphere(g0.clone().add(V(-1.4 + i * 0.7, H - 1.45, D / 2 + 0.75)), 0.1, { col: hex('#fff3e6'), glow: 1, ch: SEQ(i) }, 10);
  // the roof: an ink slab overhanging the front, its soffit lined in light
  b.box(g0.clone().add(V(0, H + 0.12, 0.35)), [W + 0.9, 0.3, D + 1.3], 0, { col: INK, gloss: 0.15 });
  b.box(g0.clone().add(V(0, H - 0.06, D / 2 + 0.95)), [W + 0.6, 0.04, 0.06], 0, { col: hex('#fff3e6'), glow: 0.9, ch: CH.b }, 0, 0, 0);
  // inside: the back wall glows, three pedestals hold the drop
  b.box(g0.clone().add(V(0, 2.6, -D / 2 + 0.25)), [3.2, 4.4, 0.06], 0, { col: hex('#fff3e6'), glow: 0.85, ch: CH.a }, 0, 0, 0);
  b.box(g0.clone().add(V(0, 0.54, 0)), [W - 0.8, 0.08, D - 0.6], 0, { col: INK, gloss: 0.4 }, 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    const p = g0.clone().add(V(-1.0 + i * 1.0, 0.5, -0.9 + (i % 2) * 0.4));
    b.box(p.clone().add(V(0, 0.55, 0)), [0.7, 1.1, 0.7], 0, { col: PAPER });
    b.box(p.clone().add(V(0, 1.22, 0)), [0.5, 0.24, 0.24], 0, { col: VERM });
  }

  // ---- the sneaker's plinth: two ink tiers, a lit ring between them, a polished top
  const sp = V(-5.8, 0, 2.6);
  b.cyl(sp, 3.05, 3.15, 0.32, 56, { col: INK });
  b.cyl(sp.clone().add(V(0, 0.32, 0)), 3.06, 3.06, 0.05, 56, { col: PAPER, glow: 0.7, ch: CH.b });
  b.cyl(sp.clone().add(V(0, 0.37, 0)), 2.8, 2.9, 0.26, 56, { col: INK, gloss: 0.2 });
  b.cyl(sp.clone().add(V(0, 0.63, 0)), 2.78, 2.78, 0.02, 56, { col: hex('#1b1c20'), gloss: 0.7 });
  const shine = spill(c, 6.2, 6.2, new THREE.Color(0.2, 0.17, 0.14));
  shine.mesh.rotation.x = -Math.PI / 2;
  shine.mesh.position.copy(sp).add(V(0, 0.66, 0));
  group.add(shine.mesh);
  const sb = new Builder();
  sneaker(sb);
  const shoe = new THREE.Mesh(sb.build(), mat);
  shoe.position.copy(sp).add(V(0, 0.66, 0));
  group.add(shoe);

  // ---- the drops: shoe boxes stacked by the display, lids banded in vermilion
  const bx = V(3.6, 0, 3.6);
  for (const [x, y, z, r] of [[0, 0, 0, 0.1], [0.1, 0.62, 0.05, -0.15], [1.2, 0, -0.4, 0.4], [0.05, 1.24, 0, 0.25]]) {
    b.box(bx.clone().add(V(x, y + 0.27, z)), [1.1, 0.54, 0.7], r, { col: INK, gloss: 0.1 });
    b.box(bx.clone().add(V(x, y + 0.57, z)), [1.16, 0.08, 0.76], r, { col: VERM }, 0, 0, 0.02);
    b.box(bx.clone().add(V(x, y + 0.3, z)), [1.12, 0.06, 0.72], r, { col: hex('#2a2a2e') }, 0, 0, 0);
  }

  lamps(b, [[-3.4, 6.4], [3.4, 6.4], [-9.3, 5.4], [9.3, 5.4], [-9.3, -1.0]], INK, PAPER);

  const screen = kiosk(c, b, group, {
    x: 7.4, z: 1.4, yaw: -0.45, w: 4.0, h: 2.5, frame: INK, trim: VERM,
    pages: ['home', 'product', 'shop', 'admin'].map((n) => `${base}world/krama/${n}.webp`),
  });

  // the wordmark on the roof, outlined as the storefront sets it over the product (kept low and narrow so a
  // phone's frame holds it)
  const sign = canvasCard(c, [5.6, 1.3], [1024, 238], (g, w, h) => {
    g.font = `700 210px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '14px';
    g.lineWidth = 9;
    g.strokeStyle = '#fdf9f1';
    g.strokeText('KRAMA', w / 2, h / 2 + 10);
  }, new THREE.Vector3(1.35, 1.35, 1.35), [`700 210px ${SANS}`]);
  sign.mesh.position.copy(g0).add(V(0, H + 0.95, D / 2 - 0.2));
  group.add(sign.mesh);

  const arch = new THREE.Mesh(b.build(), mat);
  // the still architecture casts the world's sun shadow (see environment.ts); moving parts do not
  arch.name = 'arch';
  group.add(arch);

  const detail = detailShot(group, V(-8.5, 4.6, 19), V(-1.2, 2.4, -1.2), V(0.3, 2.4, -0.8));
  return {
    group,
    detail,
    triangles: b.triangles + sb.triangles + 6,
    update(t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, k.screen);
      mat.uniforms.uSeq.value.x = k.seq;
      sign.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      sign.mat.uniforms.uReveal.value = k.sign;
      shine.mat.uniforms.uOn.value = k.accents;
      screen.update(t, k.screen);
      // the shoe turns slowly on its plinth, presenting its side to the lens as the gallery opens, and eases
      // between turns rather than spinning like a motor
      const turn = t * 0.16 + 0.35 * Math.sin(t * 0.16);
      shoe.rotation.y = 0.9 - 1.2 * k.life + turn * k.life;
    },
  };
}

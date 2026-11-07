import * as THREE from 'three';
import type { Common } from '../shaders';
import { Builder, CH, hex } from './kit';
import { beats, builder, canvasCard, detailShot, kiosk, lamps, type Pad, placeGroup, plinth, type ProjectWorld, ripples, SANS, V } from './stage';

/**
 * TARANG: music, redesigned for the web. A band shell in the app's colours (lime, ink, vermilion): a
 * record spinning on a deck as big as a room, level meters along the shell that dance once the music
 * starts, speakers sending rings across the terrace, and a display walking through the app's own
 * screens (home, now playing, listening stats, from the repository's README).
 */

const LIME = hex('#d8f827'), INK = hex('#111215'), VERM = hex('#ff5226'), PAPER = hex('#fdf9f1');
const STONE = hex('#c9c6bc'), STONE_DARK = hex('#8f8c84'), VINYL = hex('#16161a'), GROOVE = hex('#2a2a30');

export function tarangWorld(c: Common, pad: Pad, base = '/'): ProjectWorld {
  const group = placeGroup('tarang', pad);
  const BAR_BASE = 0.7;
  const { b, mat } = builder(c, { pulse: BAR_BASE, warm: [1.0, 1.02, 0.95] });

  plinth(b, 21, 14, STONE, STONE_DARK);

  // ---- the band shell: an ink wall, a lime-lined roof that tips up toward the terrace
  b.box(V(0, 2.9, -5.8), [13, 5.8, 0.5], 0, { col: INK });
  for (const x of [-6.3, 6.3]) b.box(V(x, 2.9, -4.6), [0.4, 5.8, 2.8], 0, { col: INK });
  b.box(V(0, 6.05, -4.2), [13.6, 0.35, 4.2], 0, { col: INK }, -0.12);
  b.box(V(0, 5.82, -4.2), [13.2, 0.06, 3.9], 0, { col: LIME, glow: 0.55, ch: CH.b }, -0.12);
  b.box(V(0, 0.35, -4.6), [12.2, 0.7, 2.4], 0, { col: INK });
  // level meters along the shell: each bar rises and falls on its own phase once the music plays
  for (let i = 0; i < 16; i++) {
    const x = -5.25 + i * 0.7;
    const col = i % 5 === 2 ? VERM : LIME;
    b.box(V(x, BAR_BASE + 1.9, -5.45), [0.48, 3.8, 0.2], 0, { col, glow: 0.85, ch: CH.a, aux: i + 1 });
  }

  // ---- speakers either side of the shell, cones ringed in vermilion
  for (const x of [-8.4, 8.4]) {
    b.box(V(x, 2.1, -4.2), [2, 4.2, 1.7], 0, { col: INK });
    b.disc(V(x, 2.9, -3.33), 0.66, 0.08, 20, { col: GROOVE });
    b.disc(V(x, 2.9, -3.3), 0.26, 0.1, 14, { col: VERM, glow: 0.7, ch: CH.b });
    b.disc(V(x, 1.2, -3.33), 0.4, 0.08, 16, { col: GROOVE });
  }

  // ---- the deck: a turntable as big as a room, front left
  const deck = V(-5.6, 0, 2.2);
  b.box(deck.clone().add(V(0, 0.55, 0)), [6.4, 1.1, 5.2], 0, { col: INK });
  b.box(deck.clone().add(V(0, 1.12, 0)), [6.2, 0.04, 5.0], 0, { col: hex('#22232a') });
  b.cyl(deck.clone().add(V(-0.6, 1.1, 0)), 2.25, 2.25, 0.12, 40, { col: hex('#3a3b42') });
  // the tonearm's pivot and rest
  const pivot = deck.clone().add(V(2.3, 1.1, -1.6));
  b.cyl(pivot, 0.3, 0.36, 0.5, 14, { col: hex('#3a3b42') });
  b.box(deck.clone().add(V(2.4, 1.3, 1.2)), [0.24, 0.4, 0.24], 0, { col: hex('#3a3b42') });
  // play light
  b.sphere(deck.clone().add(V(2.4, 1.2, 2.0)), 0.16, { col: VERM, glow: 1, ch: CH.b }, 8);

  // the record: its own mesh, so it can turn
  const rb = new Builder();
  rb.cyl(V(0, 0, 0), 2.05, 2.05, 0.06, 48, { col: VINYL });
  for (const r of [1.85, 1.6, 1.35, 1.1]) rb.cyl(V(0, 0.061, 0), r, r, 0.004, 48, { col: GROOVE });
  rb.cyl(V(0, 0.062, 0), 0.72, 0.72, 0.01, 32, { col: LIME, glow: 0.4, ch: CH.b });
  rb.box(V(0.42, 0.075, 0), [0.32, 0.01, 0.08], 0, { col: INK });
  rb.cyl(V(0, 0.06, 0), 0.05, 0.05, 0.12, 8, { col: PAPER });
  const record = new THREE.Mesh(rb.build(), mat);
  record.position.copy(deck).add(V(-0.6, 1.23, 0));
  group.add(record);

  // the tonearm: a slim bar from the pivot, swinging onto the record when the music starts
  const ab = new Builder();
  ab.box(V(0, 0.45, -1.35), [0.1, 0.1, 2.7], 0, { col: PAPER });
  ab.box(V(0, 0.4, -2.75), [0.26, 0.14, 0.4], 0, { col: INK });
  ab.box(V(0, 0.45, 0.45), [0.3, 0.3, 0.5], 0, { col: hex('#3a3b42') });
  const arm = new THREE.Mesh(ab.build(), mat);
  arm.position.copy(pivot).add(V(0, 0.2, 0));
  group.add(arm);

  lamps(b, [[-3.4, 6.4], [3.4, 6.4], [-9.3, 5.6], [9.3, 5.6], [9.3, -0.5]], INK, LIME);

  const screen = kiosk(c, b, group, {
    x: 6.6, z: 2.4, yaw: -0.42, w: 4.0, h: 2.5, frame: INK, trim: LIME,
    pages: ['home', 'now-playing', 'stats'].map((n) => `${base}world/tarang/${n}.webp`),
  });

  // sound across the terrace
  const rings = ripples(c, 8, new THREE.Color('#d8f827'), 0.45);
  rings.mesh.rotation.x = -Math.PI / 2;
  rings.mesh.position.set(0, 0.08, -2.4);
  group.add(rings.mesh);

  // the wordmark on the shell's lip
  const sign = canvasCard(c, [5.6, 1.0], [1024, 184], (g, w, h) => {
    g.fillStyle = '#111215';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8f827';
    g.font = `700 128px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '10px';
    g.fillText('TARANG', w / 2, h / 2 + 6);
  }, new THREE.Vector3(1.3, 1.3, 1.3), [`700 128px ${SANS}`]);
  sign.mesh.position.set(0, 4.95, -5.53);
  group.add(sign.mesh);

  const arch = new THREE.Mesh(b.build(), mat);
  group.add(arch);

  const detail = detailShot(group, V(-6.0, 6.4, 24.5), V(-2.8, 2.6, -1.2));
  let spin = 0, last = 0;
  return {
    group,
    detail,
    triangles: b.triangles + rb.triangles + ab.triangles + 12,
    update(t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, k.screen);
      mat.uniforms.uLevel.value = k.life;
      sign.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      sign.mat.uniforms.uReveal.value = k.sign;
      screen.update(t, k.screen);
      rings.mat.uniforms.uOn.value = k.life;
      // the arm swings on first, then the platter comes up to speed (33 rpm, slowed to read)
      arm.rotation.y = 1.3 + 0.45 * k.accents;
      const dt = Math.min(0.1, Math.max(0, t - last));
      last = t;
      spin += dt * 1.6 * k.life;
      record.rotation.y = -spin;
    },
  };
}

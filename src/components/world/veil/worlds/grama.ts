import * as THREE from 'three';
import type { Common } from '../shaders';
import { type Builder, CH, hex, SEQ } from './kit';
import { beats, builder, canvasCard, detailShot, labels, lamps, MONO, type Pad, placeGroup, plinth, type ProjectWorld, ripples, V } from './stage';

/**
 * GRAMA SATHI: a voice assistant that answers in simple spoken Hindi. A village chaupal in sand and
 * vermilion: two thatched huts, a raised platform with a charpai, and a loudspeaker on a pole whose voice
 * travels out across the ground in rings. A painted board carries the name in Devanagari (ग्राम साथी, as the
 * portfolio's own case-study world sets it), and three posts stand for the pipeline the project lists:
 * faster-whisper hears, Llama 3.3 answers, edge-tts speaks. There is no repository to take screens from.
 */

const SAND = hex('#ebe5d8'), VERM = hex('#ff5226');
const MUD = hex('#c58a5c'), MUD_DARK = hex('#9a6644'), THATCH = hex('#cda866'), WOOD = hex('#7a5536');
const STONE = hex('#d8cdb6'), STONE_DARK = hex('#a39276');
const DEVA = "'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', sans-serif";

/**
 * A round hut: a mud wall on a raised, lime-washed plinth with a painted border, a door in a timber frame
 * under a little porch on two posts, and a thatch of three layered skirts tied at the crown.
 */
function hut(b: Builder, at: THREE.Vector3, r: number, h: number) {
  b.cyl(at, r * 1.16, r * 1.22, 0.4, 32, { col: hex('#e9e1d0') });
  b.cyl(at.clone().add(V(0, 0.4, 0)), r * 1.17, r * 1.17, 0.06, 32, { col: VERM });
  b.cyl(at.clone().add(V(0, 0.4, 0)), r, r * 1.03, h - 0.4, 32, { col: MUD });
  b.cyl(at.clone().add(V(0, 0.46, 0)), r * 1.04, r * 1.05, 0.5, 32, { col: MUD_DARK });
  // the door and its frame, and a porch roof on two posts
  b.box(at.clone().add(V(0, 0.4 + h * 0.36, r * 0.99)), [r * 0.48, h * 0.72, 0.08], 0, { col: hex('#3b2618') }, 0, 0, 0);
  for (const s of [-1, 1]) b.box(at.clone().add(V(s * r * 0.28, 0.4 + h * 0.38, r * 1.0)), [0.12, h * 0.78, 0.14], 0, { col: WOOD });
  b.box(at.clone().add(V(0, 0.4 + h * 0.78, r * 1.0)), [r * 0.7, 0.12, 0.16], 0, { col: WOOD });
  for (const s of [-1, 1]) b.cyl(at.clone().add(V(s * r * 0.5, 0.4, r * 1.45)), 0.06, 0.07, h - 0.3, 8, { col: WOOD });
  b.box(at.clone().add(V(0, h + 0.05, r * 1.3)), [r * 1.3, 0.1, 1.0], 0, { col: THATCH }, 0.32);
  // thatch: three skirts, each overhanging the one above, then the crown tied off with a finial
  const sk: [number, number, number, number][] = [[1.42, 0.0, 0.88, 0.5], [1.02, 0.42, 0.62, 0.5], [0.7, 0.84, 0.12, 0.62]];
  sk.forEach(([r0, y0, r1, hh], i) => {
    const y = h - 0.2 + y0 * h * 0.62;
    b.lathe(at.clone().add(V(0, y, 0)), [[r * r0, 0], [r * r0 * 0.99, 0.12], [r * r1, hh * h * 0.62 + 0.1], [0, hh * h * 0.62 + 0.12]], 30, { col: i % 2 ? hex('#c39d5c') : THATCH });
  });
  b.cyl(at.clone().add(V(0, h * 1.5, 0)), 0.1, 0.16, 0.18, 8, { col: hex('#8c6a3c') });
  b.cyl(at.clone().add(V(0, h * 1.62, 0)), 0.03, 0.07, 0.42, 6, { col: WOOD });
}

/** an earthen pot: a matka, round-bellied, with a rolled lip */
function pot(b: Builder, at: THREE.Vector3, s: number, col = hex('#b5643a')) {
  b.lathe(at, [[0, 0], [0.18, 0.02], [0.32, 0.18], [0.36, 0.34], [0.28, 0.52], [0.15, 0.6], [0.17, 0.66], [0.13, 0.68]].map(([r, y]) => [r * s, y * s] as [number, number]), 18, { col, gloss: 0.08 });
}

export function gramaWorld(c: Common, pad: Pad): ProjectWorld {
  const group = placeGroup('grama-sathi', pad);
  const { b, mat } = builder(c, { steps: 3, warm: [1.5, 1.25, 0.95] });
  // the Devanagari face the case-study world loads
  const deva = import('@fontsource/noto-sans-devanagari/devanagari-800.css').catch(() => {});

  plinth(b, 21, 14, STONE, STONE_DARK);

  // ---- two huts, a lamp glowing in a window
  const h1 = V(-5.2, 0, -3.6);
  hut(b, h1, 2.5, 2.7);
  b.box(h1.clone().add(V(1.7, 1.5, 1.8)), [0.6, 0.6, 0.08], 0.75, { col: hex('#ffcf87'), glow: 0.9, ch: CH.a });
  hut(b, V(-8.4, 0, 0.2), 1.6, 2.0);

  // ---- the chaupal: a raised round platform with a stone kerb and a step, a charpai on it, pots by the edge
  const ch = V(1.8, 0, -2.0);
  b.cyl(ch, 3.4, 3.6, 0.55, 40, { col: SAND });
  b.cyl(ch.clone().add(V(0, 0.5, 0)), 3.48, 3.48, 0.1, 40, { col: hex('#b7a789') });
  b.cyl(ch.clone().add(V(0, 0.55, 0)), 3.2, 3.2, 0.03, 40, { col: hex('#dcd3c0') });
  b.box(ch.clone().add(V(0, 0.15, 3.65)), [1.6, 0.3, 0.6], 0, { col: hex('#b7a789') });
  pot(b, ch.clone().add(V(2.3, 0.58, -1.6)), 1.1);
  pot(b, ch.clone().add(V(2.75, 0.58, -0.9)), 0.85, hex('#a25530'));
  pot(b, ch.clone().add(V(-2.5, 0, 3.0)), 1.0);
  const cp = ch.clone().add(V(-0.6, 0.58, 0.4));
  for (const [x, z] of [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]]) b.box(cp.clone().add(V(x, 0.3, z)), [0.12, 0.6, 0.12], 0, { col: WOOD });
  b.box(cp.clone().add(V(0, 0.58, 0)), [2.2, 0.08, 1.15], 0, { col: WOOD });
  // the woven rope bed, in bands
  for (let i = 0; i < 7; i++) b.box(cp.clone().add(V(-0.84 + i * 0.28, 0.635, 0)), [0.22, 0.04, 0.95], 0, { col: i % 2 ? hex('#e7d9b8') : hex('#d6c49c') }, 0, 0, 0);

  // ---- the loudspeaker: a pole, a vermilion horn pointing over the platform
  const pole = V(5.6, 0, -4.4);
  b.cyl(pole, 0.09, 0.12, 6.4, 8, { col: WOOD });
  b.cyl(pole, 0.32, 0.4, 0.4, 10, { col: hex('#b7a789') });
  // a crossarm and the amplifier box strapped to the pole, its lead running up to the horn
  b.box(pole.clone().add(V(0, 5.5, 0)), [1.2, 0.1, 0.1], 0, { col: WOOD });
  b.box(pole.clone().add(V(0.0, 3.2, 0.2)), [0.5, 0.6, 0.3], 0, { col: hex('#4a5560') });
  b.box(pole.clone().add(V(0.0, 3.35, 0.36)), [0.08, 0.08, 0.02], 0, { col: hex('#ff8c5a'), glow: 1, ch: CH.b }, 0, 0, 0);
  b.rod(pole.clone().add(V(0.12, 3.5, 0.2)), pole.clone().add(V(0.1, 5.8, 0.1)), 0.015, { col: hex('#1b1b1b') }, 4);
  const horn = new THREE.LatheGeometry([[0.1, 0], [0.16, 0.5], [0.5, 1.15], [0.62, 1.3], [0.58, 1.32], [0.12, 0.06]].map(([r, y]) => new THREE.Vector2(r, y)), 20);
  horn.computeVertexNormals();
  const hq = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(-0.7, -0.25, 0.66).normalize());
  b.add(horn, new THREE.Matrix4().compose(pole.clone().add(V(0, 5.9, 0)), hq, V(1, 1, 1)), { col: VERM, gloss: 0.25 });
  // the bell's rolled rim, and the driver behind it
  const rimAt = pole.clone().add(V(0, 5.9, 0)).add(V(0, 1.31, 0).applyQuaternion(hq));
  b.add(new THREE.TorusGeometry(0.6, 0.035, 6, 24), new THREE.Matrix4().compose(rimAt, hq.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2)), V(1, 1, 1)), { col: hex('#d8401a') });
  b.add(new THREE.CylinderGeometry(0.2, 0.24, 0.32, 14), new THREE.Matrix4().compose(pole.clone().add(V(0, 5.9, 0)).add(V(0, -0.1, 0).applyQuaternion(hq)), hq, V(1, 1, 1)), { col: hex('#4a5560') });
  b.sphere(pole.clone().add(V(0, 5.9, 0)), 0.2, { col: VERM, glow: 0.8, ch: CH.b }, 8);
  const voice = ripples(c, 7.5, new THREE.Color('#ff5226'), 0.5);
  voice.mesh.rotation.x = -Math.PI / 2;
  voice.mesh.position.copy(ch).add(V(0, 0.62, 0));
  group.add(voice.mesh);

  // ---- the pipeline: three posts along the path, lit in turn
  const steps = ['faster-whisper', 'Llama 3.3', 'edge-tts'];
  const posts = steps.map((_, k) => V(-2.6 + k * 2.6, 0, 4.6 - (k === 1 ? 0.5 : 0)));
  posts.forEach((p, k) => {
    b.box(p.clone().add(V(0, 0.12, 0)), [0.5, 0.24, 0.5], 0, { col: hex('#b7a789') });
    b.box(p.clone().add(V(0, 0.85, 0)), [0.16, 1.5, 0.16], 0, { col: WOOD });
    // a little clay diya lamp on each, lit in turn
    b.lathe(p.clone().add(V(0, 1.6, 0)), [[0, 0], [0.2, 0.02], [0.26, 0.1], [0.22, 0.12]], 14, { col: hex('#b5643a') });
    b.sphere(p.clone().add(V(0, 1.82, 0)), 0.13, { col: hex('#ffb36b'), glow: 1, ch: SEQ(k) }, 10);
  });
  const plates = labels(c, steps.map((text, k) => ({ text, at: posts[k].clone().add(V(0, 1.15, 0.12)) })), { w: 1.9, h: 0.42, ink: '#111215', paper: '#ebe5d8', font: MONO });
  group.add(plates.mesh);

  // ---- the name board, on two posts at the right
  const bd = V(7.0, 0, 1.6), by = -0.5;
  const bq = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), by);
  const bp = (x: number, y: number, z: number) => V(x, y, z).applyQuaternion(bq).add(bd);
  for (const s of [-1.8, 1.8]) b.box(bp(s, 2.0, -0.08), [0.2, 4.0, 0.2], by, { col: WOOD });
  b.box(bp(0, 3.0, -0.1), [4.3, 2.4, 0.14], by, { col: WOOD });
  // a little pitched roof keeps the rain off the board
  for (const s of [-1, 1]) b.box(bp(0, 4.42, -0.05 + s * 0.38), [4.8, 0.08, 0.86], by, { col: THATCH }, s * 0.5);
  const board = canvasCard(c, [3.9, 2.0], [1024, 524], (g, w, h) => {
    g.fillStyle = '#ebe5d8';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ff5226';
    g.lineWidth = 10;
    g.strokeRect(18, 18, w - 36, h - 36);
    g.fillStyle = '#111215';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `800 190px ${DEVA}`;
    g.fillText('ग्राम साथी', w / 2, h * 0.44);
    g.fillStyle = '#ff5226';
    g.font = `600 52px ${MONO}`;
    g.fillText('GRAMA SATHI', w / 2, h * 0.8);
  }, new THREE.Vector3(1.2, 1.18, 1.12), [`800 190px ${DEVA}`], deva);
  board.mesh.position.copy(bp(0, 3.0, 0.0));
  board.mesh.rotation.y = by;
  group.add(board.mesh);

  // lanterns, warm
  lamps(b, [[-3.4, 6.4], [3.4, 6.4], [-9.3, 5.4], [9.3, 5.4], [9.3, -2.0]], WOOD, hex('#ffcf87'), 2.2);
  // a beaten-earth path from the steps to the chaupal
  b.box(V(0, 0.03, 2.4), [3.0, 0.06, 7.0], 0, { col: hex('#bba98a') }, 0, 0, 0);

  const arch = new THREE.Mesh(b.build(), mat);
  // the still architecture casts the world's sun shadow (see environment.ts); moving parts do not
  arch.name = 'arch';
  group.add(arch);

  const detail = detailShot(group, V(5.5, 7.2, 23.5), V(-0.4, 2.4, -1.2), V(-0.5, 2.4, -0.8));
  return {
    group,
    detail,
    triangles: b.triangles + 12,
    update(_t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, 0);
      mat.uniforms.uSeq.value.x = k.seq;
      plates.mat.uniforms.uOn.value = 1;
      plates.mat.uniforms.uReveal.value = k.seq;
      board.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      board.mat.uniforms.uReveal.value = k.sign;
      // the voice goes out once the pipeline has run: hear, answer, speak
      voice.mat.uniforms.uOn.value = k.screen;
    },
  };
}

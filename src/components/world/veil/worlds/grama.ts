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

function hut(b: Builder, at: THREE.Vector3, r: number, h: number) {
  b.cyl(at, r, r * 1.04, h, 28, { col: MUD });
  b.cyl(at, r * 1.06, r * 1.08, 0.35, 28, { col: MUD_DARK });
  // thatch: a cone that overhangs the wall, with a little finial
  b.lathe(at.clone().add(V(0, h - 0.2, 0)), [[r * 1.4, 0], [r * 1.38, 0.18], [r * 0.6, h * 0.62], [0.08, h * 0.98], [0, h]], 28, { col: THATCH });
  b.cyl(at.clone().add(V(0, h * 1.75, 0)), 0.04, 0.08, 0.4, 6, { col: WOOD });
  b.box(at.clone().add(V(0, h * 0.42, r * 0.99)), [r * 0.5, h * 0.8, 0.08], 0, { col: hex('#3b2618') });
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

  // ---- the chaupal: a raised round platform, a charpai on it
  const ch = V(1.8, 0, -2.0);
  b.cyl(ch, 3.4, 3.6, 0.55, 36, { col: SAND });
  b.cyl(ch.clone().add(V(0, 0.55, 0)), 3.2, 3.2, 0.03, 36, { col: hex('#dcd3c0') });
  const cp = ch.clone().add(V(-0.6, 0.58, 0.4));
  for (const [x, z] of [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]]) b.box(cp.clone().add(V(x, 0.3, z)), [0.12, 0.6, 0.12], 0, { col: WOOD });
  b.box(cp.clone().add(V(0, 0.58, 0)), [2.2, 0.08, 1.15], 0, { col: WOOD });
  b.box(cp.clone().add(V(0, 0.63, 0)), [1.95, 0.04, 0.95], 0, { col: hex('#e7d9b8') });

  // ---- the loudspeaker: a pole, a vermilion horn pointing over the platform
  const pole = V(5.6, 0, -4.4);
  b.cyl(pole, 0.09, 0.12, 6.4, 8, { col: WOOD });
  const horn = new THREE.LatheGeometry([[0.1, 0], [0.16, 0.5], [0.5, 1.15], [0.62, 1.3], [0.58, 1.32], [0.12, 0.06]].map(([r, y]) => new THREE.Vector2(r, y)), 20);
  horn.computeVertexNormals();
  const hq = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(-0.7, -0.25, 0.66).normalize());
  b.add(horn, new THREE.Matrix4().compose(pole.clone().add(V(0, 5.9, 0)), hq, V(1, 1, 1)), { col: VERM });
  b.sphere(pole.clone().add(V(0, 5.9, 0)), 0.2, { col: VERM, glow: 0.8, ch: CH.b }, 8);
  const voice = ripples(c, 7.5, new THREE.Color('#ff5226'), 0.5);
  voice.mesh.rotation.x = -Math.PI / 2;
  voice.mesh.position.copy(ch).add(V(0, 0.62, 0));
  group.add(voice.mesh);

  // ---- the pipeline: three posts along the path, lit in turn
  const steps = ['faster-whisper', 'Llama 3.3', 'edge-tts'];
  const posts = steps.map((_, k) => V(-2.6 + k * 2.6, 0, 4.6 - (k === 1 ? 0.5 : 0)));
  posts.forEach((p, k) => {
    b.box(p.clone().add(V(0, 0.8, 0)), [0.16, 1.6, 0.16], 0, { col: WOOD });
    b.sphere(p.clone().add(V(0, 1.75, 0)), 0.22, { col: hex('#ffb36b'), glow: 1, ch: SEQ(k) }, 10);
  });
  const plates = labels(c, steps.map((text, k) => ({ text, at: posts[k].clone().add(V(0, 1.15, 0.12)) })), { w: 1.9, h: 0.42, ink: '#111215', paper: '#ebe5d8', font: MONO });
  group.add(plates.mesh);

  // ---- the name board, on two posts at the right
  const bd = V(7.0, 0, 1.6), by = -0.5;
  const bq = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), by);
  const bp = (x: number, y: number, z: number) => V(x, y, z).applyQuaternion(bq).add(bd);
  for (const s of [-1.8, 1.8]) b.box(bp(s, 1.6, -0.08), [0.18, 3.2, 0.18], by, { col: WOOD });
  b.box(bp(0, 3.0, -0.1), [4.2, 2.3, 0.12], by, { col: WOOD });
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
  b.box(V(0, 0.04, 2.2), [3.4, 0.08, 7.4], 0, { col: hex('#cbbd9e') });

  const arch = new THREE.Mesh(b.build(), mat);
  group.add(arch);

  const detail = detailShot(group, V(5.5, 7.2, 23.5), V(-0.4, 2.4, -1.2));
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

import * as THREE from 'three';
import { COMMON, type Common } from '../shaders';
import { Builder, CH, hex, type RGB } from './kit';
import { beats, builder, canvasCard, detailShot, kiosk, lamps, type Pad, placeGroup, plinth, type ProjectWorld, ripples, SANS, spill, V } from './stage';

/**
 * TARANG: music, redesigned for the web. A band shell in the app's colours (lime, ink, vermilion): concentric
 * arches over a round stage, LED level meters along the back that dance once the music starts, speakers
 * sending rings across the terrace, a turntable as big as a room playing a grooved record, and a display
 * walking through the app's own screens (home, now playing, listening stats, from the repository's README).
 */

const LIME = hex('#d8f827'), INK = hex('#111215'), VERM = hex('#ff5226'), PAPER = hex('#fdf9f1');
const STONE = hex('#b9b5a9'), STONE_DARK = hex('#7f7b72'), GRAPHITE = hex('#2c2d33'), STEEL = hex('#9ea3ab'), SHELL = hex('#1c1d22');

/* ------------------------------------------------------------------ vinyl */

const VINYL_VS = /* glsl */ `
varying vec2 vUv; varying vec3 vWP;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const VINYL_FS = /* glsl */ `
${COMMON}
uniform vec3 uCentre; uniform float uOn;
varying vec2 vUv; varying vec3 vWP;
void main(){
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float ang = atan(p.y, p.x);
  // fine grooves (faded out where they would alias), the gaps between tracks, the run-out
  float gr = r * 520.0;
  float aa = fwidth(gr);
  float groove = mix(0.5, 0.5 + 0.5 * sin(gr), 1.0 - smoothstep(0.4, 1.6, aa));
  float gaps = 0.0;
  for (int i = 0; i < 4; i++) gaps += 1.0 - smoothstep(0.0, 0.006, abs(r - (0.5 + float(i) * 0.11)));
  float played = smoothstep(0.38, 0.42, r) * (1.0 - smoothstep(0.94, 0.96, r));
  vec3 col = vec3(0.018, 0.018, 0.022) + groove * 0.016 * played - gaps * 0.01;
  // the sheen: two streaks fixed in the room (the grooves turn under them), where the grooves face the sun
  vec3 V = normalize(uCam - vWP);
  vec3 H = normalize(uSun + V);
  vec2 d = vWP.xz - uCentre.xz;
  float wa = atan(d.y, d.x), ha = atan(H.z, H.x);
  float streak = pow(abs(sin(wa - ha)), 26.0);
  float sh = shadowAt(vWP, 0.002);
  col += uSunCol * streak * (0.06 + 0.16 * groove) * played * sh;
  col += uSkyCol * 0.05 * pow(1.0 - max(V.y, 0.0), 2.0);
  // the label: lime paper with a printed ring and a band of type that turns with the record
  float label = 1.0 - smoothstep(0.355, 0.36, r);
  vec3 paper = vec3(0.85, 0.97, 0.15) * (0.55 + 0.45 * sh) * (0.8 + 0.5 * uOn);
  paper *= 1.0 - 0.75 * (1.0 - smoothstep(0.0, 0.006, abs(r - 0.32)));
  float type = step(0.2, r) * step(r, 0.26) * step(0.25, fract(ang / 6.2832 * 14.0)) * step(ang, 1.4) * step(-0.2, ang);
  paper = mix(paper, vec3(0.07), type);
  col = mix(col, paper, label);
  // the spindle
  col = mix(col, vec3(0.75, 0.76, 0.78), 1.0 - smoothstep(0.03, 0.035, r));
  gl_FragColor = vec4(fogApply(col, vWP), 0.0);
}`;

/* ------------------------------------------------------------------ parts */

/** a speaker cone facing +z: surround, cone, dust cap */
function cone(b: Builder, c: THREE.Vector3, r: number) {
  // dust cap proud at the centre, the cone dished back from the surround
  const prof: [number, number][] = [[0.0, -0.16], [0.14, -0.18], [0.2, -0.26], [0.24, -0.3], [0.86, -0.06], [0.92, 0.02], [0.98, 0.03], [1.0, 0.0]];
  const g = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x * r, y * r)), 28);
  g.computeVertexNormals();
  b.add(g, new THREE.Matrix4().compose(c, new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2), V(1, 1, 1)), { col: hex('#3b3d45'), gloss: 0.35 });
  b.add(new THREE.TorusGeometry(r * 1.02, r * 0.05, 6, 32), new THREE.Matrix4().makeTranslation(c.x, c.y, c.z - 0.01), { col: STEEL, gloss: 0.5 });
}

/** a band of an arch in the xy plane (a half ellipse of half-width rx, height ry) at depth z, as n boxes */
function arch(b: Builder, rx: number, ry: number, z: number, depth: number, thick: number, col: RGB, n: number, extra: Partial<{ glow: number; ch: number; gloss: number }> = {}, bevel?: number) {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI, am = (a0 + a1) / 2;
    const p0 = V(Math.cos(a0) * rx, Math.sin(a0) * ry, z), p1 = V(Math.cos(a1) * rx, Math.sin(a1) * ry, z);
    const mid = V(Math.cos(am) * rx, Math.sin(am) * ry, z);
    const len = p0.distanceTo(p1) + thick * 0.35;
    const roll = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    b.box(mid, [len, thick, depth], 0, { col, ...extra }, 0, roll, bevel);
  }
}

export function tarangWorld(c: Common, pad: Pad, base = '/'): ProjectWorld {
  const group = placeGroup('tarang', pad);
  const { b, mat } = builder(c, { pulse: 0, warm: [1.0, 1.02, 0.95] });

  plinth(b, 21, 14, STONE, STONE_DARK, 11);

  // ---- the stage: a round apron in ink with a lime nosing, under the shell
  const sz = -5.6;
  b.add(new THREE.CylinderGeometry(5.8, 5.9, 0.8, 40, 1, false, -Math.PI / 2, Math.PI), new THREE.Matrix4().makeTranslation(0, 0.4, sz), { col: INK });
  b.add(new THREE.CylinderGeometry(5.84, 5.84, 0.05, 40, 1, true, -Math.PI / 2, Math.PI), new THREE.Matrix4().makeTranslation(0, 0.72, sz), { col: LIME, glow: 0.6, ch: CH.b });
  b.add(new THREE.CylinderGeometry(5.7, 5.7, 0.04, 40, 1, false, -Math.PI / 2, Math.PI), new THREE.Matrix4().makeTranslation(0, 0.81, sz), { col: hex('#24252b'), gloss: 0.25 });

  // ---- the band shell: concentric arches stepping in toward the back, each with an infill, a lit inner edge
  const shells: [number, number, number][] = [[6.6, 6.6, -2.7], [5.9, 5.9, -3.6], [5.2, 5.2, -4.5], [4.5, 4.6, -5.4]];
  shells.forEach(([rx, ry, z], k) => {
    arch(b, rx, ry, z, 0.5, 0.42, INK, 14, { gloss: 0.12 });
    arch(b, rx - 0.3, ry - 0.3, z - 0.42, 0.95, 0.5, k % 2 ? SHELL : hex('#202127'), 12, {}, 0);
    arch(b, rx - 0.24, ry - 0.24, z + 0.26, 0.04, 0.06, LIME, 16, { glow: 0.75, ch: CH.b }, 0);
  });
  // the back: a half disc, panelled
  for (let i = 0; i < 12; i++) {
    const x = -4.5 + (i + 0.5) * 0.75, hgt = 4.6 * Math.sqrt(Math.max(0, 1 - (x / 4.5) ** 2));
    b.box(V(x, hgt / 2, -6.0), [0.73, hgt, 0.3], 0, { col: i % 2 ? SHELL : hex('#18191d') }, 0, 0, 0.02);
  }
  // footings either side of the front arch
  for (const s of [-1, 1]) b.box(V(s * 6.6, 0.5, -2.7), [1.0, 1.0, 1.0], 0, { col: INK });

  // ---- LED level meters along the back: columns of segments, shorter toward the edge of the arch
  const SEG = 12;
  const meterTop = (x: number) => Math.min(3.4, 4.6 * Math.sqrt(Math.max(0, 1 - (x / 4.5) ** 2)) - 1.4);
  for (let i = 0; i < 13; i++) {
    const x = -3.6 + i * 0.6, top = meterTop(x), hSeg = top / SEG;
    for (let s = 0; s < SEG; s++) {
      const f = (s + 0.5) / SEG;
      const col = s >= SEG - 2 ? VERM : LIME;
      b.box(V(x, 0.95 + hSeg * (s + 0.5), -5.7), [0.44, hSeg * 0.74, 0.12], 0, { col, glow: 0.92, ch: CH.a, aux: i + 1 + f * 0.98 }, 0, 0, 0);
    }
  }

  // ---- speakers either side: cabinets with a woofer, a mid and a horn, each ringed in steel
  for (const x of [-8.6, 8.6]) {
    b.box(V(x, 2.2, -4.0), [2.1, 4.4, 1.8], 0, { col: INK, gloss: 0.1 });
    b.box(V(x, 0.12, -4.0), [2.3, 0.24, 2.0], 0, { col: GRAPHITE });
    cone(b, V(x, 1.35, -3.08), 0.72);
    cone(b, V(x, 2.85, -3.08), 0.42);
    b.box(V(x, 3.75, -3.06), [1.1, 0.42, 0.1], 0, { col: GRAPHITE, gloss: 0.3 });
    b.box(V(x, 3.75, -3.0), [0.8, 0.16, 0.06], 0, { col: VERM, glow: 0.7, ch: CH.b }, 0, 0, 0);
  }

  // ---- the turntable: a plinth as big as a room, platter with a strobe rim, controls, a play light
  const deck = V(-5.6, 0, 2.4);
  b.box(deck.clone().add(V(0, 0.58, 0)), [6.6, 1.16, 5.3], 0, { col: INK, gloss: 0.15 });
  b.box(deck.clone().add(V(0, 1.18, 0)), [6.3, 0.05, 5.0], 0, { col: hex('#1d1e23'), gloss: 0.35 }, 0, 0, 0.02);
  for (const [fx, fz] of [[-2.9, -2.3], [2.9, -2.3], [2.9, 2.3], [-2.9, 2.3]]) b.cyl(deck.clone().add(V(fx, -0.05, fz)), 0.32, 0.36, 0.12, 14, { col: GRAPHITE });
  const pc = deck.clone().add(V(-0.7, 1.2, -0.1));
  b.cyl(pc, 2.32, 2.36, 0.16, 56, { col: STEEL, gloss: 0.6 });
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    b.box(pc.clone().add(V(Math.cos(a) * 2.34, 0.08, Math.sin(a) * 2.34)), [0.05, 0.08, 0.05], -a, { col: hex('#5c6068') }, 0, 0, 0);
  }
  // controls: start/stop, 33/45, a pitch fader in its slot
  b.box(deck.clone().add(V(-2.6, 1.23, 2.0)), [0.6, 0.06, 0.4], 0, { col: GRAPHITE, gloss: 0.3 });
  for (const ox of [-1.8, -1.3]) b.cyl(deck.clone().add(V(ox, 1.2, 2.1)), 0.14, 0.14, 0.06, 12, { col: STEEL, gloss: 0.5 });
  b.box(deck.clone().add(V(2.7, 1.22, 0.7)), [0.12, 0.03, 2.2], 0, { col: hex('#08080a') }, 0, 0, 0);
  b.box(deck.clone().add(V(2.7, 1.28, 0.9)), [0.34, 0.1, 0.24], 0, { col: STEEL, gloss: 0.5 });
  b.sphere(deck.clone().add(V(2.7, 1.26, 2.2)), 0.1, { col: VERM, glow: 1, ch: CH.b }, 10);

  // the tonearm's base, and the rest it leaves
  const pivot = deck.clone().add(V(2.25, 1.2, -1.75));
  b.cyl(pivot, 0.42, 0.46, 0.14, 20, { col: GRAPHITE, gloss: 0.3 });
  b.cyl(pivot.clone().add(V(0, 0.14, 0)), 0.2, 0.24, 0.32, 16, { col: STEEL, gloss: 0.6 });
  b.cyl(deck.clone().add(V(2.4, 1.2, 1.15)), 0.05, 0.06, 0.48, 8, { col: STEEL, gloss: 0.5 });
  b.box(deck.clone().add(V(2.4, 1.7, 1.15)), [0.22, 0.06, 0.22], 0, { col: GRAPHITE });

  // the record: a grooved disc with its own shading, on the platter, turning
  const vinylMat = new THREE.ShaderMaterial({
    vertexShader: VINYL_VS,
    fragmentShader: VINYL_FS,
    uniforms: { ...c, uCentre: { value: new THREE.Vector3() }, uOn: { value: 0 } },
  });
  const record = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(2.12, 96), vinylMat);
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.045;
  const rb = new Builder();
  rb.cyl(V(0, 0, 0), 2.12, 2.12, 0.04, 96, { col: hex('#0d0d10'), gloss: 0.5 }, true);
  rb.cyl(V(0, -0.01, 0), 2.0, 2.0, 0.04, 48, { col: hex('#0d0d10') });
  record.add(face, new THREE.Mesh(rb.build(), mat));
  record.position.copy(pc).add(V(0, 0.16, 0));
  group.add(record);

  // the tonearm: gimbal, counterweight, a tube that bends to the headshell, the cartridge on its stylus
  const ab = new Builder();
  ab.add(new THREE.TorusGeometry(0.2, 0.04, 8, 20), new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, 0.42, 0), { col: STEEL, gloss: 0.7 });
  ab.disc(V(0, 0.42, 0.62), 0.24, 0.34, 20, { col: STEEL, gloss: 0.7 });
  ab.disc(V(0, 0.42, 0.85), 0.2, 0.08, 20, { col: GRAPHITE });
  ab.rod(V(0, 0.42, 0.45), V(0, 0.42, -2.0), 0.06, { col: PAPER, gloss: 0.6 }, 10);
  ab.rod(V(0, 0.42, -2.0), V(-0.28, 0.38, -2.55), 0.06, { col: PAPER, gloss: 0.6 }, 10);
  ab.box(V(-0.38, 0.33, -2.78), [0.3, 0.06, 0.46], 0.45, { col: INK, gloss: 0.3 });
  ab.box(V(-0.4, 0.24, -2.84), [0.16, 0.14, 0.24], 0.45, { col: VERM });
  ab.box(V(-0.2, 0.36, -2.6), [0.24, 0.03, 0.05], 0.45, { col: STEEL }, 0, 0, 0);
  const arm = new THREE.Mesh(ab.build(), mat);
  arm.position.copy(pivot).add(V(0, 0.24, 0));
  group.add(arm);

  lamps(b, [[-3.5, 6.4], [3.5, 6.4], [-9.3, 5.6], [9.3, 5.6], [9.3, -0.5]], INK, LIME);

  const screen = kiosk(c, b, group, {
    x: 6.8, z: 2.6, yaw: -0.42, w: 4.0, h: 2.5, frame: INK, trim: LIME,
    pages: ['home', 'now-playing', 'stats'].map((n) => `${base}world/tarang/${n}.webp`),
  });

  // sound across the terrace, and the stage light on the floor of the shell
  const rings = ripples(c, 8, new THREE.Color('#d8f827'), 0.45);
  rings.mesh.rotation.x = -Math.PI / 2;
  rings.mesh.position.set(0, 0.1, -1.6);
  group.add(rings.mesh);
  const wash = spill(c, 9, 5, new THREE.Color(0.32, 0.36, 0.05));
  wash.mesh.position.set(0, 2.4, -5.8);
  group.add(wash.mesh);

  // the wordmark hung under the crown of the front arch
  const sign = canvasCard(c, [4.6, 0.82], [1024, 184], (g, w, h) => {
    g.fillStyle = '#111215';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8f827';
    g.font = `700 128px ${SANS}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '10px';
    g.fillText('TARANG', w / 2, h / 2 + 6);
  }, new THREE.Vector3(1.3, 1.3, 1.3), [`700 128px ${SANS}`]);
  sign.mesh.position.set(0, 5.55, -2.4);
  group.add(sign.mesh);
  for (const s of [-1, 1]) b.rod(V(s * 1.9, 5.96, -2.42), V(s * 1.9, 6.5, -2.6), 0.02, { col: STEEL });

  const arch_ = new THREE.Mesh(b.build(), mat);
  // the still architecture casts the world's sun shadow (see environment.ts); moving parts do not
  arch_.name = 'arch';
  group.add(arch_);

  group.updateMatrixWorld(true);
  record.getWorldPosition(vinylMat.uniforms.uCentre.value);

  const detail = detailShot(group, V(-6.0, 6.4, 24.5), V(-2.8, 2.6, -1.2), V(0.2, 2.6, -0.8));
  let spin = 0, last = 0;
  return {
    group,
    detail,
    triangles: b.triangles + rb.triangles + ab.triangles + 96 + 12,
    update(t, a) {
      const k = beats(a);
      mat.uniforms.uOn.value.set(k.windows, k.accents, k.lamps, k.screen);
      mat.uniforms.uLevel.value = k.life;
      vinylMat.uniforms.uOn.value = k.accents;
      sign.mat.uniforms.uOn.value = k.sign > 0 ? 1 : 0;
      sign.mat.uniforms.uReveal.value = k.sign;
      screen.update(t, k.screen);
      rings.mat.uniforms.uOn.value = k.life;
      wash.mat.uniforms.uOn.value = k.windows * (0.75 + 0.25 * Math.sin(t * 3.1) * Math.sin(t * 1.3));
      // the arm swings in and drops onto the lead-in, then tracks slowly inward as the side plays
      const into = k.accents, play = (t * 0.004) % 0.12;
      arm.rotation.y = 1.18 + 0.5 * into + play * into;
      arm.rotation.z = 0.04 * (1 - into);
      const dt = Math.min(0.1, Math.max(0, t - last));
      last = t;
      // the platter comes up to speed with a little lag, as a heavy one does
      spin += dt * 1.6 * k.life * k.life;
      record.rotation.y = -spin;
    },
  };
}

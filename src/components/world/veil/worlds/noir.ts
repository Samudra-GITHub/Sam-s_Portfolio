import * as THREE from 'three';
import type { Common } from '../shaders';
import { archMaterial, Builder, cardMaterial, CH, ease, hex, screenMaterial, steam } from './kit';
import { beats, type Pad, type ProjectWorld, texture, uploadTexture } from './stage';

/**
 * NOIR CAFÉ's island: a coffee house that exists only as a website, given a
 * building to live in.
 *
 * Everything shown comes from the real project: its palette (espresso, cream,
 * copper), its Cormorant wordmark, screenshots of its own menu, reservation and
 * shop pages on the ordering display, and the four languages and currencies the
 * site ships on the menu board. The latte-art cup is the signature piece; the
 * 2D case-study world (components/work/worlds/NoirWorld.tsx) pours the same rosetta.
 *
 * Local frame: origin on the build pad, +z toward the project camera, +x to its right.
 */

const ESPRESSO = hex('#1b1410'), CHARCOAL = hex('#2b2420'), CREAM = hex('#efe6da'), COPPER = hex('#c98a4b');
const STONE = hex('#b9ad9c'), STONE_DARK = hex('#8f8577'), OAK = hex('#9a7652'), GLASS = hex('#c98a4b'), CERAMIC = hex('#f4efe8');


/** the café wordmark as the real site sets it: a ring, then NOIR CAFÉ in Cormorant capitals */
function wordmark(font: string) {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 160;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#f3e9dc';
  g.strokeStyle = '#f3e9dc';
  g.lineWidth = 8;
  g.beginPath();
  g.arc(70, 88, 42, 0, Math.PI * 2);
  g.stroke();
  // the caps sit low on the canvas so the acute over the É has room above them
  g.font = `600 92px ${font}`;
  g.textBaseline = 'alphabetic';
  g.letterSpacing = '6px';
  g.fillText('NOIR CAFÉ', 150, 122);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** the A-frame board: the four languages and currencies the site really ships */
function menuBoard(font: string) {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 640;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#1b1410';
  g.fillRect(0, 0, 512, 640);
  g.strokeStyle = '#c98a4b';
  g.lineWidth = 6;
  g.strokeRect(18, 18, 476, 604);
  g.fillStyle = '#f3e9dc';
  g.textAlign = 'center';
  g.font = `500 64px ${font}`;
  g.fillText('NOIR CAFÉ', 256, 110);
  const rows: [string, string][] = [['Menu', 'EN · USD'], ['メニュー', 'JA · JPY'], ['Carte', 'FR · EUR'], ['Menù', 'IT · GBP']];
  rows.forEach(([w, code], i) => {
    const y = 220 + i * 110;
    g.fillStyle = '#f3e9dc';
    g.font = `500 54px ${font}, 'Yu Mincho', serif`;
    g.fillText(w, 256, y);
    g.fillStyle = '#c98a4b';
    g.font = `500 24px ui-monospace, monospace`;
    g.fillText(code, 256, y + 38);
  });
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** the rosetta on the signature cup, poured as the 2D world pours it */
function rosetta() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d')!;
  const crema = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  crema.addColorStop(0, '#c58a52');
  crema.addColorStop(0.8, '#8a5631');
  crema.addColorStop(1, '#5b3720');
  g.fillStyle = crema;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#f6eadb';
  // stacked leaves narrowing toward the tip, cut through by the pull line
  for (let i = 0; i < 7; i++) {
    const y = 200 - i * 22, w = 78 - i * 8;
    g.beginPath();
    g.ellipse(128, y, w, 12 + (6 - i) * 0.6, 0, Math.PI, Math.PI * 2);
    g.ellipse(128, y + 2, w * 0.9, 9, 0, 0, Math.PI);
    g.fill();
  }
  g.beginPath();
  g.arc(128, 42, 16, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#8a5631';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(128, 26);
  g.lineTo(128, 224);
  g.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}


export function noirWorld(c: Common, pad: Pad, base = '/'): ProjectWorld {
  const group = new THREE.Group();
  group.name = 'noir-cafe';
  group.position.copy(pad.p);
  group.rotation.y = Math.atan2(pad.face.x, pad.face.z);
  const b = new Builder();
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // ---- plinth: a stone terrace levels the ground for the café, stepping down at the front
  b.box(V(0, -1.4, 0), [21, 2.8, 14], 0, { col: STONE_DARK });
  b.box(V(0, -0.05, 0), [20.4, 0.1, 13.4], 0, { col: STONE });
  b.box(V(0, -0.35, 7.3), [6, 0.3, 1.2], 0, { col: STONE });
  b.box(V(0, -0.7, 8.2), [6, 0.3, 1.2], 0, { col: STONE_DARK });

  // ---- the hall: charcoal timber, a full-height glazed front, a copper fascia
  const H = 5.2;
  b.box(V(0, H / 2, -6.2), [10.4, H, 0.4], 0, { col: CHARCOAL });
  for (const x of [-5.1, 5.1]) b.box(V(x, H / 2, -3.6), [0.4, H, 5.6], 0, { col: CHARCOAL });
  b.box(V(0, H + 0.2, -3.5), [11.2, 0.4, 6.6], 0, { col: ESPRESSO });
  b.box(V(0, H - 0.2, -0.62), [11.2, 1.1, 0.16], 0, { col: ESPRESSO });
  b.box(V(0, H - 0.8, -0.55), [11.2, 0.08, 0.2], 0, { col: COPPER, glow: 0.35, ch: CH.b });
  // glazing: warm light from inside once the café opens (channel a)
  for (let i = 0; i < 5; i++) {
    const x = -4 + i * 2;
    if (i === 2) continue;
    b.box(V(x, 2.15, -0.85), [1.8, 4.1, 0.08], 0, { col: GLASS, glow: 0.8, ch: CH.a });
  }
  // the room seen through the glass: a long espresso bar in silhouette, pendants burning above it
  b.box(V(0, 0.6, -0.8), [9.8, 1.2, 0.04], 0, { col: ESPRESSO });
  b.box(V(0, 1.24, -0.79), [9.8, 0.08, 0.05], 0, { col: OAK });
  for (let i = 0; i < 7; i++) {
    const x = -4.2 + i * 1.4;
    if (Math.abs(x) < 0.9) continue;
    b.box(V(x, 3.55, -0.8), [0.03, 0.8, 0.03], 0, { col: ESPRESSO });
    b.sphere(V(x, 3.1, -0.78), 0.17, { col: hex('#ffd9a0'), glow: 1, ch: CH.c }, 8);
  }
  // the door, recessed, its frame in copper
  b.box(V(0, 1.55, -1.0), [1.6, 3.1, 0.08], 0, { col: GLASS, glow: 0.7, ch: CH.a });
  b.box(V(0, 3.2, -0.82), [1.9, 0.14, 0.14], 0, { col: COPPER });
  for (let i = 0; i <= 5; i++) b.box(V(-5 + i * 2, 2.15, -0.75), [0.16, 4.3, 0.18], 0, { col: ESPRESSO });
  b.box(V(0, 0.08, -0.75), [10.2, 0.16, 0.22], 0, { col: ESPRESSO });
  b.box(V(0, 4.25, -0.75), [10.2, 0.14, 0.22], 0, { col: ESPRESSO });

  // ---- the tower: a cream volume carrying the ring emblem, the café's mark seen from afar
  b.box(V(-6.6, 3.9, -3.8), [2.6, 7.8, 2.6], 0, { col: CREAM });
  b.box(V(-6.6, 7.95, -3.8), [2.9, 0.3, 2.9], 0, { col: ESPRESSO });
  b.add(new THREE.TorusGeometry(0.78, 0.09, 8, 36), new THREE.Matrix4().makeTranslation(-6.6, 6.2, -2.44), { col: COPPER, glow: 0.8, ch: CH.b });
  for (const y of [1.6, 3.6]) b.box(V(-6.6, y, -2.48), [0.36, 1.5, 0.06], 0, { col: GLASS, glow: 0.8, ch: CH.a });

  // ---- awning over the terrace, copper, on two slim posts
  b.box(V(0, 4.05, 0.3), [11.2, 0.1, 2.3], 0, { col: CHARCOAL }, 0.25);
  b.box(V(0, 3.62, 1.42), [11.2, 0.34, 0.06], 0, { col: COPPER });
  for (const x of [-5.2, 5.2]) b.box(V(x, 1.8, 1.4), [0.12, 3.6, 0.12], 0, { col: ESPRESSO });

  // ---- terrace: oak tables, cream chairs, a cup on each table
  const cups: THREE.Vector3[] = [];
  const tables: [number, number][] = [[-3.4, 1.4], [0, 1.6], [3.4, 1.4], [-1.8, 3.6], [1.8, 3.6]];
  for (const [x, z] of tables) {
    b.cyl(V(x, 0, z), 0.08, 0.3, 0.72, 8, { col: ESPRESSO });
    b.cyl(V(x, 0.72, z), 0.62, 0.62, 0.06, 18, { col: OAK });
    for (const s of [-1, 1]) {
      const cx = x + s * 1.0;
      b.box(V(cx, 0.45, z), [0.5, 0.06, 0.5], 0, { col: CREAM });
      b.box(V(cx + s * 0.24, 0.8, z), [0.06, 0.7, 0.5], 0, { col: CREAM });
      for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) b.box(V(cx + lx, 0.22, z + lz), [0.04, 0.44, 0.04], 0, { col: ESPRESSO });
    }
    b.lathe(V(x + 0.15, 0.78, z), [[0, 0], [0.14, 0], [0.16, 0.16], [0.12, 0.16], [0, 0.12]], 10, { col: CERAMIC });
    cups.push(V(x + 0.15, 1.0, z));
  }

  // ---- lamps along the steps and the terrace edge (channel c): the first lights to come on
  for (const [x, z] of [[-3.6, 6.4], [3.6, 6.4], [-8.6, 5.6], [8.6, 5.6], [-8.6, -2], [8.6, 0.5]]) {
    b.cyl(V(x, 0, z), 0.06, 0.08, 2.5, 6, { col: ESPRESSO });
    b.sphere(V(x, 2.65, z), 0.24, { col: hex('#ffd9a0'), glow: 1, ch: CH.c }, 10);
  }

  // ---- ordering display: a slim copper-framed screen on a stand, angled toward the visitor
  const kiosk = { x: 7.4, z: 1.2, yaw: -0.42 };
  const kq = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), kiosk.yaw);
  const kp = (lx: number, ly: number, lz: number) => V(lx, ly, lz).applyQuaternion(kq).add(V(kiosk.x, 0, kiosk.z));
  b.box(kp(0, 0.9, -0.05), [0.18, 1.8, 0.18], kiosk.yaw, { col: COPPER });
  b.box(kp(0, 0.06, 0), [1.4, 0.12, 0.9], kiosk.yaw, { col: ESPRESSO });
  b.box(kp(0, 3.05, -0.08), [4.3, 2.75, 0.14], kiosk.yaw, { col: ESPRESSO });
  b.box(kp(0, 4.47, -0.08), [4.3, 0.06, 0.18], kiosk.yaw, { col: COPPER, glow: 0.5, ch: CH.d });

  // ---- menu board, an A-frame at the top of the steps
  const boardAt = V(-2.4, 0, 5.6);
  b.box(boardAt.clone().add(V(0, 0.75, -0.3)), [1.05, 1.5, 0.06], 0, { col: OAK }, 0.22);

  // ---- the signature: a latte cup on its saucer, as big as a pavilion, steaming
  const cupAt = V(-8.4, 0, 2.2);
  b.cyl(cupAt, 1.9, 2.1, 0.5, 28, { col: ESPRESSO });
  b.lathe(cupAt.clone().add(V(0, 0.5, 0)), [[0, 0], [2.6, 0.02], [2.7, 0.18], [2.4, 0.22], [1.3, 0.16], [0, 0.18]], 36, { col: CERAMIC });
  b.lathe(cupAt.clone().add(V(0, 0.68, 0)), [[0, 0], [1.0, 0], [1.55, 0.6], [1.85, 1.7], [1.92, 2.1], [1.78, 2.1], [1.66, 1.8], [0, 1.72]], 36, { col: CERAMIC });
  // handle: a short ring of boxes
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI;
    b.box(cupAt.clone().add(V(1.95 + Math.cos(a) * 0.55, 1.75 + Math.sin(a) * 0.55, 0)), [0.22, 0.26, 0.26], 0, { col: CERAMIC }, 0, a);
  }

  const mat = archMaterial(c);
  const arch = new THREE.Mesh(b.build(), mat);
  group.add(arch);

  // ---- cards: the wordmark on the fascia, the board, the crema
  const font = "'Noir Cormorant', 'Cormorant Garamond', Georgia, serif";
  const signMat = cardMaterial(c, wordmark('Georgia, serif'));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.0), signMat);
  sign.position.set(0, H - 0.2, -0.53);
  group.add(sign);
  const boardMat = cardMaterial(c, menuBoard('Georgia, serif'), new THREE.Vector3(1.25, 1.2, 1.1));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.19), boardMat);
  board.position.copy(boardAt).add(V(0, 0.78, -0.26));
  board.rotation.x = -0.22;
  group.add(board);
  const crema = new THREE.Mesh(new THREE.CircleGeometry(1.72, 36), cardMaterial(c, rosetta(), new THREE.Vector3(1, 1, 1)));
  crema.rotation.x = -Math.PI / 2;
  crema.position.copy(cupAt).add(V(0, 2.5, 0));
  (crema.material as THREE.ShaderMaterial).uniforms.uOn.value = 1;
  (crema.material as THREE.ShaderMaterial).uniforms.uReveal.value = 1;
  group.add(crema);

  // the brand face, when it arrives, redraws the wordmark and board in Cormorant
  if (typeof FontFace !== 'undefined') {
    const ff = new FontFace('Noir Cormorant', `url(${base}world/noir/cormorant.woff2)`, { weight: '400 500' });
    ff.load()
      .then((f) => {
        document.fonts.add(f);
        signMat.uniforms.uMap.value = uploadTexture(wordmark(font));
        boardMat.uniforms.uMap.value = uploadTexture(menuBoard(font));
      })
      .catch(() => {});
  }

  // ---- the ordering display shows the real site: menu, reservation, shop
  const scr = screenMaterial(c);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.5), scr);
  screen.position.copy(kp(0, 3.05, 0.0));
  screen.rotation.y = kiosk.yaw;
  group.add(screen);
  scr.uniforms.uCrop.value.set(1, 1);
  const pages: THREE.Texture[] = [];
  for (const n of ['menu', 'reservation', 'shop']) pages.push(texture(`${base}world/noir/${n}.webp`));
  scr.uniforms.uA.value = pages[0];
  scr.uniforms.uB.value = pages[1];

  // ---- steam: over every cup on the terrace, and a tall plume from the signature cup
  const smallSteam = steam(c, cups, 1.1, 0.5);
  const bigSteam = steam(c, [0, 1, 2].map((i) => cupAt.clone().add(V(-0.5 + i * 0.5, 2.6, (i - 1) * 0.3))), 6.5, 2.4);
  group.add(smallSteam, bigSteam);

  // ---- the detail shot: in front and a little to the right, the café filling the right of the frame
  group.updateMatrixWorld(true);
  const detail = {
    cam: V(9, 9.5, 30).applyMatrix4(group.matrixWorld),
    look: V(-2.5, 2.4, -0.5).applyMatrix4(group.matrixWorld),
    centre: V(0.6, 2.4, -0.8).applyMatrix4(group.matrixWorld),
  };

  return {
    group,
    detail,
    triangles: b.triangles + 4 * 2 + cups.length * 2 + 6,
    update(t, a) {
      // the choreography, in the order the brief asks for: the place first, then its life, then the product
      const kb = beats(a);
      const lamps = kb.lamps, windows = kb.windows, accents = kb.accents, signOn = kb.sign, screenOn = kb.screen, steamOn = ease(a, 0.32, 0.5);
      mat.uniforms.uOn.value.set(windows, accents, lamps, screenOn);
      signMat.uniforms.uOn.value = signOn > 0 ? 1 : 0;
      signMat.uniforms.uReveal.value = signOn;
      boardMat.uniforms.uOn.value = 1;
      boardMat.uniforms.uReveal.value = accents;
      scr.uniforms.uOn.value = screenOn;
      (smallSteam.material as THREE.ShaderMaterial).uniforms.uOn.value = steamOn;
      (bigSteam.material as THREE.ShaderMaterial).uniforms.uOn.value = 0.6 + 0.4 * steamOn;
      // once on, the display walks through the site: each page holds, scrolls a little, then hands over
      const period = 6, k = t / period, i = Math.floor(k), f = k - i;
      scr.uniforms.uA.value = pages[i % pages.length];
      scr.uniforms.uB.value = pages[(i + 1) % pages.length];
      scr.uniforms.uMix.value = ease(f, 0.82, 1);
      scr.uniforms.uScroll.value = 0;
    },
  };
}

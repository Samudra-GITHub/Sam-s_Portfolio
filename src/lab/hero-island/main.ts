import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildEnvironment } from '../../components/world/veil/environment';
import { createPainter } from '../../components/world/veil/paint';

/**
 * Hero island lab page (not part of the site build): the environment alone,
 * from fixed cinematic shots. ?shot=0..3, or ?cam=x,y,z&look=x,y,z&fov=n.
 * ?q=low phone budget, ?rock=field unsculpted rock, ?paint=0 no brushwork.
 */
const qs = new URLSearchParams(location.search);
const LOW = qs.get('q') === 'low';
const status = document.getElementById('status')!;
const say = (s: string) => { status.textContent = s; };


const SHOTS: { cam: [number, number, number]; look: [number, number, number]; fov: number }[] = [
  { cam: [118, 6, 104], look: [-4, -10, 0], fov: 34 }, // establishing, three-quarter, rim light
  { cam: [74, -60, 84], look: [0, -24, 0], fov: 44 }, // the underside: lobes, roots, falls
  { cam: [-30, 22, 34], look: [20, 10, -12], fov: 50 }, // across the canopy to the crags
  { cam: [150, 26, 215], look: [-40, -8, -60], fov: 36 }, // the archipelago, the hero in scale
];


async function main() {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.25 : 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.info.autoReset = false;
  document.body.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.5, 3000);
  const env = await buildEnvironment(renderer, { low: LOW, rock: qs.get('rock') === 'field' ? 'field' : 'baked', onStatus: say });
  const composer = createPainter(renderer, env.scene, camera, { paint: !LOW && qs.get('paint') !== '0', low: LOW });

  // ---------------- camera ----------------
  const shot = SHOTS[Math.min(SHOTS.length - 1, +(qs.get('shot') ?? 0))];
  const vec = (s: string | null, d: [number, number, number]) => (s ? (s.split(',').map(Number) as [number, number, number]) : d);
  camera.position.set(...vec(qs.get('cam'), shot.cam));
  camera.fov = +(qs.get('fov') ?? shot.fov);
  camera.updateProjectionMatrix();
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...vec(qs.get('look'), shot.look));
  controls.enableDamping = true;
  controls.update();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  // ?prof: GPU cost of each scene layer. Times synced frames (a 1px readPixels waits for the GPU)
  // with everything on, then with one layer hidden at a time; the difference is that layer's cost.
  if (qs.has('prof')) {
    env.update(camera, 12);
    const gl = renderer.getContext();
    const px = new Uint8Array(4);
    const time = (n = 8) => {
      composer.render();
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const t = performance.now();
      for (let i = 0; i < n; i++) {
        composer.render();
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      }
      return (performance.now() - t) / n;
    };
    const kids = env.scene.children;
    const only = (pick: (i: number) => boolean) => kids.forEach((o, i) => (o.visible = pick(i)));
    // layer groups by build order (see environment.ts)
    const n = kids.length;
    const groups: [string, (i: number) => boolean][] = [
      ['hero rock', (i) => i === 0],
      ['water: rivers, falls (15)', (i) => i >= 1 && i <= 15],
      ['hero foliage (leaf cards)', (i) => i >= 16 && i <= 18],
      ['trunks, vines, roots, moss, crystals', (i) => i >= 19 && i <= 24],
      ['far formations (9)', (i) => kids[i].type === 'LOD'],
      ['cloud puffs', (i) => i === n - 4],
      ['cloud floor', (i) => i === n - 3],
      ['sky dome', (i) => i === n - 2],
      ['spores', (i) => i === n - 1],
    ];
    only(() => true);
    const full = time(12);
    only(() => false);
    const empty = time(12);
    const rows: [string, number][] = [['FULL FRAME', full], ['post only (empty scene)', empty]];
    for (const [name, pick] of groups) {
      only(pick);
      rows.push([name, time(12) - empty]);
    }
    only(() => true);
    const tris = (o: THREE.Object3D) => {
      let t = 0;
      o.traverse((m) => {
        const g = (m as THREE.Mesh).geometry;
        if (!g || !(m as THREE.Mesh).isMesh) return;
        const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
        t += n * ((m as THREE.InstancedMesh).count ?? 1);
      });
      return t;
    };
    for (const [name, pick] of groups) rows.push([`  tris: ${name} ${Math.round(kids.filter((_, i) => pick(i)).reduce((a, o) => a + tris(o), 0) / 1000)}k`, 0]);
    const out = rows.map(([k, v]) => `${v.toFixed(1).padStart(7)} ms  ${k}`).join('\n');
    console.info(out);
    (window as unknown as { __prof: string }).__prof = out;
    document.body.dataset.ready = '1';
    return;
  }

  const clock = new THREE.Clock();
  let frames = 0;
  const tick = () => {
    controls.update();
    env.update(camera, 12 + clock.getElapsedTime());
    renderer.info.reset();
    composer.render();
    if (++frames === 3) {
      say('');
      document.body.dataset.ready = '1';
      const info = renderer.info.render;
      console.info(`hero island: ${info.triangles} tris, ${info.calls} calls`);
    }
    requestAnimationFrame(tick);
  };
  tick();
}

main().catch((e) => {
  say(String(e));
  console.error(e);
});

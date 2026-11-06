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

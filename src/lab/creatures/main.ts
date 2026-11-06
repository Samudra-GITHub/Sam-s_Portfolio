import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildEnvironment } from '../../components/world/veil/environment';
import { createPainter } from '../../components/world/veil/paint';
import { taperTube } from '../../components/world/veil/flora';
import { barkMaterial } from '../../components/world/veil/shaders';
import { SPECIES } from '../../components/world/veil/fauna';

/**
 * Creature concept sheet (not part of the site build). One species at a time,
 * in the real environment light: ?c=0..4 species, ?v=0..2 view
 * (side, three-quarter, high front). Orbit with the mouse.
 */
const qs = new URLSearchParams(location.search);
const status = document.getElementById('status')!;
const say = (s: string) => { status.textContent = s; };

const VIEWS = [
  { az: 0, el: 6 },
  { az: 52, el: 16 },
  { az: -38, el: 40 },
];
// high in open sky on the sunward side of the archipelago: the sun sits over the camera's shoulder
const STAGE = new THREE.Vector3(-210, 80, 430);

async function main() {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.NoToneMapping;
  document.body.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.02, 3000);
  const env = await buildEnvironment(renderer, { onStatus: say });
  const c = env.common;
  say('Sculpting the creature…');
  await new Promise((r) => setTimeout(r, 0));

  const ci = Math.min(SPECIES.length - 1, +(qs.get('c') ?? 0));
  const t0 = performance.now();
  const sp = SPECIES[ci](c);
  const buildMs = performance.now() - t0;
  // one rig at the stage, turned so the creature's side (+z) faces the sun; extras are placed in its frame
  const sun = c.uSun.value;
  const theta = Math.atan2(sun.x, sun.z);
  const rig = new THREE.Group();
  rig.position.copy(STAGE);
  rig.rotation.y = theta;
  rig.add(sp.group);
  env.scene.add(rig);

  // a little context per species
  const r = (() => { let s = 9; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  if (sp.id === 'spinlet') {
    for (let i = 0; i < 14; i++) {
      const k = sp.group.clone();
      k.position.set(-1 - r() * 4, (r() - 0.3) * 1.6, -0.5 - r() * 3);
      k.rotation.set((r() - 0.5) * 0.5, (r() - 0.5) * 1.2, (r() - 0.5) * 0.6);
      rig.add(k);
    }
  }
  if (sp.id === 'moth') {
    for (let i = 0; i < 6; i++) {
      const k = sp.group.clone();
      k.position.set(-0.4 - r() * 1.2, (r() - 0.5) * 0.6, -0.2 - r() * 1.2);
      k.rotation.set(0, (r() - 0.5) * 2.4, (r() - 0.5) * 0.4);
      rig.add(k);
    }
  }
  if (sp.id === 'shingleback') {
    // the bough it walks along
    const b = taperTube([new THREE.Vector3(-2.6, -0.84, 0), new THREE.Vector3(0, -0.9, 0.05), new THREE.Vector3(2.4, -0.8, -0.05)], 0.16, 0.11, 12, 8);
    rig.add(new THREE.Mesh(b, barkMaterial(c)));
  }
  rig.updateMatrixWorld(true);

  // frame the species' own bounds from the chosen view
  const box = new THREE.Box3().setFromObject(sp.group);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const v = VIEWS[Math.min(VIEWS.length - 1, +(qs.get('v') ?? 1))];
  const az = THREE.MathUtils.degToRad(v.az), el = THREE.MathUtils.degToRad(v.el);
  const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.08;
  camera.position.copy(sphere.center).add(new THREE.Vector3(Math.sin(theta + az) * Math.cos(el), Math.sin(el), Math.cos(theta + az) * Math.cos(el)).multiplyScalar(dist));
  camera.near = dist * 0.02;
  camera.updateProjectionMatrix();
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(sphere.center);
  controls.update();

  const composer = createPainter(renderer, env.scene, camera, { paint: qs.get('paint') !== '0', low: false });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  let tris = 0;
  sp.group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.geometry.index) tris += (m.geometry.index.count / 3) * ((m as unknown as THREE.InstancedMesh).count ?? 1);
  });
  say(`${sp.name}  ·  ${sp.kind}\n${sp.size} (a hero tree is 10 to 15)\n${Math.round(tris / 1000)}k triangles, built in ${buildMs.toFixed(0)} ms`);

  const t = qs.has('t') ? +qs.get('t')! : null;
  let frames = 0;
  const loop = (now: number) => {
    controls.update();
    env.update(camera, t ?? now / 1000);
    composer.render();
    if (++frames === 20) document.body.dataset.ready = 'true';
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

main().catch((e) => {
  say(String(e?.stack ?? e));
  throw e;
});

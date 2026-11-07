import * as THREE from 'three';

/**
 * The studio's one 3D object: a liquid-chrome band, a wave closed on itself with three half-twists
 * (Samudra: the ocean). The surface is computed in the vertex shader from (u, v): u runs around the band,
 * v around its elliptical cross-section, so swell and pointer ripples bend the true surface and its
 * normals, and the reflections move like liquid metal.
 *
 * It renders into one fixed, transparent canvas and is placed over DOM "slots" ([data-sculpt]): it sits in
 * the word space of the name, and the scroll carries it to the introduction. The loop runs only while a
 * slot is on screen and the tab is visible.
 */

export interface SculptureOptions {
  reduced: boolean;
  compact: boolean;
}

const SURFACE = /* glsl */ `
uniform float uTime; uniform vec3 uPoke; uniform float uPokeAmt; uniform float uSwell;
const float TAU = 6.28318530718;
vec3 band(float u, float v){
  float th = u * TAU, ph = v * TAU;
  // the spine: a circle that rises and dips twice and breathes in and out three times
  float R = 1.0 + 0.07 * sin(3.0 * th + uTime * 0.35);
  vec3 C = vec3(cos(th) * R, 0.2 * sin(2.0 * th), sin(th) * R);
  // the cross-section: a flat ellipse, turned three half-turns over the loop; a swell runs around it
  float swell = sin(5.0 * th - uTime * 0.9) * 0.5 + 0.5;
  float a = 0.36 + 0.07 * swell * uSwell;
  float b = 0.075 + 0.035 * sin(2.0 * th + uTime * 0.6);
  // the pointer: a ripple where it presses, travelling outward along the band
  float d = atan(sin(th - uPoke.x), cos(th - uPoke.x));
  float near = exp(-d * d * 6.0) * uPokeAmt;
  a += near * 0.05 * sin(14.0 * d - uTime * 5.0);
  b += near * 0.035;
  float al = 1.5 * th + 0.35 * sin(th + uTime * 0.25);
  vec3 N0 = vec3(cos(th), 0.0, sin(th)), B0 = vec3(0.0, 1.0, 0.0);
  vec3 Nr = cos(al) * N0 + sin(al) * B0, Br = -sin(al) * N0 + cos(al) * B0;
  return C + Nr * cos(ph) * a + Br * sin(ph) * b;
}
`;

/** a studio of soft boxes in the palette's colours: the chrome only ever reflects this */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d9d7d1');
  const box = (w: number, h: number, color: string, intensity: number, pos: [number, number, number], look: [number, number, number] = [0, 0, 0]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(...look);
    scene.add(m);
  };
  // the room: warm ivory floor, darker graphite walls so the edges read
  const room = new THREE.Mesh(new THREE.BoxGeometry(30, 18, 30), new THREE.MeshBasicMaterial({ color: '#6c6e74', side: THREE.BackSide }));
  scene.add(room);
  box(30, 30, '#efe9dd', 1.0, [0, -8.9, 0], [0, 0, 0]);
  box(14, 4, '#ffffff', 3.2, [0, 8.5, 0], [0, 0, 0]); // the key softbox overhead
  box(6, 10, '#8275ff', 2.4, [-11, 1, 3]); // violet from the left
  box(6, 10, '#536bfa', 2.0, [11, 0, -4]); // cobalt from the right
  box(10, 3, '#ffffff', 1.6, [0, 2, 12]); // a strip behind the viewer: the bright rim along the front edge
  box(4, 8, '#17191d', 1.0, [0, -2, -12]); // a dark flag: one deep reflection for contrast
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(scene, 0.035).texture;
  pm.dispose();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  });
  return env;
}

export function createSculpture(canvas: HTMLCanvasElement, opts: SculptureOptions) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const dprCap = opts.compact ? 1.5 : 2;

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const uniforms = {
    uTime: { value: 0 },
    uPoke: { value: new THREE.Vector3() },
    uPokeAmt: { value: 0 },
    uSwell: { value: 1 },
  };
  const geo = new THREE.PlaneGeometry(1, 1, opts.compact ? 260 : 420, opts.compact ? 28 : 40);
  geo.translate(0.5, 0.5, 0); // uv = position.xy in [0,1]
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#eceef3',
    metalness: 1,
    roughness: 0.13,
    iridescence: 0.7,
    iridescenceIOR: 1.38,
    iridescenceThicknessRange: [220, 560],
    envMapIntensity: 1.15,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${SURFACE}`)
      .replace(
        '#include <beginnormal_vertex>',
        `float su = uv.x, sv = uv.y, e = 0.0015;
        vec3 sP = band(su, sv);
        vec3 sdu = band(su + e, sv) - band(su - e, sv);
        vec3 sdv = band(su, sv + e) - band(su, sv - e);
        vec3 objectNormal = normalize(cross(sdu, sdv));
        #ifdef USE_TANGENT
        vec3 objectTangent = vec3(1.0, 0.0, 0.0);
        #endif`,
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = sP;');
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  const pivot = new THREE.Group();
  pivot.add(mesh);
  scene.add(pivot);

  // ---------------- state ----------------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: 0 };
  let width = 1, height = 1;
  let visible = true;
  let last = performance.now();
  const start = last;
  let tiltX = 0, tiltY = 0, poke = 0;
  const box = { cx: 0, cy: 0, h: 1 };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();

  const onPointer = (e: PointerEvent) => {
    pointer.tx = (e.clientX / width) * 2 - 1;
    pointer.ty = (e.clientY / height) * 2 - 1;
    // how close to the object the pointer is, and where around the band it presses
    const dx = e.clientX - box.cx, dy = e.clientY - box.cy;
    const dist = Math.hypot(dx, dy) / Math.max(1, box.h);
    pointer.inside = Math.max(0, 1 - Math.max(0, dist - 0.35) / 0.9);
    // screen angle around the object's centre, turned into the band's own angle (its spin included)
    uniforms.uPoke.value.x = Math.atan2(dy, dx) + mesh.rotation.y;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', resize);

  /** the sculpture's place on screen this frame: a centre and a height in CSS pixels */
  const place = (cx: number, cy: number, h: number, journey: number) => {
    box.cx = cx;
    box.cy = cy;
    box.h = h;
    const H = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    pivot.position.set((cx / width - 0.5) * H * camera.aspect, -(cy / height - 0.5) * H, 0);
    // the band is about 2.9 units across and 1.1 tall when seen from the front: fit its height to the slot
    pivot.scale.setScalar(((h / height) * H) / 1.05);
    pivot.userData.journey = journey;
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = opts.reduced ? 6 : (now - start) / 1000;
    uniforms.uTime.value = t;
    const k = 1 - Math.exp(-dt * 4);
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;
    tiltX += (pointer.y * 0.28 - tiltX) * k;
    tiltY += (pointer.x * 0.45 - tiltY) * k;
    poke += ((opts.reduced ? 0 : pointer.inside) - poke) * (1 - Math.exp(-dt * 3));
    uniforms.uPokeAmt.value = poke;
    const journey = (pivot.userData.journey as number) ?? 0;
    // a three-quarter view that reads the twists, turning slowly; the scroll journey turns it further
    mesh.rotation.y = (opts.reduced ? 0.6 : t * 0.12) + journey * Math.PI * 0.9;
    pivot.rotation.set(0.42 + tiltX - journey * 0.25, tiltY, -0.12 + journey * 0.3);
    renderer.render(scene, camera);
  };

  return {
    place,
    /** call from the page's ticker; renders only while shown */
    tick(now: number) {
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      frame(now);
    },
    setVisible(v: boolean) {
      if (v === visible) return;
      visible = v;
      canvas.style.visibility = v ? 'visible' : 'hidden';
      if (!v) renderer.clear();
    },
    dispose() {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', resize);
      geo.dispose();
      mat.dispose();
      scene.environment?.dispose();
      renderer.dispose();
    },
  };
}

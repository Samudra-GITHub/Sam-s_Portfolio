import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PLACES } from './places';
import { measure, worldProgress } from './progress';
import { featured } from '../../data/projects';
import { follow } from '../../lib/motion';
import { matches, MQ } from '../../lib/runtime';

/**
 * The world: six floating islands of matte clay, one per section of the
 * homepage. It is a presentation layer only. It never takes input away from
 * the page: the canvas ignores the pointer except for a gentle parallax, and
 * everything it shows also exists as HTML.
 */

const CLAY = '#f3eee6';
const CLAY_TOP = '#fdfbf7';
const CLAY_UNDER = '#ddd4c6';
const ACCENTS = ['#f49a7b', '#b9a9f4', '#9fd9e8', '#536bfa', '#d5e978'];

const pointer = { x: 0, y: 0 };

function clay(color: string, roughness = 0.88) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0} />;
}

/** A floating island: a soft top slab over a tapering rock. */
function Rock({ r = 3, h = 0.9 }: { r?: number; h?: number }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[r, r * 0.98, 0.12, 48]} />
        {clay(CLAY_TOP)}
      </mesh>
      <mesh position={[0, -h / 2, 0]}>
        <cylinderGeometry args={[r * 0.98, r * 0.78, h, 48]} />
        {clay(CLAY)}
      </mesh>
      <mesh position={[0, -h - r * 0.45, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[r * 0.78, r * 0.9, 40]} />
        {clay(CLAY_UNDER)}
      </mesh>
    </group>
  );
}

/** Landing island: the signature sculpture, an arch holding an orb, that turns toward the pointer. */
function Landing({ accent }: { accent: string }) {
  const sculpt = useRef<THREE.Group>(null);
  const orb = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    const g = sculpt.current;
    if (!g) return;
    g.rotation.y = follow(g.rotation.y, pointer.x * 0.5 + Math.sin(state.clock.elapsedTime * 0.25) * 0.15, dt, 0.5);
    g.rotation.x = follow(g.rotation.x, -pointer.y * 0.12, dt, 0.5);
    if (orb.current) orb.current.position.y = 2.15 + Math.sin(state.clock.elapsedTime * 1.1) * 0.12;
  });
  return (
    <group>
      <Rock r={3.4} h={1.1} />
      {/* stepped plinth */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.6, 1.7, 0.36, 48]} />
        {clay(CLAY_TOP)}
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[1.15, 1.2, 0.28, 48]} />
        {clay(CLAY)}
      </mesh>
      <group ref={sculpt} position={[0, 0.76, 0]}>
        <mesh position={[0, 1.35, 0]}>
          <torusGeometry args={[1.25, 0.2, 24, 64, Math.PI]} />
          {clay('#ffffff', 0.7)}
        </mesh>
        <mesh position={[-1.25, 0.68, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 1.36, 24]} />
          {clay('#ffffff', 0.7)}
        </mesh>
        <mesh position={[1.25, 0.68, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 1.36, 24]} />
          {clay('#ffffff', 0.7)}
        </mesh>
        <mesh ref={orb} position={[0, 2.15, 0]}>
          <sphereGeometry args={[0.55, 48, 48]} />
          <meshPhysicalMaterial color={accent} roughness={0.15} metalness={0.05} clearcoat={1} clearcoatRoughness={0.1} />
        </mesh>
        <mesh position={[0, 0.5, 0.05]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.55, 0.55, 0.55]} />
          {clay('#f49a7b')}
        </mesh>
      </group>
      {/* a small companion stone */}
      <mesh position={[2.3, 0.35, 1]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        {clay('#b9a9f4')}
      </mesh>
    </group>
  );
}

/** Project district: one small display per featured project, on plinths in an arc. */
function District() {
  const n = featured.length;
  return (
    <group>
      <Rock r={4} h={1} />
      {Array.from({ length: n }, (_, i) => {
        const a = -Math.PI * 0.85 + (i / Math.max(1, n - 1)) * Math.PI * 1.7;
        const x = Math.cos(a) * 2.7;
        const z = Math.sin(a) * 2.2;
        const h = 0.35 + (i % 3) * 0.22;
        const c = ACCENTS[i % ACCENTS.length];
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, h / 2 + 0.1, 0]}>
              <boxGeometry args={[0.7, h, 0.7]} />
              {clay(CLAY_TOP)}
            </mesh>
            <mesh position={[0, h + 0.42, 0]} rotation={[0, a, 0]}>
              {i % 3 === 0 ? <sphereGeometry args={[0.3, 32, 32]} /> : i % 3 === 1 ? <boxGeometry args={[0.46, 0.46, 0.46]} /> : <cylinderGeometry args={[0.24, 0.24, 0.55, 32]} />}
              {clay(c, 0.6)}
            </mesh>
          </group>
        );
      })}
      {/* a pavilion at the centre */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 1.6, 6]} />
        {clay('#ffffff', 0.75)}
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <coneGeometry args={[1.15, 0.6, 6]} />
        {clay('#f49a7b')}
      </mesh>
    </group>
  );
}

/** The garden: small round trees and pebbles, less formal than the district. */
function Garden() {
  const trees = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const a = i * 2.39996;
        const d = 0.6 + Math.sqrt(i / 11) * 2.4;
        return { x: Math.cos(a) * d, z: Math.sin(a) * d, s: 0.25 + ((i * 37) % 10) / 30, c: ['#9fd9e8', '#d5e978', '#b9a9f4'][i % 3], stem: 0.4 + ((i * 13) % 7) / 10 };
      }),
    [],
  );
  return (
    <group>
      <Rock r={3.3} h={0.9} />
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.stem / 2 + 0.1, 0]}>
            <cylinderGeometry args={[0.04, 0.05, t.stem, 8]} />
            {clay('#cfc6b8')}
          </mesh>
          <mesh position={[0, t.stem + 0.1 + t.s * 0.6, 0]}>
            {i % 4 === 3 ? <coneGeometry args={[t.s, t.s * 2, 24]} /> : <sphereGeometry args={[t.s, 32, 32]} />}
            {clay(t.c, 0.7)}
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The observatory: a tower, a dome and a telescope pointed up. */
function Observatory() {
  return (
    <group>
      <Rock r={3} h={1} />
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1, 1.1, 1.7, 40]} />
        {clay('#ffffff', 0.75)}
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[1.02, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {clay('#b9a9f4', 0.55)}
      </mesh>
      <mesh position={[0.45, 2.35, 0.2]} rotation={[0.2, 0, -0.75]}>
        <cylinderGeometry args={[0.13, 0.18, 1.5, 24]} />
        <meshStandardMaterial color="#c9ccd6" roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh position={[-1.9, 0.3, 1]}>
        <boxGeometry args={[0.9, 0.4, 0.9]} />
        {clay(CLAY_TOP)}
      </mesh>
    </group>
  );
}

/** The workshop: shelves of blocks, one shelf per group of tools. */
function Workshop() {
  return (
    <group>
      <Rock r={3.2} h={0.9} />
      {[0, 1, 2].map((row) => (
        <group key={row} position={[0, 0, -0.9 + row * 0.9]}>
          <mesh position={[0, 0.5 + row * 0.28, 0]}>
            <boxGeometry args={[3, 0.1, 0.5]} />
            <meshStandardMaterial color="#c9ccd6" roughness={0.4} metalness={0.5} />
          </mesh>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} position={[-1.2 + i * 0.6, 0.75 + row * 0.28, 0]}>
              <boxGeometry args={[0.36, 0.36 + ((i + row) % 3) * 0.12, 0.36]} />
              {clay(ACCENTS[(i + row * 2) % ACCENTS.length], 0.65)}
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** The gate: an arch with a soft glowing pane, the way out. */
function Gate({ accent }: { accent: string }) {
  return (
    <group>
      <Rock r={3} h={1} />
      <group position={[0, 0.1, 0]}>
        <mesh position={[-1.2, 1.2, 0]}>
          <boxGeometry args={[0.45, 2.4, 0.45]} />
          {clay('#ffffff', 0.75)}
        </mesh>
        <mesh position={[1.2, 1.2, 0]}>
          <boxGeometry args={[0.45, 2.4, 0.45]} />
          {clay('#ffffff', 0.75)}
        </mesh>
        <mesh position={[0, 2.4, 0]}>
          <torusGeometry args={[1.2, 0.22, 24, 64, Math.PI]} />
          {clay('#ffffff', 0.75)}
        </mesh>
        <mesh position={[0, 1.55, 0]}>
          <planeGeometry args={[1.95, 3.1]} />
          <meshBasicMaterial color={accent} transparent opacity={0.22} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

const ISLANDS = [Landing, District, Garden, Observatory, Workshop, Gate];

function Islands() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const still = matches(MQ.reducedMotion);
  useFrame((state) => {
    if (still) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (g) g.position.y = PLACES[i].at[1] + Math.sin(t * 0.55 + i * 1.3) * 0.14;
    });
  });
  return (
    <>
      {PLACES.map((p, i) => {
        const Island = ISLANDS[i];
        return (
          <group key={p.id} ref={(g) => { refs.current[i] = g; }} position={p.at}>
            <Island accent={p.accent} />
          </group>
        );
      })}
      {/* drifting pebbles between the islands give the space depth */}
      <Pebbles />
    </>
  );
}

function Pebbles() {
  const list = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        p: [((i * 61) % 70) - 4, ((i * 17) % 9) - 5, -((i * 29) % 26) - 2] as [number, number, number],
        s: 0.12 + ((i * 7) % 5) * 0.07,
      })),
    [],
  );
  return (
    <group>
      {list.map((b, i) => (
        <mesh key={i} position={b.p}>
          <icosahedronGeometry args={[b.s, 1]} />
          {clay(i % 5 === 0 ? '#b9a9f4' : CLAY_UNDER)}
        </mesh>
      ))}
    </group>
  );
}

/** The camera travels from island to island with the scroll. */
function Rig() {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3());
  const ready = useRef(false);
  const still = matches(MQ.reducedMotion);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  useFrame((_, dt) => {
    const compact = size.width < 1000;
    let f = worldProgress();
    if (still) f = Math.round(f);
    const i = Math.min(PLACES.length - 2, Math.floor(f));
    const k = f - i;
    const a = PLACES[i].at;
    const b = PLACES[Math.min(PLACES.length - 1, i + 1)].at;
    // desktop: islands sit right of centre beside the text; compact: above the text
    const off = compact ? [0, -2.6, 0] : [-5.2, 0.2, 0];
    const tx = a[0] + (b[0] - a[0]) * k + off[0];
    const ty = a[1] + (b[1] - a[1]) * k + off[1];
    const tz = a[2] + (b[2] - a[2]) * k + off[2];
    // narrow portrait screens need the camera further back to fit an island's width
    const aspect = size.width / size.height;
    const dist = compact ? Math.min(34, 14.5 / Math.min(1, aspect)) : 20;
    // a gentle arc: the camera swings wide mid-journey, so it glides around each island
    const swing = Math.sin(k * Math.PI) * 3;
    const px = tx + pointer.x * 0.6 + swing * 0.5;
    const py = ty + 4.6 + pointer.y * 0.3 + swing * 0.3;
    const pz = tz + dist + swing;
    const r = still || !ready.current ? 0.0001 : 0.35;
    camera.position.set(follow(camera.position.x, px, dt, r), follow(camera.position.y, py, dt, r), follow(camera.position.z, pz, dt, r));
    look.current.set(follow(look.current.x, tx, dt, r), follow(look.current.y, ty + 0.6, dt, r), follow(look.current.z, tz, dt, r));
    camera.lookAt(look.current);
    ready.current = true;
  });
  return null;
}

export default function World({ onReady }: { onReady?: () => void }) {
  const compact = matches(MQ.compact);
  const dpr: [number, number] = compact ? [1, 1.25] : [1, 1.75];

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <Canvas
      className="world-canvas"
      dpr={dpr}
      camera={{ fov: compact ? 42 : 34, near: 0.1, far: 120, position: [0, 4, 14] }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#f7f6f2');
        onReady?.();
      }}
      aria-hidden="true"
    >
      <fog attach="fog" args={['#f7f6f2', 28, 64]} />
      <hemisphereLight args={['#ffffff', '#e6dccd', 1.15]} />
      <directionalLight position={[8, 14, 8]} intensity={1.7} color="#fff3e4" />
      <directionalLight position={[-10, 4, -6]} intensity={0.45} color="#c9d4ff" />
      <Islands />
      <Rig />
    </Canvas>
  );
}

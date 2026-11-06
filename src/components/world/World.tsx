import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PLACES } from './places';
import { measure, worldProgress } from './progress';
import { buildIsland, crownGeometry, PALETTE, rampTexture, softSprite, type IslandOptions } from './island';
import { follow } from '../../lib/motion';
import { matches, MQ } from '../../lib/runtime';

/**
 * The Veil Archipelago: a chain of floating landmasses over a cloud sea.
 * One monumental hero island with waterfalls, distant islands softened by
 * haze, drifting cloud cards and a few spores. The camera moves between
 * framed shots as the page scrolls. Decorative only: everything here also
 * exists as HTML on the page.
 */

const pointer = { x: 0, y: 0 };
const STILL = typeof window !== 'undefined' && matches(MQ.reducedMotion);

/* ---------------------------------------------------------------- islands */

const ISLANDS: { opts: IslandOptions; at: [number, number, number] }[] = [
  { opts: { seed: 3, radius: 8, depth: 14, falls: [Math.PI * 0.42, Math.PI * 0.66, Math.PI * 0.2] }, at: [0, 0, 0] },
  { opts: { seed: 11, radius: 6, depth: 11, falls: [Math.PI * 0.5], detail: 'low' }, at: [-38, 6, -62] },
  { opts: { seed: 19, radius: 5, depth: 9, detail: 'low' }, at: [42, -5, -56] },
  { opts: { seed: 27, radius: 9, depth: 16, falls: [Math.PI * 0.45], detail: 'low' }, at: [8, 12, -128] },
  { opts: { seed: 33, radius: 2.2, depth: 4.5, density: 0.8 }, at: [17, -7, -12] },
  { opts: { seed: 41, radius: 1.5, depth: 3.2, density: 0.6, detail: 'low' }, at: [-27, 8, -22] },
];

function Waterfall({ top, out, length, width }: { top: THREE.Vector3; out: THREE.Vector3; length: number; width: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mist = useMemo(() => softSprite('dot', 4), []);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, length, 1, 36);
    g.translate(0, -length / 2, 0);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const t = -p.getY(i) / length;
      p.setZ(i, 0.55 + t * t * length * 0.12);
      p.setX(i, p.getX(i) * (1 + t * 0.6));
    }
    return g;
  }, [length, width]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uA: { value: PALETTE.glint.clone() }, uB: { value: new THREE.Color('#ffffff') } }), []);
  useFrame((_, dt) => {
    if (mat.current && !STILL) mat.current.uniforms.uTime.value += dt;
  });
  const rotY = Math.atan2(out.x, out.z);
  const bottom = top.clone().add(out.clone().multiplyScalar(0.55 + length * 0.12)).add(new THREE.Vector3(0, -length, 0));
  return (
    <>
      <mesh geometry={geo} position={top} rotation={[0, rotY, 0]} renderOrder={2}>
        <shaderMaterial
          ref={mat}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          uniforms={uniforms}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={`
            varying vec2 vUv; uniform float uTime; uniform vec3 uA; uniform vec3 uB;
            float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
            float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
              return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
            void main(){
              vec2 p = vec2(vUv.x * 9.0, vUv.y * 2.2 + uTime * 1.25);
              float s = n(p) * 0.6 + n(p * 2.3 + 4.0) * 0.4;
              float streak = smoothstep(0.38, 0.85, s);
              float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
              float fall = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
              float a = (0.28 + streak * 0.62) * edge * fall;
              gl_FragColor = vec4(mix(uA, uB, streak * 0.85), a);
            }`}
        />
      </mesh>
      {[0, 1, 2].map((i) => (
        <sprite key={i} position={[bottom.x + (i - 1) * width * 0.6, bottom.y + i * 0.4, bottom.z]} scale={[width * 3 + i, width * 2.2 + i, 1]}>
          <spriteMaterial map={mist} transparent opacity={0.55} depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

function IslandMesh({ opts, at, ramp, crown }: { opts: IslandOptions; at: [number, number, number]; ramp: THREE.Texture; crown: THREE.BufferGeometry }) {
  const data = useMemo(() => buildIsland(opts), [opts]);
  const toon = useMemo(() => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp }), [ramp]);
  const leaf = useMemo(() => new THREE.MeshToonMaterial({ gradientMap: ramp }), [ramp]);
  const barkMat = useMemo(() => new THREE.MeshToonMaterial({ color: PALETTE.bark, gradientMap: ramp }), [ramp]);
  const canopy = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.5, 0.8, 1, 6), []);

  useEffect(() => {
    const c = canopy.current;
    if (c) {
      data.canopy.matrices.forEach((m, i) => {
        c.setMatrixAt(i, m);
        c.setColorAt(i, data.canopy.colors[i]);
      });
      c.instanceMatrix.needsUpdate = true;
      if (c.instanceColor) c.instanceColor.needsUpdate = true;
    }
    const t = trunks.current;
    if (t) {
      data.trunks.forEach((m, i) => t.setMatrixAt(i, m));
      t.instanceMatrix.needsUpdate = true;
    }
  }, [data]);

  useEffect(
    () => () => {
      data.rock.dispose();
      data.hang.dispose();
    },
    [data],
  );

  // a slow, heavy bob: these are geological masses, so barely any
  useFrame((state) => {
    if (!group.current || STILL) return;
    group.current.position.y = at[1] + Math.sin(state.clock.elapsedTime * 0.18 + opts.seed) * 0.25;
  });

  return (
    <group ref={group} position={at}>
      <mesh geometry={data.rock} material={toon} />
      <mesh geometry={data.hang} material={toon} />
      <instancedMesh ref={canopy} args={[crown, leaf, data.canopy.matrices.length]} frustumCulled={false} />
      <instancedMesh ref={trunks} args={[trunkGeo, barkMat, data.trunks.length]} frustumCulled={false} />
      {data.falls.map((f, i) => (
        <Waterfall key={i} {...f} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------- atmosphere */

function CloudSea() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color('#ffffff') }, uShade: { value: new THREE.Color('#cdd9d6') } }), []);
  useFrame((_, dt) => {
    if (mat.current && !STILL) mat.current.uniforms.uTime.value += dt * 0.6;
  });
  return (
    <mesh position={[0, -24, -40]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[520, 520, 1, 1]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`
          varying vec2 vUv; uniform float uTime; uniform vec3 uColor; uniform vec3 uShade;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
          float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=n(p)*a; p*=2.02; a*=0.5; } return s; }
          void main(){
            vec2 p = vUv * 22.0 + vec2(uTime * 0.05, uTime * 0.02);
            float c = fbm(p + fbm(p * 0.5));
            float body = smoothstep(0.32, 0.72, c);
            float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
            vec3 col = mix(uShade, uColor, smoothstep(0.45, 0.85, c));
            gl_FragColor = vec4(col, body * edge * 0.95);
          }`}
      />
    </mesh>
  );
}

function CloudCards() {
  const tex = useMemo(() => [softSprite('cloud', 2), softSprite('cloud', 5), softSprite('cloud', 9)], []);
  const cards = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        p: new THREE.Vector3(((i * 53) % 160) - 80, -14 + ((i * 7) % 18), -((i * 37) % 140) + 10),
        s: 18 + ((i * 11) % 16),
        t: i % 3,
        speed: 0.3 + ((i * 13) % 5) * 0.08,
      })),
    [],
  );
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  useFrame((_, dt) => {
    if (STILL) return;
    refs.current.forEach((s, i) => {
      if (!s) return;
      s.position.x += cards[i].speed * dt;
      if (s.position.x > 90) s.position.x = -90;
    });
  });
  return (
    <>
      {cards.map((c, i) => (
        <sprite key={i} ref={(s) => { refs.current[i] = s; }} position={c.p} scale={[c.s, c.s * 0.45, 1]}>
          <spriteMaterial map={tex[c.t]} transparent opacity={0.8} depthWrite={false} fog />
        </sprite>
      ))}
    </>
  );
}

function Spores() {
  const count = matches(MQ.compact) ? 40 : 90;
  const tex = useMemo(() => softSprite('dot', 3), []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = ((i * 97) % 60) - 30;
      arr[i * 3 + 1] = ((i * 31) % 30) - 12;
      arr[i * 3 + 2] = ((i * 53) % 40) - 14;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);
  const ref = useRef<THREE.Points>(null);
  useFrame((state, dt) => {
    if (STILL || !ref.current) return;
    const p = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = p.getY(i) + dt * (0.25 + (i % 5) * 0.06);
      if (y > 18) y = -12;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(state.clock.elapsedTime * 0.4 + i) * dt * 0.15);
    }
    p.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial map={tex} size={0.22} color="#f3dcae" transparent opacity={0.85} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function Archipelago() {
  const ramp = useMemo(() => rampTexture(), []);
  const crown = useMemo(() => crownGeometry(), []);
  const list = useMemo(() => (matches(MQ.compact) ? ISLANDS.filter((_, i) => i !== 5) : ISLANDS), []);
  return (
    <>
      {list.map((isl, i) => (
        <IslandMesh key={i} opts={isl.opts} at={isl.at} ramp={ramp} crown={crown} />
      ))}
      <CloudSea />
      <CloudCards />
      <Spores />
    </>
  );
}

/* ----------------------------------------------------------------- camera */

/** Framed shots, one per section: [camera position, look target]. */
const SHOTS: [THREE.Vector3, THREE.Vector3][] = [
  [new THREE.Vector3(-2, 8, 54), new THREE.Vector3(0, -3, 0)], // arrival: the establishing view
  [new THREE.Vector3(6, 19, 34), new THREE.Vector3(4, -1, -60)], // work: rise over the clouds, the archipelago appears
  [new THREE.Vector3(20, -3, 34), new THREE.Vector3(2, -7, 6)], // experiments: down by the falls
  [new THREE.Vector3(-13, 9, 8), new THREE.Vector3(-38, 3, -62)], // about: an overlook across the cloud sea
  [new THREE.Vector3(14, -19, 30), new THREE.Vector3(0, -11, 0)], // toolkit: under the roots and mineral seams
  [new THREE.Vector3(0, 11, 74), new THREE.Vector3(0, 1, -40)], // contact: pull back to the horizon
];

function Rig() {
  const { camera, size } = useThree();
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const ready = useRef(false);
  const tp = useMemo(() => new THREE.Vector3(), []);
  const tl = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  useFrame((_, dt) => {
    const compact = size.width < 1000;
    let f = worldProgress();
    if (STILL) f = Math.round(f);
    const i = Math.min(SHOTS.length - 2, Math.floor(f));
    const k = Math.min(1, f - i);
    tp.lerpVectors(SHOTS[i][0], SHOTS[i + 1][0], k);
    tl.lerpVectors(SHOTS[i][1], SHOTS[i + 1][1], k);
    // keep the subject out of the text: right of centre on desktop, high on phones
    dir.subVectors(tl, tp);
    const dist = dir.length();
    dir.normalize();
    right.crossVectors(dir, up).normalize();
    if (compact) {
      tl.addScaledVector(up, -dist * 0.16);
      // portrait screens: step back so the island's width still fits
      const aspect = size.width / size.height;
      tp.addScaledVector(dir, -Math.min(30, dist * (0.85 / Math.min(1, aspect) - 0.85) * 0.45));
    } else tl.addScaledVector(right, -dist * 0.2);
    // small cursor parallax, never steering
    tp.addScaledVector(right, pointer.x * 0.8).addScaledVector(up, -pointer.y * 0.4);

    const r = STILL || !ready.current ? 0.0001 : 0.45;
    pos.current.set(follow(pos.current.x, tp.x, dt, r), follow(pos.current.y, tp.y, dt, r), follow(pos.current.z, tp.z, dt, r));
    look.current.set(follow(look.current.x, tl.x, dt, r), follow(look.current.y, tl.y, dt, r), follow(look.current.z, tl.z, dt, r));
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    ready.current = true;
  });
  return null;
}

export default function World({ onReady }: { onReady?: () => void }) {
  const compact = matches(MQ.compact);
  const dpr: [number, number] = compact ? [1, 1.25] : [1, 1.6];

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
      camera={{ fov: compact ? 50 : 38, near: 0.5, far: 400, position: SHOTS[0][0].toArray() }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady?.();
      }}
      aria-hidden="true"
    >
      <fog attach="fog" args={['#dfe8e2', 45, 200]} />
      <hemisphereLight args={['#e4f2ec', '#7a6650', 1.25]} />
      <directionalLight position={[-24, 30, 18]} intensity={2.4} color="#fff0d2" />
      <directionalLight position={[20, -6, -10]} intensity={0.5} color="#9fd6d0" />
      <Archipelago />
      <Rig />
    </Canvas>
  );
}

// keep places and shots in step
if (import.meta.env.DEV && PLACES.length !== SHOTS.length) console.warn('World: PLACES and SHOTS differ in length');

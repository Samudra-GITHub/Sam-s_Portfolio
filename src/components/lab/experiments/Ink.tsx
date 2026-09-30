import { useCallback, useRef, useState, type PointerEvent } from 'react';
import ShaderCanvas from '../../core/ShaderCanvas';
import { useReducedMotion } from '../../../lib/runtime';

/**
 * INK: the cursor is a brush. Each move drops a blob that shrinks away over a
 * couple of seconds; blobs merge as a metaball field, cut into flat bands of
 * lime, cobalt and vermilion. Flat colour and hard edges, soft behaviour.
 */
const N = 8;
const LIFE = 2.6;

const FRAG = `
${Array.from({ length: N }, (_, i) => `uniform vec3 uB${i};`).join('\n')}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);
  float f = 0.0;
  ${Array.from({ length: N }, (_, i) => `{ vec2 c = (vec2(uB${i}.x, 1.0 - uB${i}.y) - 0.5) * vec2(asp, 1.0); float d = distance(p, c); f += uB${i}.z * uB${i}.z / (d * d + 0.0008); }`).join('\n  ')}

  vec3 paper = vec3(0.992, 0.976, 0.945);
  vec3 ink = vec3(0.067, 0.071, 0.082);
  vec3 lime = vec3(0.847, 0.973, 0.153);
  vec3 cobalt = vec3(0.118, 0.227, 0.91);
  vec3 vermilion = vec3(1.0, 0.322, 0.149);

  vec2 g = abs(fract(p * 9.0 + 0.5) - 0.5);
  vec3 col = mix(paper, paper * 0.94, step(0.47, max(g.x, g.y)));
  if (f > 1.0) col = lime;
  if (f > 2.1) col = cobalt;
  if (f > 4.2) col = vermilion;
  float edge = abs(f - 1.0);
  col = mix(ink, col, smoothstep(0.0, 0.06, edge));
  gl_FragColor = vec4(col, 1.0);
}
`;

interface Blob {
  x: number;
  y: number;
  r: number;
  t: number;
}

export default function Ink() {
  const [fallback, setFallback] = useState(false);
  const reduce = useReducedMotion();
  const blobs = useRef<Blob[]>(Array.from({ length: N }, () => ({ x: 0.5, y: 0.5, r: 0, t: -99 })));
  const next = useRef(0);
  const last = useRef({ x: -1, y: -1 });
  const hover = useRef(false);

  const drop = (x: number, y: number, r: number) => {
    blobs.current[next.current % N] = { x, y, r, t: performance.now() / 1000 };
    next.current++;
  };

  const onUnsupported = useCallback(() => setFallback(true), []);

  const uniforms = useCallback(() => {
    const now = performance.now() / 1000;
    // when nobody is drawing, one blob wanders so the panel is never empty
    if (!hover.current && now - blobs.current[(next.current + N - 1) % N].t > 1.3) {
      drop(0.5 + 0.32 * Math.sin(now * 0.7), 0.5 + 0.28 * Math.cos(now * 0.55), 0.085);
    }
    const out: Record<string, number[]> = {};
    blobs.current.forEach((b, i) => {
      const age = (now - b.t) / LIFE;
      const r = age >= 1 ? 0 : b.r * (1 - age * age);
      out[`uB${i}`] = [b.x, b.y, r];
    });
    return out;
  }, []);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    hover.current = true;
    if (Math.hypot(x - last.current.x, y - last.current.y) > 0.025) {
      last.current = { x, y };
      drop(x, y, 0.07 + Math.random() * 0.03);
    }
  };
  const onClick = (e: PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    drop((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height, 0.2);
  };

  return (
    <div
      className="ink"
      role="img"
      aria-label="Ink experiment: move the cursor to paint with merging blobs of colour"
      onPointerMove={onMove}
      onPointerLeave={() => (hover.current = false)}
      onClick={onClick}
    >
      {fallback || reduce ? (
        <div className="ink-fallback" aria-hidden="true" />
      ) : (
        <ShaderCanvas frag={FRAG} uniforms={uniforms} maxDpr={1.25} onUnsupported={onUnsupported} />
      )}
    </div>
  );
}

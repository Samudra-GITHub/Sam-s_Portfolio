import { useCallback, useRef, type RefObject } from 'react';
import ShaderCanvas from '../core/ShaderCanvas';
import { pointer } from '../../lib/pointer';
import { clamp } from '../../lib/hooks';

/**
 * The hero's paper is a field of dots on the same 40px grid the rest of the
 * site uses. Dots breathe on a slow wave; under the cursor they swell, turn
 * lime and pick up an ink ring. With no pointer (touch) a soft hotspot wanders
 * on its own so the paper is never dead.
 */
const FRAG = `
uniform vec2 uMouse;
uniform float uSwell;

void main(){
  vec2 frag = gl_FragCoord.xy / uPx;
  vec2 res = uRes / uPx;
  float cell = 40.0;
  vec2 id = floor(frag / cell);
  vec2 c = (id + 0.5) * cell;
  float d = length(frag - c);

  vec2 m = uMouse * res;
  float dm = length(c - m);
  float swell = exp(-dm * dm / (2.0 * 100.0 * 100.0)) * uSwell;
  float wave = 0.5 + 0.5 * sin(uTime * 0.9 + id.x * 0.35 + id.y * 0.27);

  float r = 1.0 + 0.5 * wave + 2.4 * swell;
  float dotMask = 1.0 - smoothstep(r - 0.8, r + 0.4, d);
  float ring = (1.0 - smoothstep(r + 1.2, r + 2.3, d)) * smoothstep(r - 0.5, r + 0.5, d) * step(0.24, swell);

  vec3 paper = vec3(0.992, 0.976, 0.945);
  vec3 ink = vec3(0.067, 0.071, 0.082);
  vec3 lime = vec3(0.847, 0.973, 0.153);

  float limeAmt = smoothstep(0.16, 0.5, swell);
  vec3 dc = mix(mix(paper, ink, 0.17), lime, limeAmt);
  vec3 col = mix(paper, dc, dotMask);
  col = mix(col, ink, ring);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function HeroGrid({ stageRef }: { stageRef: RefObject<HTMLDivElement | null> }) {
  const smooth = useRef({ x: 0.5, y: 0.5, k: 0, ready: false });

  const uniforms = useCallback(
    (t: number) => {
      const stage = stageRef.current;
      const s = smooth.current;
      if (!stage) return { uMouse: [0.5, 0.5], uSwell: 0 };
      const r = stage.getBoundingClientRect();
      let tx: number;
      let ty: number;
      if (pointer.seen) {
        tx = clamp((pointer.x.get() - r.left) / r.width, -0.2, 1.2);
        ty = clamp(1 - (pointer.y.get() - r.top) / r.height, -0.2, 1.2);
      } else {
        tx = 0.5 + 0.34 * Math.sin(t * 0.35);
        ty = 0.5 + 0.22 * Math.cos(t * 0.27);
      }
      if (!s.ready) {
        s.x = tx;
        s.y = ty;
        s.ready = true;
      }
      s.x += (tx - s.x) * 0.12;
      s.y += (ty - s.y) * 0.12;
      s.k += ((pointer.seen ? 1 : 0.7) - s.k) * 0.05;
      return { uMouse: [s.x, s.y], uSwell: s.k };
    },
    [stageRef],
  );

  return (
    <div className="hero-grid" aria-hidden="true">
      <ShaderCanvas frag={FRAG} uniforms={uniforms} maxDpr={1.25} />
    </div>
  );
}

import { useCallback, useMemo, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import ShaderCanvas from '../../core/ShaderCanvas';
import { useBeat, useScene } from '../scene';
import './worlds.css';
import './akasha.css';

/**
 * AKASHALENS: reconstruction.
 * One procedural landscape drawn twice: the "raw" pass is hazy, desaturated
 * and buried in drifting cloud; the "reconstructed" pass is clean terrain with
 * contour lines. A wavefront sweeps across as you scroll, turning cloud into
 * ground behind it. Hovering opens a lens that reconstructs under the cursor.
 * This is a visual metaphor for the project, not output from its model.
 */
const buildFrag = (octaves: number) => `
uniform float uProgress; uniform vec2 uMouse; uniform float uHover;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < ${octaves}; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }
  return v;
}

void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);

  vec3 ink = vec3(0.067, 0.071, 0.082);
  vec3 paper = vec3(0.992, 0.976, 0.945);
  vec3 sand = vec3(0.922, 0.898, 0.847);
  vec3 cobalt = vec3(0.118, 0.227, 0.91);
  vec3 lime = vec3(0.847, 0.973, 0.153);
  vec3 moss = vec3(0.42, 0.46, 0.27);

  // terrain height
  float h = fbm(p * 2.6 + vec2(3.1, 1.7));
  vec3 land = mix(sand, moss, smoothstep(0.46, 0.78, h));
  vec3 water = mix(cobalt * 0.72, cobalt, smoothstep(0.18, 0.42, h));
  vec3 terrain = mix(water, land, step(0.42, h));
  float f = fract(h * 14.0);
  terrain *= mix(0.6, 1.0, smoothstep(0.0, 0.08, f));
  vec2 g = abs(fract(p * 4.0 + 0.5) - 0.5);
  terrain = mix(terrain, lime, (1.0 - smoothstep(0.0, 0.006, min(g.x, g.y))) * 0.22);

  // cloud cover drifting across the raw pass
  float cw = fbm(p * 2.1 + vec2(uTime * 0.03, -uTime * 0.015) + vec2(8.0, 2.0));
  float cloud = smoothstep(0.46, 0.7, cw);
  vec3 raw = mix(terrain, vec3(dot(terrain, vec3(0.3, 0.59, 0.11))), 0.6);
  raw = mix(raw, paper, cloud * 0.93);
  raw += (hash(fc + uTime) - 0.5) * 0.05;

  // wavefront: everything to its left is reconstructed
  float wf = mix(-0.08, 1.08, uProgress);
  float rec = 1.0 - smoothstep(wf - 0.004, wf + 0.004, uv.x);

  // lens under the cursor
  vec2 m = vec2(uMouse.x * asp, 1.0 - uMouse.y);
  float dm = distance(vec2(uv.x * asp, uv.y), m);
  float lens = (1.0 - smoothstep(0.155, 0.165, dm)) * uHover;
  float ring = (smoothstep(0.15, 0.156, dm) - smoothstep(0.165, 0.171, dm)) * uHover;

  vec3 col = mix(raw, terrain, max(rec, lens));
  float line = (1.0 - smoothstep(0.0, 0.0035, abs(uv.x - wf))) * step(0.003, uProgress) * step(uProgress, 0.997);
  col = mix(col, lime, line);
  col = mix(col, lime, ring);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function AkashaWorld() {
  const { progress, rawX, rawY, hover, compact } = useScene();
  const [fallback, setFallback] = useState(false);
  const frag = useMemo(() => buildFrag(compact ? 3 : 5), [compact]);

  const sweep = useBeat(progress, 0.12, 0.86);
  const wfLeft = useTransform(sweep, (v) => `${(-0.08 + 1.16 * v) * 100}%`);

  const uniforms = useCallback(
    () => ({ uProgress: sweep.get(), uMouse: [rawX.get(), rawY.get()], uHover: Math.min(1, hover.get()) }),
    [sweep, rawX, rawY, hover],
  );
  const onUnsupported = useCallback(() => setFallback(true), []);

  return (
    <div className="world aw">
      {fallback ? <Fallback /> : <ShaderCanvas frag={frag} uniforms={uniforms} maxDpr={1.5} onUnsupported={onUnsupported} />}

      <motion.div className="aw-wf" style={{ left: wfLeft }} aria-hidden="true">
        <span className="mono aw-wf-tag">wavefront</span>
      </motion.div>

      <span className="world-label aw-l aw-l-left">Reconstructed</span>
      <span className="world-label aw-l aw-l-right">Cloudy input</span>
      <span className="world-label aw-hint">Hover: lens</span>
    </div>
  );
}

/** No WebGL: a static split of the same idea in CSS. */
function Fallback() {
  return (
    <div className="aw-fallback" aria-hidden="true">
      <div className="aw-fb-clean" />
      <div className="aw-fb-cloud" />
    </div>
  );
}

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import ShaderCanvas from '../../core/ShaderCanvas';
import { scrollVelocity } from '../../../lib/scroll';
import { useTicker } from '../../../lib/hooks';
import { useScene } from '../scene';
import './worlds.css';
import './portfolio.css';

/**
 * PORTFOLIO: shader language, geometry, distortion.
 * A grid of cells that morph between circle and square, driven by two real
 * uniforms (scroll progress and the pointer) that are printed on the scene.
 * The name on top is warped by an SVG displacement filter whose strength is
 * hover plus scroll velocity. The scene is the site describing itself.
 */
const buildFrag = () => `
uniform float uProgress; uniform vec2 uMouse; uniform float uHover;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);
  vec2 m = (vec2(uMouse.x, 1.0 - uMouse.y) - 0.5) * vec2(asp, 1.0);
  float d = length(p - m);

  p += 0.06 * vec2(sin(p.y * 7.0 + uTime * 0.7), cos(p.x * 7.0 - uTime * 0.6));
  p += (p - m) * exp(-d * 3.6) * 0.42 * uHover;

  float cells = mix(9.0, 24.0, uProgress);
  vec2 g = p * cells + vec2(0.0, uTime * 0.25);
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;

  float wave = 0.5 + 0.5 * sin(length(id) * 0.62 - uTime * 1.1 + uProgress * 6.2831);
  float r = mix(0.08, 0.5, wave);
  float sq = 0.5 + 0.5 * sin(uTime * 0.4 + id.x * 0.21 + id.y * 0.13);
  float shape = mix(length(f), max(abs(f.x), abs(f.y)), smoothstep(0.3, 0.7, sq));
  float mask = 1.0 - smoothstep(r - 0.03, r, shape);

  vec3 ink = vec3(0.067, 0.071, 0.082);
  vec3 lime = vec3(0.847, 0.973, 0.153);
  vec3 cobalt = vec3(0.118, 0.227, 0.91);
  vec3 vermilion = vec3(1.0, 0.322, 0.149);
  float near = 1.0 - smoothstep(0.1, 0.3, d);
  vec3 c = mix(lime, cobalt, near * uHover);
  c = mix(c, vermilion, step(0.86, wave) * (1.0 - near * uHover));
  gl_FragColor = vec4(mix(ink, c, mask), 1.0);
}
`;

export default function PortfolioWorld() {
  const { progress, rawX, rawY, hover, visible, compact, reduce } = useScene();
  const [fallback, setFallback] = useState(false);
  const frag = useMemo(() => buildFrag(), []);
  const warpRef = useRef<SVGFEDisplacementMapElement>(null);
  const strength = useRef(0);

  const uniforms = useCallback(
    () => ({ uProgress: progress.get(), uMouse: [rawX.get(), rawY.get()], uHover: Math.min(1, hover.get()) }),
    [progress, rawX, rawY, hover],
  );
  const onUnsupported = useCallback(() => setFallback(true), []);

  // typography distortion: hover plus scroll speed
  useTicker((_, dt) => {
    const el = warpRef.current;
    if (!el || reduce) return;
    const target = Math.min(1, hover.get()) * 26 + Math.min(Math.abs(scrollVelocity.get()), 50) * 0.9;
    strength.current += (target - strength.current) * (1 - Math.exp(-dt * 7));
    el.setAttribute('scale', strength.current.toFixed(1));
  }, visible);

  const readProgress = useTransform(progress, (v) => `uProgress ${v.toFixed(2)}`);
  const readMouse = useTransform(rawX, (v) => `uMouse ${v.toFixed(2)}, ${rawY.get().toFixed(2)}`);

  return (
    <div className="world pw">
      {fallback ? <div className="pw-fallback" aria-hidden="true" /> : <ShaderCanvas frag={frag} uniforms={uniforms} maxDpr={compact ? 1 : 1.4} onUnsupported={onUnsupported} />}

      <svg className="pw-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="pw-warp" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.035" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap ref={warpRef} in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="pw-name font-display" aria-hidden="true" style={{ filter: reduce ? undefined : 'url(#pw-warp)' }}>
        SAMUDRA
      </div>

      <div className="pw-readout mono" aria-hidden="true">
        <motion.span>{readProgress}</motion.span>
        <motion.span>{readMouse}</motion.span>
      </div>
      <span className="world-label pw-here">You are here</span>
    </div>
  );
}

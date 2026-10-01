import { useCallback, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import ShaderCanvas from '../core/ShaderCanvas';
import { pointer } from '../../lib/pointer';
import { clamp } from '../../lib/hooks';

/**
 * The contact scene's backdrop, in one fragment shader:
 *  - an ink field with a faint cobalt aurora, drifting dust, and a soft glow
 *    that follows the pointer in the orb's current colour
 *  - a 3D liquid orb, raymarched (orthographic, displaced sphere, flat toon
 *    bands, halftone shadow, paper outline). Its light follows the cursor, and
 *    its colour, spikiness and squash react to whichever link you aim at.
 * No meshes, no Three.js: just maths, drawn only while the section is on screen.
 */
const FRAG = `
uniform vec2 uMouse;     // 0..1, y up
uniform vec2 uOrb;       // orb centre, 0..1, y up
uniform float uOrbR;     // radius in units of canvas height
uniform vec3 uColor;
uniform float uSpike;
uniform float uSquash;
uniform float uGrow;     // 0..1 entrance
uniform float uDim;      // 0..1 (reduce on small screens so text stays readable)

float hash31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float orbMap(vec3 p){
  vec3 r = vec3(p.x, p.y / max(uSquash, 0.4), p.z);
  float freq = 1.1 + 1.5 * uSpike;
  float n = vnoise(r * freq + vec3(0.0, uTime * 0.45, uTime * 0.3)) * 2.0 - 1.0;
  float amp = 0.035 + 0.13 * uSpike;
  return length(r) - 1.0 - amp * n;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = uv * vec2(asp, 1.0);

  vec3 ink = vec3(0.067, 0.071, 0.082);
  vec3 paper = vec3(0.992, 0.976, 0.945);
  vec3 cobalt = vec3(0.118, 0.227, 0.91);

  // ---- field ----
  vec3 col = ink;
  float band = smoothstep(0.55, 1.0, sin(p.x * 2.2 + uTime * 0.12 + sin(p.y * 3.0 + uTime * 0.2)) * 0.5 + 0.5);
  col += cobalt * band * 0.05 * (1.0 - uv.y);
  vec2 m = uMouse * vec2(asp, 1.0);
  float gd = distance(p, m);
  col += uColor * exp(-gd * gd * 5.0) * 0.17;
  col += uColor * exp(-gd * gd * 38.0) * 0.12;
  // dust
  vec2 sg = floor(gl_FragCoord.xy / 3.0 / 22.0);
  float sh = hash21(sg);
  vec2 sc = (sg + 0.5) * 22.0 * 3.0;
  float tw = 0.5 + 0.5 * sin(uTime * (0.6 + sh * 1.4) + sh * 40.0);
  float star = step(0.987, sh) * (1.0 - smoothstep(0.0, 2.2, distance(gl_FragCoord.xy, sc + (sh - 0.5) * 40.0)));
  col += paper * star * tw * 0.55;

  // ---- orb ----
  vec2 c = uOrb * vec2(asp, 1.0);
  float R = uOrbR * uGrow;
  if (R > 0.002) {
    vec2 q = (p - c) / R;
    if (dot(q, q) < 2.6) {
      vec3 ro = vec3(q, -2.5);
      vec3 rd = vec3(0.0, 0.0, 1.0);
      float t = 0.0;
      float md = 10.0;
      bool hit = false;
      for (int i = 0; i < 44; i++) {
        float h = orbMap(ro + rd * t);
        md = min(md, h);
        if (h < 0.002) { hit = true; break; }
        t += h * 0.85;
        if (t > 5.0) break;
      }
      if (hit) {
        vec3 pos = ro + rd * t;
        vec2 e = vec2(0.012, 0.0);
        vec3 n = normalize(vec3(orbMap(pos + e.xyy) - orbMap(pos - e.xyy), orbMap(pos + e.yxy) - orbMap(pos - e.yxy), orbMap(pos + e.yyx) - orbMap(pos - e.yyx)));
        // the light is the cursor
        vec2 look = clamp((m - c) * 1.2, -1.4, 1.4);
        vec3 L = normalize(vec3(-0.5 + look.x * 0.6, 0.7 + look.y * 0.6, -0.65));
        float ndl = dot(n, L);
        float shade = ndl > 0.52 ? 1.0 : (ndl > 0.08 ? 0.74 : 0.46);
        vec3 base = uColor * shade;
        // halftone in the shadow
        vec2 hp = fract(gl_FragCoord.xy / 7.0) - 0.5;
        float halftone = step(length(hp), 0.3 + 0.1 * (0.46 - shade));
        base = mix(base, base * 0.55, step(shade, 0.5) * halftone);
        // hard specular
        vec3 Hh = normalize(L - rd);
        float spec = pow(max(dot(n, Hh), 0.0), 60.0);
        base = mix(base, paper, step(0.55, spec));
        // rim
        float fres = 1.0 - abs(n.z);
        base = mix(base, mix(uColor, paper, 0.55), step(0.93, fres) * 0.9);
        col = mix(base, ink, uDim * 0.4);
      } else if (md < 0.03) {
        col = mix(col, paper, 0.95);   // 2px-style outline around the silhouette
      }
    }
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

type Aim = 'instagram' | 'github' | 'linkedin' | null;
const LIME: [number, number, number] = [0.847, 0.973, 0.153];
const TARGET: Record<string, { color: [number, number, number]; spike: number }> = {
  none: { color: LIME, spike: 0.28 },
  instagram: { color: [1.0, 0.322, 0.149], spike: 0.8 },
  github: { color: [0.992, 0.976, 0.945], spike: 0.08 },
  linkedin: { color: [0.2, 0.36, 1.0], spike: 0.55 },
};

interface Props {
  sectionRef: RefObject<HTMLElement | null>;
  aimRef: MutableRefObject<Aim>;
}

export default function ContactField({ sectionRef, aimRef }: Props) {
  const [fallback, setFallback] = useState(false);
  const s = useRef({
    color: [...LIME] as number[],
    spike: 0.28,
    squash: 1,
    squashV: 0,
    mx: 0.5,
    my: 0.5,
    lastAim: null as Aim,
    ready: false,
  });

  const uniforms = useCallback(
    (t: number): Record<string, number | number[]> => {
      const el = sectionRef.current;
      const st = s.current;
      if (!el) return {};
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const visibleH = Math.min(r.height, vh);
      const compact = r.width < 1000;

      // pointer in section space (y up). Without a pointer a hotspot wanders.
      let tx: number;
      let ty: number;
      if (pointer.seen) {
        tx = clamp((pointer.x.get() - r.left) / r.width, -0.2, 1.2);
        ty = clamp(1 - (pointer.y.get() - r.top) / r.height, -0.2, 1.2);
      } else {
        tx = 0.62 + 0.25 * Math.sin(t * 0.4);
        ty = 0.35 + 0.18 * Math.cos(t * 0.33);
      }
      if (!st.ready) {
        st.mx = tx;
        st.my = ty;
        st.ready = true;
      }
      st.mx += (tx - st.mx) * 0.1;
      st.my += (ty - st.my) * 0.1;

      // aim: colour, spikiness and a squash kick when the target changes
      const aim = aimRef.current;
      const target = TARGET[aim ?? 'none'];
      if (aim !== st.lastAim) {
        st.lastAim = aim;
        st.squashV = -0.9;
      }
      for (let i = 0; i < 3; i++) st.color[i] += (target.color[i] - st.color[i]) * 0.09;
      st.spike += (target.spike - st.spike) * 0.08;
      st.squashV += (1 - st.squash) * 0.2;
      st.squashV *= 0.82;
      st.squash += st.squashV * 0.35;

      // where the orb sits: right of the links on desktop, below the links on phones
      const orbCxPx = compact ? r.width * 0.5 : r.width * 0.79;
      const orbCyFromTop = compact ? r.height * 0.74 : r.height - visibleH * 0.5;
      const orbRpx = compact ? Math.min(r.width * 0.22, r.height * 0.1) : Math.min(r.width * 0.17, visibleH * 0.33);
      // the orb leans very slightly toward the cursor
      const ox = orbCxPx / r.width + (st.mx - orbCxPx / r.width) * 0.03;
      const oy = 1 - orbCyFromTop / r.height + (st.my - (1 - orbCyFromTop / r.height)) * 0.03;

      const enter = clamp((vh - r.top) / (vh * 0.95));
      const grow = 1 - Math.pow(1 - enter, 3);

      return {
        uMouse: [st.mx, st.my],
        uOrb: [ox, oy],
        uOrbR: orbRpx / r.height,
        uColor: st.color,
        uSpike: st.spike,
        uSquash: st.squash,
        uGrow: grow,
        uDim: 0,
      };
    },
    [sectionRef, aimRef],
  );

  const onUnsupported = useCallback(() => setFallback(true), []);

  return (
    <div className="contact-field" aria-hidden="true">
      {fallback ? <div className="contact-orb-fallback" /> : <ShaderCanvas frag={FRAG} uniforms={uniforms} maxDpr={1.25} onUnsupported={onUnsupported} />}
    </div>
  );
}

export type { Aim };

import { useCallback, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import ShaderCanvas from '../core/ShaderCanvas';
import { pointer } from '../../lib/pointer';
import { clamp } from '../../lib/hooks';

/**
 * The contact scene's backdrop, in one fragment shader: the deep end of the
 * print. Night blue (never black), a faint drifting band of light, a few
 * twinkling stars, and a soft white light that follows the pointer, tinted a
 * little toward whichever link you aim at. The enamel body itself is drawn
 * crisp in SVG (ContactBody). Drawn only while the section is on screen.
 */
const FRAG = `
uniform vec2 uMouse;     // 0..1, y up
uniform vec3 uColor;

float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = uv * vec2(asp, 1.0);

  vec3 night = vec3(0.031, 0.11, 0.29);
  vec3 cobalt = vec3(0.118, 0.227, 0.91);
  vec3 paper = vec3(0.992, 0.976, 0.945);

  vec3 col = mix(night, vec3(0.071, 0.227, 0.549), 0.35 * (1.0 - uv.y));
  float band = smoothstep(0.55, 1.0, sin(p.x * 2.2 + uTime * 0.12 + sin(p.y * 3.0 + uTime * 0.2)) * 0.5 + 0.5);
  col += cobalt * band * 0.05 * (1.0 - uv.y);

  // the cursor is a soft light on the print, white rather than the link's colour
  vec2 m = uMouse * vec2(asp, 1.0);
  float gd = distance(p, m);
  vec3 glow = mix(uColor, vec3(0.93, 0.95, 0.99), 0.7);
  col += glow * exp(-gd * gd * 5.0) * 0.07;
  col += glow * exp(-gd * gd * 38.0) * 0.06;

  // stars
  vec2 sg = floor(gl_FragCoord.xy / 3.0 / 22.0);
  float sh = hash21(sg);
  vec2 sc = (sg + 0.5) * 22.0 * 3.0;
  float tw = 0.5 + 0.5 * sin(uTime * (0.6 + sh * 1.4) + sh * 40.0);
  float star = step(0.987, sh) * (1.0 - smoothstep(0.0, 2.2, distance(gl_FragCoord.xy, sc + (sh - 0.5) * 40.0)));
  col += paper * star * tw * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`;

export type Aim = 'instagram' | 'github' | 'linkedin' | null;
const LIME: [number, number, number] = [0.847, 0.973, 0.153];
const TARGET: Record<string, [number, number, number]> = {
  none: LIME,
  instagram: [1.0, 0.322, 0.149],
  github: [0.992, 0.976, 0.945],
  linkedin: [0.2, 0.36, 1.0],
};

interface Props {
  sectionRef: RefObject<HTMLElement | null>;
  aimRef: MutableRefObject<Aim>;
}

export default function ContactField({ sectionRef, aimRef }: Props) {
  const [fallback, setFallback] = useState(false);
  const s = useRef({ color: [...LIME] as number[], mx: 0.5, my: 0.5, ready: false });

  const uniforms = useCallback(
    (t: number): Record<string, number | number[]> => {
      const el = sectionRef.current;
      const st = s.current;
      if (!el) return {};
      const r = el.getBoundingClientRect();

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

      const target = TARGET[aimRef.current ?? 'none'];
      for (let i = 0; i < 3; i++) st.color[i] += (target[i] - st.color[i]) * 0.09;

      return { uMouse: [st.mx, st.my], uColor: st.color };
    },
    [sectionRef, aimRef],
  );

  const onUnsupported = useCallback(() => setFallback(true), []);

  return <div className="contact-field" aria-hidden="true">{fallback ? null : <ShaderCanvas frag={FRAG} uniforms={uniforms} maxDpr={1.25} onUnsupported={onUnsupported} />}</div>;
}

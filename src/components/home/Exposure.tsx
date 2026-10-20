import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import ShaderCanvas from '../core/ShaderCanvas';
import { usePageTransition } from '../core/PageTransition';
import { useMedia, useReducedMotion } from '../../lib/runtime';
import { useTicker, useVisibleRef } from '../../lib/hooks';
import { follow } from '../../lib/motion';
import { config } from '../../data/config';
import Arrow from '../core/Arrow';
import './exposure.css';

/**
 * The homepage is one sun print, being made while you watch.
 *
 * A cyanotype is paper painted with iron salts: where light reaches it, it
 * turns Prussian blue; where something lies on it, it stays white. Here the
 * pointer is the lamp. Three objects lie on the sheet, one for each thing he
 * makes: an interface window, a sound wave, a lens. They cast photogram
 * shadows that swing and soften as the lamp moves, and the lens watches it.
 * The name is the part of the sheet that was masked, so it develops white out
 * of the blue in the first second, and each letter lifts a little and throws
 * its own shadow away from the light.
 *
 * Nothing waits on the entrance: any key, click or wheel finishes it at once.
 */
const FRAG = `
uniform vec2 uLight; uniform float uExpose; uniform float uWake;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
float box(vec2 p, vec2 b, float r){ vec2 d = abs(p) - b + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float cover(float d, float blur){ return smoothstep(blur, -blur, d); }

// the interface: a window frame, a title bar, three lights and two lines of content
float windowObj(vec2 p, float s, float blur){
  vec2 b = vec2(0.15, 0.1) * s;
  float frame = abs(box(p, b, 0.012*s)) - 0.0045*s;
  float bar = max(abs(p.y - (b.y - 0.032*s)) - 0.003*s, abs(p.x) - b.x);
  float c = max(cover(frame, blur), cover(bar, blur));
  for (int i = 0; i < 3; i++) c = max(c, cover(length(p - vec2(-b.x + (0.024 + float(i)*0.02)*s, b.y - 0.016*s)) - 0.0055*s, blur));
  c = max(c, 0.55 * cover(box(p - vec2(-0.03*s, 0.0), vec2(0.09*s, 0.008*s), 0.004*s), blur));
  c = max(c, 0.55 * cover(box(p - vec2(-0.06*s, -0.035*s), vec2(0.06*s, 0.008*s), 0.004*s), blur));
  c = max(c, 0.22 * cover(box(p, b, 0.012*s), blur)); // the glass itself lets a little less light through
  return c;
}
// the sound: one stroke of waveform
float waveObj(vec2 p, float w, float s, float t, float blur){
  float env = smoothstep(w, w*0.2, abs(p.x));
  float y = 0.035*s*env*sin(p.x*26.0/s + t*1.4) * (0.6 + 0.4*sin(p.x*7.0/s - t*0.7));
  float d = max(abs(p.y - y) - 0.004*s, abs(p.x) - w);
  return cover(d, blur);
}
// the lens: a ring, and an iris that turns toward the lamp
float lensObj(vec2 p, float s, vec2 look, float blur){
  float R = 0.075*s;
  float c = cover(abs(length(p) - R) - 0.005*s, blur);
  vec2 iris = look * R * 0.32;
  c = max(c, 0.5 * cover(length(p - iris) - R*0.44, blur));
  c = max(c, cover(length(p - iris) - R*0.17, blur));
  return c;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float a = uRes.x / uRes.y;
  vec2 q = (uv - 0.5) * vec2(a, 1.0);
  vec2 L = (uLight - 0.5) * vec2(a, 1.0);
  float t = uTime;
  bool tall = a < 0.9;
  float s = tall ? clamp(a * 1.25, 0.5, 0.9) : clamp(a * 0.62, 0.8, 1.15);

  vec2 W = tall ? vec2(a*0.5 - 0.17*s, 0.31) : vec2(a*0.5 - 0.3*s, 0.16);
  vec2 E = tall ? vec2(-a*0.5 + 0.16*s, 0.17) : vec2(a*0.5 - 0.17*s, -0.17);
  vec2 V = tall ? vec2(0.0, -0.41) : vec2(a*0.08, -0.37);
  float vw = tall ? a*0.42 : a*0.3;
  W += vec2(sin(t*0.21), cos(t*0.17)) * 0.006;
  E += vec2(cos(t*0.19), sin(t*0.23)) * 0.005;

  // a shadow lands where the line from the lamp through the object meets the
  // paper: the higher the object, the further it swings and the softer it is
  float c = 0.0;
  float k = 0.13 * 0.55; vec2 o = q - (q - L) * k;
  c = max(c, windowObj(o - W, s, k * length(q - L) * 0.5 + 0.002));
  k = 0.13 * 0.4;  o = q - (q - L) * k;
  vec2 look = L - E; look /= max(length(look), 0.001); look *= smoothstep(0.0, 0.25, length(L - E));
  c = max(c, lensObj(o - E, s, look, k * length(q - L) * 0.5 + 0.002));
  k = 0.13 * 0.22; o = q - (q - L) * k;
  c = max(c, waveObj(o - V, vw, s, t, k * length(q - L) * 0.5 + 0.0018));

  // develop: the blue comes up unevenly, the way a print does in the wash
  float dev = uExpose > 0.995 ? 1.0 : smoothstep(0.0, 1.0, uExpose * 1.45 - fbm(q * 2.6 + 3.0) * 0.45);
  float d = length(q - L);
  float pool = exp(-d * d * 2.4);
  float fibre = fbm(q * vec2(7.0, 46.0) + vec2(0.0, t * 0.01)) - 0.5;
  float e = dev * (0.6 + 0.55 * pool * uWake + fibre * 0.16);
  e *= 1.0 - c * 0.9;

  // the brushed edge of the sensitiser: the sheet stays bare at the sides and foot
  float rim = tall ? 0.6 : 1.0;
  float edge = box(q - vec2(0.0, 0.08), vec2(a * 0.5 - 0.022 * rim, 0.58), 0.0) + (fbm(q * vec2(4.0, 34.0)) - 0.5) * 0.05 * rim;
  e *= smoothstep(0.012, -0.012, edge);

  vec3 paper = vec3(0.953, 0.961, 0.976);
  vec3 c500 = vec3(0.165, 0.361, 0.753), c700 = vec3(0.071, 0.227, 0.549), c950 = vec3(0.031, 0.110, 0.290);
  vec3 col = mix(paper, c500, smoothstep(0.0, 0.32, e));
  col = mix(col, c700, smoothstep(0.3, 0.68, e));
  col = mix(col, c950, smoothstep(0.72, 1.12, e));
  col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) * 0.022;
  gl_FragColor = vec4(col, 1.0);
}`;

let seenThisLoad = false;
const SEEN = 'sk-exposed';

export default function Exposure() {
  const { go } = usePageTransition();
  const reduce = useReducedMotion();
  const tall = useMedia('(max-aspect-ratio: 9/10)');
  const rootRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const visible = useVisibleRef(rootRef);
  const [fallback, setFallback] = useState(false);
  const unsupported = useCallback(() => setFallback(true), []);

  const [returningNow] = useState(() => seenThisLoad || (() => { try { return sessionStorage.getItem(SEEN) === '1'; } catch { return false; } })());
  const returning = useRef(returningNow);
  const st = useRef({ lx: 0.68, ly: 0.62, tx: 0.68, ty: 0.62, expose: reduce ? 1 : 0, target: 1, wake: reduce ? 1 : 0, last: 0, idleAt: 0, user: false, t: 0 });
  const [done, setDone] = useState(reduce);

  useEffect(() => {
    seenThisLoad = true;
    try { sessionStorage.setItem(SEEN, '1'); } catch { /* storage blocked: the entrance plays again */ }
  }, []);

  // any input finishes the entrance
  useEffect(() => {
    if (done) return;
    const finish = () => { st.current.expose = 1; st.current.wake = 1; setDone(true); };
    const timer = window.setTimeout(() => setDone(true), returning.current ? 500 : 1500);
    window.addEventListener('keydown', finish, { once: true });
    window.addEventListener('pointerdown', finish, { once: true });
    window.addEventListener('wheel', finish, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', finish);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('wheel', finish);
    };
  }, [done]);

  // the lamp follows the pointer anywhere on the sheet (and a finger, on touch)
  useEffect(() => {
    const root = rootRef.current!;
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const s = st.current;
      s.tx = (e.clientX - r.left) / r.width;
      s.ty = 1 - (e.clientY - r.top) / r.height;
      s.user = true;
      s.idleAt = s.t;
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
    };
  }, []);

  // letters: cache their centres; each frame they lift toward the lamp and cast away from it
  const letters = useRef<{ el: HTMLElement; x: number; y: number }[]>([]);
  useEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      if (!root || !nameRef.current) return;
      const rr = root.getBoundingClientRect();
      letters.current = Array.from(nameRef.current.querySelectorAll<HTMLElement>('.xp-ch')).map((el) => {
        const r = el.getBoundingClientRect();
        return { el, x: (r.left + r.width / 2 - rr.left) / rr.width, y: 1 - (r.top + r.height / 2 - rr.top) / rr.height };
      });
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(rootRef.current!);
    return () => ro.disconnect();
  }, []);

  useTicker((time, dt) => {
    const s = st.current;
    const sec = dt;
    s.t = time;
    if (reduce) return;
    // with no hand on it, the lamp wanders slowly so the sheet never looks dead
    if (!s.user || time - s.idleAt > 4) {
      s.tx = 0.6 + Math.sin(time * 0.13) * 0.22;
      s.ty = 0.55 + Math.sin(time * 0.19 + 1) * 0.18;
    }
    s.lx = follow(s.lx, s.tx, sec, 0.16);
    s.ly = follow(s.ly, s.ty, sec, 0.16);
    s.expose = follow(s.expose, 1, sec, returning.current ? 0.12 : 0.42);
    s.wake = follow(s.wake, done ? 1 : 0.4, sec, 0.5);

    const root = rootRef.current;
    if (!root) return;
    const w = root.clientWidth;
    const h = root.clientHeight;
    for (const l of letters.current) {
      const dx = (l.x - s.lx) * w;
      const dy = (l.y - s.ly) * h;
      const dist = Math.hypot(dx, dy) || 1;
      const lift = Math.exp(-(dist * dist) / (2 * 260 * 260));
      const len = 3 + lift * 9;
      l.el.style.transform = `translate3d(0, ${(-lift * 6).toFixed(2)}px, 0)`;
      l.el.style.textShadow = `${((dx / dist) * len).toFixed(1)}px ${((-dy / dist) * len).toFixed(1)}px ${(4 + lift * 10).toFixed(1)}px rgb(8 28 74 / ${(0.35 + lift * 0.25).toFixed(2)})`;
    }
  }, visible);

  const uniforms = () => {
    const s = st.current;
    return { uLight: [s.lx, s.ly], uExpose: s.expose, uWake: s.wake };
  };

  const toWork = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go('/projects', { from: e.currentTarget.getBoundingClientRect(), color: '#081c4a', ink: '#eef2fc', label: 'The exhibition' });
  };

  const [first, last] = config.name.split(' ');
  const word = (w: string, base: number) =>
    Array.from(w).map((ch, i) => (
      <span key={i} className="xp-ch" style={{ animationDelay: `${(base + i) * 45}ms` }}>
        {ch}
      </span>
    ));

  return (
    <section ref={rootRef} id="top" className="xp" data-done={done || undefined} data-returning={returningNow || undefined} data-fallback={fallback || undefined}>
      {!fallback && <ShaderCanvas className="xp-canvas" frag={FRAG} uniforms={uniforms} maxDpr={tall ? 0.6 : 1} rootMargin="0px" onUnsupported={unsupported} />}

      <div className="xp-copy">
        <p className="xp-kicker mono">
          <span className="xp-dot" aria-hidden="true" /> {config.studio} · Designer &amp; developer
        </p>
        <h1 ref={nameRef} className="xp-name" aria-label={config.name}>
          <span className="xp-word" aria-hidden="true">{word(first, 0)}</span>
          <span className="xp-word" aria-hidden="true">{word(last ?? '', first.length)}</span>
        </h1>
        <p className="xp-what">
          I design and build <em>interactive interfaces</em>, <em>web experiences</em> and <em>AI tools</em>.
        </p>
        <p className="xp-care">I care about software that feels physical: precise, with a little play.</p>
      </div>

      <div className="xp-foot">
        <Link to="/projects" className="xp-enter" onClick={toWork} data-cursor="cta" data-cursor-label="ENTER">
          See the work <Arrow dir="right" />
        </Link>
        <p className="xp-hint mono" aria-hidden="true">
          {tall ? 'Touch to move the light' : 'Move the light'}
        </p>
      </div>
    </section>
  );
}

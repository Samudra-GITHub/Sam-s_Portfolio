import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import ShaderCanvas from '../core/ShaderCanvas';
import { usePageTransition } from '../core/PageTransition';
import { useFinePointer, useMedia, useReducedMotion } from '../../lib/runtime';
import { useTicker, useVisibleRef } from '../../lib/hooks';
import { follow } from '../../lib/motion';
import { thunk } from '../../lib/sound';
import { config } from '../../data/config';
import HomeBrowser from './HomeBrowser';
import Arrow from '../core/Arrow';
import './exposure.css';

/**
 * The homepage is one sun print, and you can make it.
 *
 * A cyanotype is paper painted with iron salts: where light reaches it, it
 * turns Prussian blue; where something lies on it, it stays white. Here the
 * pointer is the lamp. Three things lie on the sheet, one for each thing he
 * makes: a browser (a real one, paging through the featured work), a sound
 * wave, and a lens. All three cast photogram shadows that swing and soften as
 * the lamp moves; the layers drift at different depths.
 *
 * The signature: press and hold anywhere to expose. The longer you hold the
 * lamp still, the deeper the blue and the sharper the shadows; the lens is the
 * meter (its iris closes, a ring fills). Let go and the print is fixed: the
 * shadows stay where they fell, a white photogram of that moment, and the
 * sheet tells you which print it was. Hold again to make another. Keyboard:
 * the "Hold to expose" button with Space. Touch: hold a finger down.
 *
 * Nothing waits on the entrance: any key, click or wheel finishes it at once.
 */
const FRAG = `
uniform vec2 uLight; uniform float uExpose; uniform float uWake;
uniform float uHold; uniform vec2 uFixL; uniform float uFix; uniform float uFlash; uniform float uMeter;
uniform vec4 uWin; // the browser's rectangle in sheet space: centre, half size
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
float box(vec2 p, vec2 b, float r){ vec2 d = abs(p) - b + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float cover(float d, float blur){ return smoothstep(blur, -blur, d); }

// the browser lying on the sheet: an opaque frame, a translucent body
float windowObj(vec2 p, float blur){
  vec2 b = uWin.zw;
  float body = box(p, b, 0.01);
  float frame = abs(body) - 0.004;
  return max(cover(frame, blur), 0.62 * cover(body, blur));
}
float waveObj(vec2 p, float w, float s, float t, float blur){
  float env = smoothstep(w, w*0.2, abs(p.x));
  float y = 0.035*s*env*sin(p.x*26.0/s + t*1.4) * (0.6 + 0.4*sin(p.x*7.0/s - t*0.7));
  float d = max(abs(p.y - y) - 0.004*s, abs(p.x) - w);
  return cover(d, blur);
}
float lensObj(vec2 p, float s, vec2 look, float shut, float blur){
  float R = 0.075*s;
  float c = cover(abs(length(p) - R) - 0.005*s, blur);
  vec2 iris = look * R * 0.32 * (1.0 - shut);
  c = max(c, 0.5 * cover(length(p - iris) - R*(0.44 - 0.2*shut), blur));
  c = max(c, cover(length(p - iris) - R*(0.17 + 0.2*shut), blur));
  return c;
}

// every shadow on the sheet, for a lamp at L; sharp sharpens them (a held lamp, a fixed print)
float shadows(vec2 q, vec2 L, vec2 E, vec2 V, float vw, float s, float t, float sharp){
  float c = 0.0;
  float soft = 1.0 - sharp;
  float k = 0.13 * 0.6; vec2 o = q - (q - L) * k;
  c = max(c, windowObj(o - uWin.xy, k * length(q - L) * 0.5 * soft + 0.0018));
  k = 0.13 * 0.4; o = q - (q - L) * k;
  vec2 look = L - E; look /= max(length(look), 0.001); look *= smoothstep(0.0, 0.25, length(L - E));
  c = max(c, lensObj(o - E, s, look, uHold, k * length(q - L) * 0.5 * soft + 0.0018));
  k = 0.13 * 0.22; o = q - (q - L) * k;
  c = max(c, waveObj(o - V, vw, s, t, k * length(q - L) * 0.5 * soft + 0.0016));
  return c;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float a = uRes.x / uRes.y;
  vec2 q = (uv - 0.5) * vec2(a, 1.0);
  vec2 L = (uLight - 0.5) * vec2(a, 1.0);
  vec2 F = (uFixL - 0.5) * vec2(a, 1.0);
  float t = uTime;
  bool tall = a < 0.9;
  float s = tall ? clamp(a * 1.25, 0.5, 0.9) : clamp(a * 0.62, 0.8, 1.15);

  vec2 E = tall ? vec2(-a*0.5 + 0.16*s, 0.17) : vec2(a*0.5 - 0.17*s, -0.2);
  vec2 V = tall ? vec2(0.0, -0.43) : vec2(a*0.08, -0.37);
  float vw = tall ? a*0.42 : a*0.3;
  E += vec2(cos(t*0.19), sin(t*0.23)) * 0.004;

  float live = shadows(q, L, E, V, vw, s, t, uHold * 0.75);
  float fixd = uFix > 0.001 ? shadows(q, F, E, V, vw, s, 0.0, 1.0) : 0.0;

  float dev = uExpose > 0.995 ? 1.0 : smoothstep(0.0, 1.0, uExpose * 1.45 - fbm(q * 2.6 + 3.0) * 0.45);
  float d = length(q - L);
  float pool = exp(-d * d * (2.4 - uHold * 0.9));
  float fibre = fbm(q * vec2(7.0, 46.0) + vec2(0.0, t * 0.012)) - 0.5;
  float e = dev * (0.6 + 0.55 * pool * uWake + fibre * 0.16 + uHold * 0.32 + uFix * 0.1);
  // the fixed print is the base: its photogram stays white; the lamp's live shadows play faintly over it
  e *= 1.0 - fixd * uFix * 0.88;
  e *= 1.0 - live * (0.9 - 0.55 * uFix);

  float rim = tall ? 0.6 : 1.0;
  float edge = box(q - vec2(0.0, 0.08), vec2(a * 0.5 - 0.022 * rim, 0.58), 0.0) + (fbm(q * vec2(4.0, 34.0)) - 0.5) * 0.05 * rim;
  e *= smoothstep(0.012, -0.012, edge);

  vec3 paper = vec3(0.953, 0.961, 0.976);
  vec3 c500 = vec3(0.165, 0.361, 0.753), c700 = vec3(0.071, 0.227, 0.549), c950 = vec3(0.031, 0.110, 0.290);
  vec3 col = mix(paper, c500, smoothstep(0.0, 0.32, e));
  col = mix(col, c700, smoothstep(0.3, 0.68, e));
  col = mix(col, c950, smoothstep(0.72, 1.12, e));

  // the meter: a lime ring round the lens fills while you hold
  vec2 m = q - E;
  float R = 0.075 * s + 0.022 * s;
  float ang = fract(atan(m.x, m.y) / 6.28318 + 1.0);
  float ring = smoothstep(0.004, 0.0, abs(length(m) - R) - 0.003 * s) * step(ang, uMeter);
  col = mix(col, vec3(0.847, 0.973, 0.153), ring * smoothstep(0.0, 0.02, uMeter));

  col = mix(col, paper, uFlash * 0.4);
  col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) * 0.022;
  gl_FragColor = vec4(col, 1.0);
}`;

let seenThisLoad = false;
const SEEN = 'sk-exposed';
const FULL = 2.4; // seconds of holding for a full exposure

export default function Exposure() {
  const { go } = usePageTransition();
  const reduce = useReducedMotion();
  const tall = useMedia('(max-aspect-ratio: 9/10)');
  const fine = useFinePointer();
  const rootRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const visible = useVisibleRef(rootRef);
  const [fallback, setFallback] = useState(false);
  const unsupported = useCallback(() => setFallback(true), []);
  const [returningNow] = useState(() => seenThisLoad || (() => { try { return sessionStorage.getItem(SEEN) === '1'; } catch { return false; } })());
  const [done, setDone] = useState(reduce);
  const [prints, setPrints] = useState(0);

  const st = useRef({
    lx: 0.62, ly: 0.6, tx: 0.62, ty: 0.6, px: 0, py: 0,
    expose: reduce ? 1 : 0, wake: reduce ? 1 : 0, user: false, idleAt: 0, t: 0,
    holding: false, held: 0, hold: 0, fx: 0.62, fy: 0.6, fix: 0, flash: 0, meter: 0,
    win: [0.5, 0.15, 0.15, 0.1] as number[],
  });

  useEffect(() => {
    seenThisLoad = true;
    try { sessionStorage.setItem(SEEN, '1'); } catch { /* storage blocked: the entrance plays again */ }
  }, []);

  // any input finishes the entrance
  useEffect(() => {
    if (done) return;
    const finish = () => { st.current.expose = 1; st.current.wake = 1; setDone(true); };
    const timer = window.setTimeout(() => setDone(true), returningNow ? 500 : 1500);
    window.addEventListener('keydown', finish, { once: true });
    window.addEventListener('pointerdown', finish, { once: true });
    window.addEventListener('wheel', finish, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', finish);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('wheel', finish);
    };
  }, [done, returningNow]);

  // ---------- holding the lamp: the exposure ----------
  const say = (text: string) => { if (statusRef.current) statusRef.current.textContent = text; };
  const startHold = () => {
    const s = st.current;
    if (s.holding) return;
    s.holding = true;
    s.held = 0;
    rootRef.current?.setAttribute('data-holding', '');
    say('Exposing…');
  };
  const endHold = () => {
    const s = st.current;
    if (!s.holding) return;
    s.holding = false;
    rootRef.current?.removeAttribute('data-holding');
    if (s.held < 0.25 && !reduce) {
      say('Hold a little longer to fix a print.');
      return;
    }
    s.fx = s.lx;
    s.fy = s.ly;
    s.fix = 0.001;
    s.flash = reduce ? 0 : 1;
    const secs = reduce ? FULL : Math.min(s.held, FULL);
    setPrints((n) => {
      const next = n + 1;
      say(`Print ${String(next).padStart(2, '0')} fixed · ${secs.toFixed(1)}s exposure. Hold again for another.`);
      return next;
    });
    thunk();
  };
  const holdRef = useRef({ startHold, endHold });
  useEffect(() => {
    holdRef.current = { startHold, endHold };
  });

  // the lamp follows the pointer anywhere on the sheet (and a finger, on touch); a press on the paper itself starts an exposure
  useEffect(() => {
    const root = rootRef.current!;
    const place = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const s = st.current;
      s.tx = (e.clientX - r.left) / r.width;
      s.ty = 1 - (e.clientY - r.top) / r.height;
      s.user = true;
      s.idleAt = s.t;
    };
    const down = (e: PointerEvent) => {
      place(e);
      if (e.button !== 0) return;
      const el = e.target as HTMLElement;
      if (el.closest('a, button, [data-hold-ignore], .nav')) return;
      holdRef.current.startHold();
    };
    const up = () => holdRef.current.endHold();
    window.addEventListener('pointermove', place, { passive: true });
    root.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', up);
    return () => {
      window.removeEventListener('pointermove', place);
      root.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('blur', up);
    };
  }, []);

  const onHoldKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      startHold();
    }
  };
  const onHoldKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      endHold();
    }
  };

  // ---------- measuring what lies on the sheet ----------
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
      const w = winRef.current;
      if (w) {
        // in sheet space: y up, x scaled by aspect, origin at the centre (the shader's q)
        const a = rr.width / rr.height;
        const r = w.getBoundingClientRect();
        const cx = (r.left + r.width / 2 - rr.left) / rr.width;
        const cy = 1 - (r.top + r.height / 2 - rr.top) / rr.height;
        st.current.win = [(cx - 0.5) * a, cy - 0.5, (r.width / rr.width / 2) * a, r.height / rr.height / 2];
      }
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(rootRef.current!);
    return () => ro.disconnect();
  }, []);

  useTicker((time, dt) => {
    const s = st.current;
    s.t = time;
    const root = rootRef.current;
    if (!root) return;

    if (!reduce && (!s.user || time - s.idleAt > 5) && !s.holding) {
      // with no hand on it, the lamp wanders slowly so the sheet never looks dead
      s.tx = 0.58 + Math.sin(time * 0.13) * 0.22;
      s.ty = 0.55 + Math.sin(time * 0.19 + 1) * 0.18;
    }
    const resp = reduce ? 0.0001 : s.holding ? 0.5 : 0.16; // a held lamp is heavy: it moves slowly
    s.lx = follow(s.lx, s.tx, dt, resp);
    s.ly = follow(s.ly, s.ty, dt, resp);
    s.expose = reduce ? 1 : follow(s.expose, 1, dt, returningNow ? 0.12 : 0.42);
    s.wake = reduce ? 1 : follow(s.wake, done ? 1 : 0.4, dt, 0.5);
    if (s.holding) s.held += dt;
    s.hold = follow(s.hold, s.holding ? Math.min(1, s.held / FULL) : 0, dt, s.holding ? 0.08 : 0.3);
    s.meter = s.holding ? Math.min(1, s.held / FULL) : follow(s.meter, 0, dt, 0.25);
    if (s.fix > 0) s.fix = follow(s.fix, 1, dt, reduce ? 0.0001 : 0.35);
    s.flash = follow(s.flash, 0, dt, 0.18);
    if (s.holding && statusRef.current) statusRef.current.textContent = `Exposing · ${Math.min(s.held, FULL).toFixed(1)}s${s.held >= FULL ? ' (full)' : ''}`;

    if (reduce) return;
    // depth: each layer drifts with the pointer at its own distance from the paper
    s.px = follow(s.px, s.lx - 0.5, dt, 0.3);
    s.py = follow(s.py, 0.5 - s.ly, dt, 0.3);
    root.style.setProperty('--px', s.px.toFixed(4));
    root.style.setProperty('--py', s.py.toFixed(4));

    const w = root.clientWidth;
    const h = root.clientHeight;
    for (const l of letters.current) {
      const dx = (l.x - s.lx) * w;
      const dy = (l.y - s.ly) * h;
      const dist = Math.hypot(dx, dy) || 1;
      const lift = Math.exp(-(dist * dist) / (2 * 260 * 260));
      const len = 3 + lift * 9 + s.hold * 4;
      l.el.style.transform = `translate3d(0, ${(-lift * 6).toFixed(2)}px, 0)`;
      l.el.style.textShadow = `${((dx / dist) * len).toFixed(1)}px ${((-dy / dist) * len).toFixed(1)}px ${((4 + lift * 10) * (1 - s.hold * 0.7)).toFixed(1)}px rgb(8 28 74 / ${(0.35 + lift * 0.25).toFixed(2)})`;
    }
  }, visible);

  const uniforms = () => {
    const s = st.current;
    return { uLight: [s.lx, s.ly], uExpose: s.expose, uWake: s.wake, uHold: s.hold, uFixL: [s.fx, s.fy], uFix: s.fix, uFlash: s.flash, uMeter: s.meter, uWin: s.win };
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
    <section ref={rootRef} id="top" className="xp" data-done={done || undefined} data-returning={returningNow || undefined} data-fallback={fallback || undefined} data-printed={prints > 0 || undefined}>
      {!fallback && <ShaderCanvas className="xp-canvas" frag={FRAG} uniforms={uniforms} maxDpr={tall ? 0.6 : 1} rootMargin="0px" onUnsupported={unsupported} />}

      <div className="xp-win">
        <HomeBrowser ref={winRef} />
      </div>

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
        <p className="xp-care">Software that feels physical: precise, with a little play. This page is a sun print, and you can make one.</p>
      </div>

      <div className="xp-foot">
        <Link to="/projects" className="xp-enter" onClick={toWork} data-cursor="cta" data-cursor-label="ENTER">
          See all the work <Arrow dir="right" />
        </Link>
        {!fallback && (
          <div className="xp-make">
            <button
              type="button"
              className="xp-hold mono"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                startHold();
              }}
              onKeyDown={onHoldKey}
              onKeyUp={onHoldKeyUp}
              onBlur={endHold}
              aria-describedby="xp-status"
              data-cursor="cta"
              data-cursor-label="HOLD"
            >
              <span className="xp-hold-meter" aria-hidden="true" />
              Hold to expose
            </button>
            <p id="xp-status" ref={statusRef} className="xp-status mono" aria-live="polite">
              {fine ? 'Move the light. Hold anywhere to make a print' : 'Hold a finger on the sheet to make a print'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../../data/config';
import { useReducedMotion } from '../../lib/runtime';
import { usePageTransition } from '../core/PageTransition';
import { glassLift, glassSettle } from '../../lib/sound';
import Arrow from '../core/Arrow';
import './glass.css';

/**
 * The homepage: one drop of liquid glass resting on a name.
 *
 * The name is set huge on deep blue. A single drop sits on it and really
 * refracts it: letters under the glass are magnified and bent toward the rim,
 * split very slightly into colour at the edge, lit by a lime rim light and one
 * white highlight that both follow the light source (the pointer).
 *
 * The interaction is the drop itself. Hover and it leans toward you; press and
 * drag (mouse or finger) to carry it anywhere on the name; it stretches with its
 * speed, and on release springs home with a real, damped wobble. At rest it
 * only breathes. Under reduced motion it is a still, crisp lens.
 *
 * The h1 stays real text (laid out, read by assistive tech and search); the
 * WebGL pass draws the same words into a texture so it can bend them. If WebGL
 * is unavailable the h1 is simply shown.
 */
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes; uniform float uTime; uniform float uPx;
uniform vec2 uC; uniform float uR; uniform vec2 uVel; uniform vec2 uLean; uniform vec2 uLight;
uniform float uIntro; uniform float uPress;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// the drop: a breathing circle, stretched along its velocity, with a lobe that leans toward the hand
float drop(vec2 p){
  vec2 q = p - uC;
  float sp = length(uVel);
  vec2 dir = sp > 0.001 ? uVel / sp : vec2(1.0, 0.0);
  float st = min(sp, 0.45);
  float along = dot(q, dir), across = dot(q, vec2(-dir.y, dir.x));
  q = dir * along / (1.0 + st) + vec2(-dir.y, dir.x) * across * (1.0 + st * 0.5);
  float a = atan(q.y, q.x);
  float t = uTime;
  float R = uR * (1.0 + 0.05 * uPress) * (1.0 + 0.022 * sin(a * 3.0 + t * 0.9) + 0.016 * sin(a * 5.0 - t * 1.3) + 0.01 * sin(a * 2.0 + t * 0.5));
  float d = length(q) - R;
  float lobe = length(p - (uC + uLean)) - uR * 0.42;
  return smin(d, lobe, uR * 0.42);
}

vec4 text(vec2 p){ return texture2D(uTex, p / uRes); }
// the ground at any point: deep blue with a soft pool of light round the drop's home
vec3 ground(vec2 p){
  vec3 deep = vec3(0.027, 0.086, 0.247), mid = vec3(0.071, 0.212, 0.533);
  float pool = exp(-pow(length((p - uC) / (uR * 3.2)), 2.0));
  return mix(deep, mid, 0.45 + 0.4 * pool - 0.25 * length(p / uRes - 0.5));
}

void main(){
  vec2 p = gl_FragCoord.xy;
  vec2 uv = p / uRes;
  float t = uTime;

  // the ground: deep blue, a soft pool of light behind the drop, fine grain
  vec3 deep = vec3(0.027, 0.086, 0.247), mid = vec3(0.071, 0.212, 0.533);
  float pool = exp(-pow(length((p - uC) / (uR * 3.2)), 2.0));
  vec3 bg = mix(deep, mid, 0.45 + 0.4 * pool - 0.25 * length(uv - 0.5));

  float d = drop(p);
  // the drop's shadow on the ground, cast away from the light
  vec2 Ld = normalize(uLight - uC + vec2(0.0001));
  float sh = smoothstep(uR * 0.7, -uR * 0.3, drop(p + Ld * uR * 0.18));
  bg *= 1.0 - 0.32 * sh * uIntro;

  // the name, revealed line by line as the drop wells up
  vec4 tx = text(p);
  float reveal = smoothstep(0.0, 1.0, clamp(uIntro * 1.6 - (1.0 - uv.y) * 0.6, 0.0, 1.0));
  vec3 col = mix(bg, vec3(0.953, 0.961, 0.976), tx.a * reveal);

  // inside the glass
  float inside = smoothstep(1.2 * uPx, -1.2 * uPx, d);
  if (inside > 0.0) {
    float e = 1.5 * uPx;
    vec2 g = vec2(drop(p + vec2(e, 0.0)) - drop(p - vec2(e, 0.0)), drop(p + vec2(0.0, e)) - drop(p - vec2(0.0, e)));
    vec2 n = g / max(length(g), 1e-4);
    float depth = clamp(-d / uR, 0.0, 1.0);         // 0 at the rim, 1 in the middle
    float dome = sqrt(1.0 - pow(1.0 - depth, 2.0));  // a lens profile
    float bend = pow(1.0 - dome, 2.2);
    // a drop is a ball lens: it shows the world behind it widened and upside down,
    // folding hard at the rim; colour splits a little at the edge
    vec2 v = p - uC;
    vec2 base = uC - v * (2.1 - 1.1 * bend) + n * bend * uR * 0.5;
    vec2 ca = n * bend * uR * 0.04;
    float ar = text(base - ca).a, ag = text(base).a, ab = text(base + ca).a;
    vec3 seen = mix(ground(base), vec3(0.97, 0.98, 1.0), vec3(ar, ag, ab) * reveal);
    vec3 lit = seen * vec3(0.9, 0.95, 1.06) + vec3(0.02, 0.05, 0.12) * dome;
    // rim light (lime) on the side facing the light, a cool rim on the other
    float rim = pow(1.0 - dome, 3.0);
    float facing = dot(-n, Ld) * 0.5 + 0.5;
    lit += vec3(0.847, 0.973, 0.153) * rim * pow(facing, 2.0) * 0.9;
    lit += vec3(0.55, 0.7, 1.0) * rim * pow(1.0 - facing, 2.0) * 0.25;
    // one specular highlight, and a soft inner shade opposite it
    vec2 S = uC + Ld * uR * 0.42;
    lit += vec3(1.0) * exp(-pow(length(p - S) / (uR * 0.11), 2.0)) * 0.85;
    lit += vec3(1.0) * exp(-pow(length(p - (uC + Ld * uR * 0.18)) / (uR * 0.5), 2.0)) * 0.06;
    lit *= 1.0 - 0.18 * smoothstep(0.2, 1.0, dot(normalize(p - uC + 0.0001), -Ld)) * (1.0 - dome);
    col = mix(col, lit, inside * smoothstep(0.0, 0.25, uIntro));
  }

  col += (hash(p + fract(t)) - 0.5) * 0.018;
  gl_FragColor = vec4(col, 1.0);
}`;

export default function GlassHero() {
  const { go } = usePageTransition();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [gl, setGl] = useState<'pending' | 'on' | 'off'>('pending');

  useEffect(() => {
    const root = rootRef.current!;
    // a fresh canvas per mount: a released context can never be re-acquired from the same element
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    wrapRef.current!.appendChild(canvas);
    const h1 = nameRef.current!;
    const ctx = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!ctx) {
      canvas.remove();
      setGl('off');
      return;
    }
    const g = ctx;
    const compile = (type: number, src: string) => {
      const s = g.createShader(type)!;
      g.shaderSource(s, src);
      g.compileShader(s);
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    let prog: WebGLProgram;
    try {
      prog = g.createProgram()!;
      g.attachShader(prog, compile(g.VERTEX_SHADER, VERT));
      g.attachShader(prog, compile(g.FRAGMENT_SHADER, FRAG));
      g.linkProgram(prog);
      if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error('link');
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[glass] shader failed, showing the plain name instead:', err);
      canvas.remove();
      setGl('off');
      return;
    }
    g.useProgram(prog);
    const buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(prog, 'p');
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    const U = (n: string) => g.getUniformLocation(prog, n);
    const u = { tex: U('uTex'), res: U('uRes'), time: U('uTime'), px: U('uPx'), c: U('uC'), r: U('uR'), vel: U('uVel'), lean: U('uLean'), light: U('uLight'), intro: U('uIntro'), press: U('uPress') };
    const tex = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
    const paper = document.createElement('canvas');

    // ---------- state: everything in device pixels, y up ----------
    const s = {
      w: 1, h: 1, dpr: 1, home: [0, 0], x: 0, y: 0, vx: 0, vy: 0, r: 100,
      lean: [0, 0], leanT: [0, 0], light: [0, 0], lightT: [0, 0],
      hand: false, drag: false, grab: [0, 0], px: 0, py: 0, press: 0,
      intro: reduce ? 1 : 0, start: performance.now(), raf: 0, last: 0, visible: true,
    };

    // the drop rests where the type leaves room, sized from the type itself:
    // in the word space on one line, between the lines (a little right) when stacked
    const restingPlace = (rr: DOMRect) => {
      const [l1, l2] = Array.from(h1.querySelectorAll<HTMLElement>('.gh-line')).map((l) => l.getBoundingClientRect());
      const fs = parseFloat(getComputedStyle(h1).fontSize);
      const oneLine = Math.abs(l1.top - l2.top) < 4;
      const cx = oneLine ? (l1.right + l2.left) / 2 : rr.left + rr.width * 0.62;
      const cy = oneLine ? (l1.top + l1.bottom) / 2 : (l1.bottom + l2.top) / 2;
      return { cx: cx - rr.left, cy: cy - rr.top, r: fs * (oneLine ? 1.05 : 0.8) };
    };
    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 1.75);
      const rr = root.getBoundingClientRect();
      s.dpr = dpr;
      s.w = Math.max(1, Math.round(rr.width * dpr));
      s.h = Math.max(1, Math.round(rr.height * dpr));
      canvas.width = s.w;
      canvas.height = s.h;
      g.viewport(0, 0, s.w, s.h);
      const a = restingPlace(rr);
      const hx = a.cx * dpr;
      const hy = (rr.height - a.cy) * dpr;
      const first = s.home[0] === 0 && s.home[1] === 0;
      s.home = [hx, hy];
      s.r = a.r * dpr;
      if (first) {
        s.x = hx;
        s.y = hy;
        s.light = [hx + s.r * 0.8, hy + s.r * 0.9];
        s.lightT = [...s.light];
      }
      // the words, drawn exactly where the h1 lays them out
      paper.width = s.w;
      paper.height = s.h;
      const c2 = paper.getContext('2d')!;
      c2.clearRect(0, 0, s.w, s.h);
      const cs = getComputedStyle(h1);
      c2.fillStyle = '#fff';
      c2.textBaseline = 'alphabetic';
      for (const line of Array.from(h1.querySelectorAll<HTMLElement>('.gh-line'))) {
        const r = line.getBoundingClientRect();
        const word = (line.textContent ?? '').toUpperCase();
        const stretch = parseFloat(cs.fontStretch) >= 112 || cs.fontStretch === 'expanded' ? 'expanded' : 'normal';
        const ext = c2 as CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };
        const setFont = (px: number) => {
          c2.font = `${cs.fontWeight} ${stretch} ${px}px ${cs.fontFamily}`;
          ext.fontStretch = stretch;
          ext.letterSpacing = `${(parseFloat(cs.letterSpacing || '0') / parseFloat(cs.fontSize)) * px}px`;
        };
        let fs = parseFloat(cs.fontSize) * dpr;
        setFont(fs);
        // fit the drawn word to the width the browser laid out, so the two always agree
        const want = r.width * dpr;
        const got = c2.measureText(word).width;
        if (got > 0 && Math.abs(got - want) / want > 0.01) {
          fs *= Math.max(0.75, Math.min(1.3, want / got));
          setFont(fs);
        }
        const m = c2.measureText(word);
        const top = (r.top - rr.top) * dpr;
        const boxH = r.height * dpr;
        // centre the glyphs' ink box in the line box, as the browser does for caps
        const ink = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        const base = top + (boxH - ink) / 2 + m.actualBoundingBoxAscent;
        const left = (r.left - rr.left) * dpr + (r.width * dpr - m.width) / 2;
        c2.fillText(word, left, base);
      }
      g.bindTexture(g.TEXTURE_2D, tex);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, paper);
      draw(performance.now());
    };

    const draw = (now: number) => {
      const t = reduce ? 4 : (now - s.start) / 1000;
      g.uniform1i(u.tex, 0);
      g.uniform2f(u.res, s.w, s.h);
      g.uniform1f(u.time, t);
      g.uniform1f(u.px, s.dpr);
      g.uniform2f(u.c, s.x, s.y);
      g.uniform1f(u.r, s.r * (reduce ? 1 : elastic(s.intro)));
      g.uniform2f(u.vel, (s.vx / (s.r * 9)) || 0, (s.vy / (s.r * 9)) || 0);
      g.uniform2f(u.lean, s.lean[0], s.lean[1]);
      g.uniform2f(u.light, s.light[0], s.light[1]);
      g.uniform1f(u.intro, s.intro);
      g.uniform1f(u.press, s.press);
      g.drawArrays(g.TRIANGLES, 0, 3);
    };

    // ---------- physics ----------
    const step = (now: number) => {
      const dt = Math.min(0.033, s.last ? (now - s.last) / 1000 : 0.016);
      s.last = now;
      if (!reduce) s.intro = Math.min(1, s.intro + dt / 1.4);
      const [tx, ty] = s.drag ? [s.px - s.grab[0], s.py - s.grab[1]] : s.home;
      if (reduce) {
        s.x = tx;
        s.y = ty;
        s.vx = s.vy = 0;
      } else {
        // an underdamped spring: carried, it follows tightly; released, it overshoots home and settles
        const k = s.drag ? 520 : 150;
        const c = s.drag ? 46 : 11;
        s.vx += ((tx - s.x) * k - s.vx * c) * dt;
        s.vy += ((ty - s.y) * k - s.vy * c) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      const f = reduce ? 1 : 1 - Math.exp(-dt / 0.16);
      s.lean[0] += (s.leanT[0] - s.lean[0]) * f;
      s.lean[1] += (s.leanT[1] - s.lean[1]) * f;
      s.light[0] += (s.lightT[0] - s.light[0]) * f;
      s.light[1] += (s.lightT[1] - s.light[1]) * f;
      s.press += ((s.drag ? 1 : 0) - s.press) * (1 - Math.exp(-dt / 0.12));
      if (!s.hand && !s.drag) {
        // idle: the light drifts slowly round the drop so the glass is never flat
        const a = now / 4200;
        s.lightT = [s.home[0] + Math.cos(a) * s.r * 1.3, s.home[1] + s.r * 0.9 + Math.sin(a) * s.r * 0.5];
        s.leanT = [0, 0];
      }
      draw(now);
      const settled = reduce && !s.drag;
      s.raf = s.visible && !settled ? requestAnimationFrame(step) : 0;
    };
    const kick = () => {
      if (!s.raf && s.visible) {
        s.last = 0;
        s.raf = requestAnimationFrame(step);
      }
    };

    // ---------- the hand ----------
    const toDev = (e: PointerEvent) => {
      const rr = root.getBoundingClientRect();
      return [(e.clientX - rr.left) * s.dpr, (rr.bottom - e.clientY) * s.dpr];
    };
    const onMove = (e: PointerEvent) => {
      const [x, y] = toDev(e);
      s.px = x;
      s.py = y;
      s.lightT = [x, y + s.r * 0.4];
      if (e.pointerType === 'mouse' && !s.drag) {
        // hover: the drop leans toward the hand, more as it comes near
        const dx = x - s.x, dy = y - s.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = Math.max(0, 1 - dist / (s.r * 4)) * s.r * 0.55;
        s.leanT = [(dx / dist) * pull, (dy / dist) * pull];
        s.hand = true;
      }
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('a, button, .nav')) return;
      const [x, y] = toDev(e);
      // pick the drop up wherever you press on the stage: it comes to the hand
      s.drag = true;
      s.grab = Math.hypot(x - s.x, y - s.y) < s.r ? [x - s.x, y - s.y] : [0, 0];
      s.px = x;
      s.py = y;
      s.leanT = [0, 0];
      s.lightT = [x, y + s.r * 0.4];
      root.setAttribute('data-holding', '');
      glassLift(y / s.h);
      root.setPointerCapture?.(e.pointerId);
      kick();
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false;
      root.removeAttribute('data-holding');
      glassSettle(Math.hypot(s.vx, s.vy) / (s.r * 20));
      kick();
    };
    const onLeave = () => {
      s.hand = false;
      kick();
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    root.addEventListener('pointerleave', onLeave);
    const onVis = () => {
      s.visible = document.visibilityState === 'visible';
      if (s.visible) kick();
    };
    document.addEventListener('visibilitychange', onVis);

    const ro = new ResizeObserver(() => layout());
    ro.observe(root);
    let alive = true;
    document.fonts?.ready.then(() => alive && layout());
    layout();
    setGl('on');
    kick();
    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      setGl('off');
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      alive = false;
      cancelAnimationFrame(s.raf);
      ro.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      root.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      g.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, [reduce]);

  const explore = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go('/projects', { from: e.currentTarget.getBoundingClientRect(), color: '#081c4a', ink: '#eef2fc', label: 'The work' });
  };

  const [first, last] = config.name.split(' ');
  return (
    <section ref={rootRef} className="gh" data-gl={gl} aria-labelledby="gh-name">
      <div ref={wrapRef} className="gh-canvas" aria-hidden="true" />
      <div className="gh-stage">
        <h1 id="gh-name" ref={nameRef} className="gh-name">
          <span className="gh-line">{first}</span> <span className="gh-line">{last}</span>
        </h1>
      </div>
      <div className="gh-foot">
        <p className="gh-role mono">Designer &amp; Developer</p>
        <p className="gh-line-copy">I design and build interactive interfaces, web experiences, and AI tools.</p>
        <Link to="/projects" className="gh-cta" onClick={explore}>
          Explore my work <Arrow dir="right" />
        </Link>
      </div>
    </section>
  );
}

/** the drop wells up: a quick rise with one soft overshoot */
function elastic(x: number) {
  if (x >= 1) return 1;
  if (x <= 0) return 0.0001;
  return 1 - Math.pow(2, -9 * x) * Math.cos(x * Math.PI * 2.6);
}

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { featured, projects } from '../../data/projects';
import { real } from '../../lib/content';
import { useTicker, useVisibleRef } from '../../lib/hooks';
import { scrollToTarget, scrollY, scrollVelocity } from '../../lib/scroll';
import { useMedia, useReducedMotion } from '../../lib/runtime';
import { tick as soundTick } from '../../lib/sound';
import { usePageTransition } from '../core/PageTransition';
import ProximityText from '../core/ProximityText';
import Arrow from '../core/Arrow';
import PlanetSurface from './PlanetSurface';
import './universe.css';

/**
 * THE HOMEPAGE: a small universe with the name at its centre.
 *
 * The nine featured projects orbit "SAMUDRA KAR" on tilted rings, drawn in
 * perspective: the near half of every ring passes in front of the name, the
 * far half behind it, so the identity sits inside the scene, not beside it.
 *
 *   environment   rings turn slowly, inner worlds faster (w ~ r^-1.5)
 *   pointer       drag anywhere to turn the system, with momentum
 *   selection     a world flies out of its orbit to the focus slot and its
 *                 panel opens (description, stack, real links); others dim
 *   scroll        leaving the hero closes the rings edge-on
 *   entrance      rings and worlds arrive from the centre once, in about a
 *                 second; any input finishes it immediately
 *
 * Canvases draw the rings; planets are real buttons so the scene is usable
 * without a pointer, and the rail below lists every world as plain buttons.
 * Per-frame work writes canvas pixels and transforms only, and stops when
 * nothing is moving or the hero is offscreen.
 */

const TAU = Math.PI * 2;
/** planets are laid out at this size and scaled down, so the focused one renders sharp */
const BASE = 360;
const SESSION_FLAG = 'sk-universe-seen';
let introSeen: boolean | null = null;

interface Body {
  phase: number;
  speed: number;
  /** 0 in orbit, 1 in the focus slot */
  k: number;
  /** hover emphasis */
  h: number;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function Universe() {
  const { go } = usePageTransition();
  const reduce = useReducedMotion();
  const compact = useMedia('(max-width: 759px)');
  const rootRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const planetRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const visible = useVisibleRef(rootRef, '0px');

  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const selRef = useRef<number | null>(null);
  const hovRef = useRef<number | null>(null);

  const n = featured.length;
  const bodies = useRef<Body[]>(featured.map((_, i) => ({ phase: 0.9 + i * 2.39996, speed: Math.pow(1 / (1 + i * 0.32), 1.5), k: 0, h: 0 })));

  // camera and frame state, mutated by the ticker
  const cam = useRef({ yaw: 0.35, vel: 0, dragging: false, lastX: 0, lastT: 0, downX: 0, moved: false, t: 0 });
  const geo = useRef({ w: 0, h: 0, dpr: 1, dirty: true });
  const intro = useRef({ t: 0 });
  const lastScroll = useRef(-1);
  // pointer parallax: the camera leans a little toward the pointer (eased)
  const look = useRef({ tx: 0, ty: 0, x: 0, y: 0 });
  useEffect(() => {
    selRef.current = selected;
    hovRef.current = hovered;
    geo.current.dirty = true;
  }, [selected, hovered]);

  // entrance: once per session, never under reduced motion; any input completes it
  useEffect(() => {
    // read once per page load (StrictMode runs effects twice in dev)
    if (introSeen === null) {
      try {
        introSeen = sessionStorage.getItem(SESSION_FLAG) === '1';
        sessionStorage.setItem(SESSION_FLAG, '1');
      } catch {
        introSeen = false; // storage blocked: play it
      }
    }
    if (reduce || introSeen) intro.current.t = 1;
    rootRef.current?.setAttribute('data-intro', intro.current.t < 1 ? 'playing' : 'done');
    const skip = () => {
      intro.current.t = 1;
      rootRef.current?.setAttribute('data-intro', 'done');
    };
    const opts = { once: true, passive: true } as const;
    window.addEventListener('pointerdown', skip, opts);
    window.addEventListener('keydown', skip, opts);
    window.addEventListener('wheel', skip, opts);
    window.addEventListener('touchstart', skip, opts);
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchstart', skip);
    };
  }, [reduce]);

  // canvas size follows the scene
  useEffect(() => {
    const scene = sceneRef.current!;
    const ro = new ResizeObserver(() => {
      const r = scene.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
      for (const c of [backRef.current, frontRef.current]) {
        if (!c) continue;
        c.width = Math.round(r.width * dpr);
        c.height = Math.round(r.height * dpr);
      }
      geo.current = { w: r.width, h: r.height, dpr, dirty: true };
    });
    ro.observe(scene);
    return () => ro.disconnect();
  }, [compact]);

  const select = useCallback(
    (i: number | null) => {
      setSelected((cur) => {
        if (cur === i) return cur;
        if (i !== null) soundTick();
        return i;
      });
      geo.current.dirty = true;
    },
    [],
  );

  // Escape closes an open world from anywhere on the page
  useEffect(() => {
    if (selected === null) return;
    const onEsc = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && select(null);
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [selected, select]);

  // keyboard: arrows walk the worlds, Escape returns to the overview
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && selRef.current !== null) {
      select(null);
      return;
    }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea')) return;
    const cur = selRef.current ?? (e.key === 'ArrowRight' ? -1 : n);
    const next = (cur + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
    e.preventDefault();
    select(next);
    document.querySelector<HTMLButtonElement>(`.uni-rail [data-index="${next}"]`)?.focus({ preventScroll: true });
  };

  // ---------- the frame ----------
  useTicker((_, dt) => {
    const g = geo.current;
    const back = backRef.current?.getContext('2d');
    const front = frontRef.current?.getContext('2d');
    if (!back || !front || !g.w) return;
    const c = cam.current;
    const it = intro.current;

    // what can change this frame
    const y = scrollY.get();
    const scrolled = y !== lastScroll.current;
    lastScroll.current = y;
    const drifting = !reduce;
    let moving = drifting || c.dragging || Math.abs(c.vel) > 0.0005 || it.t < 1 || scrolled || g.dirty;

    // clocks
    if (it.t < 1) it.t = Math.min(1, it.t + dt / 1.15);
    if (drifting) c.t += dt * (0.05 + Math.min(Math.abs(scrollVelocity.get()), 60) * 0.002);
    if (!c.dragging && Math.abs(c.vel) > 0.0005) {
      c.yaw += c.vel * dt;
      c.vel *= Math.exp(-dt * 2.6);
    }
    if (drifting && !c.dragging) c.yaw += dt * 0.025;

    // focus and hover springs (critically damped feel; interruptible because they ease from the live value)
    const sel = selRef.current;
    const hov = hovRef.current;
    const kRate = reduce ? 1 : 1 - Math.exp(-dt * 7.5);
    const hRate = reduce ? 1 : 1 - Math.exp(-dt * 14);
    let focus = 0;
    for (let i = 0; i < n; i++) {
      const b = bodies.current[i];
      const kt = sel === i ? 1 : 0;
      const ht = hov === i ? 1 : 0;
      const dk = kt - b.k;
      const dh = ht - b.h;
      if (Math.abs(dk) > 0.001) {
        b.k += dk * kRate;
        moving = true;
      } else b.k = kt;
      if (Math.abs(dh) > 0.001) {
        b.h += dh * hRate;
        moving = true;
      } else b.h = ht;
      focus = Math.max(focus, b.k);
    }
    if (!moving) return;
    g.dirty = false;

    // geometry: the system is sized from the scene, never wider than it
    const W = g.w;
    const H = g.h;
    const span = compact ? W : Math.min(W, H * 2.05);
    const R0 = span * (compact ? 0.2 : 0.17);
    const R1 = span * (compact ? 0.41 : 0.41);
    const step = (R1 - R0) / Math.max(1, n - 1);
    const lk = look.current;
    const lRate = reduce ? 1 : 1 - Math.exp(-dt * 3);
    if (Math.abs(lk.tx - lk.x) + Math.abs(lk.ty - lk.y) > 0.0005) {
      lk.x += (lk.tx - lk.x) * lRate;
      lk.y += (lk.ty - lk.y) * lRate;
    }
    // with a world in focus, the system slides away from the panel so text never sits on a ring
    const side = compact ? 0 : ease(focus) * W * 0.16;
    const cx = W * 0.5 + side + lk.x * W * 0.012;
    const cy = H * (compact ? 0.47 : 0.52) + lk.y * H * 0.012;
    const leave = Math.min(1, Math.max(0, y / Math.max(1, H * 0.85)));
    const baseElev = (compact ? 0.46 : 0.36) + lk.y * 0.06;
    const elev = baseElev * (1 - 0.86 * leave) * (0.75 + 0.25 * ease(it.t));
    const D = R1 * 1.7;
    const cosE = Math.cos(elev);
    const sinE = Math.sin(elev);
    const project = (x: number, z: number) => {
      const s = D / (D + z * cosE);
      return { sx: cx + x * s, sy: cy - z * sinE * s, s };
    };

    // ---------- rings ----------
    const dpr = g.dpr;
    for (const ctx of [back, front]) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
    }
    // a faint glow behind the name: the light the worlds orbit
    const glow = back.createRadialGradient(cx, cy, 0, cx, cy, R0 * 1.6);
    glow.addColorStop(0, `rgba(238,242,252,${0.12 * (1 - focus * 0.6)})`);
    glow.addColorStop(1, 'rgba(238,242,252,0)');
    back.fillStyle = glow;
    back.fillRect(0, 0, W, H);

    const SEG = compact ? 72 : 120;
    for (let i = 0; i < n; i++) {
      const b = bodies.current[i];
      const arrive = Math.min(1, Math.max(0, it.t * 1.7 - i * 0.07));
      const r = (R0 + i * step) * (0.55 + 0.45 * ease(arrive));
      const strong = Math.max(b.k, b.h);
      const dimmed = focus > 0 && b.k < 0.5 ? 1 - focus * 0.72 : 1;
      const alpha = (0.38 + 0.55 * strong) * dimmed * arrive;
      for (const [ctx, wantNear] of [
        [back, false],
        [front, true],
      ] as const) {
        ctx.beginPath();
        let open = false;
        for (let k = 0; k <= SEG; k++) {
          const a = (k / SEG) * TAU;
          const x = r * Math.cos(a);
          const z = r * Math.sin(a);
          const near = z < 0;
          if (near !== wantNear) {
            open = false;
            continue;
          }
          const p = project(x, z);
          if (!open) {
            ctx.moveTo(p.sx, p.sy);
            open = true;
          } else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = `rgba(238,242,252,${alpha.toFixed(3)})`;
        ctx.lineWidth = strong > 0.5 ? 1.5 : 1;
        ctx.setLineDash(strong > 0.5 ? [] : [2, 6]);
        ctx.stroke();
      }
    }

    // ---------- worlds ----------
    const unit = (compact ? W / 390 : Math.min(W / 1440, H / 860)) * (compact ? 40 : 76);
    const slotX = compact ? cx : W * 0.72;
    const slotY = compact ? cy : H * 0.5;
    const slotSize = compact ? Math.min(W * 0.42, H * 0.46) : Math.min(W * 0.27, H * 0.5);
    let label: { x: number; y: number; s: number } | null = null;
    for (let i = 0; i < n; i++) {
      const el = planetRefs.current[i];
      const b = bodies.current[i];
      if (!el) continue;
      const arrive = Math.min(1, Math.max(0, it.t * 1.7 - 0.12 - i * 0.07));
      const r = (R0 + i * step) * (0.55 + 0.45 * ease(arrive));
      const a = b.phase + c.t * b.speed + c.yaw;
      const p = project(r * Math.cos(a), r * Math.sin(a));
      const near = Math.sin(a) < 0;
      // near worlds swell, far ones recede; capped so the nearest never crowds the rail or the edge
      const orbitSize = unit * Math.min(1.75, Math.pow(p.s, 1.6)) * (1 + 0.3 * b.h);
      const kk = ease(b.k);
      const x = p.sx + (slotX - p.sx) * kk;
      const yy = p.sy + (slotY - p.sy) * kk;
      const size = orbitSize + (slotSize - orbitSize) * kk;
      const scale = size / BASE;
      el.style.transform = `translate3d(${(x - BASE / 2).toFixed(2)}px, ${(yy - BASE / 2).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      const dim = focus > 0 && b.k < 0.5 ? 1 - focus * 0.7 : 1;
      // far worlds sit back in the haze; near ones are fully lit
      el.style.opacity = (arrive * dim * (near || b.k > 0.5 ? 1 : 0.72)).toFixed(3);
      el.style.zIndex = b.k > 0.02 ? '8' : near ? '5' : '1';
      if (hov === i && b.k < 0.5) label = { x, y: yy, s: size };
    }

    // the name dims as a world comes into focus, and lifts as the hero leaves
    const nm = nameRef.current;
    if (nm) {
      nm.style.opacity = ((1 - focus * 0.95) * (1 - leave * 0.6)).toFixed(3);
      nm.style.transform = `translate3d(0, ${(-leave * H * 0.08).toFixed(1)}px, 0) scale(${(1 - focus * 0.04).toFixed(4)})`;
    }
    const lb = labelRef.current;
    if (lb) {
      if (label) {
        lb.style.opacity = '1';
        lb.style.transform = `translate3d(${(label.x + label.s * 0.62).toFixed(1)}px, ${(label.y - 11).toFixed(1)}px, 0)`;
      } else lb.style.opacity = '0';
    }
    rootRef.current?.style.setProperty('--leave', leave.toFixed(3));
  }, visible);

  // ---------- drag to turn ----------
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('button, a')) return;
    const c = cam.current;
    c.dragging = !reduce;
    c.moved = false;
    c.lastX = c.downX = e.clientX;
    c.lastT = performance.now();
    c.vel = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && !reduce) {
      const r = e.currentTarget.getBoundingClientRect();
      look.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      look.current.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      geo.current.dirty = true;
    }
    const c = cam.current;
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (Math.abs(e.clientX - c.downX) > 6) c.moved = true;
    if (!c.dragging || !c.moved) return;
    const now = performance.now();
    const dx = e.clientX - c.lastX;
    const k = 4.2 / Math.max(320, geo.current.w);
    const dtS = Math.max((now - c.lastT) / 1000, 1 / 240);
    c.yaw += dx * k;
    c.vel = c.vel * 0.55 + ((dx * k) / dtS) * 0.45;
    c.lastX = e.clientX;
    c.lastT = now;
    geo.current.dirty = true;
    rootRef.current?.setAttribute('data-dragging', 'true');
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const c = cam.current;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    c.dragging = false;
    if (performance.now() - c.lastT > 90) c.vel = 0;
    c.vel = Math.max(-3.5, Math.min(3.5, c.vel));
    rootRef.current?.removeAttribute('data-dragging');
    // a click on empty space (no drag) returns to the overview
    if (!c.moved && selRef.current !== null) select(null);
  };

  const current = selected !== null ? featured[selected] : null;

  const openCase = (slug: string, color: string, ink: string, label: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(`/work/${slug}`, { color, ink, label });
  };

  if (n === 0) return null;

  return (
    <section ref={rootRef} id="top" className="uni" data-focus={selected !== null} data-reduce={reduce || undefined} aria-label="Introduction and the worlds" onKeyDown={onKey}>
      <div ref={sceneRef} className="uni-scene" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} data-cursor={selected === null ? 'drag' : undefined} data-cursor-label="TURN">
        <canvas ref={backRef} className="uni-canvas uni-canvas--back" aria-hidden="true" />
        <div ref={nameRef} className="uni-name">
          <h1 className="uni-title">
            <ProximityText text="SAMUDRA" intro start introDelay={0.15} weight={780} maxWeight={900} lift={5} />
            <ProximityText text="KAR" intro start introDelay={0.3} weight={780} maxWeight={900} lift={5} />
          </h1>
        </div>
        <canvas ref={frontRef} className="uni-canvas uni-canvas--front" aria-hidden="true" />

        <div className="uni-planets">
          {featured.map((p, i) => (
            <button
              key={p.id}
              ref={(el) => void (planetRefs.current[i] = el)}
              type="button"
              className="uni-planet"
              data-on={selected === i}
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => select(selected === i ? null : i)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(i)}
              onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
              data-cursor="project"
              data-cursor-label={selected === i ? 'CLOSE' : 'LAND'}
            >
              <PlanetSurface world={p.world} palette={p.palette} />
            </button>
          ))}
        </div>

        <div ref={labelRef} className="uni-tip mono" aria-hidden="true">
          {hovered !== null && (
            <>
              <span>{String(hovered + 1).padStart(2, '0')}</span> {featured[hovered].title}
              <em>{featured[hovered].category}</em>
            </>
          )}
        </div>
      </div>

      {/* the overview copy: who, and how to explore. One line each. */}
      <div className="uni-intro">
        <p className="uni-lede">
          <strong>Designer &amp; developer.</strong> Interfaces, web toys, AI tools.
        </p>
      </div>
      <p className="uni-hint mono">Drag to turn · pick a world</p>

      {/* the focused world */}
      <div className="uni-panel" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {current && selected !== null && (
            <motion.article
              key={current.id}
              className="uni-card"
              style={{ '--p-acc': current.palette.accent, '--len': Math.max(...current.title.split(' ').map((w) => w.length)) } as CSSProperties}
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(10px)', filter: 'blur(3px)' }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)', filter: 'blur(0px)' }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-6px)', filter: 'blur(2px)' }}
              transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="mono uni-card-k">
                World {String(selected + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </p>
              <h2 className="uni-card-title">{current.title}</h2>
              <ul className="dotlist mono uni-card-meta" aria-label="Category and year">
                <li>{current.category}</li>
                <li>{current.year}</li>
                {current.team && <li>{current.team}</li>}
              </ul>
              <p className="uni-card-tag">{current.tagline}</p>
              <p className="uni-card-desc">{current.description}</p>
              <ul className="dotlist mono uni-card-tech" aria-label="Built with">
                {current.tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="uni-card-actions">
                <button type="button" className="btn" onClick={() => scrollToTarget(`#w-${current.slug}`, { duration: 2 })} data-cursor="cta" data-cursor-label="ENTER">
                  Enter the world <Arrow dir="down" className="btn-arrow" />
                </button>
                <Link to={`/work/${current.slug}`} className="tlink" onClick={openCase(current.slug, current.palette.bg, current.palette.fg, current.title)}>
                  Case study <Arrow dir="right" />
                </Link>
                {current.github && (
                  <a href={current.github} className="tlink" target="_blank" rel="noreferrer">
                    GitHub <Arrow dir="out" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
                {real(current.live) && (
                  <a href={current.live} className="tlink" target="_blank" rel="noreferrer">
                    Live <Arrow dir="out" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
              <div className="uni-card-nav">
                <button type="button" className="uni-step mono" onClick={() => select((selected - 1 + n) % n)}>
                  <Arrow dir="left" /> Previous
                </button>
                <button type="button" className="uni-step mono" onClick={() => select(null)}>
                  All worlds
                </button>
                <button type="button" className="uni-step mono" onClick={() => select((selected + 1) % n)}>
                  Next <Arrow dir="right" />
                </button>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>

      {/* every world as a plain control: the accessible and touch-first way in */}
      <nav className="uni-rail" aria-label="The worlds">
        <ol>
          {featured.map((p, i) => (
            <li key={p.id} style={{ '--b-bg': p.palette.bg } as CSSProperties}>
              <button
                type="button"
                data-index={i}
                aria-pressed={selected === i}
                onClick={() => select(selected === i ? null : i)}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(i)}
                onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered((h) => (h === i ? null : h))}
              >
                <span className="uni-rail-disc" aria-hidden="true" />
                <span className="mono uni-rail-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="uni-rail-name">{p.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <Link to="/projects" className="tlink uni-rail-more" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); go('/projects', { color: '#081c4a', ink: '#eef2fc', label: 'The exhibition' }); }}>
          All {projects.length} <Arrow dir="right" />
        </Link>
      </nav>

    </section>
  );
}

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent as RPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { featured, type Project } from '../../data/projects';
import { config } from '../../data/config';
import { real } from '../../lib/content';
import { useReducedMotion } from '../../lib/runtime';
import { follow } from '../../lib/motion';
import { tick, thunk } from '../../lib/sound';
import { usePageTransition } from '../core/PageTransition';
import Specimen from '../projects/Specimen';
import Arrow from '../core/Arrow';
import './filmstrip.css';

/**
 * The homepage is one strip of film.
 *
 * Frame 00 is him: the name and one line, printed on a cyanotype. Frames
 * 01-09 are the featured projects, with their names in the film's edge print.
 * The frame in the gate is developed; its neighbours wait as dim negatives.
 *
 * One interaction moves everything: advancing the film. Drag or flick the
 * strip (a flick is projected forward and lands on a frame), scroll, use the
 * arrow keys, or pull the advance lever. The caption under the gate, the frame
 * counter and the light on the page all follow the same frame.
 *
 * Nothing moves at rest: the loop runs only while the film is travelling.
 */
type Frame = { kind: 'me' } | { kind: 'work'; p: Project };
const FRAMES: Frame[] = [{ kind: 'me' }, ...featured.map((p) => ({ kind: 'work' as const, p }))];
const N = FRAMES.length;
const clampI = (i: number) => Math.max(0, Math.min(N - 1, i));
const projectV = (v: number, rate = 0.994) => ((v / 1000) * rate) / (1 - rate); // Apple's deceleration projection, in frames
const n2 = (i: number) => String(i).padStart(2, '0');

export default function Filmstrip() {
  const { go } = usePageTransition();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [pulls, setPulls] = useState(0);
  const [first] = useState(() => !(window as unknown as { __skFilm?: boolean }).__skFilm);
  const frame = FRAMES[idx];
  const current = frame.kind === 'work' ? frame.p : null;

  const st = useRef({ pos: 0, goal: 0, drag: false, x0: 0, p0: 0, last: 0, lastT: 0, vel: 0, moved: false, fw: 1, cx: 0, raf: 0, lastFrame: 0, shown: 0 });

  useEffect(() => {
    (window as unknown as { __skFilm?: boolean }).__skFilm = true;
  }, []);

  // ---------- the travel loop ----------
  const paint = () => {
    const s = st.current;
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = `translate3d(${(s.cx - (s.pos + 0.5) * s.fw).toFixed(2)}px, 0, 0)`;
    const kids = track.children;
    for (let i = 0; i < kids.length; i++) {
      const dev = Math.max(0, 1 - Math.abs(i - s.pos));
      (kids[i] as HTMLElement).style.setProperty('--dev', dev.toFixed(3));
    }
    const near = clampI(Math.round(s.pos));
    if (near !== s.shown) {
      s.shown = near;
      setIdx(near);
      tick();
    }
  };
  const loop = (now: number) => {
    const s = st.current;
    const dt = Math.min(0.064, s.lastFrame ? (now - s.lastFrame) / 1000 : 0.016);
    s.lastFrame = now;
    if (!s.drag) s.pos = reduce ? s.goal : follow(s.pos, s.goal, dt, 0.12);
    const moving = s.drag || Math.abs(s.pos - s.goal) > 0.0008;
    if (!moving) s.pos = s.goal;
    paint();
    s.raf = moving ? requestAnimationFrame(loop) : 0;
    if (!s.raf) s.lastFrame = 0;
  };
  const kick = () => {
    const s = st.current;
    if (!s.raf) s.raf = requestAnimationFrame(loop);
  };
  const goTo = (i: number) => {
    const s = st.current;
    const n = clampI(i);
    if (n === s.goal && !s.drag) return;
    s.goal = n;
    kick();
  };
  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);

  // measure the frame pitch and the gate centre
  useEffect(() => {
    const measure = () => {
      const s = st.current;
      const gate = gateRef.current;
      const first = trackRef.current?.firstElementChild as HTMLElement | null;
      if (!gate || !first) return;
      s.fw = first.offsetWidth;
      s.cx = gate.clientWidth / 2;
      paint();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(gateRef.current!);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- drag and flick ----------
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const s = st.current;
    s.drag = true;
    s.moved = false;
    s.x0 = e.clientX;
    s.p0 = s.pos;
    s.last = s.pos;
    s.lastT = performance.now();
    s.vel = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    kick();
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (!s.drag) return;
    const dx = e.clientX - s.x0;
    if (!s.moved && Math.abs(dx) < 6) return;
    s.moved = true;
    let p = s.p0 - dx / s.fw;
    // past either end the film resists (rubber band)
    if (p < 0) p = -(0.55 * -p) / (1 + 0.55 * -p);
    if (p > N - 1) {
      const o = p - (N - 1);
      p = N - 1 + (0.55 * o) / (1 + 0.55 * o);
    }
    const now = performance.now();
    s.vel = s.vel * 0.5 + ((p - s.last) / Math.max(1, now - s.lastT)) * 1000 * 0.5;
    s.last = p;
    s.lastT = now;
    s.pos = p;
  };
  const onUp = () => {
    const s = st.current;
    if (!s.drag) return;
    s.drag = false;
    if (!s.moved) return;
    s.goal = clampI(Math.round(s.pos + (reduce ? 0 : projectV(s.vel))));
    kick();
  };

  // scroll advances one frame at a time (vertical or horizontal wheels)
  const wheelAt = useRef(0);
  useEffect(() => {
    const el = gateRef.current!;
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 4) return;
      e.preventDefault();
      const now = performance.now();
      if (now - wheelAt.current < 160) return;
      wheelAt.current = now;
      goTo(st.current.goal + (d > 0 ? 1 : -1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (k === 'ArrowRight') goTo(st.current.goal + 1);
    else if (k === 'ArrowLeft') goTo(st.current.goal - 1);
    else if (k === 'Home') goTo(0);
    else if (k === 'End') goTo(N - 1);
    else if (k === 'Enter' && current) open(current);
    else return;
    e.preventDefault();
  };

  const advance = (d: 1 | -1) => {
    const s = st.current;
    const next = s.goal + d;
    if (next < 0 || next > N - 1) {
      goTo(d > 0 ? 0 : N - 1); // the end of the roll rewinds to the start
    } else goTo(next);
    setPulls((n) => n + 1);
    thunk();
  };

  const open = (p: Project) => {
    go(`/projects?p=${p.slug}`, { from: gateRef.current?.querySelector('[data-in-gate] .fs-pic')?.getBoundingClientRect() ?? null, color: p.palette.bg, ink: p.palette.fg, label: p.title });
  };
  const onFrameClick = (i: number) => (e: MouseEvent) => {
    if (st.current.moved) return;
    e.preventDefault();
    const f = FRAMES[i];
    if (i === idx && f.kind === 'work') open(f.p);
    else goTo(i);
  };
  const link = (to: string, label: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(to, { from: e.currentTarget.getBoundingClientRect(), color: '#081c4a', ink: '#eef2fc', label });
  };

  const [firstName, lastName] = config.name.split(' ');
  const light = current ? current.palette.accent : '#d8f827';

  return (
    <section ref={rootRef} className="fs" data-first={first || undefined} style={{ '--light': light } as CSSProperties} aria-label="Samudra Kar: introduction and featured work">
      <div
        ref={gateRef}
        className="fs-gate"
        role="group"
        aria-roledescription="film strip"
        aria-label={`Frame ${n2(idx)} of ${n2(N - 1)}: ${current ? current.title : config.name}. Use the arrow keys to advance.`}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        data-lenis-prevent
        data-cursor="drag"
        data-cursor-label="DRAG"
      >
        <div ref={trackRef} className="fs-track">
          {FRAMES.map((f, i) => (
            <div key={i} className="fs-frame" data-in-gate={i === idx || undefined} data-kind={f.kind} onClick={onFrameClick(i)} aria-hidden={i !== idx || undefined}>
              <div className="fs-pic">
                {f.kind === 'me' ? (
                  <div className="fs-me">
                    <p className="fs-me-k mono">
                      <span className="fs-dot" aria-hidden="true" /> Designer &amp; developer
                    </p>
                    <h1 className="fs-name">
                      <span className="fs-line"><span>{firstName}</span></span>
                      <span className="fs-line"><span>{lastName}</span></span>
                    </h1>
                    <p className="fs-me-what">
                      I design and build interactive interfaces, web experiences and AI tools.
                    </p>
                  </div>
                ) : (
                  <Specimen project={f.p} live={i === idx} />
                )}
              </div>
              <p className="fs-edge mono" aria-hidden="true">
                <span>SK 400</span>
                <span>▸ {n2(i)}A</span>
                <span>{f.kind === 'me' ? config.name : f.p.title}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="fs-cap">
        <div className="fs-counter" aria-hidden="true">
          <span className="fs-counter-win mono">
            <span key={idx}>{n2(idx)}</span>
          </span>
          <span className="fs-counter-of mono">/ {n2(N - 1)}</span>
        </div>

        <div className="fs-cap-body" aria-live="polite" key={idx}>
          {current ? (
            <>
              <h2 className="fs-cap-title">{current.title}</h2>
              <p className="fs-cap-tag">{current.tagline}</p>
              <p className="fs-cap-meta mono">
                {current.category} · {current.tech.slice(0, 3).join(' · ')}
              </p>
            </>
          ) : (
            <>
              <h2 className="fs-cap-title">Precision, engineering, play.</h2>
              <p className="fs-cap-tag">Every frame on this roll is something I designed and built. Advance the film to see them.</p>
            </>
          )}
        </div>

        <div className="fs-cap-act">
          {current ? (
            <>
              <Link to={`/projects?p=${current.slug}`} className="fs-open" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); open(current); }}>
                Open project <Arrow dir="right" />
              </Link>
              {real(current.live) && (
                <a href={current.live} className="tlink fs-live" target="_blank" rel="noreferrer">
                  Live <Arrow dir="out" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </>
          ) : (
            <Link to="/projects" className="fs-open" onClick={link('/projects', 'The exhibition')}>
              All the work <Arrow dir="right" />
            </Link>
          )}
          <div className="fs-lever-row">
            <button type="button" className="fs-rewind" onClick={() => advance(-1)} aria-label="Previous frame" disabled={idx === 0}>
              <Arrow dir="left" />
            </button>
            <button type="button" className="fs-lever" onClick={() => advance(1)} aria-label={idx === N - 1 ? 'Rewind to the first frame' : 'Advance the film one frame'}>
              <svg viewBox="0 0 48 24" aria-hidden="true" key={pulls} data-pulled={pulls > 0 || undefined}>
                <circle cx="8" cy="12" r="6" />
                <path d="M8 12 L44 7 L44 13 Z" />
              </svg>
              <span className="mono">{idx === N - 1 ? 'Rewind' : 'Advance'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

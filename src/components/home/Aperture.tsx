import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent as RPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { featured } from '../../data/projects';
import { config } from '../../data/config';
import { useReducedMotion } from '../../lib/runtime';
import { follow } from '../../lib/motion';
import { tick, thunk } from '../../lib/sound';
import { usePageTransition } from '../core/PageTransition';
import Specimen from '../projects/Specimen';
import Arrow from '../core/Arrow';
import './aperture.css';

/**
 * The homepage is one lens.
 *
 * His name runs the full width of the sheet; a single loupe sits on it and
 * magnifies what is under the glass: blue ink on white paper, the way you
 * would check a print. That is the whole composition: one object, one name.
 *
 * The lens's focus ring turns (drag it, flick it, scroll over it, or use the
 * arrow keys) and clicks into ten detents. Detent 0 is the loupe on his name.
 * Detents 1-9 are the featured projects: at each click the iris blades close,
 * the glass changes to that project's specimen, and they open again. Press
 * the glass to open that project in the exhibition.
 *
 * Physical rules: a flick is projected forward (Apple's deceleration) and lands
 * on the nearest detent; the ring re-targets from its live angle, so it can be
 * caught mid-spin; the lens leans a little toward the hand. Nothing moves when
 * nobody is touching it.
 */
const STEPS = featured.length + 1; // 0 = the loupe on the name
const STEP = 360 / STEPS;
const BLADES = 8;
let seenThisLoad = false;

const norm = (i: number) => ((i % STEPS) + STEPS) % STEPS;
const project = (v: number, rate = 0.995) => ((v / 1000) * rate) / (1 - rate);

export default function Aperture() {
  const { go } = usePageTransition();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const bladesRef = useRef<SVGGElement>(null);
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(0); // what the glass shows (changes while the iris is shut)
  const [first] = useState(() => !seenThisLoad);
  const current = shown > 0 ? featured[shown - 1] : null;
  const target = idx > 0 ? featured[idx - 1] : null;

  const st = useRef({
    angle: 0, goal: 0, vel: 0, drag: false, start: 0, startAngle: 0, last: 0, lastT: 0, moved: false,
    iris: first && !reduce ? 1 : 0, irisGoal: 0, pending: -1,
    mx: 0, my: 0, tmx: 0, tmy: 0, raf: 0, cx: 0, cy: 0, r: 1,
  });

  // ---------- one loop, alive only while something is moving ----------
  const kick = () => {
    const s = st.current;
    if (!s.raf) s.raf = requestAnimationFrame(frame);
  };
  const lastFrame = useRef(0);
  const frame = (now: number) => {
    const s = st.current;
    const dt = Math.min(0.064, lastFrame.current ? (now - lastFrame.current) / 1000 : 0.016);
    lastFrame.current = now;
    let busy = false;

    if (!s.drag) {
      s.angle = reduce ? s.goal : follow(s.angle, s.goal, dt, 0.11);
      if (Math.abs(s.angle - s.goal) > 0.05) busy = true;
      else s.angle = s.goal;
    }
    // the iris: shut fast, swap, open slower
    const shutting = s.irisGoal > s.iris;
    s.iris = reduce ? s.irisGoal : follow(s.iris, s.irisGoal, dt, shutting ? 0.045 : 0.09);
    if (Math.abs(s.iris - s.irisGoal) > 0.004) busy = true;
    else s.iris = s.irisGoal;
    if (s.pending >= 0 && s.iris > 0.96) {
      setShown(s.pending);
      s.pending = -1;
      s.irisGoal = 0;
      busy = true;
    }
    s.mx = follow(s.mx, s.tmx, dt, 0.25);
    s.my = follow(s.my, s.tmy, dt, 0.25);
    if (Math.abs(s.mx - s.tmx) > 0.05 || Math.abs(s.my - s.tmy) > 0.05) busy = true;

    paint();
    s.raf = busy || s.drag ? requestAnimationFrame(frame) : 0;
    if (!s.raf) lastFrame.current = 0;
  };

  const paint = () => {
    const s = st.current;
    ringRef.current?.setAttribute('transform', `rotate(${s.angle.toFixed(2)})`);
    const root = stageRef.current;
    if (root) {
      root.style.setProperty('--mx', `${s.mx.toFixed(2)}px`);
      root.style.setProperty('--my', `${s.my.toFixed(2)}px`);
    }
    const g = bladesRef.current;
    if (g) {
      // eight blades pivot in from the rim; the opening is an octagon of radius r
      const r = 50 * (1 - s.iris * 0.985);
      const tw = s.iris * 0.9;
      const out: string[] = [];
      for (let i = 0; i < BLADES; i++) {
        const a0 = (i / BLADES) * Math.PI * 2 + tw;
        const a1 = ((i + 1) / BLADES) * Math.PI * 2 + tw;
        const p = (rad: number, a: number) => `${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`;
        out.push(`${p(r, a0)} ${p(r, a1)} ${p(62, a1 + 0.5)} ${p(62, a0 + 0.2)}`);
      }
      g.querySelectorAll('polygon').forEach((poly, i) => poly.setAttribute('points', out[i]));
      g.style.display = s.iris < 0.002 ? 'none' : '';
    }
  };

  // ---------- detents ----------
  const detentOf = (angle: number) => norm(Math.round(-angle / STEP));
  const setDetent = (i: number) => {
    const n = norm(i);
    setIdx((prev) => {
      if (prev === n) return prev;
      const s = st.current;
      s.pending = n;
      s.irisGoal = 1;
      tick();
      kick();
      return n;
    });
  };
  const turnTo = (i: number) => {
    const s = st.current;
    // the shortest way round to detent i from where the ring is now
    const cur = -s.goal / STEP;
    let diff = norm(i) - norm(Math.round(cur));
    if (diff > STEPS / 2) diff -= STEPS;
    if (diff < -STEPS / 2) diff += STEPS;
    s.goal = -(Math.round(cur) + diff) * STEP;
    setDetent(i);
    kick();
  };

  // entrance: the iris opens once (any input finishes it)
  useEffect(() => {
    seenThisLoad = true;
    const s = st.current;
    paint();
    if (s.iris > 0) {
      const t = window.setTimeout(() => {
        s.irisGoal = 0;
        kick();
      }, 350);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // measure the lens so the glass can magnify exactly what lies under it
  useEffect(() => {
    const measure = () => {
      const root = stageRef.current;
      const lens = lensRef.current;
      if (!root || !lens) return;
      const s = st.current;
      s.cx = lens.offsetLeft + lens.offsetWidth / 2;
      s.cy = lens.offsetTop + lens.offsetHeight / 2;
      s.r = lens.offsetWidth / 2;
      root.style.setProperty('--lx', `${lens.offsetLeft}px`);
      root.style.setProperty('--ly', `${lens.offsetTop}px`);
      root.style.setProperty('--lcx', `${s.cx}px`);
      root.style.setProperty('--lcy', `${s.cy}px`);
      root.style.setProperty('--sw', `${root.clientWidth}px`);
      root.style.setProperty('--sh', `${root.clientHeight}px`);
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(stageRef.current!);
    return () => ro.disconnect();
  }, []);

  // the lens leans toward the hand (fine pointers only; a finger is already on it)
  useEffect(() => {
    if (reduce) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const root = stageRef.current;
      if (!root) return;
      const s = st.current;
      const rr = root.getBoundingClientRect();
      const dx = e.clientX - rr.left - s.cx;
      const dy = e.clientY - rr.top - s.cy;
      const d = Math.hypot(dx, dy) || 1;
      const pull = Math.min(1, d / (s.r * 3));
      s.tmx = (dx / d) * pull * 14;
      s.tmy = (dy / d) * pull * 14;
      kick();
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // ---------- the ring: drag with momentum ----------
  const angleAt = (e: { clientX: number; clientY: number }) => {
    const r = lensRef.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const s = st.current;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.drag = true;
    s.moved = false;
    s.start = angleAt(e);
    s.startAngle = s.angle;
    s.last = s.angle;
    s.lastT = performance.now();
    s.vel = 0;
    s.goal = s.angle;
    kick();
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (!s.drag) return;
    let d = angleAt(e) - s.start;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    if (!s.moved && Math.abs(d) < 3) return;
    s.moved = true;
    // keep unwrapping so a full turn keeps counting
    const next = s.startAngle + d;
    const now = performance.now();
    const dtm = Math.max(1, now - s.lastT);
    s.vel = s.vel * 0.6 + ((next - s.last) / dtm) * 1000 * 0.4;
    s.last = next;
    s.lastT = now;
    s.angle = next;
    s.start = angleAt(e);
    s.startAngle = next;
    setDetent(detentOf(next));
    paint();
  };
  const onUp = () => {
    const s = st.current;
    if (!s.drag) return;
    s.drag = false;
    if (!s.moved) return; // a press without a turn is a click on the glass
    const landing = s.angle + (reduce ? 0 : project(s.vel));
    s.goal = Math.round(landing / STEP) * STEP;
    setDetent(detentOf(s.goal));
    kick();
  };

  // scroll over the lens turns it one detent at a time
  const wheelLock = useRef(0);
  useEffect(() => {
    const lens = lensRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      if (now - wheelLock.current < 140 || Math.abs(e.deltaY) < 4) return;
      wheelLock.current = now;
      const s = st.current;
      turnTo(detentOf(s.goal) + (e.deltaY > 0 ? 1 : -1));
    };
    lens.addEventListener('wheel', onWheel, { passive: false });
    return () => lens.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') turnTo(idx + 1);
    else if (k === 'ArrowLeft' || k === 'ArrowUp') turnTo(idx - 1);
    else if (k === 'Home') turnTo(0);
    else if (k === 'End') turnTo(STEPS - 1);
    else if ((k === 'Enter' || k === ' ') && target) openProject();
    else return;
    e.preventDefault();
  };

  const openProject = () => {
    if (!target) return;
    thunk();
    go(`/projects?p=${target.slug}`, { from: lensRef.current?.getBoundingClientRect() ?? null, color: target.palette.bg, ink: target.palette.fg, label: target.title });
  };
  const onGlassClick = () => {
    if (st.current.moved) return;
    if (target) openProject();
    else turnTo(1); // on the name, a press turns to the first work
  };

  const toWork = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go('/projects', { from: e.currentTarget.getBoundingClientRect(), color: '#081c4a', ink: '#eef2fc', label: 'The exhibition' });
  };

  const [firstName, lastName] = config.name.split(' ');
  const name = (
    <>
      <span className="ap-line">
        <span>{firstName}</span>
      </span>{' '}
      <span className="ap-line">
        <span>{lastName}</span>
      </span>
    </>
  );

  const label = target ? `${String(idx).padStart(2, '0')} ${target.title}` : 'The loupe';

  return (
    <section ref={rootRef} className="ap" data-first={first || undefined} data-mode={shown > 0 ? 'work' : 'name'} aria-labelledby="ap-name">
      <p className="ap-kicker mono">
        <span className="ap-dot" aria-hidden="true" />
        Designer &amp; developer
      </p>

      <div ref={stageRef} className="ap-stage">
      <h1 id="ap-name" className="ap-name">
        {name}
      </h1>

      <div
        ref={lensRef}
        className="ap-lens"
        role="slider"
        tabIndex={0}
        aria-label="Lens: turn the ring to look at the work"
        aria-valuemin={0}
        aria-valuemax={STEPS - 1}
        aria-valuenow={idx}
        aria-valuetext={target ? `${target.title}: ${target.tagline} Press Enter to open it.` : 'The loupe, on the name'}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={onGlassClick}
        onKeyDown={onKey}
        data-lenis-prevent
        data-cursor="drag"
        data-cursor-label={target ? 'OPEN' : 'TURN'}
      >
        <div className="ap-glass" aria-hidden="true">
          <div className="ap-mag">
            <div className="ap-mag-name">{name}</div>
          </div>
          {current && (
            <div className="ap-work" key={current.id}>
              <Specimen project={current} live />
            </div>
          )}
          <span className="ap-sheen" />
        </div>
        <svg className="ap-ring" viewBox="-64 -64 128 128" aria-hidden="true">
          <g ref={bladesRef} className="ap-blades">
            <clipPath id="ap-clip">
              <circle r="50" />
            </clipPath>
            <g clipPath="url(#ap-clip)">
              {Array.from({ length: BLADES }, (_, i) => (
                <polygon key={i} />
              ))}
            </g>
          </g>
          <circle r="50" className="ap-rim" />
          <g ref={ringRef}>
            <circle r="56" className="ap-band" />
            {Array.from({ length: 120 }, (_, i) => (
              <line key={i} x1="0" y1="-59.5" x2="0" y2={i % 12 === 0 ? -55.5 : -57.5} transform={`rotate(${i * 3})`} className="ap-knurl" />
            ))}
            {Array.from({ length: STEPS }, (_, i) => (
              <text key={i} className="ap-num" transform={`rotate(${i * STEP}) translate(0 -52.6)`} textAnchor="middle" dominantBaseline="middle">
                {i === 0 ? '◦' : i}
              </text>
            ))}
          </g>
          <path d="M0 -61.2 L-2.6 -64 L2.6 -64 Z" className="ap-index" />
        </svg>
      </div>

      </div>

      <div className="ap-read" aria-live="polite">
        <p className="ap-read-k mono" key={`k-${idx}`}>
          {label}
        </p>
        <p className="ap-read-t" key={`t-${idx}`}>
          {target ? target.tagline : 'Turn the ring to look at the work.'}
        </p>
        <div className="ap-read-ctl">
          <button type="button" className="ap-step" onClick={() => turnTo(idx - 1)} aria-label="Turn back one">
            <Arrow dir="left" />
          </button>
          <button type="button" className="ap-step" onClick={() => turnTo(idx + 1)} aria-label="Turn forward one">
            <Arrow dir="right" />
          </button>
          {target ? (
            <Link to={`/projects?p=${target.slug}`} className="ap-open mono" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); openProject(); }}>
              Open {target.title} <Arrow dir="right" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="ap-copy">
        <p className="ap-what">
          I design and build <em>interactive interfaces</em>, <em>web experiences</em> and <em>AI tools</em>.
        </p>
        <p className="ap-how">Light, edges, timing: a photographer's habits, brought to software.</p>
        <Link to="/projects" className="ap-all" onClick={toWork}>
          All the work <Arrow dir="right" />
        </Link>
      </div>
    </section>
  );
}

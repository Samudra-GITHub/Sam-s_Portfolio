import { useRef, type PointerEvent } from 'react';
import { useTicker, useVisibleRef } from '../../../lib/hooks';
import { useReducedMotion } from '../../../lib/runtime';

/**
 * DEVELOP: photography taught me to wait. A print sits blurred and colourless;
 * rest the cursor on it and a circle of the picture develops under it, growing
 * the longer you stay. Leave, and it fades back. Passing a real photo in
 * (see src/data/playground.ts) swaps the drawn scene for it.
 * Uses a radial CSS mask that follows the pointer, driven by two custom props.
 */
function Scene({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="dev-svg" aria-hidden="true">
      <defs>
        <linearGradient id={`dv-sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e3ae8" />
          <stop offset="0.55" stopColor="#ff5226" />
          <stop offset="1" stopColor="#ebe5d8" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#dv-sky-${uid})`} />
      <circle cx="270" cy="150" r="46" fill="#d8f827" stroke="#111215" strokeWidth="3" />
      <path d="M0 176 C60 150 96 168 150 152 C210 134 250 170 320 150 C360 140 385 150 400 156 V300 H0Z" fill="#111215" opacity="0.88" />
      <path d="M0 210 C70 190 120 214 190 198 C260 182 320 212 400 196 V300 H0Z" fill="#111215" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${210 + i * 12} ${222 + i * 12} h${70 - i * 12}`} stroke="#d8f827" strokeWidth="3" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export default function Develop({ photo }: { photo?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const visible = useVisibleRef(rootRef);
  const reduce = useReducedMotion();
  const s = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, dev: 0, target: 0 });

  useTicker((_, dt) => {
    const el = rootRef.current;
    if (!el) return;
    const st = s.current;
    // rest on it and it develops; leave and it fades
    st.dev += (st.target - st.dev) * (1 - Math.exp(-dt * (st.target ? 0.9 : 2.2)));
    st.x += (st.tx - st.x) * (1 - Math.exp(-dt * 10));
    st.y += (st.ty - st.y) * (1 - Math.exp(-dt * 10));
    const w = el.clientWidth;
    const h = el.clientHeight;
    const r = 26 + st.dev * Math.hypot(w, h) * 0.62;
    el.style.setProperty('--x', `${(st.x * w).toFixed(1)}px`);
    el.style.setProperty('--y', `${(st.y * h).toFixed(1)}px`);
    el.style.setProperty('--r', `${r.toFixed(1)}px`);
    el.style.setProperty('--dev', st.dev.toFixed(3));
    if (readoutRef.current) readoutRef.current.textContent = `${String(Math.round(st.dev * 100)).padStart(3, '0')}`;
  }, visible);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    s.current.tx = (e.clientX - r.left) / r.width;
    s.current.ty = (e.clientY - r.top) / r.height;
    s.current.target = 1;
  };

  return (
    <div
      ref={rootRef}
      className="dev"
      data-still={reduce}
      role="img"
      aria-label="Develop experiment: rest the cursor on the print and it develops from blurred grey into colour"
      tabIndex={0}
      data-cursor="image"
      data-cursor-label="DEVELOP"
      onPointerMove={move}
      onPointerEnter={move}
      onPointerLeave={() => (s.current.target = 0)}
      onFocus={() => (s.current.target = 1)}
      onBlur={() => (s.current.target = 0)}
    >
      <div className="dev-layer dev-raw">{photo ? <img src={photo} alt="" className="dev-svg" /> : <Scene uid="a" />}</div>
      <div className="dev-layer dev-done">{photo ? <img src={photo} alt="" className="dev-svg" /> : <Scene uid="b" />}</div>
      <span className="dev-read mono" aria-hidden="true">
        exposure <span ref={readoutRef}>000</span>
      </span>
    </div>
  );
}


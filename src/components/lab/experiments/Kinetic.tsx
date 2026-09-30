import { useCallback, useEffect, useRef, type PointerEvent } from 'react';
import { useTicker, useVisibleRef, clamp } from '../../../lib/hooks';
import { useReducedMotion } from '../../../lib/runtime';

/**
 * KINETIC: a small physics toy. Letters fall, bounce and collide; grab one and
 * throw it. Circle bodies, gravity, restitution, pairwise impulse collisions,
 * two sub-steps per frame. Rendering is transforms only.
 */
interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  va: number;
}

const TILES = [
  { t: 'S', bg: '#d8f827', fg: '#111215' },
  { t: 'A', bg: '#ff5226', fg: '#111215' },
  { t: 'M', bg: '#fdf9f1', fg: '#111215' },
  { t: 'U', bg: '#1e3ae8', fg: '#fdf9f1' },
  { t: 'D', bg: '#111215', fg: '#d8f827' },
  { t: 'R', bg: '#d8f827', fg: '#111215' },
  { t: 'A', bg: '#ff5226', fg: '#fdf9f1' },
];

const GRAVITY = 1700;
const REST = 0.52;

export default function Kinetic() {
  const boardRef = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const dims = useRef({ w: 0, h: 0, r: 34 });
  const held = useRef<{ i: number; dx: number; dy: number; tx: number; ty: number; vx: number; vy: number } | null>(null);
  const visible = useVisibleRef(boardRef);
  const reduce = useReducedMotion();

  const seed = useCallback(() => {
    const { w, r } = dims.current;
    bodies.current = TILES.map((_, i) => ({
      x: r + Math.random() * Math.max(1, w - 2 * r),
      y: -r * (2 + i * 1.6),
      vx: (Math.random() - 0.5) * 240,
      vy: 0,
      r,
      a: Math.random() * 6,
      va: (Math.random() - 0.5) * 6,
    }));
  }, []);

  useEffect(() => {
    const board = boardRef.current!;
    const measure = () => {
      const w = board.clientWidth;
      const h = board.clientHeight;
      const r = clamp(Math.min(w, h) * 0.085, 24, 42);
      dims.current = { w, h, r };
      bodies.current.forEach((b) => (b.r = r));
      tiles.current.forEach((el) => {
        if (el) {
          el.style.width = el.style.height = `${r * 2}px`;
          el.style.fontSize = `${r * 1.05}px`;
        }
      });
    };
    measure();
    seed();
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    return () => ro.disconnect();
  }, [seed]);

  useTicker((_, dtRaw) => {
    if (reduce) return;
    const { w, h } = dims.current;
    const list = bodies.current;
    const hold = held.current;
    const dt = Math.min(dtRaw, 1 / 30);
    const steps = 2;
    const step = dt / steps;

    for (let s = 0; s < steps; s++) {
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        if (hold && hold.i === i) {
          const px = b.x;
          const py = b.y;
          const k = 1 - Math.exp(-step * 32);
          b.x += (hold.tx - b.x) * k;
          b.y += (hold.ty - b.y) * k;
          hold.vx = hold.vx * 0.7 + ((b.x - px) / step) * 0.3;
          hold.vy = hold.vy * 0.7 + ((b.y - py) / step) * 0.3;
          b.vx = b.vy = 0;
          continue;
        }
        b.vy += GRAVITY * step;
        b.x += b.vx * step;
        b.y += b.vy * step;
        b.a += b.va * step;
        if (b.x < b.r) {
          b.x = b.r;
          b.vx = -b.vx * REST;
          b.va *= 0.8;
        } else if (b.x > w - b.r) {
          b.x = w - b.r;
          b.vx = -b.vx * REST;
          b.va *= 0.8;
        }
        if (b.y > h - b.r) {
          b.y = h - b.r;
          b.vy = -b.vy * REST;
          b.vx *= 0.985;
          b.va = b.va * 0.94 + (b.vx / b.r) * 0.06;
          if (Math.abs(b.vy) < 26) b.vy = 0;
        }
      }
      // pairwise collisions
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const min = a.r + b.r;
          if (dist >= min) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = min - dist;
          const aHeld = hold?.i === i;
          const bHeld = hold?.i === j;
          const wa = aHeld ? 0 : bHeld ? 1 : 0.5;
          const wb = bHeld ? 0 : aHeld ? 1 : 0.5;
          a.x -= nx * overlap * wa;
          a.y -= ny * overlap * wa;
          b.x += nx * overlap * wb;
          b.y += ny * overlap * wb;
          const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vn < 0) {
            const imp = (-(1 + REST) * vn) / 2;
            if (!aHeld) {
              a.vx -= imp * nx;
              a.vy -= imp * ny;
              a.va -= imp * 0.004;
            }
            if (!bHeld) {
              b.vx += imp * nx;
              b.vy += imp * ny;
              b.va += imp * 0.004;
            }
          }
        }
      }
    }

    for (let i = 0; i < list.length; i++) {
      const el = tiles.current[i];
      const b = list[i];
      if (el) el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0) rotate(${b.a.toFixed(3)}rad)`;
    }
  }, visible);

  const local = (e: PointerEvent) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: PointerEvent) => {
    if (reduce) return;
    const tile = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (!tile) return;
    const i = Number(tile.dataset.i);
    const p = local(e);
    const b = bodies.current[i];
    held.current = { i, dx: b.x - p.x, dy: b.y - p.y, tx: b.x, ty: b.y, vx: 0, vy: 0 };
    boardRef.current!.setPointerCapture(e.pointerId);
    tile.dataset.held = 'true';
  };
  const onMove = (e: PointerEvent) => {
    const hold = held.current;
    if (!hold) return;
    const p = local(e);
    const { w, h, r } = dims.current;
    hold.tx = clamp(p.x + hold.dx, r, w - r);
    hold.ty = clamp(p.y + hold.dy, r, h - r);
  };
  const onUp = () => {
    const hold = held.current;
    if (!hold) return;
    const b = bodies.current[hold.i];
    b.vx = clamp(hold.vx, -2600, 2600);
    b.vy = clamp(hold.vy, -2600, 2600);
    b.va = b.vx * 0.004;
    tiles.current[hold.i]?.removeAttribute('data-held');
    held.current = null;
  };

  const shake = () => {
    bodies.current.forEach((b) => {
      b.vy = -(500 + Math.random() * 700);
      b.vx = (Math.random() - 0.5) * 900;
      b.va = (Math.random() - 0.5) * 10;
    });
  };

  return (
    <div className="kin">
      <div
        ref={boardRef}
        className="kin-board"
        role="group"
        aria-label="Physics toy: drag and throw the letters of SAMUDRA"
        data-cursor="drag"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {TILES.map((t, i) => (
          <div
            key={i}
            ref={(el) => {
              tiles.current[i] = el;
            }}
            data-i={i}
            className="kin-tile font-display"
            style={{ background: t.bg, color: t.fg, ...(reduce ? { position: 'relative', display: 'inline-grid', margin: '0.3rem' } : null) }}
            aria-hidden="true"
          >
            {t.t}
          </div>
        ))}
      </div>
      {!reduce && (
        <div className="kin-controls">
          <button type="button" className="lab-btn mono" onClick={shake}>
            Shake
          </button>
          <button type="button" className="lab-btn mono" onClick={seed}>
            Drop again
          </button>
        </div>
      )}
    </div>
  );
}

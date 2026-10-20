import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { pointer } from '../../lib/pointer';
import { scrollVelocity } from '../../lib/scroll';
import { clamp } from '../../lib/hooks';
import { isPaused, useReducedMotion } from '../../lib/runtime';
import './proximity.css';

interface Props {
  text: string;
  className?: string;
  /** distance (px) at which the pointer stops affecting a letter */
  radius?: number;
  /** resting weight; slots are sized for it */
  weight?: number;
  /** weight under the pointer: letters swell past their slot, centred */
  maxWeight?: number;
  /** px a letter lifts when the pointer is on it */
  lift?: number;
  /** play the letters-inflate entrance */
  intro?: boolean;
  introDelay?: number;
  /** letters also lean with scroll velocity */
  velocity?: boolean;
  /** when the parent knows the text is offscreen it can pause the effect */
  paused?: boolean;
  /** hold the entrance until this turns true (the loader releases it) */
  start?: boolean;
}

/**
 * Typography as a physical object. Every letter is its own slot with its own
 * weight: the pointer thickens and lifts the letters it passes over (variable
 * font weight axis), scroll velocity leans them. On entrance the letters rise
 * in with transform and opacity only. Slots are sized for the
 * resting weight and letters swell past them symmetrically, so the line
 * never reflows.
 */
export default function ProximityText({
  text,
  className = '',
  radius = 190,
  weight = 700,
  maxWeight = 830,
  lift = 10,
  intro = false,
  introDelay = 0,
  velocity = false,
  paused = false,
  start = true,
}: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const ready = useRef(!intro);
  const onScreen = useRef(false);
  const reduce = useReducedMotion();
  const chars = Array.from(text);

  // stable slot widths at max weight (reflow-free weight changes)
  useLayoutEffect(() => {
    const root = rootRef.current!;
    const slots = Array.from(root.querySelectorAll<HTMLElement>('.prox-slot'));
    const glyphs = slots.map((s) => s.firstElementChild as HTMLElement);
    const measure = () => {
      glyphs.forEach((g) => {
        g.style.fontWeight = String(weight);
      });
      slots.forEach((s, i) => {
        s.style.width = `${glyphs[i].getBoundingClientRect().width}px`;
      });
      glyphs.forEach((g) => {
        g.style.fontWeight = '';
      });
    };
    measure();
    const ro = new ResizeObserver(() => {
      slots.forEach((s) => (s.style.width = ''));
      measure();
    });
    ro.observe(root);
    document.fonts?.ready.then(() => {
      slots.forEach((s) => (s.style.width = ''));
      measure();
    });
    return () => ro.disconnect();
  }, [text, weight]);

  // entrance: letters rise into place, staggered. Transform and opacity only:
  // tweening font-weight here re-laid out the whole page every frame.
  useEffect(() => {
    const root = rootRef.current!;
    const glyphs = Array.from(root.querySelectorAll<HTMLElement>('.prox-glyph'));
    if (!intro || reduce) {
      root.classList.remove('prox--pre');
      ready.current = true;
      return;
    }
    if (!start) return; // glyphs stay hidden (.prox--pre) until the intro is released
    const tl = gsap.timeline({
      delay: introDelay,
      onComplete: () => {
        ready.current = true;
      },
    });
    tl.add(() => root.classList.remove('prox--pre'), 0).fromTo(
      glyphs,
      { yPercent: 55, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.045, clearProps: 'transform' },
    );
    return () => {
      tl.kill();
    };
  }, [intro, introDelay, weight, reduce, start]);

  // visibility gate
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (onScreen.current = e.isIntersecting), { rootMargin: '5% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // per-frame pointer response
  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current!;
    const slots = Array.from(root.querySelectorAll<HTMLElement>('.prox-slot'));
    const glyphs = slots.map((s) => s.firstElementChild as HTMLElement);
    const amount = new Array(slots.length).fill(0);
    const last = new Array(slots.length).fill(-1);

    // Work only while something can change: the pointer moved, the scroll is
    // leaning the letters, or the letters are still settling. With no pointer
    // (touch, keyboard) the letters rest; there is no idle animation.
    let lastPx = NaN;
    let lastPy = NaN;
    let lastLean = 0;
    let settled = true;
    const tick = (_time: number, deltaMs: number) => {
      if (!ready.current || paused || !onScreen.current || isPaused()) return;
      const dt = Math.min(deltaMs, 64) / 1000;
      const usePointer = pointer.seen;
      const px = pointer.x.get();
      const py = pointer.y.get();
      const lean = velocity ? clamp(scrollVelocity.get() / 60, -1, 1) * 9 : 0;
      const moved = usePointer && (px !== lastPx || py !== lastPy);
      const leaning = Math.abs(lean - lastLean) > 0.05 || Math.abs(lean) > 0.05;
      if (!moved && !leaning && settled) return;
      lastPx = px;
      lastPy = py;
      lastLean = lean;
      const follow = 1 - Math.exp(-dt * 9);

      // read phase (only when a pointer is in play)
      const rects = usePointer ? slots.map((s) => s.getBoundingClientRect()) : null;
      // write phase
      settled = true;
      for (let i = 0; i < slots.length; i++) {
        let target = 0;
        if (rects) {
          const r = rects[i];
          const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
          target = clamp(1 - d / radius);
          target *= target;
        }
        amount[i] += (target - amount[i]) * follow;
        if (Math.abs(target - amount[i]) > 0.003) settled = false;
        else amount[i] = target;
        const a = amount[i];
        const stamp = Math.round(a * 200) + Math.round(lean * 10);
        if (stamp === last[i]) continue;
        last[i] = stamp;
        const g = glyphs[i];
        g.style.fontWeight = String(Math.round(weight + (maxWeight - weight) * a));
        g.style.transform = `translate3d(0, ${(-lift * a).toFixed(2)}px, 0) skewX(${(-lean).toFixed(2)}deg)`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [text, radius, weight, maxWeight, lift, velocity, paused, reduce]);

  return (
    <span ref={rootRef} className={`prox prox--pre ${className}`}>
      <span className="sr-only">{text}</span>
      {chars.map((c, i) =>
        c === ' ' ? (
          <span key={i} className="prox-space" aria-hidden="true">
            {' '}
          </span>
        ) : (
          <span key={i} className="prox-slot" aria-hidden="true">
            <span className="prox-glyph">{c}</span>
          </span>
        ),
      )}
    </span>
  );
}

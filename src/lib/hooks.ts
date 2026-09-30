import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import { gsap } from './gsap';
import { isPaused } from './runtime';

/**
 * Tracks whether an element is near the viewport in a ref (no re-render).
 * Effects gate their per-frame work on this so nothing runs offscreen.
 */
export function useVisibleRef<T extends Element>(ref: RefObject<T | null>, rootMargin = '10% 0px'): MutableRefObject<boolean> {
  const visible = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return visible;
}

/**
 * Per-frame callback on the shared GSAP ticker (a single rAF for the whole
 * site). Skipped while `enabled` is false, the tab is hidden or Kage is open.
 */
export function useTicker(callback: (time: number, dt: number) => void, enabled?: RefObject<boolean>) {
  const cb = useRef(callback);
  useEffect(() => {
    cb.current = callback;
  });
  useEffect(() => {
    const fn = (time: number, deltaMs: number) => {
      if (isPaused()) return;
      if (enabled && !enabled.current) return;
      cb.current(time, Math.min(deltaMs, 64) / 1000);
    };
    gsap.ticker.add(fn);
    return () => gsap.ticker.remove(fn);
  }, [enabled]);
}

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const map = (v: number, inMin: number, inMax: number, outMin = 0, outMax = 1) =>
  outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);

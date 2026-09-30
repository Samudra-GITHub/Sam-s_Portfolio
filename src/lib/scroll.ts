import { motionValue } from 'framer-motion';
import type Lenis from 'lenis';

export const scrollY = motionValue(0);
/** px per frame, signed, decays to 0 when idle (driven by Lenis) */
export const scrollVelocity = motionValue(0);

let lenis: Lenis | null = null;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};
export const getLenis = () => lenis;

type Target = string | number | HTMLElement;

export function scrollToTarget(target: Target, opts: { offset?: number; immediate?: boolean; duration?: number } = {}) {
  const { offset = 0, immediate = false, duration = 1.4 } = opts;

  // Resolve to an absolute pixel position: exact, and independent of scroll-padding.
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  const y = typeof el === 'number' ? el : el ? el.getBoundingClientRect().top + window.scrollY : null;
  if (y === null) return;

  if (lenis) {
    // after a route change Lenis still holds the previous page's scroll limit
    lenis.resize();
    lenis.scrollTo(y + offset, { immediate, duration, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  window.scrollTo({ top: y + offset, behavior: immediate ? 'auto' : 'smooth' });
}

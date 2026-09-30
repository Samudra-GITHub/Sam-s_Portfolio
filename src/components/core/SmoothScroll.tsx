import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { scrollVelocity, scrollY, setLenis } from '../../lib/scroll';
import { matches, MQ } from '../../lib/runtime';

/**
 * Lenis smooths the scroll and GSAP's ticker drives it, so ScrollTrigger,
 * Lenis and every per-frame effect share one requestAnimationFrame.
 * Under reduced motion Lenis is skipped and the browser scrolls natively.
 */
export default function SmoothScroll() {
  useEffect(() => {
    let lenis: Lenis | null = null;
    if (!matches(MQ.reducedMotion)) {
      lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      setLenis(lenis);
    }

    let lastY = window.scrollY;
    const tick = (time: number) => {
      lenis?.raf(time * 1000);
      const y = window.scrollY;
      scrollY.set(y);
      scrollVelocity.set(scrollVelocity.get() * 0.82 + (y - lastY) * 0.18);
      lastY = y;
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}

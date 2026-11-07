import { useEffect, type PointerEvent as RPointerEvent } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { matches, MQ } from '../lib/runtime';

/** the studio's scroll motion: lines rise, sections reveal in order, screens settle from a tilt */
export function useStudioMotion(root: React.RefObject<HTMLElement | null>, key?: unknown) {
  useEffect(() => {
    const el = root.current;
    if (!el || matches(MQ.reducedMotion)) return;
    const ctx = gsap.context(() => {
      // the name: each part rises out of its own line
      gsap.from('[data-line]', { yPercent: 105, duration: 1.15, ease: 'expo.out', stagger: 0.08, delay: 0.15 });
      gsap.from('[data-fade]', { opacity: 0, y: 16, duration: 0.9, ease: 'power3.out', stagger: 0.07, delay: 0.6 });
      // every section: heading, then text, then pictures
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((n) => {
        gsap.from(n.querySelectorAll(':scope [data-r]'), {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.075,
          scrollTrigger: { trigger: n, start: 'top 82%', once: true },
        });
      });
      // project screens settle from a tilt to flat as they come up the page
      gsap.utils.toArray<HTMLElement>('[data-tilt]').forEach((n) => {
        gsap.fromTo(
          n,
          { rotateX: 14, rotateY: Number(n.dataset.tilt) || 0, y: 60 },
          { rotateX: 0, rotateY: 0, y: 0, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'center 55%', scrub: 0.6 } },
        );
      });
    }, el);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [root, key]);
}


/** the pointer lights a screen: a soft highlight where it is, and the screen leans toward it */
export const light = {
  onPointerMove(e: RPointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    e.currentTarget.style.setProperty('--lean-x', `${((e.clientY - r.top) / r.height - 0.5) * -4}deg`);
    e.currentTarget.style.setProperty('--lean-y', `${((e.clientX - r.left) / r.width - 0.5) * 5}deg`);
  },
  onPointerLeave(e: RPointerEvent<HTMLElement>) {
    e.currentTarget.style.setProperty('--lean-x', '0deg');
    e.currentTarget.style.setProperty('--lean-y', '0deg');
  },
};

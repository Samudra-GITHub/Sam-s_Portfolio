import { useEffect, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { matches, MQ } from '../lib/runtime';
import { M } from './motion';

/**
 * The home page's seams, one device per cut, never the same one twice in a row (docs/MOTION_STORYBOARD.md, section 3).
 * Everything is scrubbed with a light lag, so scrolling back plays it backwards. No pins.
 * Phones get the same seams as short timed arrivals instead of scrubs (a thumb flick covers a screen in a few frames,
 * so a scrub would be over before it was seen); the hero zoom and the montage drift stay desktop-only.
 * Reduced motion keeps the still layout.
 */
export function useReel(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || matches(MQ.reducedMotion)) return;
    if (matches(MQ.compact)) return phoneReel(el);
    const scrub = (trigger: Element | string, start: string, end: string) => ({ trigger, start, end, scrub: M.scrub });
    const ctx = gsap.context(() => {
      // 1. hero, zoom-through: the two halves of the name part around the band and rush past the camera
      const halves = gsap.utils.toArray<HTMLElement>('.st-name__row > .st-clip');
      if (halves.length >= 2) {
        gsap
          .timeline({ defaults: { ease: M.ease.scrub }, scrollTrigger: scrub('.st-hero', 'top top', 'bottom 20%') })
          .to(halves[0], { xPercent: -60, scale: 2, opacity: 0, transformOrigin: '100% 60%' }, 0)
          .to(halves[halves.length - 1], { xPercent: 60, scale: 2, opacity: 0, transformOrigin: '0% 60%' }, 0)
          .to('.st-role', { yPercent: 70, scale: 1.2, opacity: 0 }, 0)
          .to('.st-hero__foot', { y: -50, opacity: 0 }, 0.08);
      }

      // 2. AkashaLens, scan wipe: the comparison is uncovered by a scanline, like the detector's sweep
      if (el.querySelector('.st-ak__frames')) gsap.fromTo('.st-ak__frames', { '--scan': 0 }, { '--scan': 1, ease: M.ease.scrub, scrollTrigger: scrub('.st-ak__frames', 'top 92%', 'top 38%') });

      // 3. Krama into Rinti, perspective turn: the research screen swings round to face you
      if (el.querySelector('.st-ri__screen'))
        gsap.fromTo(
          '.st-ri__screen',
          { rotateY: 58, transformPerspective: 1800, transformOrigin: '0% 50%', opacity: 0.35 },
          { rotateY: 0, opacity: 1, ease: M.ease.scrub, scrollTrigger: scrub('.st-ri__screen', 'top bottom', 'top 42%') },
        );

      // 4. Noir Café, arched masks: the screens open through the shape of the café's own arch
      gsap.utils.toArray<HTMLElement>('.st-noir .st-screen img').forEach((n) => {
        gsap.fromTo(
          n,
          { clipPath: 'inset(30% 16% 0% 16% round 50% 50% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)', ease: M.ease.scrub, scrollTrigger: scrub(n, 'top bottom', 'center 52%') },
        );
      });

      // 5. About montage: pictures drift at their own depths; the words slide against them
      const montage = el.querySelector('.st-montage');
      if (montage) {
        gsap.utils.toArray<HTMLElement>('[data-depth]').forEach((n) => {
          const d = Number(n.dataset.depth) || 1;
          gsap.fromTo(n, { yPercent: d * 30 }, { yPercent: -d * 30, ease: M.ease.scrub, scrollTrigger: scrub(montage, 'top bottom', 'bottom top') });
        });
        gsap.utils.toArray<HTMLElement>('.st-montage__word').forEach((n, i) => {
          gsap.fromTo(n, { xPercent: i % 2 ? -10 : 10 }, { xPercent: i % 2 ? 6 : -6, ease: M.ease.scrub, scrollTrigger: scrub(montage, 'top bottom', 'bottom top') });
        });
      }
    }, el);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [root]);
}

/** the phone versions of the seams: each plays once as it arrives, and rewinds if you scroll back above it */
function phoneReel(el: HTMLElement) {
  const arrive = (trigger: Element | string) => ({ trigger, start: 'top 80%', toggleActions: 'play none none reverse' });
  const ctx = gsap.context(() => {
    if (el.querySelector('.st-ak__frames'))
      gsap.fromTo('.st-ak__frames', { '--scan': 0 }, { '--scan': 1, duration: 1.1, ease: 'power2.inOut', scrollTrigger: arrive('.st-ak__frames') });
    if (el.querySelector('.st-ri__screen'))
      gsap.fromTo(
        '.st-ri__screen',
        { rotateY: 34, transformPerspective: 1200, transformOrigin: '0% 50%', opacity: 0.4 },
        { rotateY: 0, opacity: 1, duration: M.dur.scene, ease: M.ease.settle, scrollTrigger: arrive('.st-ri__screen') },
      );
    gsap.utils.toArray<HTMLElement>('.st-noir .st-screen img').forEach((n) => {
      gsap.fromTo(
        n,
        { clipPath: 'inset(30% 16% 0% 16% round 50% 50% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)', duration: 1, ease: M.ease.settle, scrollTrigger: arrive(n) },
      );
    });
  }, el);
  ScrollTrigger.refresh();
  return () => ctx.revert();
}

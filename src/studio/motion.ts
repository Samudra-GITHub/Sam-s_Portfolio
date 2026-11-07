import { useEffect, type PointerEvent as RPointerEvent } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { matches, MQ } from '../lib/runtime';

/** the motion language: every scene reads its curves and timings from here (docs/MOTION_STORYBOARD.md, section 2) */
export const M = {
  ease: { cut: 'expo.inOut', settle: 'expo.out', scrub: 'none', camera: 'power3.inOut', rise: 'power3.out' },
  dur: { beat: 0.45, scene: 0.9, cut: 0.6, name: 1.15 },
  stagger: { char: 0.018, line: 0.075, panel: 0.12 },
  /** scrub lag in seconds: light enough that a reversed scroll plays straight back */
  scrub: 0.4,
} as const;

/** the studio's scroll motion: lines rise, sections reveal in order, screens settle from a tilt */
export function useStudioMotion(root: React.RefObject<HTMLElement | null>, key?: unknown) {
  useEffect(() => {
    const el = root.current;
    if (!el || matches(MQ.reducedMotion)) return;
    const ctx = gsap.context(() => {
      // the name: each part rises out of its own line
      gsap.from('[data-line]', { yPercent: 105, duration: M.dur.name, ease: M.ease.settle, stagger: 0.08, delay: 0.15 });
      gsap.from('[data-fade]', { opacity: 0, y: 16, duration: M.dur.scene, ease: M.ease.rise, stagger: 0.07, delay: 0.6 });
      // kinetic headings (see Kinetic.tsx): play on the way in, reverse on the way back out
      gsap.utils.toArray<HTMLElement>('[data-kinetic]').forEach((n) => {
        const st = { trigger: n, start: 'top 86%', toggleActions: 'play none none reverse' };
        const mode = n.dataset.kinetic;
        if (mode === 'whip') {
          // whip pan: each word streaks in from alternate sides, blurred along its path, and lands square
          gsap.from(n.querySelectorAll('.st-k__w'), {
            xPercent: (i) => (i % 2 ? 70 : -70),
            skewX: (i) => (i % 2 ? -16 : 16),
            filter: 'blur(10px)',
            opacity: 0,
            duration: M.dur.cut,
            ease: M.ease.cut,
            stagger: 0.08,
            scrollTrigger: st,
          });
        } else if (mode === 'drop') {
          // characters fall in with weight
          gsap.from(n.querySelectorAll('.st-k__c'), { yPercent: -130, rotate: (i) => (i % 2 ? 9 : -7), opacity: 0, duration: 0.8, ease: 'back.out(1.5)', stagger: M.stagger.char * 1.6, scrollTrigger: st });
        } else {
          gsap.from(n.querySelectorAll('.st-k__c'), { yPercent: 112, rotate: 7, duration: M.dur.scene, ease: M.ease.settle, stagger: M.stagger.char, scrollTrigger: st });
        }
      });
      // every section: heading, then text, then pictures
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((n) => {
        gsap.from(n.querySelectorAll(':scope [data-r]'), {
          y: 28,
          opacity: 0,
          duration: M.dur.scene,
          ease: M.ease.rise,
          stagger: M.stagger.line,
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

  // decode each section's screenshots a screen and a half before it arrives, so the first frames of its
  // arrival are not spent decoding large images (measured: the cold spikes in the showcases were decodes)
  useEffect(() => {
    const el = root.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          e.target.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
            img.loading = 'eager';
            img.decode().catch(() => {});
          });
        }
      },
      { rootMargin: '150% 0px' },
    );
    el.querySelectorAll('section, article').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [root, key]);
}


/**
 * The pointer lights a screen: a soft highlight where it is, and the picture drifts a little toward it.
 * The drift is 2D on purpose: a 3D lean inside the clipped frame cost about 50 ms the first time each screen was hovered.
 * --sx and --sy run from -0.5 to 0.5.
 */
export const light = {
  onPointerMove(e: RPointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty('--mx', `${x * 100}%`);
    e.currentTarget.style.setProperty('--my', `${y * 100}%`);
    e.currentTarget.style.setProperty('--sx', `${x - 0.5}`);
    e.currentTarget.style.setProperty('--sy', `${y - 0.5}`);
  },
  onPointerLeave(e: RPointerEvent<HTMLElement>) {
    e.currentTarget.style.setProperty('--sx', '0');
    e.currentTarget.style.setProperty('--sy', '0');
  },
};

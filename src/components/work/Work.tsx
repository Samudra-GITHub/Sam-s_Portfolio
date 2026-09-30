import { useEffect, useMemo, useRef } from 'react';
import { motionValue } from 'framer-motion';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { MQ, useMedia, useReducedMotion } from '../../lib/runtime';
import { projects } from '../../data/projects';
import Chapter from './Chapter';
import WorkIntro from './WorkIntro';
import './work.css';

const CLIP_FROM = ['inset(100% 0% 0% 0%)', 'inset(0% 100% 0% 0%)', 'circle(0% at 50% 50%)', 'inset(0% 0% 0% 100%)'];
const CLIP_TO = ['inset(-8% -8% -8% -8%)', 'inset(-8% -8% -8% -8%)', 'circle(120% at 50% 50%)', 'inset(-8% -8% -8% -8%)'];

/**
 * Work is one continuous system, not seven sections.
 *
 * pin mode (desktop): every chapter is a sticky 100dvh stage. The next chapter
 * has a negative top margin, so it slides up over the pinned one (scene handoff)
 * while the old stage shrinks and dims (depth). Each incoming scene opens with
 * a different mask: rise, wipe, iris, wipe from the other side.
 *
 * stack mode (tablet, mobile, reduced motion): chapters are plain stacked
 * blocks. Scroll still drives each scene's progress, without pins or overlap.
 */
export default function Work() {
  const rootRef = useRef<HTMLElement>(null);
  const pin = useMedia(`${MQ.desktop} and (prefers-reduced-motion: no-preference)`);
  const reduce = useReducedMotion();
  const list = useMemo(() => projects.filter((p) => p.featured), []);
  const progress = useMemo(() => list.map(() => motionValue(0.5)), [list]);

  useEffect(() => {
    const root = rootRef.current!;
    const chapters = Array.from(root.querySelectorAll<HTMLElement>('.chapter'));
    const mm = gsap.matchMedia();

    mm.add(
      {
        pin: `${MQ.desktop} and (prefers-reduced-motion: no-preference)`,
        stack: `(max-width: 999px) and (prefers-reduced-motion: no-preference)`,
      },
      (ctx) => {
        const { pin: isPin } = ctx.conditions as { pin: boolean };

        chapters.forEach((ch, i) => {
          const q = gsap.utils.selector(ch);
          const frame = q('.scene-frame')[0];
          const bgword = q('.chapter-bgword')[0];

          // scene progress across the chapter's own scroll range
          ScrollTrigger.create({
            trigger: ch,
            start: isPin ? 'top bottom' : 'top bottom',
            end: isPin ? 'bottom bottom' : 'bottom top',
            onUpdate: (self) => progress[i].set(self.progress),
            onRefresh: (self) => progress[i].set(self.progress),
          });

          // copy arrives as a sequence, and rewinds if you scroll back
          const reveal = gsap
            .timeline({ paused: true })
            .from(q('.chapter-title .split-inner'), { yPercent: 118, duration: 0.95, ease: 'expo.out', stagger: 0.035 })
            .from(q('.chapter-reveal'), { y: 26, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07 }, '-=0.65');
          ScrollTrigger.create({
            trigger: ch,
            start: isPin ? 'top 55%' : 'top 78%',
            onEnter: () => reveal.play(),
            onLeaveBack: () => reveal.reverse(),
          });

          if (!isPin) return;

          // each incoming scene opens with its own mask
          const v = i % 4;
          gsap.fromTo(
            frame,
            { clipPath: CLIP_FROM[v] },
            {
              clipPath: CLIP_TO[v],
              ease: 'none',
              scrollTrigger: { trigger: ch, start: 'top 92%', end: 'top 22%', scrub: true },
            },
          );

          // giant title drifts sideways while the chapter lives (horizontal motion inside vertical scroll)
          const dir = i % 2 === 0 ? 1 : -1;
          gsap.fromTo(
            bgword,
            { xPercent: dir * 6 },
            { xPercent: dir * -22, ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom bottom', scrub: true } },
          );

          // the chapter beneath is pushed back as this one covers it
          if (i > 0) {
            const prev = chapters[i - 1];
            const prevInner = prev.querySelector('.chapter-inner');
            gsap.to(prevInner, {
              scale: 0.9,
              yPercent: -5,
              opacity: 0.2,
              ease: 'none',
              scrollTrigger: { trigger: ch, start: 'top bottom', end: 'top top', scrub: true },
            });
            // a covered chapter must not keep keyboard focus
            ScrollTrigger.create({
              trigger: ch,
              start: 'top 12%',
              onEnter: () => prev.setAttribute('inert', ''),
              onLeaveBack: () => prev.removeAttribute('inert'),
            });
          }
        });
      },
    );

    return () => mm.revert();
  }, [pin, progress]);

  // under reduced motion scenes rest at a composed mid-point
  useEffect(() => {
    if (reduce) progress.forEach((p) => p.set(0.55));
  }, [reduce, progress]);

  return (
    <section ref={rootRef} id="work" className="work" data-mode={pin ? 'pin' : 'stack'} data-theme="ink" aria-label="Selected work">
      <WorkIntro />
      <div className="chapters">
        {list.map((p, i) => (
          <Chapter key={p.id} project={p} index={i} total={list.length} progress={progress[i]} />
        ))}
      </div>
    </section>
  );
}

import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { config } from '../../data/config';
import './flying-intro.css';

/**
 * The introduction floats in the middle of the world, in three depth layers.
 * Scrolling the first screen sends it flying: each word detaches on its own
 * curved, banking path, shrinking and softening into the haze while the
 * camera moves forward (see docs/STORYBOARD.md, section A).
 *
 * The h1 and paragraph keep their real text for assistive technology; the
 * flying pieces are aria-hidden copies of it.
 */

const LINE = 'I build thoughtful digital experiences through design, technology and experimentation.';

interface Path {
  /** end offset as a fraction of the viewport */
  x: number;
  y: number;
  /** depth travelled, px */
  z: number;
  /** bank into the turn, then roll out (deg) */
  bank: number;
  yaw: number;
  /** where along the scrub this piece leaves (0..1) */
  at: number;
  /** a dip before the climb, fraction of viewport height */
  dip?: number;
}

export default function FlyingIntro({ onJump }: { onJump: (id: string) => (e: React.MouseEvent) => void }) {
  const root = useRef<HTMLElement>(null);
  const [first, ...rest] = config.name.toUpperCase().split(' ');
  const last = rest.join(' ');
  const words = LINE.split(' ');

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    const q = gsap.utils.selector(el);
    // a context reverts cleanly (StrictMode mounts twice; a killed .from would strand the text invisible)
    const ctx = gsap.context(() => {
      // arrival: the layers rise into place from depth, nearest first
      gsap.from(q('[data-layer]'), { y: 26, z: -220, opacity: 0, duration: 1.3, ease: 'power3.out', stagger: 0.14, delay: 0.25 });
    }, el);

    // the veil behind the later sections stays off while the title floats
    const veil = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom center',
      onUpdate: (st) => document.documentElement.style.setProperty('--veil', String(Math.min(1, st.progress * 1.4))),
    });

    mm.add(
      {
        full: '(prefers-reduced-motion: no-preference) and (min-width: 700px)',
        compact: '(prefers-reduced-motion: no-preference) and (max-width: 699px)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        const { reduce, compact } = ctx.conditions as Record<string, boolean>;
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: reduce ? true : 0.9 } });

        if (reduce) {
          // a calm handover: fade and rise a little, no flight
          tl.to(q('[data-fly]'), { opacity: 0, y: -24, stagger: 0.04, ease: 'none', duration: 0.5 }, 0);
          tl.to(q('.fi-actions'), { opacity: 0, duration: 0.3 }, 0);
          return;
        }

        const W = window.innerWidth, H = window.innerHeight;
        const depth = compact ? 0.55 : 1;
        const fly = (target: Element, p: Path, index: number) => {
          const dx = p.x * W, dy = p.y * H, dip = (p.dip ?? 0.06) * H;
          tl.to(
            target,
            {
              keyframes: {
                '0%': { x: 0, y: 0, z: 0, rotationZ: 0, rotationY: 0, scale: 1, filter: 'blur(0px)', opacity: 1 },
                // detach: a small drop and a lean, like a wingbeat before the climb
                '18%': { x: dx * 0.06, y: dip, z: -60 * depth, rotationZ: p.bank * 0.5, rotationY: p.yaw * 0.2 },
                // the turn: bank hard, sweep outward and up
                '52%': { x: dx * 0.45, y: dy * 0.35, z: p.z * 0.4 * depth, rotationZ: p.bank, rotationY: p.yaw * 0.6, scale: 0.7, filter: compact ? 'blur(0px)' : 'blur(1px)' },
                // the glide: roll out and recede into the haze
                '86%': { x: dx * 0.9, y: dy * 0.85, z: p.z * 0.85 * depth, rotationZ: -p.bank * 0.25, rotationY: p.yaw, scale: 0.36, filter: compact ? 'blur(0px)' : 'blur(3px)', opacity: 0.85 },
                '100%': { x: dx, y: dy, z: p.z * depth, rotationZ: -p.bank * 0.35, rotationY: p.yaw * 1.1, scale: 0.26, filter: compact ? 'blur(1px)' : 'blur(5px)', opacity: 0 },
                easeEach: 'sine.inOut',
              },
              ease: 'power1.in',
              duration: 1 - p.at,
            },
            p.at + index * 0.0001,
          );
        };

        const [a, b] = q('.fi-word');
        fly(a, { x: -0.52, y: -0.62, z: -1500, bank: -22, yaw: 28, at: 0.02, dip: 0.05 }, 0);
        fly(b, { x: 0.5, y: -0.55, z: -1300, bank: 20, yaw: -26, at: 0.09, dip: 0.07 }, 1);
        fly(q('.fi-role')[0], { x: 0.42, y: -0.2, z: -1000, bank: 14, yaw: -18, at: 0.17, dip: 0.04 }, 2);
        q('.fi-w').forEach((w, j) => {
          // alternate sides, each word on its own lane so the flock fans out instead of bunching
          const side = j % 2 ? 1 : -1;
          const spread = 0.26 + ((j * 37) % 5) * 0.09;
          fly(w, { x: side * spread, y: -0.12 - ((j * 13) % 5) * 0.12, z: -800 - ((j * 53) % 5) * 160, bank: side * (10 + (j % 3) * 5), yaw: -side * 16, at: 0.22 + j * 0.025, dip: 0.03 }, 3 + j);
        });
        tl.to(q('.fi-actions'), { y: 30, opacity: 0, ease: 'power1.in', duration: 0.25 }, 0.05);
        tl.to(q('.fi-cue'), { opacity: 0, duration: 0.15 }, 0);
      },
    );

    // pointer: the layers drift a touch against each other, so they read as depth
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stage = el.querySelector<HTMLElement>('.fi-stage');
    const rx = stage ? gsap.quickTo(stage, 'rotationX', { duration: 1.2, ease: 'power3.out' }) : null;
    const ry = stage ? gsap.quickTo(stage, 'rotationY', { duration: 1.2, ease: 'power3.out' }) : null;
    const move = (e: PointerEvent) => {
      rx?.((e.clientY / window.innerHeight - 0.5) * -4);
      ry?.((e.clientX / window.innerWidth - 0.5) * 6);
    };
    if (fine) window.addEventListener('pointermove', move, { passive: true });

    return () => {
      window.removeEventListener('pointermove', move);
      ctx.revert();
      veil.kill();
      mm.revert();
      document.documentElement.style.removeProperty('--veil');
    };
  }, []);

  return (
    <section id="top" ref={root} className="fi" aria-labelledby="hero-title">
      <div className="fi-sticky">
        <div className="fi-stage">
          <h1 id="hero-title" className="fi-name" data-layer>
            <span className="sr-only">{config.name}</span>
            <span className="fi-word" data-fly aria-hidden="true">
              {first}
            </span>{' '}
            <span className="fi-word" data-fly aria-hidden="true">
              {last}
            </span>
          </h1>
          <p className="fi-role mono" data-fly data-layer>
            Designer &amp; Developer
          </p>
          <p className="fi-line" data-layer>
            <span className="sr-only">{LINE}</span>
            {words.map((w, i) => (
              <span key={i} className="fi-w" data-fly aria-hidden="true">
                {w}
              </span>
            ))}
          </p>
          <div className="fi-actions" data-layer>
            <a href="#work" className="btn" onClick={onJump('work')}>
              Explore selected work <span className="btn-arrow" aria-hidden="true">→</span>
            </a>
            <a href="#about" className="btn btn--line" onClick={onJump('about')}>
              About me
            </a>
          </div>
        </div>
        <p className="fi-cue mono" aria-hidden="true">
          Scroll to travel
        </p>
      </div>
    </section>
  );
}

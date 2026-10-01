import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { pointer } from '../../lib/pointer';
import { clamp } from '../../lib/hooks';
import { MQ, matches, useReducedMotion } from '../../lib/runtime';
import { scrollToTarget } from '../../lib/scroll';
import { useIntroDone } from '../../lib/intro';
import { config } from '../../data/config';
import { projects } from '../../data/projects';
import ProximityText from '../core/ProximityText';
import Split from '../core/Split';
import HeroGrid from './HeroGrid';
import './hero.css';

/**
 * Opening sequence
 *   stillness      paper, a grid and one lime dot
 *   small action   the dot can be grabbed and thrown; letters inflate in
 *   cursor         letters thicken and lift under the pointer
 *   scroll         the stage pins; the dot drops ink from wherever it landed
 *   takeover       ink fills the screen, type inverts, "Seven worlds" arrives
 *   handoff        the ink continues straight into the Work section
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef<HTMLButtonElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const introDone = useIntroDone();

  // dot: its own drag position plus a soft pull toward the cursor
  const seedX = useMotionValue(0);
  const seedY = useMotionValue(0);
  const pullX = useSpring(0, { stiffness: 90, damping: 14, mass: 0.6 });
  const pullY = useSpring(0, { stiffness: 90, damping: 14, mass: 0.6 });

  // the dot leans toward the pointer when it is near (cursor response)
  useEffect(() => {
    if (reduce) return;
    const update = () => {
      const seed = seedRef.current;
      if (!seed || !pointer.seen) return;
      const r = seed.getBoundingClientRect();
      const dx = pointer.x.get() - (r.left + r.width / 2 - pullX.get());
      const dy = pointer.y.get() - (r.top + r.height / 2 - pullY.get());
      const d = Math.hypot(dx, dy);
      const f = clamp(1 - d / 380);
      pullX.set(dx * f * 0.12);
      pullY.set(dy * f * 0.12);
    };
    const unsubs = [pointer.x.on('change', update), pointer.y.on('change', update)];
    return () => unsubs.forEach((u) => u());
  }, [reduce, pullX, pullY]);

  // the deck deals itself out after the type has landed
  useEffect(() => {
    if (reduce || !introDone) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-card', {
        yPercent: 120,
        rotation: (i: number) => (i % 2 ? 24 : -24),
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.08,
        delay: 1.5,
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce, introDone]);

  const jump = (slug: string) => (e: MouseEvent) => {
    e.preventDefault();
    scrollToTarget(`#w-${slug}`, { duration: 2.4 });
  };

  // scroll choreography
  useEffect(() => {
    const section = sectionRef.current!;
    const stage = stageRef.current!;
    const ink = inkRef.current!;
    const seed = seedRef.current!;
    const mm = gsap.matchMedia();

    mm.add(`(prefers-reduced-motion: no-preference)`, () => {
      const q = gsap.utils.selector(section);
      const tl = gsap.timeline({ defaults: { ease: 'none' } });
      tl.to(q('.hero-kicker, .hero-sentence'), { opacity: 0, y: -40, duration: 0.28 }, 0)
        .to(q('.hero-title'), { scale: 0.8, yPercent: -10, duration: 0.6 }, 0)
        .to(q('.hero-title'), { opacity: 0, duration: 0.22 }, 0.34)
        .to(q('.hero-stamp'), { opacity: 0, rotate: 90, duration: 0.3 }, 0)
        .to(q('.hero-deck'), { opacity: 0, yPercent: 8, duration: 0.3 }, 0)
        .to(q('.hero-seed-hint'), { opacity: 0, duration: 0.1 }, 0)
        .fromTo(q('.hero-outro'), { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.3 }, 0.62)
        .fromTo(q('.hero-outro .split-inner'), { yPercent: 105 }, { yPercent: 0, duration: 0.3, stagger: 0.04 }, 0.62)
        .to(seed, { scale: 0.55, opacity: 0, duration: 0.18 }, 0.82);

      let lastR = -1;
      // the ink circle grows from the dot's *current* position
      const paintInk = (progress: number) => {
        const p = clamp((progress - 0.14) / 0.62);
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const s = seed.getBoundingClientRect();
        const b = stage.getBoundingClientRect();
        const cx = s.left + s.width / 2 - b.left;
        const cy = s.top + s.height / 2 - b.top;
        const max = Math.hypot(Math.max(cx, b.width - cx), Math.max(cy, b.height - cy)) + 40;
        const r = eased * max;
        if (Math.abs(r - lastR) < 0.3) return;
        lastR = r;
        ink.style.clipPath = `circle(${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
      };
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        animation: tl,
        onUpdate: (self) => paintInk(self.progress),
        onRefresh: (self) => {
          lastR = -1;
          paintInk(self.progress);
        },
      });
      return () => st.kill();
    });

    return () => mm.revert();
  }, []);

  // the hint retires after the first grab
  const onDragStart = () => {
    hintRef.current?.setAttribute('data-gone', 'true');
  };

  return (
    <section ref={sectionRef} id="top" className="hero" aria-label="Introduction" data-reduce={reduce}>
      <div ref={stageRef} className="hero-stage">
        <HeroGrid stageRef={stageRef} />
        <div ref={inkRef} className="hero-ink" aria-hidden="true" />

        {/* blended layer: ink on paper, paper on ink */}
        <div className="hero-copy">
          <p className="hero-kicker mono">Creative developer &amp; designer</p>
          <h1 className="hero-title font-display">
            <ProximityText text="SAMUDRA" intro start={introDone} introDelay={0.35} velocity />
            <span className="hero-title-kar">
              <ProximityText text="KAR" intro start={introDone} introDelay={0.6} velocity />
              <span className="hero-title-dot" aria-hidden="true">.</span>
            </span>
          </h1>
          <p className="hero-sentence">
            I&apos;m a <RoleSlot roles={config.about.roles} /> who builds tactile interfaces, web toys and AI tools.
          </p>
          <div className="hero-stamp mono" aria-hidden="true">
            <svg viewBox="0 0 120 120" width="100%" height="100%">
              <defs>
                <path id="stamp-path" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
              </defs>
              <text fontSize="10.5" fill="currentColor" fontFamily="var(--font-mono)" fontWeight="600">
                <textPath href="#stamp-path" textLength="276" lengthAdjust="spacing">HUMAN-CRAFTED * 0% BORING * HUMAN-CRAFTED * 0% BORING *</textPath>
              </text>
            </svg>
          </div>
        </div>

        {/* the seven worlds, dealt like a hand of cards: each one jumps to its chapter */}
        <nav className="hero-deck" data-hold={!introDone && !reduce} aria-label="The seven worlds">
          {projects.map((p, i) => (
            <a
              key={p.id}
              href={`#w-${p.slug}`}
              className="hero-card-pos"
              style={{ '--k': i - (projects.length - 1) / 2, '--len': Math.max(...p.title.split(' ').map((w) => w.length)) } as CSSProperties}
              onClick={jump(p.slug)}
              data-cursor="project"
              data-cursor-label="ENTER"
            >
              <span className="hero-card" style={{ '--bg': p.palette.bg, '--fg': p.palette.fg, '--acc': p.palette.accent } as CSSProperties}>
                <span className="hero-card-num mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="hero-card-title font-display">{p.title}</span>
                <span className="hero-card-meta mono">{p.category}</span>
              </span>
            </a>
          ))}
        </nav>

        <div className="hero-outro" aria-hidden="true">
          <h2 className="hero-outro-title font-display">
            <Split text="SEVEN" /> <Split text="WORLDS." />
          </h2>
          <p className="hero-outro-line mono">Each project is a place. Come in.</p>
        </div>

        <motion.div className="hero-seed-wrap" style={{ x: pullX, y: pullY }}>
          <motion.button
            ref={seedRef}
            type="button"
            className="hero-seed"
            aria-label="A lime dot you can drag and throw"
            data-cursor="drag"
            style={{ x: seedX, y: seedY }}
            drag
            dragConstraints={stageRef}
            dragElastic={0.18}
            dragTransition={{ power: 0.4, timeConstant: 260, bounceStiffness: 260, bounceDamping: 16 }}
            whileDrag={{ scale: 1.12 }}
            whileTap={{ scale: 0.94 }}
            onDragStart={onDragStart}
            initial={{ scale: 0, opacity: 0 }}
            animate={introDone ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.2 }}
          >
            <span className="hero-seed-face" aria-hidden="true" />
          </motion.button>
        </motion.div>
        {introDone && (
          <span ref={hintRef} className="hero-seed-hint mono" aria-hidden="true">
            grab the dot
          </span>
        )}
      </div>
    </section>
  );
}

/** Rotating role, cycles quietly; static under reduced motion. */
function RoleSlot({ roles }: { roles: string[] }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || matches(MQ.reducedMotion)) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % roles.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [reduce, roles.length]);

  const longestRole = roles.reduce((a, b) => (a.length > b.length ? a : b));
  const currentRole = reduce ? roles[0] : roles[index];

  return (
    <span className="role-slot">
      <span className="sr-only">{roles.join(', ')}</span>
      
      {/* Invisible spacer dictates exact baseline and stable width */}
      <span className="role-spacer" aria-hidden="true">
        {longestRole}
      </span>
      
      {/* Window clips the transition */}
      <span className="role-window" aria-hidden="true">
        <AnimatePresence>
          <motion.span
            key={currentRole}
            className="role-word"
            initial={reduce ? undefined : { y: '100%' }}
            animate={{ y: '0%' }}
            exit={reduce ? undefined : { y: '-100%' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentRole}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { gsap } from '../../lib/gsap';
import { useReducedMotion } from '../../lib/runtime';
import { projects } from '../../data/projects';
import Split from '../core/Split';
import './stack.css';

/**
 * The Toolbox is a sticker sheet built from the seven projects themselves:
 * every tool listed in any project's `tech` becomes a sticker, and the more
 * worlds use it the bigger it prints. Nothing here is typed in by hand, so it
 * can only ever say what the work actually used. Stickers can be dragged.
 */
interface Tool {
  name: string;
  count: number;
  by: string[];
}

const SHAPES = ['pill', 'rect', 'ticket', 'round'] as const;
const FILLS = ['lime', 'vermilion', 'cobalt', 'paper', 'ink', 'sand'] as const;

function useTools(): Tool[] {
  return useMemo(() => {
    const tally = new Map<string, Tool>();
    for (const p of projects) {
      for (const name of p.tech) {
        const t = tally.get(name) ?? { name, count: 0, by: [] };
        t.count += 1;
        t.by.push(p.title);
        tally.set(name, t);
      }
    }
    const list = [...tally.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    // deterministic shuffle so big and small stickers are mixed, not sorted into rows
    const n = list.length;
    const step = [7, 5, 3, 11, 13].find((s) => n % s !== 0) ?? 1;
    return list.map((_, i) => list[(i * step) % n]);
  }, []);
}

export default function Stack() {
  const rootRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const tools = useTools();

  useEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from('.stack-title .split-inner', {
        yPercent: 118,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.05,
        scrollTrigger: { trigger: '.stack-head', start: 'top 80%', toggleActions: 'play none none reverse' },
      });
      gsap.from('.sticker', {
        y: -90,
        opacity: 0,
        rotation: (i: number) => (i % 2 ? 14 : -14),
        duration: 0.8,
        ease: 'back.out(1.5)',
        stagger: { each: 0.035, from: 'random' },
        scrollTrigger: { trigger: '.sticker-sheet', start: 'top 82%', toggleActions: 'play none none reverse' },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={rootRef} id="stack" className="stack" aria-labelledby="stack-title">
      <div className="stack-tape" aria-hidden="true" />
      <div className="stack-inner">
        <header className="stack-head">
          <h2 id="stack-title" className="stack-title font-display">
            <Split text="TOOLBOX" by="chars" />
          </h2>
          <p className="stack-sub">
            {String(projects.length).padStart(2, '0')} projects, {tools.length} tools. The bigger the sticker, the more worlds it shows up in.
          </p>
        </header>

        <ul className="sticker-sheet">
          {tools.map((t, i) => {
            const size = t.count >= 4 ? 'xl' : t.count === 3 ? 'l' : t.count === 2 ? 'm' : 's';
            const rot = (((i * 37) % 13) - 6) * 0.9;
            return (
              <li key={t.name} className="sticker-slot" style={{ '--rot': `${rot}deg` } as CSSProperties}>
                <motion.span
                  className="sticker"
                  data-size={size}
                  data-shape={SHAPES[i % SHAPES.length]}
                  data-fill={FILLS[(i * 5 + 1) % FILLS.length]}
                  drag
                  dragMomentum={false}
                  dragElastic={0.14}
                  whileHover={{ scale: 1.08, rotate: rot * -0.6 }}
                  whileDrag={{ scale: 1.12, zIndex: 40 }}
                  data-cursor="drag"
                  title={`Used in: ${t.by.join(', ')}`}
                >
                  <span className="sticker-name font-display">{t.name}</span>
                  <span className="sticker-count mono" aria-label={`used in ${t.count} ${t.count === 1 ? 'project' : 'projects'}`}>
                    x{t.count}
                  </span>
                </motion.span>
              </li>
            );
          })}
        </ul>
        <p className="stack-hint">Drag them around. Hover a sticker to see which worlds use it.</p>
      </div>
    </section>
  );
}

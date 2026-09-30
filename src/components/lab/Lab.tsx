import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from '../../lib/gsap';
import { useReducedMotion } from '../../lib/runtime';
import { playgroundExperiments, type ExperimentKind } from '../../data/playground';
import Split from '../core/Split';
import Kinetic from './experiments/Kinetic';
import Ink from './experiments/Ink';
import Develop from './experiments/Develop';
import Pop from './experiments/Pop';
import Momentum from './experiments/Momentum';
import './lab.css';

/**
 * The Lab is a different room: a bench of five experiments on gridded paper,
 * behind a strip of tape. Each one uses a different way of touching the page
 * (drag, cursor, dwell, click, scroll) and says one thing about its maker.
 */
export default function Lab() {
  const rootRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      gsap.from('.lab-title .split-inner', {
        yPercent: 120,
        rotate: 6,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.05,
        scrollTrigger: { trigger: '.lab-head', start: 'top 78%', toggleActions: 'play none none reverse' },
      });
      gsap.from('.bench', {
        y: 70,
        opacity: 0,
        rotate: (i) => (i % 2 ? 2 : -2),
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: '.bench-grid', start: 'top 82%', toggleActions: 'play none none reverse' },
      });
    }, root);
    return () => ctx.revert();
  }, [reduce]);

  const body: Record<ExperimentKind, (photo?: string) => ReactNode> = {
    kinetic: () => <Kinetic />,
    ink: () => <Ink />,
    develop: (photo) => <Develop photo={photo} />,
    pop: () => <Pop />,
    momentum: () => <Momentum />,
  };

  return (
    <section ref={rootRef} id="lab" className="lab" aria-labelledby="lab-title">
      <div className="lab-tape" aria-hidden="true" />
      <div className="lab-inner">
        <header className="lab-head">
          <h2 id="lab-title" className="lab-title font-display">
            <Split text="THE LAB" by="chars" />
          </h2>
          <p className="lab-sub">Five small experiments. Touch everything.</p>
        </header>

        <div className="bench-grid">
          {playgroundExperiments.map((exp, i) => (
            <article key={exp.id} className="bench" data-kind={exp.kind}>
              <header className="bench-head mono">
                <span>Exp {String(i + 1).padStart(2, '0')}</span>
                <span>{exp.model}</span>
              </header>
              <div className="bench-body">{body[exp.kind](exp.photo)}</div>
              <footer className="bench-foot">
                <h3 className="font-display">{exp.title}</h3>
                <p>{exp.says}</p>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Suspense, useRef, useState, useEffect, type CSSProperties, type MouseEvent } from 'react';
import type { MotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Project } from '../../data/projects';
import { real } from '../../lib/content';
import { usePageTransition } from '../core/PageTransition';
import Split from '../core/Split';
import Magnetic from '../core/Magnetic';
import SceneFrame from './SceneFrame';
import { WORLDS } from './worlds';

interface Props {
  project: Project;
  index: number;
  total: number;
  progress: MotionValue<number>;
}

/** Mounts a world only once its chapter is close, then keeps it. */
function useNear<T extends Element>(rootMargin = '120% 0px') {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [near, rootMargin]);
  return [ref, near] as const;
}

export default function Chapter({ project, index, total, progress }: Props) {
  const { go } = usePageTransition();
  const [ref, near] = useNear<HTMLElement>();
  const World = WORLDS[project.world];
  const flip = index % 2 === 1;
  const facts = [project.year, project.category, ...project.tech.slice(0, 3)];

  const open = (rect?: DOMRect | null) =>
    go(`/work/${project.slug}`, {
      from: rect ?? null,
      color: project.palette.bg,
      ink: project.palette.fg,
      label: project.title,
    });

  const onLink = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const frame = (e.currentTarget.closest('.chapter') as HTMLElement | null)?.querySelector('.scene-frame');
    open(frame?.getBoundingClientRect());
  };

  const longestWord = Math.max(...project.title.split(' ').map((w) => w.length));
  const style = {
    '--len': longestWord,
    '--c-bg': project.palette.bg,
    '--c-fg': project.palette.fg,
    '--c-accent': project.palette.accent,
  } as CSSProperties;

  return (
    <article
      ref={ref}
      id={`w-${project.slug}`}
      className="chapter"
      data-flip={flip}
      data-index={index}
      style={style}
      aria-labelledby={`t-${project.slug}`}
    >
      <div className="chapter-stage">
        <div className="chapter-bgword" aria-hidden="true">
          {project.title}
        </div>
        <div className="chapter-numeral font-display" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="chapter-inner">
          <div className="chapter-text">
            <p className="chapter-index mono chapter-reveal">
              World {String(index + 1).padStart(2, '0')} of {String(total).padStart(2, '0')}
            </p>
            <h3 id={`t-${project.slug}`} className="chapter-title font-display">
              <Split text={project.title} by="chars" />
            </h3>
            {project.alias && <p className="chapter-alias mono chapter-reveal">also known as {project.alias}</p>}
            <p className="chapter-tagline chapter-reveal">{project.tagline}</p>
            <ul className="chapter-chips chapter-reveal">
              {facts.map((f) => (
                <li key={f} className="chip mono">
                  {f}
                </li>
              ))}
            </ul>
            <p className="chapter-desc chapter-reveal">{real(project.description)}</p>
            <div className="chapter-actions chapter-reveal">
              <Magnetic>
                <Link to={`/work/${project.slug}`} className="btn btn--chapter" onClick={onLink} data-cursor="cta" data-cursor-label="OPEN">
                  View case study
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </Magnetic>
              {project.github && (
                <a href={project.github} className="chapter-link mono" target="_blank" rel="noreferrer">
                  Source on GitHub &#8599;
                </a>
              )}
            </div>
          </div>

          <div className="chapter-scene">
            <SceneFrame project={project} index={index} total={total} progress={progress} onOpen={open}>
              {near ? (
                <Suspense fallback={<div className="world-fallback" />}>
                  <World />
                </Suspense>
              ) : (
                <div className="world-fallback" />
              )}
            </SceneFrame>
          </div>
        </div>
      </div>
    </article>
  );
}

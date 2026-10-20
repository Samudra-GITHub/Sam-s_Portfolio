import { useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../../data/projects';
import { usePageTransition } from '../core/PageTransition';
import Specimen from '../projects/Specimen';
import Arrow from '../core/Arrow';
import './gate.css';

/**
 * The way from the homepage into the exhibition: a strip of every project's
 * specimen running past, and one large link. The page transition grows out of
 * the strip itself, so the wall seems to open into the next room.
 */
export default function Gate() {
  const { go } = usePageTransition();
  const ref = useRef<HTMLAnchorElement>(null);
  const [live, setLive] = useState(false);
  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go('/projects', { from: ref.current?.getBoundingClientRect() ?? null, color: '#081c4a', ink: '#eef2fc', label: 'The exhibition' });
  };
  const strip = [...projects, ...projects];
  return (
    <section id="gate" className="gate" aria-labelledby="gate-title">
      <Link
        ref={ref}
        to="/projects"
        className="gate-link"
        onClick={open}
        onPointerEnter={() => setLive(true)}
        onPointerLeave={() => setLive(false)}
        onFocus={() => setLive(true)}
        onBlur={() => setLive(false)}
        data-cursor="cta"
        data-cursor-label="ENTER"
      >
        <span className="gate-strip" aria-hidden="true">
          <span className="gate-track" data-live={live || undefined}>
            {strip.map((p, i) => (
              <span key={`${p.id}-${i}`} className="gate-frame">
                <Specimen project={p} live={live} />
              </span>
            ))}
          </span>
        </span>
        <span className="gate-text">
          <span id="gate-title" className="gate-title">
            All {projects.length} works
          </span>
          <span className="gate-go mono">
            Enter the exhibition <Arrow dir="right" />
          </span>
        </span>
      </Link>
    </section>
  );
}

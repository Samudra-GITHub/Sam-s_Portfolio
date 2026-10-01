import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollTrigger } from '../lib/gsap';
import { scrollToTarget } from '../lib/scroll';
import { useIntroDone } from '../lib/intro';
import './side-index.css';

/**
 * A chapter rail on the right edge: where you are in the story, and a way to
 * jump. It uses a difference blend so it reads on paper, ink and colour alike.
 */
const CHAPTERS = [
  { id: 'top', label: 'Intro' },
  { id: 'work', label: 'Work' },
  { id: 'stack', label: 'Toolbox' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Find me' },
] as const;

export default function SideIndex() {
  const onHome = useLocation().pathname === '/';
  const introDone = useIntroDone();
  const [active, setActive] = useState<string>('top');

  useEffect(() => {
    if (!onHome) return;
    const triggers = CHAPTERS.map(({ id }) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setActive(id),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, [onHome]);

  if (!onHome) return null;

  return (
    <nav className="side-index" data-ready={introDone} aria-label="Chapters">
      <ol>
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <a
              href={c.id === 'top' ? '/' : `/#${c.id}`}
              className="side-link"
              data-active={active === c.id}
              aria-current={active === c.id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget(c.id === 'top' ? 0 : `#${c.id}`, { duration: 1.8 });
              }}
            >
              <span className="side-label mono">{c.label}</span>
              <span className="side-num mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="side-tick" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

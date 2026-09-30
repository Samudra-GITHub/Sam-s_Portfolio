import type { CSSProperties, MouseEvent } from 'react';
import { projects } from '../../data/projects';
import { scrollToTarget } from '../../lib/scroll';

/**
 * The index of the seven worlds. It is the way in: hovering a name fills its
 * row with that world's colour, clicking scrolls straight to the chapter.
 */
export default function WorkIntro() {
  const jump = (slug: string) => (e: MouseEvent) => {
    e.preventDefault();
    scrollToTarget(`#w-${slug}`, { duration: 2 });
  };

  return (
    <div className="work-intro">
      <div className="work-intro-inner">
        <h2 className="work-intro-label mono">Selected work, 2026</h2>
        <ol className="work-index">
          {projects.map((p, i) => (
            <li key={p.id} style={{ '--row-bg': p.palette.bg, '--row-fg': p.palette.fg } as CSSProperties}>
              <a href={`#w-${p.slug}`} className="work-row" onClick={jump(p.slug)} data-cursor="project" data-cursor-label="ENTER">
                <span className="work-row-num mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="work-row-title font-display">{p.title}</span>
                <span className="work-row-meta mono">{p.category}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

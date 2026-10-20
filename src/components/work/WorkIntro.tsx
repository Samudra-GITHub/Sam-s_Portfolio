import { useState, type CSSProperties, type MouseEvent } from 'react';
import { featured as projects, moreWork, earlier } from '../../data/projects';
import { scrollToTarget } from '../../lib/scroll';
import Arrow from '../core/Arrow';

/**
 * The index of the featured worlds, printed on the same sheet as the instrument.
 * Hovering or focusing a row floods it with that world's enamel and turns the
 * plate beside it to that world; clicking lands on the chapter.
 */
export default function WorkIntro() {
  const [active, setActive] = useState(0);
  const current = projects[active];
  if (!current) return null;

  const jump = (slug: string) => (e: MouseEvent) => {
    e.preventDefault();
    scrollToTarget(`#w-${slug}`, { duration: 2 });
  };

  return (
    <div className="work-intro">
      <div className="work-intro-inner">
        <div className="work-index-col">
          <header className="work-index-head">
            <h2 className="work-index-title">Index of worlds</h2>
            <p className="work-index-sub">
              {projects.length === 1 ? 'One project so far.' : `${projects.length} projects. Pick one to land on it, or keep scrolling to visit them in order.`}
            </p>
          </header>
          <ol className="work-index">
            {projects.map((p, i) => (
              <li key={p.id} style={{ '--row-bg': p.palette.bg, '--row-fg': p.palette.fg, '--row-acc': p.palette.accent } as CSSProperties}>
                <a
                  href={`#w-${p.slug}`}
                  className="work-row"
                  data-on={i === active}
                  onClick={jump(p.slug)}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  data-cursor="project"
                  data-cursor-label="ENTER"
                >
                  <span className="work-row-num mono">{String(i + 1).padStart(2, '0')}</span>
                  <span className="work-row-disc" aria-hidden="true" />
                  <span className="work-row-title">{p.title}</span>
                  <span className="work-row-meta mono">{p.category}</span>
                </a>
              </li>
            ))}
          </ol>
          {moreWork.length + earlier.length > 0 && (
            <a
              href="#more"
              className="tlink work-more-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget('#more', { duration: 2.4 });
              }}
            >
              {moreWork.length > 0 && `${moreWork.length} more ${moreWork.length === 1 ? 'project' : 'projects'}`}
              {moreWork.length > 0 && earlier.length > 0 && ' and '}
              {earlier.length > 0 && `${earlier.length} earlier ${earlier.length === 1 ? 'site' : 'sites'}`}
              <Arrow dir="down" />
            </a>
          )}
        </div>

        <aside
          className="work-preview"
          aria-hidden="true"
          style={{ '--p-bg': current.palette.bg, '--p-fg': current.palette.fg, '--p-acc': current.palette.accent } as CSSProperties}
        >
          <div className="work-planet">
            <svg className="work-planet-orbit" viewBox="-100 -100 200 200">
              <circle r="97" />
            </svg>
            <span className="work-planet-body" />
            <span className="work-planet-moon" />
          </div>
          <div className="work-preview-body">
            <p className="work-preview-title" key={current.id}>
              {current.title}
            </p>
            <p className="work-preview-tag">{current.tagline}</p>
            <ul className="work-preview-tech dotlist mono">
              {current.tech.slice(0, 4).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

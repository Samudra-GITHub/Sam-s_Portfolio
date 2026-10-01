import { useState, type CSSProperties, type MouseEvent } from 'react';
import { projects } from '../../data/projects';
import { scrollToTarget } from '../../lib/scroll';

/**
 * The index of the seven worlds. It is the way in: hovering a name fills its
 * row with that world's colour and wakes the preview card beside it; clicking
 * scrolls straight to the chapter.
 */
export default function WorkIntro() {
  const [active, setActive] = useState(0);
  const current = projects[active];

  const jump = (slug: string) => (e: MouseEvent) => {
    e.preventDefault();
    scrollToTarget(`#w-${slug}`, { duration: 2 });
  };

  return (
    <div className="work-intro">
      <div className="work-intro-inner">
        <div className="work-index-col">
          <h2 className="work-intro-label mono">Selected work, 2026</h2>
          <ol className="work-index">
            {projects.map((p, i) => (
              <li key={p.id} style={{ '--row-bg': p.palette.bg, '--row-fg': p.palette.fg } as CSSProperties}>
                <a
                  href={`#w-${p.slug}`}
                  className="work-row"
                  onClick={jump(p.slug)}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  data-cursor="project"
                  data-cursor-label="ENTER"
                >
                  <span className="work-row-num mono">{String(i + 1).padStart(2, '0')}</span>
                  <span className="work-row-title font-display">{p.title}</span>
                  <span className="work-row-meta mono">{p.category}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        <aside
          className="work-preview"
          aria-hidden="true"
          style={{ '--p-bg': current.palette.bg, '--p-fg': current.palette.fg, '--p-acc': current.palette.accent } as CSSProperties}
        >
          <span className="work-preview-num font-display">{String(active + 1).padStart(2, '0')}</span>
          <div className="work-preview-body">
            <p className="work-preview-year mono">
              {current.year} / {current.category}
            </p>
            <h3 className="work-preview-title font-display">{current.title}</h3>
            <p className="work-preview-tag">{current.tagline}</p>
            <ul className="work-preview-chips">
              {current.tech.slice(0, 4).map((t) => (
                <li key={t} className="mono">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <span className="work-preview-disc" />
        </aside>
      </div>
    </div>
  );
}

import type { CSSProperties, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { earlier, moreWork, type Project } from '../../data/projects';
import { usePageTransition } from '../core/PageTransition';
import ProjectPlate from './ProjectPlate';
import './more.css';
import Arrow from '../core/Arrow';

/**
 * Everything on GitHub that earned a place but has no world of its own yet:
 * products, hackathon builds, team coursework. Lead entries get a plate and
 * room to explain themselves; the rest are ruled rows. Team work always says
 * so, with his role. Data: src/data/projects.ts (tier "more" and "earlier").
 */
export default function MoreWork() {
  const { go } = usePageTransition();
  if (moreWork.length === 0 && earlier.length === 0) return null;

  const leads = moreWork.filter((p) => p.lead);
  const rest = moreWork.filter((p) => !p.lead);

  const open = (p: Project) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(`/work/${p.slug}`, { color: p.palette.bg, ink: p.palette.fg, label: p.title });
  };

  return (
    <section id="more" className="more" aria-labelledby="more-title">
      <div className="more-inner">
        <header className="more-head">
          <h2 id="more-title" className="more-title">
            More work
          </h2>
          <p className="more-sub">
            {moreWork.length} more projects from GitHub: products, hackathon builds and team coursework. They have no world of their own yet, so each one is drawn as a body on the instrument.
          </p>
        </header>

        {leads.length > 0 && (
          <ul className="more-leads">
            {leads.map((p) => (
              <li key={p.id} className="more-lead" style={vars(p)}>
                <ProjectPlate project={p} className="more-lead-plate" />
                <div className="more-lead-body">
                  <h3 className="more-lead-title">
                    <Link to={`/work/${p.slug}`} onClick={open(p)} className="more-link" data-cursor="project" data-cursor-label="OPEN">
                      {p.title}
                    </Link>
                  </h3>
                  <ul className="more-meta mono dotlist" aria-label="Category and year">
                    <li>{p.category}</li>
                    <li>{p.year}</li>
                  </ul>
                  <p className="more-lead-tag">{p.tagline}</p>
                  <p className="more-desc">{p.description}</p>
                  {p.highlights.length > 0 && (
                    <ul className="more-exists" aria-label="What exists">
                      {p.highlights.slice(0, 3).map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                  <Credit p={p} />
                  <ul className="dotlist mono more-tech" aria-label="Built with">
                    {p.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <Links p={p} open={open(p)} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {rest.length > 0 && (
          <ul className="more-rows">
            {rest.map((p) => (
              <li key={p.id} className="more-row" style={vars(p)}>
                <span className="more-row-disc" aria-hidden="true" />
                <div className="more-row-main">
                  <h3 className="more-row-title">
                    <Link to={`/work/${p.slug}`} onClick={open(p)} className="more-link" data-cursor="project" data-cursor-label="OPEN">
                      {p.title}
                    </Link>
                  </h3>
                  <p className="more-row-tag">{p.tagline}</p>
                  {p.highlights[0] && <p className="more-row-exists">{p.highlights[0]}</p>}
                  <ul className="dotlist mono more-row-tech" aria-label="Built with">
                    {p.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <Credit p={p} />
                </div>
                <ul className="more-meta mono more-row-meta dotlist" aria-label="Category and year">
                  <li>{p.category}</li>
                  <li>{p.year}</li>
                </ul>
                <Links p={p} open={open(p)} compact />
              </li>
            ))}
          </ul>
        )}

        {earlier.length > 0 && (
          <div className="more-earlier">
            <h3 className="more-earlier-title">Earlier sites</h3>
            <ul>
              {earlier.map((p) => (
                <li key={p.id}>
                  {p.github ? (
                    <a href={p.github} target="_blank" rel="noreferrer" className="more-earlier-link">
                      {p.title}
                      <span className="sr-only"> on GitHub (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span>{p.title}</span>
                  )}
                  <span className="more-earlier-note">
                    {p.year} · {p.tagline}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

const vars = (p: Project) => ({ '--pl-bg': p.palette.bg, '--pl-fg': p.palette.fg, '--pl-acc': p.palette.accent }) as CSSProperties;

function Credit({ p }: { p: Project }) {
  if (!p.team && !p.role) return null;
  return (
    <p className="more-credit">
      {p.team ? `${p.team}. ` : ''}
      {p.role ? `Role: ${p.role}.` : ''}
    </p>
  );
}

function Links({ p, open, compact = false }: { p: Project; open: (e: MouseEvent<HTMLAnchorElement>) => void; compact?: boolean }) {
  return (
    <ul className={`more-links ${compact ? 'more-links--compact' : ''}`}>
      <li>
        <Link to={`/work/${p.slug}`} onClick={open} className="tlink" tabIndex={compact ? -1 : undefined} aria-hidden={compact || undefined}>
          Case study <Arrow dir="right" />
        </Link>
      </li>
      {p.github && (
        <li>
          <a href={p.github} target="_blank" rel="noreferrer" className="tlink">
            GitHub <Arrow dir="out" />
            <span className="sr-only"> for {p.title} (opens in a new tab)</span>
          </a>
        </li>
      )}
      {p.live && (
        <li>
          <a href={p.live} target="_blank" rel="noreferrer" className="tlink">
            Live <Arrow dir="out" />
            <span className="sr-only"> {p.title} (opens in a new tab)</span>
          </a>
        </li>
      )}
    </ul>
  );
}

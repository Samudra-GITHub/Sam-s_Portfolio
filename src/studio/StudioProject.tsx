import { useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { paged, type Project } from '../data/projects';
import { real } from '../lib/content';
import Magnetic from '../components/core/Magnetic';
import { StudioPage } from './StudioShell';
import { light, useStudioMotion } from './motion';
import { SHOTS, type Shot } from './media';
import { Contact } from './sections';
import { CASE_ZONES, useLeaves } from './useLeaves';
import './project.css';

function Frame({ shot, tilt = 0, className = '' }: { shot: Shot; tilt?: number; className?: string }) {
  return (
    <figure className={`st-screen ${className}`} data-tilt={tilt} {...light}>
      <img src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading="lazy" decoding="async" />
    </figure>
  );
}

/** the pictures, laid out by what exists: wide screens, small native screens, or training pairs */
function Gallery({ p }: { p: Project }) {
  const shots = SHOTS[p.slug] ?? [];
  if (p.slug === 'akasha-lens') {
    return (
      <div className="st-case__pairs">
        {[0, 2, 4].map((i) => (
          <div key={i} className="st-case__pair" data-r>
            <Frame shot={shots[i]} />
            <Frame shot={shots[i + 1]} />
            <p className="st-meta">Pair {i / 2 + 1}: cloudy input, clear target</p>
          </div>
        ))}
      </div>
    );
  }
  if (!shots.length) {
    // no screenshots exist: the project's own line on its own colour, and nothing pretending to be its interface
    return (
      <div className="st-case__plate" data-r>
        <p>{p.tagline}</p>
      </div>
    );
  }
  const small = shots[0].w < 800;
  if (small) {
    return (
      <div className="st-case__bed" data-r>
        {shots.map((s, i) => <Frame key={s.src} shot={s} tilt={i % 2 ? 6 : -6} className="st-case__small" />)}
      </div>
    );
  }
  const [lead, ...rest] = shots;
  return (
    <div className="st-case__wide">
      <Frame shot={lead} tilt={-6} className="st-case__lead" />
      {rest.map((s, i) => <Frame key={s.src} shot={s} tilt={i % 2 ? 7 : -7} className="st-case__more" />)}
    </div>
  );
}

export default function StudioProject({ project: p }: { project: Project }) {
  const root = useRef<HTMLElement>(null);
  useStudioMotion(root, p.slug);
  const leafCanvas = useLeaves(root, CASE_ZONES, p.slug);
  const next = paged[(paged.findIndex((q) => q.slug === p.slug) + 1) % paged.length];
  const live = real(p.live);
  const facts: [string, string][] = [
    ['Year', p.year],
    ['Kind', p.category],
    ...(p.role ? [['Role', p.role] as [string, string]] : []),
    ...(p.team ? [['Team', p.team] as [string, string]] : []),
  ];

  return (
    <StudioPage className="st-case" rootRef={root}>
      <canvas ref={leafCanvas} className="st-leaves" aria-hidden="true" />
      <section className="st-case__hero" style={{ '--case-accent': p.palette.accent } as CSSProperties}>
        <p className="st-meta st-case__crumb" data-fade>
          <Link to="/#universe">Index</Link> <span aria-hidden="true">/</span> {p.category}
        </p>
        <h1 className="st-case__title">
          <span className="st-clip"><span data-line>{p.title}</span></span>
        </h1>
        {p.alias && <p className="st-meta" data-fade>Also known as {p.alias}</p>}
        <div className="st-case__intro">
          <p className="st-case__tagline" data-fade>{p.tagline}</p>
          <dl className="st-case__facts" data-fade>
            {facts.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <div className="st-case__actions" data-fade>
            {live && (
              <Magnetic>
                <a className="st-button" href={live} target="_blank" rel="noreferrer">
                  Open the live site <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Magnetic>
            )}
            {p.github && (
              <a className={live ? 'st-button st-button--ghost' : 'st-button'} href={p.github} target="_blank" rel="noreferrer">
                Source on GitHub <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="st-case__media" aria-label={`Pictures of ${p.title}`} data-reveal style={{ '--plate-bg': p.palette.bg, '--plate-fg': p.palette.fg, '--plate-accent': p.palette.accent } as CSSProperties}>
        <Gallery p={p} />
      </section>

      <section className="st-case__body" data-reveal>
        <div className="st-case__col">
          <h2 className="st-meta" data-r>What it is</h2>
          <p className="st-case__desc" data-r>{p.description}</p>
          {real(p.longDescription) && <p className="st-body" data-r>{p.longDescription}</p>}
          {real(p.status) && (
            <p className="st-case__status" data-r><span className="st-meta">Status</span> {p.status}</p>
          )}
        </div>
        <div className="st-case__col">
          {p.highlights.length > 0 && (
            <>
              <h2 className="st-meta" data-r>What exists</h2>
              <ul className="st-facts" data-r>
                {p.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </>
          )}
          <h2 className="st-meta" data-r>Built with</h2>
          <ul className="st-case__tech" data-r>
            {p.tech.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </section>

      <section className="st-case__next" aria-label="Next project">
        <Link to={`/work/${next.slug}`}>
          <span className="st-meta">Next project</span>
          <span className="st-case__next-name">{next.title}</span>
          <span className="st-case__next-line">{next.tagline}</span>
        </Link>
      </section>

      <Contact />
    </StudioPage>
  );
}

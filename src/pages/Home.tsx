import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WorldStage from '../components/world/WorldStage';
import { config } from '../data/config';
import { featured, moreWork, projects } from '../data/projects';
import { real } from '../lib/content';
import { scrollToTarget } from '../lib/scroll';
import './home.css';

/**
 * The homepage is a walk across six floating islands. The world is a backdrop:
 * everything it shows is here as plain, scrollable HTML, in this order.
 */

/** Tools are grouped by use, and only tools that appear in a real project are listed. */
const TOOL_GROUPS: { title: string; note: string; tools: string[] }[] = [
  { title: 'Front end', note: 'Interfaces and web apps', tools: ['React', 'Next.js', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'HTML', 'CSS'] },
  { title: 'Motion & 3D', note: 'How things move and feel', tools: ['Framer Motion', 'GSAP', 'Lenis', 'Three.js', 'React Three Fiber', 'WebGL'] },
  { title: 'Back end & data', note: 'APIs, databases, deployment', tools: ['Python', 'FastAPI', 'Flask', 'Prisma', 'PostgreSQL', 'Supabase', 'Docker', 'Stripe', 'Recharts'] },
  { title: 'AI & vision', note: 'Models and what they feel like to use', tools: ['PyTorch', 'NumPy', 'scikit-image', 'faster-whisper', 'Llama 3.3 (Groq)', 'Groq', 'edge-tts'] },
  { title: 'Hardware', note: 'Small chips, tight budgets', tools: ['C++', 'ESP32', 'Arduino'] },
];

const YEAR = new Date().getFullYear();
const pad = (n: number) => String(n).padStart(2, '0');

export default function Home() {
  const { hash } = useLocation();

  // arriving at /#work from another page: land on the island once the page has laid out
  useEffect(() => {
    if (!hash) return;
    const id = window.setTimeout(() => scrollToTarget(hash, { immediate: true }), 60);
    return () => window.clearTimeout(id);
  }, [hash]);

  const toolkit = useMemo(
    () =>
      TOOL_GROUPS.map((g) => ({
        ...g,
        tools: g.tools
          .map((t) => ({ name: t, count: projects.filter((p) => p.tech.includes(t)).length }))
          .filter((t) => t.count > 0),
      })).filter((g) => g.tools.length > 0),
    [],
  );

  const links = [
    { label: 'GitHub', url: real(config.contact.github) },
    { label: 'LinkedIn', url: real(config.contact.linkedin) },
    { label: 'Instagram', url: real(config.contact.instagram) },
    ...config.contact.otherLinks.map((l) => ({ label: l.label, url: real(l.url) })),
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));
  const email = real(config.contact.email);

  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToTarget(`#${id}`, { duration: 1.6 });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <>
      <WorldStage />
      <main id="main" className="pg">
        {/* 00 / 01: the landing island */}
        <section id="top" className="pg-sec pg-hero" aria-labelledby="hero-title">
          <div className="pg-col">
            <p className="pg-kicker mono">Designer &amp; Developer</p>
            <h1 id="hero-title" className="pg-name">
              {config.name}
            </h1>
            <p className="pg-lede">I design and build interfaces, AI tools and small worlds like this one. Scroll to travel through it, or jump straight to the work.</p>
            <div className="pg-actions">
              <a href="#work" className="btn" onClick={jump('work')}>
                Explore selected work <span className="btn-arrow" aria-hidden="true">→</span>
              </a>
              <a href="#about" className="btn btn--line" onClick={jump('about')}>
                About me
              </a>
            </div>
          </div>
          <p className="pg-cue mono" aria-hidden="true">
            Scroll to travel
          </p>
        </section>

        {/* 02: the project district */}
        <section id="work" className="pg-sec" aria-labelledby="work-title">
          <div className="pg-col pg-col--wide">
            <p className="pg-kicker mono">01 · Over the archipelago</p>
            <h2 id="work-title" className="pg-title">
              Selected work
            </h2>
            <p className="pg-sub">
              {featured.length} projects, each with its honest current status. Open one for the full case study, or{' '}
              <Link to="/projects" className="pg-inline">
                see everything in the index
              </Link>
              .
            </p>
            <ol className="pg-cards">
              {featured.map((p, i) => (
                <li key={p.slug}>
                  <Link to={`/work/${p.slug}`} className="pg-card" style={{ '--acc': ['#28785d', '#d29a54', '#318e91', '#77618e', '#58a987'][i % 5] } as React.CSSProperties}>
                    <span className="pg-card-n mono">{pad(i + 1)}</span>
                    <span className="pg-card-body">
                      <span className="pg-card-cat mono">{p.category}</span>
                      <span className="pg-card-title">
                        {p.title}
                        {p.alias && <span className="pg-card-alias"> (formerly {p.alias})</span>}
                      </span>
                      <span className="pg-card-tag">{p.tagline}</span>
                      <span className="pg-card-meta">
                        {[p.role, p.team, p.tech.slice(0, 3).join(', ')].filter(Boolean).join(' · ')}
                      </span>
                      {p.status && <span className="pg-card-status">{p.status}</span>}
                    </span>
                    <span className="pg-card-go" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 05: the garden */}
        <section id="experiments" className="pg-sec" aria-labelledby="exp-title">
          <div className="pg-col">
            <p className="pg-kicker mono">02 · Down by the falls</p>
            <h2 id="exp-title" className="pg-title">
              Experiments &amp; smaller builds
            </h2>
            <p className="pg-sub">Hackathon entries, coursework and interface explorations. Less polished, and labelled as such.</p>
            <ul className="pg-list">
              {moreWork.map((p) => (
                <li key={p.slug}>
                  <Link to={`/work/${p.slug}`} className="pg-row">
                    <span className="pg-row-title">{p.title}</span>
                    <span className="pg-row-tag">{p.tagline}</span>
                    <span className="pg-row-meta mono">
                      {p.category}
                      {p.team ? ` · ${p.team}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 02: the observatory */}
        <section id="about" className="pg-sec" aria-labelledby="about-title">
          <div className="pg-col">
            <p className="pg-kicker mono">03 · The overlook</p>
            <h2 id="about-title" className="pg-title">
              About me
            </h2>
            <p className="pg-lede">{config.about.bio}</p>
            <dl className="pg-facts">
              <div>
                <dt className="mono">Interested in</dt>
                <dd>{config.about.interests}</dd>
              </div>
              <div>
                <dt className="mono">Learning</dt>
                <dd>{config.about.learning}</dd>
              </div>
              <div>
                <dt className="mono">Experimenting with</dt>
                <dd>{config.about.experimenting}</dd>
              </div>
            </dl>
            <Link to="/about" className="tlink">
              The longer version →
            </Link>
          </div>
        </section>

        {/* 06: the workshop */}
        <section id="toolkit" className="pg-sec" aria-labelledby="tools-title">
          <div className="pg-col pg-col--wide">
            <p className="pg-kicker mono">04 · Under the roots</p>
            <h2 id="tools-title" className="pg-title">
              Toolkit
            </h2>
            <p className="pg-sub">Grouped by what I use them for. The number is how many projects on this site use each tool, not a skill score.</p>
            <div className="pg-shelves">
              {toolkit.map((g) => (
                <div key={g.title} className="pg-shelf">
                  <h3 className="pg-shelf-title">{g.title}</h3>
                  <p className="pg-shelf-note">{g.note}</p>
                  <ul className="pg-tools">
                    {g.tools.map((t) => (
                      <li key={t.name}>
                        {t.name}
                        <span className="mono" aria-label={`used in ${t.count} project${t.count === 1 ? '' : 's'}`}>
                          {t.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 07: the gate */}
        <section id="contact" className="pg-sec pg-end" aria-labelledby="contact-title">
          <div className="pg-col">
            <p className="pg-kicker mono">05 · The horizon</p>
            <h2 id="contact-title" className="pg-title pg-title--big">
              Let’s make something together.
            </h2>
            <p className="pg-lede">Say hello about a project, an idea or anything on this site. These are the places I answer.</p>
            <ul className="pg-links">
              {email && (
                <li>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              )}
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.url} target="_blank" rel="noreferrer">
                    {l.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <footer className="pg-foot mono">
            <span>© {YEAR} {config.name}</span>
            <a href="#top" onClick={jump('top')}>
              Back to the arrival ↑
            </a>
          </footer>
        </section>
      </main>
    </>
  );
}

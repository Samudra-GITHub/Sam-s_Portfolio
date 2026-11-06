import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WorldStage from '../components/world/WorldStage';
import FlyingIntro from '../components/world/FlyingIntro';
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

  // which project chapter crosses the middle of the screen: its caption shows beside its island
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const slug = e.target.id.slice(2);
          setActive((cur) => (e.isIntersecting ? slug : cur === slug ? null : cur));
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    document.querySelectorAll('.pg-chapter').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.dataset.isle = active;
    else delete root.dataset.isle;
    return () => {
      delete root.dataset.isle;
    };
  }, [active]);

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
        {/* 01: the arrival, and the introduction that takes flight */}
        <FlyingIntro onJump={jump} />

        {/* 02: the project archipelago, one island per project */}
        <section id="work" aria-labelledby="work-title">
          <div className="pg-sec pg-sec--intro">
            <div className="pg-col">
              <p className="pg-kicker mono">01 · The archipelago</p>
              <h2 id="work-title" className="pg-title">
                Selected work
              </h2>
              <p className="pg-sub">
                {featured.length} projects, each on its own island out in the sky. Scroll to fly to them in turn, or{' '}
                <Link to="/projects" className="pg-inline">
                  open the plain index
                </Link>
                .
              </p>
            </div>
          </div>
          {featured.map((p, i) => (
            <article key={p.slug} id={`p-${p.slug}`} className="pg-chapter" aria-labelledby={`t-${p.slug}`} data-active={active === p.slug || undefined}>
              {/* pinned beside the project's island while its chapter is in view (World.tsx writes --isle-x/y/r) */}
              <div className="isle-cap">
                <p className="pg-kicker mono">
                  {pad(i + 1)} / {pad(featured.length)} · {p.category}
                </p>
                <h3 id={`t-${p.slug}`} className="isle-title">
                  {p.title}
                  {p.alias && <span className="pg-card-alias"> formerly {p.alias}</span>}
                </h3>
                <p className="pg-ptag">{p.tagline}</p>
                <p className="pg-pdesc">{p.description}</p>
                <div className="pg-plinks">
                  <Link to={`/work/${p.slug}`} className="btn">
                    Case study <span className="btn-arrow" aria-hidden="true">→</span>
                  </Link>
                  {p.live && (
                    <a href={p.live} target="_blank" rel="noreferrer" className="btn btn--line">
                      Live site ↗
                    </a>
                  )}
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noreferrer" className="tlink">
                      Source
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
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

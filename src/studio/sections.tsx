import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { projects, paged, type Project } from '../data/projects';
import { config } from '../data/config';
import { real } from '../lib/content';
import { gsap } from '../lib/gsap';
import { matches, MQ } from '../lib/runtime';
import './sections.css';

const W = `${import.meta.env.BASE_URL}world`;

/* ============================================================ Project universe */

/** every project, grouped by the kind of work it is; the counts and the lens come from the project data */
const GROUPS: { key: string; label: string; slugs: string[] }[] = [
  { key: 'web', label: 'Web products', slugs: ['tarang', 'krama', 'noir-cafe', 'prahari', 'skycast'] },
  { key: 'ai', label: 'AI and vision', slugs: ['rinti-ai', 'akasha-lens', 'grama-sathi', 'niriksh-ai'] },
  { key: 'motion', label: 'Interfaces and motion', slugs: ['personal-portfolio', 'the-waffle-house', 'orbit-os', 'previous-portfolio', 'first-website'] },
  { key: 'embedded', label: 'Embedded', slugs: ['catch-the-rocket', 'speed-of-numbers'] },
];

/** real screenshots, where a project has them */
const PICS: Record<string, { src: string; w: number; h: number; alt: string }> = {
  tarang: { src: `${W}/tarang/home.webp`, w: 1440, h: 900, alt: "Tarang's home screen" },
  krama: { src: `${W}/krama/home.webp`, w: 1440, h: 900, alt: "Krama's home page" },
  'noir-cafe': { src: `${W}/noir/menu.webp`, w: 1440, h: 900, alt: "Noir Café's menu page" },
  'rinti-ai': { src: `${W}/rinti/login.webp`, w: 520, h: 540, alt: "Rinti's sign-in screen" },
  prahari: { src: `${W}/prahari/login.webp`, w: 1440, h: 900, alt: "PRAHARI's sign-in screen" },
  'akasha-lens': { src: `${W}/akasha/clear2.webp`, w: 487, h: 287, alt: 'A clear satellite image from an AkashaLens training pair' },
};

const groupOf = (slug: string) => GROUPS.find((g) => g.slugs.includes(slug))!;
const hasPage = (p: Project) => paged.some((q) => q.slug === p.slug);

function Lens({ p }: { p: Project }) {
  const pic = PICS[p.slug];
  return (
    <motion.div
      key={p.slug}
      className="st-lens__card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
    >
      <div className="st-lens__pic" style={{ '--plate-bg': p.palette.bg, '--plate-fg': p.palette.fg, '--plate-accent': p.palette.accent } as CSSProperties}>
        {pic ? (
          <img src={pic.src} alt={pic.alt} width={pic.w} height={pic.h} className={pic.w < 600 ? 'is-small' : ''} />
        ) : (
          // no screenshot exists: the project's own line, set on its own colour, and nothing pretending to be its interface
          <p className="st-lens__plate">{p.tagline}</p>
        )}
      </div>
      <p className="st-meta">{p.category} · {p.year}{p.team ? ` · ${p.team}` : ''}{p.role && p.team ? ` · ${p.role}` : ''}</p>
      <p className="st-lens__desc">{p.description}</p>
      <p className="st-meta">{p.tech.join(' · ')}</p>
      {real(p.status) && <p className="st-lens__status">{p.status}</p>}
    </motion.div>
  );
}

export function Universe() {
  const [filter, setFilter] = useState<string>('all');
  const [active, setActive] = useState('tarang');
  const list = useMemo(() => projects.filter((p) => groupOf(p.slug)).filter((p) => filter === 'all' || groupOf(p.slug).key === filter), [filter]);
  const current = projects.find((p) => p.slug === active) ?? list[0];

  return (
    <section id="universe" className="st-universe" aria-labelledby="st-universe-title">
      <div className="st-universe__head" data-reveal>
        <h2 id="st-universe-title" className="st-title st-title--big" data-r>Project universe</h2>
        <p className="st-lead" data-r>
          All {projects.length} projects, from a first HTML page in 2023 to a rocket ground station on an ESP32. Point at one to look closer.
        </p>
        <div className="st-filter" role="group" aria-label="Filter projects by kind" data-r>
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            Everything <span>{projects.length}</span>
          </button>
          {GROUPS.map((g) => (
            <button key={g.key} type="button" aria-pressed={filter === g.key} onClick={() => setFilter(g.key)}>
              {g.label} <span>{g.slugs.length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="st-universe__body">
        <ol className="st-uni">
          {list.map((p) => {
            const inner = (
              <>
                <span className="st-uni__no">{String(projects.indexOf(p) + 1).padStart(2, '0')}</span>
                <span className="st-uni__name">{p.title}</span>
                <span className="st-uni__kind st-meta">{groupOf(p.slug).label}</span>
                <span className="st-uni__year st-meta">{p.year}</span>
                <span className="st-uni__line">{p.tagline}</span>
              </>
            );
            const handlers = { onPointerEnter: () => setActive(p.slug), onFocus: () => setActive(p.slug) };
            return (
              <li key={p.id} className={current?.slug === p.slug ? 'is-on' : ''}>
                {hasPage(p) ? (
                  <Link to={`/work/${p.slug}`} {...handlers}>{inner}</Link>
                ) : (
                  <a href={p.github} target="_blank" rel="noreferrer" {...handlers}>{inner}</a>
                )}
              </li>
            );
          })}
        </ol>
        <aside className="st-lens" aria-live="polite" aria-label="Project preview">
          <AnimatePresence mode="wait" initial={false}>
            {current && <Lens key={current.slug} p={current} />}
          </AnimatePresence>
        </aside>
      </div>
    </section>
  );
}

/* ============================================================ About */

export function About() {
  const team = projects.filter((p) => p.team);
  return (
    <section id="about" className="st-about" data-reveal aria-labelledby="st-about-title">
      <div className="st-about__head">
        <h2 id="st-about-title" className="st-title st-title--big" data-r>About</h2>
        <p className="st-statement st-statement--flush" data-r>
          {config.about.roles.map((r, i) => (
            <span key={r}>
              {i === 0 ? r[0].toUpperCase() + r.slice(1) : r}
              {i < config.about.roles.length - 2 ? ', ' : i === config.about.roles.length - 2 ? ' and ' : '.'}
            </span>
          ))}
        </p>
        <p className="st-body" data-r>{config.about.interests}</p>
      </div>
      <dl className="st-facets">
        {config.about.facets.map((f) => (
          <div key={f.key} data-r>
            <dt>{f.title}</dt>
            <dd>{f.line}</dd>
          </div>
        ))}
      </dl>
      {team.length > 0 && (
        <div className="st-credits" data-r>
          <h3 className="st-meta">Team work, credited</h3>
          <ul>
            {team.map((p) => (
              <li key={p.id}>
                <span>{p.title}</span>
                <span className="st-meta">{p.team} · {p.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ============================================================ Experiments */

/** study 01: each letter's weight follows the pointer's distance (Sora is variable, 100 to 800) */
function WeightStudy() {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matches(MQ.reducedMotion)) return;
    const letters = Array.from(el.querySelectorAll<HTMLSpanElement>('span'));
    let px = -9999, py = -9999, raf = 0;
    const draw = () => {
      raf = 0;
      for (const l of letters) {
        const r = l.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const k = Math.max(0, 1 - d / 260);
        l.style.fontVariationSettings = `'wght' ${Math.round(160 + 640 * k * k)}`;
      }
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const leave = () => {
      px = py = -9999;
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const box = el.parentElement!;
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerleave', leave);
    return () => {
      box.removeEventListener('pointermove', move);
      box.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <p ref={ref} className="st-weight" aria-label="Weight">
      {'Weight'.split('').map((c, i) => <span key={i} aria-hidden="true">{c}</span>)}
    </p>
  );
}

/** study 02: a chip you can throw; it returns on a critically damped spring and reports the speed you let go at */
function SpringStudy() {
  const [speed, setSpeed] = useState<number | null>(null);
  const x = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 24 });
  const rot = useTransform(sx, [-200, 200], [-12, 12]);
  return (
    <div className="st-spring">
      <motion.button
        type="button"
        className="st-spring__chip"
        drag
        dragSnapToOrigin
        dragElastic={0.35}
        dragTransition={{ bounceStiffness: 320, bounceDamping: 22 }}
        style={{ rotate: rot }}
        onDrag={(_, info) => x.set(info.offset.x)}
        onDragEnd={(_, info) => {
          x.set(0);
          setSpeed(Math.round(Math.hypot(info.velocity.x, info.velocity.y)));
        }}
        aria-label="A chip you can drag and throw"
      >
        Throw me
      </motion.button>
      <p className="st-meta" aria-live="polite">{speed === null ? 'Drag it and let go.' : `Let go at ${speed} px/s.`}</p>
    </div>
  );
}

/** study 03: a word the scroll takes apart and puts back together */
function ScrubStudy() {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matches(MQ.reducedMotion)) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('span'),
        { yPercent: (i) => (i % 2 ? 90 : -90), rotate: (i) => (i % 2 ? 14 : -14), opacity: 0.25 },
        { yPercent: 0, rotate: 0, opacity: 1, ease: 'none', stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 95%', end: 'center 50%', scrub: 0.5 } },
      );
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <p ref={ref} className="st-scrub" aria-label="Choreography">
      {'Choreography'.split('').map((c, i) => <span key={i} aria-hidden="true">{c}</span>)}
    </p>
  );
}

export function Experiments() {
  const shipped = ['the-waffle-house', 'orbit-os'].map((s) => projects.find((p) => p.slug === s)!).filter(Boolean);
  return (
    <section id="lab" className="st-lab" aria-labelledby="st-lab-title">
      <div className="st-lab__head" data-reveal>
        <h2 id="st-lab-title" className="st-title st-title--big" data-r>Experiments</h2>
        <p className="st-lead" data-r>
          Three small studies in what I&rsquo;m experimenting with: {config.about.experimenting.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())}. They run here, on this page.
        </p>
      </div>
      <div className="st-lab__grid" data-reveal>
        <figure className="st-study st-study--weight" data-r>
          <WeightStudy />
          <figcaption><span className="st-meta">Study 01</span> Each letter takes its weight from how close the pointer is.</figcaption>
        </figure>
        <figure className="st-study st-study--spring" data-r>
          <SpringStudy />
          <figcaption><span className="st-meta">Study 02</span> A spring that keeps the speed of your throw.</figcaption>
        </figure>
        <figure className="st-study st-study--scrub" data-r>
          <ScrubStudy />
          <figcaption><span className="st-meta">Study 03</span> The scroll takes the word apart and sets it back.</figcaption>
        </figure>
      </div>
      <ul className="st-lab__shipped" data-reveal>
        {shipped.map((p) => (
          <li key={p.id} data-r>
            <span className="st-meta">Shipped experiment</span>
            <span className="st-lab__name">{p.title}</span>
            <span>{p.tagline}</span>
            <span className="st-links">
              {p.live && <a href={p.live} target="_blank" rel="noreferrer">Live site <span aria-hidden="true">↗</span></a>}
              {p.github && <a href={p.github} target="_blank" rel="noreferrer">Source <span aria-hidden="true">↗</span></a>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ============================================================ Toolkit */

const KITS: { label: string; tools: string[] }[] = [
  { label: 'Languages', tools: ['TypeScript', 'Python', 'C++', 'HTML', 'CSS', 'LaTeX'] },
  { label: 'Interface', tools: ['React', 'Next.js', 'Vite', 'Tailwind CSS', 'Zustand', 'Recharts'] },
  { label: 'Motion and 3D', tools: ['Framer Motion', 'GSAP', 'Lenis', 'Three.js', 'React Three Fiber', 'WebGL'] },
  { label: 'AI and data', tools: ['PyTorch', 'NumPy', 'scikit-image', 'Matplotlib', 'faster-whisper', 'edge-tts', 'Groq', 'Llama 3.3 (Groq)'] },
  { label: 'Back end', tools: ['Flask', 'FastAPI', 'Prisma', 'PostgreSQL', 'Supabase', 'Stripe', 'Docker', 'OpenWeatherMap API'] },
  { label: 'Hardware', tools: ['ESP32', 'Arduino'] },
];

export function Toolkit() {
  const used = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of projects) for (const t of p.tech) m.set(t, [...(m.get(t) ?? []), p.title]);
    return m;
  }, []);
  const known = new Set(KITS.flatMap((k) => k.tools));
  const other = [...used.keys()].filter((t) => !known.has(t));
  const kits = [...KITS, ...(other.length ? [{ label: 'Other', tools: other }] : [])].map((k) => ({
    ...k,
    tools: k.tools.filter((t) => used.has(t)).sort((a, b) => used.get(b)!.length - used.get(a)!.length),
  }));
  const [pick, setPick] = useState('React');

  return (
    <section id="toolkit" className="st-kit" data-reveal aria-labelledby="st-kit-title">
      <div className="st-kit__head">
        <h2 id="st-kit-title" className="st-title st-title--big" data-r>Toolkit</h2>
        <p className="st-lead" data-r>Counted from the projects themselves, not from a list of things I&rsquo;ve heard of. Pick a tool to see where it was used.</p>
        <p className="st-kit__used" aria-live="polite" data-r>
          <span className="st-kit__tool">{pick}</span>
          <span>{used.get(pick)?.join(', ')}</span>
        </p>
      </div>
      <div className="st-kit__grid">
        {kits.map((k) => (
          <div key={k.label} className="st-kit__group" data-r>
            <h3 className="st-meta">{k.label}</h3>
            <ul>
              {k.tools.map((t) => (
                <li key={t}>
                  <button type="button" aria-pressed={pick === t} onClick={() => setPick(t)} onPointerEnter={() => setPick(t)}>
                    <span>{t}</span>
                    <span className="st-meta">{used.get(t)!.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================ Contact */

const YEAR = new Date().getFullYear();
const handle = (url: string) => url.replace(/\/+$/, '').split('/').pop() ?? url;

export function Contact() {
  const c = config.contact;
  const email = real(c.email);
  const links = [
    { label: 'GitHub', url: real(c.github) },
    { label: 'LinkedIn', url: real(c.linkedin) },
    { label: 'Instagram', url: real(c.instagram) },
    ...c.otherLinks.map((l) => ({ label: l.label, url: real(l.url) })),
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));

  return (
    <section id="contact" className="st-contact" data-reveal aria-labelledby="st-contact-title">
      <h2 id="st-contact-title" className="st-contact__title" data-r>
        Let&rsquo;s build
        <br />
        something.
      </h2>
      <p className="st-lead" data-r>
        {email ? 'Write to me, or find me on any of these.' : 'The quickest way to reach me is a message on any of these.'}
      </p>
      {email && (
        <a className="st-contact__email" href={`mailto:${email}`} data-r>{email}</a>
      )}
      <ul className="st-contact__links">
        {links.map((l) => (
          <li key={l.label} data-r>
            <a href={l.url} target="_blank" rel="noreferrer">
              <span className="st-contact__label">{l.label}</span>
              <span className="st-meta">{handle(l.url)}</span>
              <span aria-hidden="true" className="st-contact__arrow">↗</span>
            </a>
          </li>
        ))}
      </ul>
      <footer className="st-foot">
        <p className="st-meta">© {YEAR} {config.name}</p>
        <p className="st-meta">Built with React, three.js and GSAP. Set in Sora, Inter and IBM Plex Mono.</p>
        <a className="st-meta" href="#main">Back to top ↑</a>
      </footer>
    </section>
  );
}

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../data/config';
import { projects } from '../data/projects';
import { ScrollTrigger } from '../lib/gsap';
import { usePageTransition } from '../components/core/PageTransition';
import Stack from '../components/stack/Stack';
import KageSeed from '../components/kage/KageSeed';
import Arrow from '../components/core/Arrow';
import './pages.css';

/**
 * /about: a contact sheet.
 *
 * Photography is one of the things he does, so the page is laid out the way a
 * photographer reviews a roll: every side of him is a frame on one strip, and
 * the loupe enlarges whichever frame you pick. Short words, then the bench
 * (what he is building, learning and trying right now), then the toolbox.
 * Every line here comes from the site config; nothing is added.
 */
const FRAMES = config.about.facets;

function Picto({ k }: { k: string }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'square' as const };
  switch (k) {
    case 'design':
      return (
        <g>
          {[30, 60, 90, 120].map((x) => <line key={x} x1={x} y1="20" x2={x} y2="130" stroke="currentColor" strokeOpacity=".18" />)}
          {[40, 75, 110].map((y) => <line key={y} x1="15" y1={y} x2="145" y2={y} stroke="currentColor" strokeOpacity=".18" />)}
          <path className="pc-draw" pathLength={1} d="M20 115 C 50 20, 100 140, 140 35" {...s} />
          <rect x="132" y="27" width="16" height="16" {...s} />
          <rect x="12" y="107" width="16" height="16" {...s} />
        </g>
      );
    case 'dev':
      return (
        <g {...s} strokeWidth={6}>
          <path d="M52 45 22 75l30 30" />
          <path d="M108 45l30 30-30 30" />
          <path d="M90 38 70 112" />
          <rect className="pc-blink" x="146" y="98" width="6" height="16" fill="currentColor" stroke="none" />
        </g>
      );
    case 'student':
      return (
        <g {...s}>
          <rect x="40" y="35" width="80" height="90" />
          <rect className="pc-page" x="40" y="35" width="80" height="90" fill="var(--sheet)" style={{ transformOrigin: '40px 80px' }} />
          {[55, 70, 85, 100].map((y) => <line key={y} x1="52" y1={y} x2="108" y2={y} strokeOpacity=".5" />)}
        </g>
      );
    case 'photo':
      return (
        <g {...s}>
          <circle cx="80" cy="75" r="50" />
          <g className="pc-iris" style={{ transformOrigin: '80px 75px' }}>
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return <line key={i} x1={80 + Math.cos(a) * 50} y1={75 + Math.sin(a) * 50} x2={80 + Math.cos(a + 2.1) * 18} y2={75 + Math.sin(a + 2.1) * 18} />;
            })}
          </g>
        </g>
      );
    case 'code':
      return (
        <g>
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} className="pc-dot" cx={80 + Math.cos(i * 2.4) * (12 + i * 3.4)} cy={75 + Math.sin(i * 2.4) * (12 + i * 3.4)} r={2 + (i % 3)} fill="currentColor" style={{ '--d': `${i * 90}ms` } as CSSProperties} />
          ))}
        </g>
      );
    case 'ai':
      return (
        <g {...s}>
          <path d="M15 75 C 50 25, 110 25, 145 75 C 110 125, 50 125, 15 75Z" />
          <circle cx="80" cy="75" r="20" />
          <circle cx="80" cy="75" r="7" fill="currentColor" />
          <line className="pc-scan" x1="20" y1="40" x2="140" y2="40" stroke="var(--lime)" strokeWidth="3" />
        </g>
      );
    default:
      return (
        <g {...s}>
          <path d="M65 25v40L35 120h90L95 65V25" />
          <line x1="58" y1="25" x2="102" y2="25" />
          {[0, 1, 2].map((i) => <circle key={i} className="pc-bubble" cx={70 + i * 12} cy="105" r={3 + i} style={{ '--d': `${i * 400}ms` } as CSSProperties} />)}
        </g>
      );
  }
}

export default function AboutPage() {
  const { go } = usePageTransition();
  const [on, setOn] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const frame = FRAMES[on];

  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => window.clearTimeout(t);
  }, []);

  // arrow keys walk the roll, the way they do in any viewer
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (on + (e.key === 'ArrowRight' ? 1 : -1) + FRAMES.length) % FRAMES.length;
    setOn(next);
    strip.current?.querySelectorAll<HTMLButtonElement>('.cs-frame')[next]?.focus();
  };

  const to = (path: string, label: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(path, { from: e.currentTarget.getBoundingClientRect(), color: '#081c4a', ink: '#eef2fc', label });
  };

  const bench = [
    { k: 'Building', v: config.personal.currentlyBuilding },
    { k: 'Learning', v: config.about.learning },
    { k: 'Trying', v: config.about.experimenting },
  ];

  return (
    <main id="main" className="pg pg-about">
      <header className="ab-open">
        <p className="ab-kicker mono">
          About · {config.studio} · {projects.length} projects
        </p>
        <h1 className="ab-title">
          {['Designer,', 'developer,', 'student.'].map((w, i) => (
            <span key={w} className="ab-line" style={{ '--i': i } as CSSProperties}>
              <span>{w}</span>
            </span>
          ))}
        </h1>
        <p className="ab-bio">{config.about.bio}</p>
      </header>

      <section className="cs" aria-labelledby="cs-title">
        <div className="cs-head">
          <h2 id="cs-title" className="ab-h2">The contact sheet</h2>
          <p className="mono cs-note">Seven frames from one roll. Pick one.</p>
        </div>
        <div className="cs-body">
          <div ref={strip} className="cs-strip" role="tablist" aria-label="Sides of Samudra" onKeyDown={onKey}>
            {FRAMES.map((f, i) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                id={`cs-tab-${f.key}`}
                aria-selected={on === i}
                aria-controls="cs-loupe"
                tabIndex={on === i ? 0 : -1}
                className="cs-frame"
                onClick={() => setOn(i)}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setOn(i)}
                style={{ '--i': i } as CSSProperties}
              >
                <span className="cs-n mono">{String(i + 1).padStart(2, '0')}A</span>
                <svg viewBox="0 0 160 150" aria-hidden="true" className="cs-picto" data-on={on === i || undefined}>
                  <Picto k={f.key} />
                </svg>
                <span className="cs-label">{f.title}</span>
              </button>
            ))}
          </div>
          <div id="cs-loupe" className="cs-loupe" role="tabpanel" aria-labelledby={`cs-tab-${frame.key}`}>
            <svg key={frame.key} viewBox="0 0 160 150" aria-hidden="true" className="cs-loupe-picto" data-on>
              <Picto k={frame.key} />
            </svg>
            <div className="cs-loupe-text" key={`t-${frame.key}`}>
              <p className="mono cs-loupe-n">Frame {String(on + 1).padStart(2, '0')} of {FRAMES.length}</p>
              <h3 className="cs-loupe-title">{frame.title}</h3>
              <p className="cs-loupe-line">{frame.line}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bench" aria-labelledby="bench-title">
        <h2 id="bench-title" className="ab-h2">On the bench</h2>
        <dl className="bench-list">
          {bench.map((b) => (
            <div key={b.k} className="bench-row">
              <dt className="mono">{b.k}</dt>
              <dd>{b.v}</dd>
            </div>
          ))}
        </dl>
        <p className="bench-interests">
          <span className="mono">Drawn to</span> {config.about.interests}
        </p>
      </section>

      <Stack />

      <nav className="ab-next" aria-label="Where next">
        <Link to="/projects" className="ab-next-link" onClick={to('/projects', 'The exhibition')}>
          <span className="mono">Next</span>
          <span className="ab-next-big">See the work</span>
          <Arrow dir="right" />
        </Link>
        <Link to="/contact" className="ab-next-link" onClick={to('/contact', 'Say hello')}>
          <span className="mono">Or</span>
          <span className="ab-next-big">Say hello</span>
          <Arrow dir="right" />
        </Link>
        <span className="ab-seed">
          <KageSeed />
        </span>
      </nav>
    </main>
  );
}

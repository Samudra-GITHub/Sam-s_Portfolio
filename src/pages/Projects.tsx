import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { projects, paged, type Project } from '../data/projects';
import { KINDS, kindsOf, type Kind } from '../data/kinds';
import { real } from '../lib/content';
import { useReducedMotion } from '../lib/runtime';
import { usePageTransition } from '../components/core/PageTransition';
import Specimen from '../components/projects/Specimen';
import Arrow from '../components/core/Arrow';
import './projects.css';

/**
 * /projects: the exhibition. Every project on the account that earned a place
 * (see docs/github-project-audit.md) hangs on one wall as a live specimen.
 * The wall is visual; words appear on demand. Pick a specimen and it moves
 * into the spotlight with its real links. Filters re-hang the wall with a
 * view transition where the browser supports one.
 */
const hasPage = new Set(paged.map((p) => p.id));

export default function Projects() {
  const { go } = usePageTransition();
  const reduce = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const kind = (params.get('room') as Kind | null) ?? null;
  const [sel, setSel] = useState<string | null>(params.get('p'));
  const [live, setLive] = useState<string | null>(null);
  const spotRef = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => projects.filter((p) => !kind || kindsOf(p.slug).includes(kind)), [kind]);
  const current = projects.find((p) => p.slug === sel) ?? null;

  const counts = useMemo(() => Object.fromEntries(KINDS.map((k) => [k.id, projects.filter((p) => kindsOf(p.slug).includes(k.id)).length])), []);

  const withTransition = (fn: () => void) => {
    const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (!reduce && d.startViewTransition) d.startViewTransition(fn);
    else fn();
  };

  const setRoom = (k: Kind | null) =>
    withTransition(() =>
      setParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (k) n.set('room', k);
          else n.delete('room');
          return n;
        },
        { replace: true },
      ),
    );

  const pick = (p: Project) => {
    setSel(p.slug);
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('p', p.slug);
        return n;
      },
      { replace: true },
    );
  };
  const close = () => {
    setSel(null);
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete('p');
        return n;
      },
      { replace: true },
    );
  };

  // bring the spotlight into view when something is picked
  useEffect(() => {
    if (!sel) return;
    spotRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  }, [sel, reduce]);
  useEffect(() => {
    if (!sel) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const openCase = (p: Project) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(`/work/${p.slug}`, { color: p.palette.bg, ink: p.palette.fg, label: p.title });
  };

  return (
    <main id="main" className="ex">
      <header className="ex-head">
        <h1 className="ex-title">
          The exhibition <span className="ex-count mono">{projects.length} works</span>
        </h1>
        <nav className="ex-rooms" aria-label="Filter projects">
          <button type="button" aria-pressed={!kind} onClick={() => setRoom(null)}>
            All <span className="mono">{projects.length}</span>
          </button>
          {KINDS.map((k) =>
            counts[k.id] ? (
              <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setRoom(kind === k.id ? null : k.id)}>
                {k.label} <span className="mono">{counts[k.id]}</span>
              </button>
            ) : null,
          )}
        </nav>
      </header>

      <div ref={spotRef} className="ex-spot-wrap" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.section
              key={current.id}
              className="ex-spot"
              aria-label={`${current.title}, in the spotlight`}
              style={{ '--s-bg': current.palette.bg, '--s-fg': current.palette.fg, '--len': Math.max(...current.title.split(' ').map((w) => w.length)) } as CSSProperties}
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(12px)' }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)' }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-8px)' }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="ex-spot-art">
                <Specimen project={current} live />
              </div>
              <div className="ex-spot-text">
                <p className="mono ex-spot-k">{kindsOf(current.slug).map((k) => KINDS.find((x) => x.id === k)?.label).join(' · ')}</p>
                <h2 className="ex-spot-title">{current.title}</h2>
                <p className="ex-spot-tag">{current.tagline}</p>
                <ul className="dotlist mono ex-spot-tech" aria-label="Built with">
                  {current.tech.slice(0, 5).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                {current.team && <p className="ex-spot-team">{current.team}{current.role ? `. Role: ${current.role}.` : ''}</p>}
                <div className="ex-spot-links">
                  {hasPage.has(current.id) && (
                    <Link to={`/work/${current.slug}`} className="btn" onClick={openCase(current)}>
                      Case study <Arrow dir="right" className="btn-arrow" />
                    </Link>
                  )}
                  {real(current.live) && (
                    <a href={current.live} className="tlink" target="_blank" rel="noreferrer">
                      Live <Arrow dir="out" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                  {current.github && (
                    <a href={current.github} className="tlink" target="_blank" rel="noreferrer">
                      GitHub <Arrow dir="out" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                  <button type="button" className="tlink ex-spot-close" onClick={close}>
                    Close
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {shown.length === 0 ? (
        <p className="ex-empty">Nothing in this room yet.</p>
      ) : (
        <ul className="ex-wall">
          {shown.map((p) => (
            <li key={p.id} className="ex-item" data-tier={p.tier} style={{ viewTransitionName: `ex-${p.slug}` } as CSSProperties}>
              <button
                type="button"
                className="ex-tile"
                aria-pressed={sel === p.slug}
                onClick={() => (sel === p.slug ? close() : pick(p))}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setLive(p.slug)}
                onPointerLeave={() => setLive(null)}
                onFocus={() => setLive(p.slug)}
                onBlur={() => setLive(null)}
                data-cursor="project"
                data-cursor-label="VIEW"
              >
                <span className="ex-tile-art">
                  <Specimen project={p} live={live === p.slug || sel === p.slug} />
                </span>
                <span className="ex-tile-cap">
                  <span className="ex-tile-title">{p.title}</span>
                  <span className="ex-tile-tag">{p.tagline}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

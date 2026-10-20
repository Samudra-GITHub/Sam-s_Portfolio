import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { projects, paged, type Project } from '../data/projects';
import { KINDS, kindsOf, type Kind } from '../data/kinds';
import { real } from '../lib/content';
import { useFinePointer, useReducedMotion } from '../lib/runtime';
import { getLenis } from '../lib/scroll';
import { usePageTransition } from '../components/core/PageTransition';
import Specimen from '../components/projects/Specimen';
import Arrow from '../components/core/Arrow';
import './projects.css';

/**
 * /projects: the exhibition. Every project on the account that earned a place
 * (see docs/github-project-audit.md) hangs here as a live specimen drawn from
 * what it actually does.
 *
 *  Wall    the specimens hang as prints: they come up out of the blue as they
 *          scroll in, lean toward the hand, and play only while you look.
 *  Index   the same collection as one fast list, for people who know what they want.
 *  Rooms   filters re-hang the wall with a view transition; each room has its own light.
 *  Focus   picking a print lifts it off the wall into a full-screen viewing room
 *          (a shared-element transition: the same picture travels). Arrow keys
 *          walk the room, Escape puts it back where it came from.
 *
 * The room, the view and the print in focus all live in the URL.
 */
const hasPage = new Set(paged.map((p) => p.id));
const ROOM_LIGHT: Record<Kind, string> = { ai: '#d8f827', web: '#7fb2ff', creative: '#ff7a4d', full: '#f3f5f9', embedded: '#ffb21f' };

type VT = { finished: Promise<void>; ready: Promise<void> };
type Doc = Document & { startViewTransition?: (cb: () => void) => VT };

export default function Projects() {
  const { go } = usePageTransition();
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const [params, setParams] = useSearchParams();
  const kind = (params.get('room') as Kind | null) ?? null;
  const view = params.get('view') === 'index' ? 'index' : 'wall';
  // the print in focus is local state (so a view transition can flush it synchronously); the URL follows it
  const urlSel = params.get('p');
  const [sel, setSel] = useState<string | null>(urlSel);
  const [room, setRoomState] = useState<Kind | null>(kind);
  const [viewState, setViewState] = useState(view);
  // The page writes its own state into the URL, and the router applies those writes later, at low
  // priority, so the URL is not a reliable mirror while a transition runs. A shared link mounts the
  // page fresh (and is read above); the only other outside change is back/forward, so follow that.
  useEffect(() => {
    const onPop = () => {
      const q = new URLSearchParams(window.location.search);
      setSel(q.get('p'));
      setRoomState((q.get('room') as Kind | null) ?? null);
      setViewState(q.get('view') === 'index' ? 'index' : 'wall');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [live, setLive] = useState<string | null>(null);
  const dlgRef = useRef<HTMLDialogElement>(null);

  const shown = useMemo(() => projects.filter((p) => !room || kindsOf(p.slug).includes(room)), [room]);
  const current = projects.find((p) => p.slug === sel) ?? null;
  const counts = useMemo(() => Object.fromEntries(KINDS.map((k) => [k.id, projects.filter((p) => kindsOf(p.slug).includes(k.id)).length])), []);

  const transition = (fn: () => void) => {
    const d = document as Doc;
    if (reduce || !d.startViewTransition) {
      fn();
      return null;
    }
    const vt = d.startViewTransition(() => flushSync(fn));
    // a transition can be skipped (another one started, the tab hid): that is fine, the state still lands
    vt.ready.catch(() => {});
    vt.finished.catch(() => {});
    return vt;
  };
  const patch = (edit: (n: URLSearchParams) => void) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        edit(n);
        return n;
      },
      { replace: true },
    );

  const setRoom = (k: Kind | null) => {
    transition(() => setRoomState(k));
    patch((n) => (k ? n.set('room', k) : n.delete('room')));
  };
  const setView = (v: 'wall' | 'index') => {
    transition(() => setViewState(v));
    patch((n) => (v === 'index' ? n.set('view', 'index') : n.delete('view')));
  };

  // ---------- the viewing room ----------
  const artOf = (slug: string) => document.querySelector<HTMLElement>(`[data-art="${slug}"]`);
  const open = (p: Project) => {
    const art = artOf(p.slug);
    if (art) art.style.viewTransitionName = 'ex-focus';
    const vt = transition(() => {
      if (art) art.style.viewTransitionName = '';
      setSel(p.slug);
    });
    if (!vt && art) art.style.viewTransitionName = '';
    patch((n) => n.set('p', p.slug));
  };
  const close = () => {
    if (!current) return;
    const slug = current.slug;
    const vt = transition(() => {
      setSel(null);
      const art = artOf(slug);
      if (art) art.style.viewTransitionName = 'ex-focus';
    });
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      const art = artOf(slug);
      if (art) art.style.viewTransitionName = '';
      // after the dialog has handed focus back (to whatever opened it first), put it on the print you were last looking at
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-tile="${slug}"]`)?.focus({ preventScroll: true }));
    };
    if (vt) {
      vt.finished.then(settle, settle);
      window.setTimeout(settle, 900); // never let a stalled transition hold the print's name or block the next open
    } else settle();
    patch((n) => n.delete('p'));
  };
  const step = (dir: 1 | -1) => {
    if (!current) return;
    const list = shown.some((p) => p.slug === current.slug) ? shown : projects;
    const i = list.findIndex((p) => p.slug === current.slug);
    const next = list[(i + dir + list.length) % list.length];
    transition(() => setSel(next.slug));
    patch((n) => n.set('p', next.slug));
  };

  // the dialog follows the URL (so a shared link opens straight into the room)
  useLayoutEffect(() => {
    const dlg = dlgRef.current;
    if (!dlg) return;
    if (current && !dlg.open) dlg.showModal();
    if (!current && dlg.open) dlg.close();
  }, [current]);
  useEffect(() => {
    const lenis = getLenis();
    if (current) lenis?.stop();
    else lenis?.start();
    return () => lenis?.start();
  }, [current]);

  const onDialogKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  };

  const openCase = (p: Project) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    getLenis()?.start();
    go(`/work/${p.slug}`, { color: p.palette.bg, ink: p.palette.fg, label: p.title });
  };

  // a print leans toward the hand
  const lean = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || reduce) return;
    const el = e.currentTarget.querySelector<HTMLElement>('.ex-tile-art');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const rest = (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget.querySelector<HTMLElement>('.ex-tile-art');
    el?.style.setProperty('--rx', '0deg');
    el?.style.setProperty('--ry', '0deg');
    setLive(null);
  };

  // the index: a small print follows the pointer down the list
  const peekRef = useRef<HTMLDivElement>(null);
  const [peek, setPeek] = useState<Project | null>(null);
  const movePeek = (e: PointerEvent) => {
    const el = peekRef.current;
    if (el) el.style.transform = `translate3d(${e.clientX + 24}px, ${e.clientY - 80}px, 0)`;
  };

  const kindLabel = (p: Project) => kindsOf(p.slug).map((k) => KINDS.find((x) => x.id === k)?.label).join(' · ');

  return (
    <main id="main" className="ex" data-view={viewState} style={{ '--room': room ? ROOM_LIGHT[room] : 'var(--lime)' } as CSSProperties}>
      <header className="ex-head">
        <p className="ex-kicker mono">Sam's Studio · the exhibition</p>
        <h1 className="ex-title">
          <span>The work</span> <span className="ex-count mono">{shown.length === projects.length ? `${projects.length} works` : `${shown.length} of ${projects.length}`}</span>
        </h1>
        <div className="ex-bar">
          <nav className="ex-rooms" aria-label="Filter projects by kind">
            <button type="button" aria-pressed={!room} onClick={() => setRoom(null)}>
              All <span className="mono">{projects.length}</span>
            </button>
            {KINDS.map((k) =>
              counts[k.id] ? (
                <button key={k.id} type="button" aria-pressed={room === k.id} onClick={() => setRoom(room === k.id ? null : k.id)} style={{ '--k': ROOM_LIGHT[k.id] } as CSSProperties}>
                  <span className="ex-room-dot" aria-hidden="true" />
                  {k.label} <span className="mono">{counts[k.id]}</span>
                </button>
              ) : null,
            )}
          </nav>
          <div className="ex-views" role="group" aria-label="View">
            <button type="button" aria-pressed={viewState === 'wall'} onClick={() => setView('wall')}>
              Wall
            </button>
            <button type="button" aria-pressed={viewState === 'index'} onClick={() => setView('index')}>
              Index
            </button>
          </div>
        </div>
      </header>

      {shown.length === 0 ? (
        <p className="ex-empty">Nothing in this room yet.</p>
      ) : viewState === 'wall' ? (
        <ul className="ex-wall">
          {shown.map((p, i) => (
            <li key={p.id} className="ex-item" data-tier={p.tier} style={{ viewTransitionName: `ex-${p.slug}`, '--i': i } as CSSProperties}>
              <button
                type="button"
                className="ex-tile"
                data-tile={p.slug}
                aria-haspopup="dialog"
                onClick={() => open(p)}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setLive(p.slug)}
                onPointerMove={lean}
                onPointerLeave={rest}
                onFocus={() => setLive(p.slug)}
                onBlur={() => setLive(null)}
                data-cursor="project"
                data-cursor-label="VIEW"
              >
                <span className="ex-tile-art" data-art={p.slug}>
                  <Specimen project={p} live={live === p.slug} />
                  <span className="ex-tile-n mono" aria-hidden="true">{String(projects.indexOf(p) + 1).padStart(2, '0')}</span>
                </span>
                <span className="ex-tile-cap">
                  <span className="ex-tile-title">{p.title}</span>
                  <span className="ex-tile-tag">{p.tagline}</span>
                  <span className="ex-tile-k mono">{kindLabel(p)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="ex-index-wrap" onPointerMove={fine ? movePeek : undefined} onPointerLeave={() => setPeek(null)}>
          <ol className="ex-index">
            {shown.map((p) => (
              <li key={p.id} style={{ viewTransitionName: `ex-${p.slug}` } as CSSProperties}>
                <button type="button" className="ex-row" data-tile={p.slug} aria-haspopup="dialog" onClick={() => open(p)} onPointerEnter={() => fine && setPeek(p)} onFocus={() => setPeek(null)}>
                  <span className="ex-row-n mono">{String(projects.indexOf(p) + 1).padStart(2, '0')}</span>
                  <span className="ex-row-art" data-art={p.slug} aria-hidden="true">
                    <Specimen project={p} />
                  </span>
                  <span className="ex-row-title">{p.title}</span>
                  <span className="ex-row-tag">{p.tagline}</span>
                  <span className="ex-row-k mono">{kindLabel(p)}</span>
                  <span className="ex-row-y mono">{p.year}</span>
                </button>
              </li>
            ))}
          </ol>
          {fine && (
            <div ref={peekRef} className="ex-peek" data-on={peek ? '' : undefined} aria-hidden="true">
              {peek && <Specimen project={peek} live />}
            </div>
          )}
        </div>
      )}

      <dialog
        ref={dlgRef}
        className="ex-room"
        aria-labelledby={current ? 'ex-room-title' : undefined}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => e.target === e.currentTarget && close()}
        onKeyDown={onDialogKey}
        data-lenis-prevent
        style={current ? ({ '--s-bg': current.palette.bg, '--s-fg': current.palette.fg, '--s-acc': current.palette.accent, '--len': Math.max(...current.title.split(' ').map((w) => w.length)) } as CSSProperties) : undefined}
      >
        {current && (
          <div className="ex-room-inner">
            <div className="ex-room-art" style={{ viewTransitionName: 'ex-focus' } as CSSProperties}>
              <Specimen project={current} live />
            </div>
            <div className="ex-room-text" key={current.id}>
              <p className="mono ex-room-k">
                {String(projects.indexOf(current) + 1).padStart(2, '0')} / {projects.length} · {kindLabel(current)}
              </p>
              <h2 id="ex-room-title" className="ex-room-title" tabIndex={-1} autoFocus>
                {current.title}
              </h2>
              <p className="ex-room-tag">{current.tagline}</p>
              <p className="ex-room-desc">{current.description}</p>
              <ul className="dotlist mono ex-room-tech" aria-label="Built with">
                {current.tech.slice(0, 6).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              {current.team && (
                <p className="ex-room-team">
                  {current.team}
                  {current.role ? `. Role: ${current.role}.` : ''}
                </p>
              )}
              <div className="ex-room-links">
                {hasPage.has(current.id) && (
                  <Link to={`/work/${current.slug}`} className="btn" onClick={openCase(current)}>
                    Case study <Arrow dir="right" className="btn-arrow" />
                  </Link>
                )}
                {real(current.live) && (
                  <a href={current.live} className="tlink" target="_blank" rel="noreferrer">
                    Live demo <Arrow dir="out" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
                {current.github && (
                  <a href={current.github} className="tlink" target="_blank" rel="noreferrer">
                    GitHub <Arrow dir="out" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
            </div>
            <div className="ex-room-ctl">
              <button type="button" className="ex-room-btn" onClick={() => step(-1)} aria-label="Previous project">
                <Arrow dir="left" />
              </button>
              <button type="button" className="ex-room-btn" onClick={() => step(1)} aria-label="Next project">
                <Arrow dir="right" />
              </button>
              <button type="button" className="ex-room-btn ex-room-close mono" onClick={close}>
                Close <span aria-hidden="true">Esc</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </main>
  );
}

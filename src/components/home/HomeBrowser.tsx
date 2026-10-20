import { forwardRef, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { featured } from '../../data/projects';
import { real } from '../../lib/content';
import { tick } from '../../lib/sound';
import { usePageTransition } from '../core/PageTransition';
import Specimen from '../projects/Specimen';
import Arrow from '../core/Arrow';

/**
 * The window on the sheet is a real one: a small browser that pages through
 * the featured work. The address bar shows the project's actual address (its
 * live site, or its repository when there is no live site), the page shows
 * its specimen, and the link opens that print in the exhibition.
 * Arrows, the keyboard (← →) or a swipe change the page; the content slides
 * the way you went. It lies on the sheet, so it casts a shadow too (the
 * shader reads its rectangle).
 */
const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const HomeBrowser = forwardRef<HTMLDivElement>(function HomeBrowser(_, ref) {
  const { go } = usePageTransition();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [live, setLive] = useState(false);
  const swipe = useRef<{ x: number; id: number } | null>(null);
  const p = featured[i];
  const address = real(p.live) ?? p.github ?? '';

  const step = (d: 1 | -1) => {
    setDir(d);
    setI((n) => (n + d + featured.length) % featured.length);
    tick();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  };
  const down = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, id: e.pointerId };
  };
  const up = (e: PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  };
  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(`/projects?p=${p.slug}`, { from: e.currentTarget.closest('.hb')?.getBoundingClientRect() ?? null, color: '#081c4a', ink: '#eef2fc', label: p.title });
  };

  return (
    <div
      ref={ref}
      className="hb"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured work"
      onKeyDown={onKey}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setLive(true)}
      onPointerLeave={() => setLive(false)}
      onFocus={() => setLive(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setLive(false)}
      onPointerDown={down}
      onPointerUp={up}
      data-hold-ignore
    >
      <div className="hb-chrome">
        <span className="hb-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="hb-address mono" title={address}>
          <span className="hb-lock" aria-hidden="true" />
          <span className="hb-host" key={address}>{hostOf(address)}</span>
        </span>
        <span className="hb-count mono" aria-live="polite">
          {String(i + 1).padStart(2, '0')}/{String(featured.length).padStart(2, '0')}
        </span>
      </div>
      <Link to={`/projects?p=${p.slug}`} className="hb-page" onClick={open} aria-label={`${p.title}: ${p.tagline} Open it in the exhibition.`} data-cursor="project" data-cursor-label="OPEN">
        <span className="hb-art" key={p.id} data-dir={dir}>
          <Specimen project={p} live={live} />
        </span>
        <span className="hb-cap" key={`c-${p.id}`} data-dir={dir} aria-hidden="true">
          <span className="hb-title">{p.title}</span>
          <span className="hb-tag">{p.tagline}</span>
        </span>
      </Link>
      <div className="hb-ctl">
        <button type="button" className="hb-btn" onClick={() => step(-1)} aria-label="Previous project">
          <Arrow dir="left" />
        </button>
        <span className="hb-dots" aria-hidden="true">
          {featured.map((f, n) => (
            <i key={f.id} data-on={n === i || undefined} />
          ))}
        </span>
        <button type="button" className="hb-btn" onClick={() => step(1)} aria-label="Next project">
          <Arrow dir="right" />
        </button>
      </div>
    </div>
  );
});

export default HomeBrowser;

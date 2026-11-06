import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMotionValueEvent } from 'framer-motion';
import { scrollToTarget, scrollY } from '../lib/scroll';
import { setSound, useSoundOn } from '../lib/sound';
import { config } from '../data/config';
import { NAV_PLACES, PLACES } from './world/places';
import { measure, worldProgress } from './world/progress';
import './nav.css';

/**
 * Compact top navigation: the five places of the world, the project index,
 * a map, and the sound switch. Every place is a plain link to a section, so
 * the world never has to be "played" to get around.
 */
export default function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === '/';
  const [atTop, setAtTop] = useState(true);
  const [active, setActive] = useState('top');
  const [mapOpen, setMapOpen] = useState(false);
  const map = useRef<HTMLDialogElement>(null);
  const soundOn = useSoundOn();
  useMotionValueEvent(scrollY, 'change', (v) => setAtTop(v < 24));

  // which island is in view: the same measure the camera uses, so nav and world agree
  useMotionValueEvent(scrollY, 'change', () => {
    if (onHome) setActive(PLACES[Math.min(PLACES.length - 1, Math.round(worldProgress()))].id);
  });
  useEffect(() => {
    if (!onHome) return;
    const t = window.setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [onHome]);

  useEffect(() => {
    const d = map.current;
    if (!d) return;
    if (mapOpen && !d.open) d.showModal();
    if (!mapOpen && d.open) d.close();
  }, [mapOpen]);

  const go = (id: string) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setMapOpen(false);
    if (onHome) {
      scrollToTarget(`#${id}`, { duration: 1.6 });
      history.replaceState(null, '', id === 'top' ? '/' : `#${id}`);
    } else navigate(id === 'top' ? '/' : `/#${id}`);
  };

  const current = onHome ? active : pathname.startsWith('/projects') || pathname.startsWith('/work/') ? 'work' : pathname.startsWith('/about') ? 'about' : pathname.startsWith('/contact') ? 'contact' : '';

  return (
    <header className="nav" data-top={onHome && atTop}>
      <div className="nav-inner">
        <a href="/" className="nav-brand" onClick={go('top')}>
          <span className="nav-dot" aria-hidden="true" />
          {config.name}
        </a>

        <nav aria-label="Primary" className="nav-main">
          <ul className="nav-links">
            {NAV_PLACES.map((p) => (
              <li key={p.id}>
                <a href={`/#${p.id}`} className="nav-link" aria-current={current === p.id ? 'location' : undefined} onClick={go(p.id)}>
                  {p.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-tools">
          <Link to="/projects" className="nav-chip nav-index" aria-current={pathname === '/projects' ? 'page' : undefined}>
            Index
          </Link>
          <button type="button" className="nav-chip" aria-haspopup="dialog" aria-expanded={mapOpen} onClick={() => setMapOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <circle cx="3" cy="4" r="2" fill="currentColor" />
              <circle cx="10" cy="3" r="1.5" fill="currentColor" />
              <circle cx="7" cy="10" r="2.5" fill="currentColor" />
            </svg>
            Map
          </button>
          <button
            type="button"
            className="nav-sound"
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Sound on. Turn off' : 'Sound off. Turn on ambient music and interface sounds'}
            onClick={() => setSound(!soundOn)}
            data-sound="none"
          >
            <span className="nav-sound-bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <dialog ref={map} className="map" aria-labelledby="map-title" onClose={() => setMapOpen(false)} onClick={(e) => e.target === e.currentTarget && setMapOpen(false)}>
        <div className="map-inner">
          <div className="map-head">
            <h2 id="map-title">Map of the world</h2>
            <button type="button" className="nav-chip" onClick={() => setMapOpen(false)}>
              Close
            </button>
          </div>
          <ol className="map-list">
            {PLACES.map((p, i) => (
              <li key={p.id}>
                <a href={p.id === 'top' ? '/' : `/#${p.id}`} onClick={go(p.id)} aria-current={current === p.id ? 'location' : undefined}>
                  <span className="map-dot" style={{ background: p.accent }} aria-hidden="true" />
                  <span className="map-n mono">{String(i).padStart(2, '0')}</span>
                  <span className="map-label">{p.label}</span>
                  <span className="map-island">{p.island}</span>
                </a>
              </li>
            ))}
          </ol>
          <Link to="/projects" className="tlink" onClick={() => setMapOpen(false)}>
            All projects in a plain index →
          </Link>
        </div>
      </dialog>
    </header>
  );
}

import type { MouseEvent, ReactNode, Ref } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '@fontsource-variable/sora';
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import { scrollToTarget } from '../lib/scroll';
import './studio.css';

const LINKS = [
  { id: 'work', label: 'Work' },
  { id: 'universe', label: 'Index' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

/** On the home page the links scroll to their sections; elsewhere they lead back to them. */
export function StudioNav({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { pathname } = useLocation();
  const home = pathname === '/';
  const jump = (id: string) => (e: MouseEvent) => {
    if (!home || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    scrollToTarget(`#${id}`);
    history.replaceState(null, '', `#${id}`);
  };
  return (
    <header className={`st-nav${tone === 'dark' ? ' st-nav--dark' : ''}`}>
      <Link to="/" className="st-wordmark">Samudra Kar</Link>
      <nav aria-label="Main">
        {LINKS.map((l) =>
          home ? (
            <a key={l.id} href={`#${l.id}`} onClick={jump(l.id)}>{l.label}</a>
          ) : (
            <Link key={l.id} to={`/#${l.id}`}>{l.label}</Link>
          ),
        )}
      </nav>
    </header>
  );
}

/** Every studio page: the ivory ground, the nav and the type. */
export function StudioPage({ children, className = '', rootRef, tone }: { children: ReactNode; className?: string; rootRef?: Ref<HTMLElement>; tone?: 'light' | 'dark' }) {
  return (
    <main id="main" className={`studio ${className}`} ref={rootRef}>
      <StudioNav tone={tone} />
      {children}
    </main>
  );
}

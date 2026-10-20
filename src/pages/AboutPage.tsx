import { useEffect } from 'react';
import { ScrollTrigger } from '../lib/gsap';
import { config } from '../data/config';
import { paged } from '../data/projects';
import About from '../components/about/About';
import Stack from '../components/stack/Stack';
import './pages.css';

/**
 * /about: the person behind the worlds. A short opening, then the desk (the
 * objects carry the detail, so there is no biography wall), then the
 * Toolbox as evidence of what he actually builds with.
 */
export default function AboutPage() {
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => window.clearTimeout(t);
  }, []);
  const roles = config.about.roles;
  return (
    <main id="main" className="pg pg-about">
      <header className="pg-open">
        <p className="mono pg-kicker-line">
          {config.studio} · {paged.length} projects
        </p>
        <h1 className="pg-title">
          Samudra Kar <span className="pg-title-soft">designs and builds</span> things you can touch.
        </h1>
        <ul className="pg-roles" aria-label="Roles">
          {roles.map((r, i) => (
            <li key={r} style={{ animationDelay: `${120 + i * 60}ms` }}>
              {r}
            </li>
          ))}
        </ul>
      </header>
      <About />
      <Stack />
    </main>
  );
}

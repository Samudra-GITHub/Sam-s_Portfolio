import { useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../data/config';
import { real } from '../lib/content';
import { usePageTransition } from '../components/core/PageTransition';
import ContactField, { type Aim } from '../components/contact/ContactField';
import ContactBody from '../components/contact/ContactBody';
import Split from '../components/core/Split';
import Arrow from '../components/core/Arrow';
import '../components/contact/contact.css';
import './contact-page.css';

/**
 * /contact: the last print, hung to dry at night.
 *
 * After the blue of the homepage and the dark room of the exhibition, the
 * sheet ends in deep night with one enamel body in the sky (the WebGL field
 * and the orb from before). The channels are the point: each is one tall
 * row; aiming at one turns the sky and the body to that channel's colour and
 * a paper plate slides in under the name from the side the hand came from.
 * Every link is the real one from data/config.ts; anything still a
 * placeholder (the email) stays hidden rather than showing a dead link.
 */
type Row = { key: string; aim: Aim; label: string; url: string; handle: string };

function handleOf(key: string, url: string): string {
  try {
    if (url.startsWith('mailto:')) return url.slice(7);
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (key === 'instagram') return `@${parts[0]}`;
    if (key === 'linkedin') return `in/${(parts[1] ?? parts[0]).replace(/-[a-z0-9]{8,10}$/i, '')}`;
    return parts[0] ?? url;
  } catch {
    return url;
  }
}

export default function ContactPage() {
  const { go } = usePageTransition();
  const rootRef = useRef<HTMLElement>(null);
  const aimRef = useRef<Aim>(null);
  const [aim, setAimState] = useState<Aim>(null);
  const setAim = (a: Aim) => {
    aimRef.current = a;
    setAimState(a);
  };

  const rows = useMemo<Row[]>(() => {
    const c = config.contact;
    const email = real(c.email);
    const list: { key: string; aim: Aim; label: string; url?: string }[] = [
      { key: 'instagram', aim: 'instagram', label: 'Instagram', url: real(c.instagram) },
      { key: 'github', aim: 'github', label: 'GitHub', url: real(c.github) },
      { key: 'linkedin', aim: 'linkedin', label: 'LinkedIn', url: real(c.linkedin) },
      { key: 'email', aim: null, label: 'Email', url: email ? `mailto:${email}` : undefined },
      ...c.otherLinks.map((l) => ({ key: l.label.toLowerCase(), aim: null as Aim, label: l.label, url: real(l.url) })),
    ];
    return list.filter((r): r is Row & { url: string } => Boolean(r.url)).map((r) => ({ ...r, url: r.url as string, handle: handleOf(r.key, r.url as string) }));
  }, []);

  // the plate slides in from whichever side the hand entered
  const enter = (e: PointerEvent<HTMLAnchorElement>, r: Row) => {
    const b = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--from', e.clientX - b.left < b.width / 2 ? '0%' : '100%');
    setAim(r.aim);
  };

  const home = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go('/', { label: config.name.split(' ')[0], color: '#123a8c', ink: '#eef2fc' });
  };

  return (
    <main id="main" className="pg pg-contact">
      <section ref={rootRef} className="fin" data-aim={aim ?? undefined} aria-labelledby="fin-title">
        <ContactField sectionRef={rootRef} aimRef={aimRef} />

        <div className="fin-inner">
          <header className="fin-head">
            <p className="fin-kicker mono">The last print · say hello</p>
            <h1 id="fin-title" className="fin-title">
              <Split text="Let's make" by="chars" className="fin-line" />
              <Split text="something" by="chars" className="fin-line" />
              <Split text="weird." by="chars" className="fin-line fin-line--accent" />
            </h1>
          </header>

          <ul className="fin-links" aria-label="Find me online">
            {rows.map((r, i) => (
              <li key={r.key} style={{ '--i': i } as CSSProperties}>
                <a
                  className="fin-link"
                  href={r.url}
                  target={r.url.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noreferrer"
                  data-cursor="cta"
                  data-cursor-label="VISIT"
                  onPointerEnter={(e) => enter(e, r)}
                  onPointerLeave={() => setAim(null)}
                  onFocus={() => setAim(r.aim)}
                  onBlur={() => setAim(null)}
                >
                  <span className="fin-n mono" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span className="fin-label">{r.label}</span>
                  <span className="fin-handle mono">{r.handle}</span>
                  <span className="fin-arrow" aria-hidden="true">
                    <Arrow dir="out" />
                  </span>
                  {!r.url.startsWith('mailto:') && <span className="sr-only"> (opens in a new tab)</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <ContactBody aim={aim} />

        <footer className="fin-foot mono">
          <span>
            &copy; 2026 {config.name}, {config.studio}
          </span>
          <Link to="/" className="fin-back" onClick={home}>
            Back to the first print <Arrow dir="up" />
          </Link>
        </footer>
      </section>
    </main>
  );
}

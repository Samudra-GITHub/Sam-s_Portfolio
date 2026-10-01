import { useEffect, useMemo, useRef, type CSSProperties, type PointerEvent } from 'react';
import { gsap } from '../../lib/gsap';
import { pointer } from '../../lib/pointer';
import { useTicker, useVisibleRef } from '../../lib/hooks';
import { scrollToTarget } from '../../lib/scroll';
import { useReducedMotion } from '../../lib/runtime';
import { real } from '../../lib/content';
import { config } from '../../data/config';
import Split from '../core/Split';
import ContactField, { type Aim } from './ContactField';
import './contact.css';

const LINES = ["LET'S MAKE", 'SOMETHING', 'WEIRD.'];

interface Social {
  key: Exclude<Aim, null>;
  label: string;
  url: string;
  handle: string;
}

/** the visible @handle, read from the real URL so there is one source of truth */
function handleOf(key: Social['key'], url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (key === 'instagram') return `@${parts[0]}`;
    if (key === 'linkedin') return `in/${(parts[1] ?? parts[0]).replace(/-[a-z0-9]{8,10}$/i, '')}`;
    return parts[0];
  } catch {
    return url;
  }
}

/**
 * The last scene. An ink dome rises over the desk like a tide. Behind
 * everything a WebGL field draws a liquid 3D orb that reacts to the link you
 * aim at (colour, spikiness, squash) and lights itself from your cursor. The
 * headline is a torch: the type lights up lime where the pointer is. The links
 * are the point: three huge rows, letters that roll, a lime sweep, a visit cursor.
 */
export default function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const aimRef = useRef<Aim>(null);
  const torch = useRef({ x: 0, y: 0, ready: false });
  const visible = useVisibleRef(rootRef, '20% 0px');
  const reduce = useReducedMotion();

  const socials = useMemo<Social[]>(() => {
    const list: { key: Social['key']; label: string; url?: string }[] = [
      { key: 'instagram', label: 'Instagram', url: real(config.contact.instagram) },
      { key: 'github', label: 'GitHub', url: real(config.contact.github) },
      { key: 'linkedin', label: 'LinkedIn', url: real(config.contact.linkedin) },
    ];
    return list.filter((s): s is Social & { url: string } => Boolean(s.url)).map((s) => ({ key: s.key, label: s.label, url: s.url as string, handle: handleOf(s.key, s.url as string) }));
  }, []);
  const extras = config.contact.otherLinks.map((l) => ({ label: l.label, url: real(l.url) })).filter((l): l is { label: string; url: string } => Boolean(l.url));

  // the torch: follows the pointer, drifts when there is none
  useTicker((t, dt) => {
    const el = headRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const tx = pointer.seen ? pointer.x.get() - r.left : r.width * (0.5 + 0.28 * Math.sin(t * 0.5));
    const ty = pointer.seen ? pointer.y.get() - r.top : r.height * (0.4 + 0.12 * Math.cos(t * 0.4));
    const cur = torch.current;
    if (!cur.ready) {
      cur.x = tx;
      cur.y = ty;
      cur.ready = true;
    }
    const k = 1 - Math.exp(-dt * 9);
    cur.x += (tx - cur.x) * k;
    cur.y += (ty - cur.y) * k;
    el.style.setProperty('--mx', `${cur.x.toFixed(1)}px`);
    el.style.setProperty('--my', `${cur.y.toFixed(1)}px`);
  }, visible);

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      gsap.from('.contact-line .split-inner', {
        yPercent: 118,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.035,
        scrollTrigger: { trigger: '.contact-title', start: 'top 85%', toggleActions: 'play none none reverse' },
      });
      gsap.from('.contact-kicker, .contact-extra', {
        y: 18,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.socials', start: 'top 95%', toggleActions: 'play none none reverse' },
      });
      gsap.from('.social', {
        yPercent: 115,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.13,
        scrollTrigger: { trigger: '.socials', start: 'top 92%', toggleActions: 'play none none reverse' },
      });
      gsap.from('.social-rule', {
        scaleX: 0,
        transformOrigin: '0 50%',
        duration: 1.2,
        ease: 'expo.inOut',
        stagger: 0.13,
        scrollTrigger: { trigger: '.socials', start: 'top 92%', toggleActions: 'play none none reverse' },
      });
      // lines slide against each other; base and torch copies must move together
      ['.contact-title', '.contact-torch'].forEach((group) => {
        gsap.utils.toArray<HTMLElement>(`${group} .contact-line`).forEach((line, i) => {
          gsap.fromTo(line, { xPercent: i % 2 ? -3 : 3 }, { xPercent: i % 2 ? 2.5 : -2.5, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom bottom', scrub: true } });
        });
      });
    }, root);
    return () => ctx.revert();
  }, [reduce]);

  const renderLines = (lit?: boolean) =>
    LINES.map((l) => (
      <span key={l} className="contact-line">
        {lit ? l : <Split text={l} by="chars" />}
      </span>
    ));

  // letters lean toward the pointer inside the row they are in
  const lean = (e: PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
  };

  return (
    <section ref={rootRef} id="contact" className="contact" data-theme="ink" aria-labelledby="contact-title">
      <ContactField sectionRef={rootRef} aimRef={aimRef} />
      <div className="contact-dome" aria-hidden="true" />

      <div className="contact-inner">
        <div ref={headRef} className="contact-headline">
          <h2 id="contact-title" className="contact-title font-display">
            {renderLines()}
          </h2>
          <div className="contact-torch font-display" aria-hidden="true">
            {renderLines(true)}
          </div>
        </div>

        <p className="contact-kicker mono">Find me online</p>

        <ul className="socials">
          {socials.map((s, i) => (
            <li key={s.key} className="socials-item">
              <span className="social-rule" aria-hidden="true" />
              <a
                className="social"
                href={s.url}
                target="_blank"
                rel="noreferrer"
                style={{ '--i': i } as CSSProperties}
                data-cursor="cta"
                data-cursor-label="VISIT"
                onPointerEnter={() => (aimRef.current = s.key)}
                onPointerLeave={() => (aimRef.current = null)}
                onPointerMove={lean}
                onFocus={() => (aimRef.current = s.key)}
                onBlur={() => (aimRef.current = null)}
              >
                <span className="sr-only">
                  {s.label}, {s.handle}. Opens in a new tab.
                </span>
                <span className="social-num mono" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="social-label font-display" aria-hidden="true">
                  {Array.from(s.label).map((ch, j) => (
                    <span key={j} className="roll" style={{ '--j': j } as CSSProperties}>
                      <span>{ch}</span>
                      <span>{ch}</span>
                    </span>
                  ))}
                </span>
                <span className="social-handle mono" aria-hidden="true">
                  {s.handle}
                </span>
                <span className="social-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square">
                    <path d="M6 18 18 6M8 6h10v10" />
                  </svg>
                </span>
              </a>
            </li>
          ))}
          <li className="socials-item socials-end">
            <span className="social-rule" aria-hidden="true" />
          </li>
        </ul>

        {extras.length > 0 && (
          <ul className="contact-extra">
            {extras.map((l) => (
              <li key={l.label}>
                <a href={l.url} target="_blank" rel="noreferrer" className="contact-link mono">
                  {l.label} <span aria-hidden="true">&#8599;</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="contact-foot mono">
        <span>
          &copy; 2026 {config.name}, {config.studio}
        </span>
        <button type="button" className="contact-top mono" onClick={() => scrollToTarget(0, { duration: 2.2 })}>
          Back to top <span aria-hidden="true">&uarr;</span>
        </button>
      </footer>
    </section>
  );
}

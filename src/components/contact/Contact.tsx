import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { gsap } from '../../lib/gsap';
import { scrollToTarget } from '../../lib/scroll';
import { useReducedMotion } from '../../lib/runtime';
import { real } from '../../lib/content';
import { config } from '../../data/config';
import Split from '../core/Split';
import ContactField, { type Aim } from './ContactField';
import ContactBody from './ContactBody';
import './contact.css';
import Arrow from '../core/Arrow';

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
 * The last scene: the deep end of the print. A night-blue dome rises over the
 * sheet like a tide. Behind everything a WebGL field draws one enamel body
 * that answers the link you aim at (colour, spikiness, squash) and takes its
 * light from your cursor. The links are the point: three big rows, letters that
 * roll, a white plate that sweeps in, a visit cursor.
 */
export default function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  const aimRef = useRef<Aim>(null);
  const [aim, setAimState] = useState<Aim>(null);
  const setAim = (a: Aim) => {
    aimRef.current = a;
    setAimState(a);
  };
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
      gsap.from('.contact-extra', {
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
    }, root);
    return () => ctx.revert();
  }, [reduce]);

  const renderLines = () =>
    LINES.map((l) => (
      <span key={l} className="contact-line">
        <Split text={l} by="chars" />
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
        <div className="contact-headline">
          <h2 id="contact-title" className="contact-title font-display">
            {renderLines()}
          </h2>
        </div>

        <ul className="socials" aria-label="Find me online">
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
                onPointerEnter={() => setAim(s.key)}
                onPointerLeave={() => setAim(null)}
                onPointerMove={lean}
                onFocus={() => setAim(s.key)}
                onBlur={() => setAim(null)}
              >
                <span className="sr-only">
                  {s.label}, {s.handle}. Opens in a new tab.
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
                  {l.label} <Arrow dir="out" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* desktop: absolutely placed beside the rows; phones: after them in the flow */}
      <ContactBody aim={aim} />

      <footer className="contact-foot mono">
        <span>
          &copy; 2026 {config.name}, {config.studio}
        </span>
        <button type="button" className="contact-top mono" onClick={() => scrollToTarget(0, { duration: 2.2 })}>
          Back to top <Arrow dir="up" />
        </button>
      </footer>
    </section>
  );
}

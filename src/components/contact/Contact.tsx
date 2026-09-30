import { useEffect, useRef, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import { gsap } from '../../lib/gsap';
import { pointer } from '../../lib/pointer';
import { useTicker, useVisibleRef } from '../../lib/hooks';
import { scrollToTarget } from '../../lib/scroll';
import { useReducedMotion } from '../../lib/runtime';
import { real } from '../../lib/content';
import { config } from '../../data/config';
import Magnetic from '../core/Magnetic';
import Split from '../core/Split';
import './contact.css';

const LINES = ["LET'S MAKE", 'SOMETHING', 'WEIRD.'];

/**
 * The last scene. A dome of ink rises over the desk like a horizon, a lime sun
 * comes up behind the headline, and the cursor is a torch: wherever it points,
 * the type lights up lime. One big action, plus whatever links are real.
 */
export default function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  const visible = useVisibleRef(rootRef, '20% 0px');
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const headRef = useRef<HTMLDivElement>(null);
  const torch = useRef({ x: 0, y: 0, ready: false });

  const github = real(config.contact.github);
  const links = [
    { label: 'GitHub', url: github },
    { label: 'LinkedIn', url: real(config.contact.linkedin) },
    { label: 'Instagram', url: real(config.contact.instagram) },
    ...config.contact.otherLinks.map((l) => ({ label: l.label, url: real(l.url) })),
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));

  // the one big action: email if there is one, otherwise the most direct real link

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

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    setStatus('submitting');
    setErrorMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message'),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        form.reset();
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.error?.message || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Failed to send message. Please try again.');
    }
  };

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      gsap.from('.contact-line .split-inner', {
        yPercent: 118,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.035,
        scrollTrigger: { trigger: '.contact-title', start: 'top 82%', toggleActions: 'play none none reverse' },
      });
      gsap.from('.contact-reveal', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.contact-actions', start: 'top 92%', toggleActions: 'play none none reverse' },
      });
      // the sun comes up as the section arrives
      gsap.fromTo('.contact-sun-rise', { yPercent: 62 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'top 10%', scrub: true } });
      // lines slide against each other; base and torch copies must move together
      ['.contact-title', '.contact-torch'].forEach((group) => {
        gsap.utils.toArray<HTMLElement>(`${group} .contact-line`).forEach((line, i) => {
          gsap.fromTo(line, { xPercent: i % 2 ? -3 : 3 }, { xPercent: i % 2 ? 2.5 : -2.5, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom bottom', scrub: true } });
        });
      });
    }, root);
    return () => ctx.revert();
  }, [reduce]);

  const sunX = useTransform(pointer.nx, [-0.5, 0.5], [-30, 30]);

  const renderLines = (lit?: boolean) =>
    LINES.map((l) => (
      <span key={l} className="contact-line">
        {lit ? l : <Split text={l} by="chars" />}
      </span>
    ));

  return (
    <section ref={rootRef} id="contact" className="contact" data-theme="ink" aria-labelledby="contact-title">
      <div className="contact-dome" aria-hidden="true" />
      <motion.div className="contact-sun" style={{ x: sunX }} aria-hidden="true">
        <div className="contact-sun-rise" />
      </motion.div>

      <div className="contact-inner">
        <div ref={headRef} className="contact-headline">
          <h2 id="contact-title" className="contact-title font-display">
            {renderLines()}
          </h2>
          <div className="contact-torch font-display" aria-hidden="true">
            {renderLines(true)}
          </div>
        </div>

        <div className="contact-actions contact-reveal">
          <form className="contact-form mono" onSubmit={handleSubmit}>
            <div className="contact-form-group">
              <label htmlFor="name" className="sr-only">Name</label>
              <input type="text" id="name" name="name" placeholder="Name" required disabled={status === 'submitting'} />
            </div>
            <div className="contact-form-group">
              <label htmlFor="email" className="sr-only">Email</label>
              <input type="email" id="email" name="email" placeholder="Email" required disabled={status === 'submitting'} />
            </div>
            <div className="contact-form-group">
              <label htmlFor="message" className="sr-only">Message</label>
              <textarea id="message" name="message" placeholder="Message" required rows={4} disabled={status === 'submitting'}></textarea>
            </div>
            <div className="contact-form-footer">
              <Magnetic strength={0.28}>
                <button
                  type="submit"
                  className="contact-cta font-display"
                  data-cursor="cta"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                  <span className="contact-cta-arrow" aria-hidden="true">
                    &rarr;
                  </span>
                </button>
              </Magnetic>
              {status === 'success' && <span className="contact-success-msg">Message sent successfully!</span>}
              {status === 'error' && <span className="contact-error-msg">{errorMessage}</span>}
            </div>
          </form>
        </div>

        {links.length > 0 && (
          <ul className="contact-links contact-reveal">
            {links.map((l) => (
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

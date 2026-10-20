import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { scrollToTarget, scrollVelocity, scrollY } from '../lib/scroll';
import { usePageTransition } from './core/PageTransition';
import { useIntroDone } from '../lib/intro';
import { setSound, useSoundOn } from '../lib/sound';
import { config } from '../data/config';
import Monogram from './core/Monogram';
import './nav.css';

const LINKS = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'projects', label: 'Projects', to: '/projects' },
  { id: 'about', label: 'About', to: '/about' },
  { id: 'contact', label: 'Contact', to: '/contact' },
] as const;

export default function Nav() {
  const { pathname } = useLocation();
  const { go } = usePageTransition();
  const onHome = pathname === '/';
  const [hidden, setHidden] = useState(false);
  const [focused, setFocused] = useState(false);
  const [atTop, setAtTop] = useState(true);
  useMotionValueEvent(scrollY, 'change', (v) => setAtTop(v < 40));
  const introDone = useIntroDone();
  const soundOn = useSoundOn();

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });

  // Scrolling down tucks the bar away, scrolling up brings it back.
  useMotionValueEvent(scrollVelocity, 'change', (v) => {
    const y = scrollY.get();
    if (y < 160) return setHidden(false);
    if (v > 7) setHidden(true);
    else if (v < -3) setHidden(false);
  });

  const shown = pathname.startsWith('/projects') || pathname.startsWith('/work/') ? 'projects' : pathname.startsWith('/about') ? 'about' : pathname.startsWith('/contact') ? 'contact' : onHome ? 'home' : '';

  const jump = (l: (typeof LINKS)[number]) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (pathname === l.to) return scrollToTarget(0, { duration: 1 });
    go(l.to, { label: l.label, color: '#081c4a', ink: '#eef2fc' });
  };

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onHome) scrollToTarget(0, { duration: 1.6 });
    else go('/', { label: config.name.split(' ')[0], color: '#123a8c', ink: '#eef2fc' });
  };

  return (
    <motion.header
      className="nav"
      data-hidden={hidden && !focused}
      data-top={onHome && atTop}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      initial={{ y: -80 }}
      animate={{ y: introDone ? 0 : -80 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    >
      <div className="nav-inner">
        <Link to="/" className="nav-brand" onClick={goHome}>
          <Monogram size={30} className="nav-mark" />
          <span className="nav-brand-name">{config.name}</span>
          <span className="nav-brand-studio mono">{config.studio}</span>
        </Link>

        <p className="nav-status mono" aria-label="Availability">
          <span className="nav-pulse" aria-hidden="true" />
          Available for new experiments
        </p>

        <button type="button" className="nav-sound mono" aria-pressed={soundOn} onClick={() => setSound(!soundOn)} title="Toggle interface sounds">
          <span className="nav-sound-dot" aria-hidden="true" />
          Sound {soundOn ? 'on' : 'off'}
        </button>

        <nav aria-label="Primary">
          <ul className="nav-links">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a href={l.to} className="nav-link mono" data-active={shown === l.id} onClick={jump(l)} aria-current={shown === l.id ? 'page' : undefined}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <motion.div className="nav-progress" style={{ scaleX: progress }} aria-hidden="true" />
    </motion.header>
  );
}

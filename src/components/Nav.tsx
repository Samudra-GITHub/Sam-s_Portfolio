import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { ScrollTrigger } from '../lib/gsap';
import { scrollToTarget, scrollVelocity, scrollY } from '../lib/scroll';
import { usePageTransition } from './core/PageTransition';
import { config } from '../data/config';
import './nav.css';

const LINKS = [
  { id: 'work', label: 'WORK' },
  { id: 'lab', label: 'LAB' },
  { id: 'about', label: 'ABOUT' },
  { id: 'contact', label: 'CONTACT' },
] as const;

export default function Nav() {
  const { pathname } = useLocation();
  const { go } = usePageTransition();
  const onHome = pathname === '/';
  const [active, setActive] = useState<string>('');
  const [hidden, setHidden] = useState(false);
  const [focused, setFocused] = useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });

  // Scrolling down tucks the bar away, scrolling up brings it back.
  useMotionValueEvent(scrollVelocity, 'change', (v) => {
    const y = scrollY.get();
    if (y < 160) return setHidden(false);
    if (v > 7) setHidden(true);
    else if (v < -3) setHidden(false);
  });

  // Which section is on screen
  useEffect(() => {
    if (!onHome) return;
    const triggers = LINKS.map(({ id }) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) setActive(id);
          else setActive((cur) => (cur === id ? '' : cur));
        },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, [onHome]);

  const shown = onHome ? active : '';

  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (onHome) scrollToTarget(`#${id}`, { duration: 1.6 });
    else go('/', { scrollTo: `#${id}`, label: id, color: '#111215', ink: '#d8f827' });
  };

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onHome) scrollToTarget(0, { duration: 1.6 });
    else go('/', { label: config.name.split(' ')[0], color: '#d8f827', ink: '#111215' });
  };

  return (
    <motion.header
      className="nav"
      data-hidden={hidden && !focused}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    >
      <div className="nav-inner">
        <Link to="/" className="nav-brand font-display" onClick={goHome} aria-label={`${config.name}, home`}>
          {config.handle}.kar<span className="nav-brand-paren">()</span>
        </Link>

        <p className="nav-status mono" aria-label="Availability">
          <span className="nav-pulse" aria-hidden="true" />
          Available for new experiments
        </p>

        <nav aria-label="Primary">
          <ul className="nav-links">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a href={`/#${l.id}`} className="nav-link mono" data-active={shown === l.id} onClick={jump(l.id)} aria-current={shown === l.id ? 'true' : undefined}>
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

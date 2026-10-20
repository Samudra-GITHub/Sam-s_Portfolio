import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useTransform } from 'framer-motion';
import { useTicker } from '../../../lib/hooks';
import { config } from '../../../data/config';
import { useScene } from '../scene';
import './worlds.css';
import './portfolio.css';

/**
 * PORTFOLIO: the site introduces itself.
 * A big squeezed headline (solid, then outlined) with the site's own
 * instrument standing across both lines: the SK monogram at the centre, three
 * rings, three bodies. Scroll turns it, the pointer tips it. The role words
 * roll over on a timer.
 */
const SOLID = ['designer', 'developer', 'student'];
const RINGS = [52, 88, 126];
const OUTLINE = ['photographer', 'creative coder'];

/** one word squeezed to a fixed cap height; shorter words stay narrower */
function Words({ words, outline, reduce, visible, offset }: { words: string[]; outline?: boolean; reduce: boolean; visible: React.RefObject<boolean>; offset: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        if (visible.current) setI((n) => (n + 1) % words.length);
      }, 3200);
    }, offset);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [reduce, visible, words.length, offset]);

  const text = (outline ? '& ' : '') + words[i].toUpperCase();
  const len = Math.min(94, text.length * 10.2);
  return (
    <div className={`pw-line${outline ? ' pw-line--outline' : ''}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.svg
          key={text}
          viewBox="0 0 100 20"
          initial={{ y: '108%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-108%' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden="true"
        >
          <text x="50" y="18.6" textAnchor="middle" textLength={len} lengthAdjust="spacingAndGlyphs">
            {text}
          </text>
        </motion.svg>
      </AnimatePresence>
    </div>
  );
}

export default function PortfolioWorld() {
  const { progress, x, y, visible, reduce } = useScene();

  const bodyRefs = useRef<(SVGCircleElement | null)[]>([]);
  const tipRef = useRef<SVGGElement>(null);

  // the bodies orbit on the shared ticker; scroll is the crank, the pointer tips the plate
  useTicker((t) => {
    if (reduce) return;
    const base = progress.get() * 9 + t * 0.12;
    RINGS.forEach((r, i) => {
      const a = base * Math.pow(RINGS[0] / r, 1.5) + i * 2.4;
      const el = bodyRefs.current[i];
      if (el) {
        el.setAttribute('cx', (Math.cos(a) * r).toFixed(2));
        el.setAttribute('cy', (Math.sin(a) * r * 0.42).toFixed(2));
      }
    });
    if (tipRef.current) tipRef.current.style.transform = `rotate(${(x.get() * 4).toFixed(2)}deg) translateY(${(y.get() * 4).toFixed(2)}px)`;
  }, visible);

  // lines drift against each other with scroll and pointer; the character rises into place
  const l1x = useTransform([progress, x], ([p, px]: number[]) => `${(0.5 - p) * 7 + px * 1.4}cqw`);
  const l2x = useTransform([progress, x], ([p, px]: number[]) => `${(p - 0.5) * 7 - px * 1.4}cqw`);
  const rise = useTransform(progress, [0, 0.28], [14, 0], { clamp: true });
  const riseY = useTransform(rise, (v) => `${v}cqw`);
  const disc = useTransform(progress, [0, 0.3], [0.4, 1], { clamp: true });

  const studio = config.studio;

  return (
    <div className="world pw" data-reduce={reduce || undefined}>
      <svg className="pw-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="pw-outline" x="-5%" y="-10%" width="110%" height="120%">
          <feMorphology in="SourceAlpha" operator="erode" radius="0.28 0.16" result="inner" />
          <feComposite in="SourceGraphic" in2="inner" operator="out" />
        </filter>
      </svg>
      <div className="pw-stage">
        <motion.i className="pw-disc" style={{ scale: disc }} aria-hidden="true" />

        <p className="pw-hi">
          hi, I&apos;m Samudra, and I&apos;m a
        </p>

        <motion.div className="pw-l1" style={{ x: l1x }}>
          <Words words={SOLID} reduce={reduce} visible={visible} offset={0} />
        </motion.div>
        <motion.div className="pw-l2" style={{ x: l2x }}>
          <Words words={OUTLINE} outline reduce={reduce} visible={visible} offset={1600} />
        </motion.div>

        <motion.div className="pw-char" style={{ y: riseY }} aria-hidden="true">
          <svg viewBox="-150 -80 300 160" role="presentation">
            <g ref={tipRef} className="pw-plate">
              {RINGS.map((r) => (
                <ellipse key={r} rx={r} ry={r * 0.42} className="pw-orbit" />
              ))}
              <circle r="24" className="pw-sun" />
              <text y="6" textAnchor="middle" className="pw-sun-text">
                SK
              </text>
              {RINGS.map((r, i) => (
                <circle key={r} ref={(el) => void (bodyRefs.current[i] = el)} cx={r} cy="0" r={7 + i} className={`pw-body pw-body--${i}`} />
              ))}
            </g>
          </svg>
        </motion.div>

        <span className="world-label pw-here">You are here</span>
        <p className="pw-foot pw-foot--l mono">{studio} · 2026</p>
      </div>
    </div>
  );
}

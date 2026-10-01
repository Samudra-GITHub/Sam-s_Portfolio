import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useTransform } from 'framer-motion';
import { useTicker } from '../../../lib/hooks';
import { config } from '../../../data/config';
import { BuddyHead } from '../../buddy/Buddy';
import { BUDDY } from '../../buddy/palette';
import { useScene } from '../scene';
import './worlds.css';
import './portfolio.css';

/**
 * PORTFOLIO: the site introduces itself.
 * A big squeezed headline (solid, then outlined) with an illustrated character
 * standing across both lines. The character is inline SVG so every part moves:
 * head and pupils follow the pointer, it blinks, breathes and waves, brows
 * lift and the mouth opens while hovered. The role words roll over on a timer.
 */
const SOLID = ['designer', 'developer', 'student'];
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

  const headRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);

  // everything that follows the pointer is written straight to the DOM on the shared ticker
  useTicker(() => {
    if (reduce) return;
    const px = x.get();
    const py = y.get();
    if (headRef.current) headRef.current.style.transform = `translate(${(px * 7).toFixed(2)}px, ${(py * 3).toFixed(2)}px) rotate(${(px * 4.5).toFixed(2)}deg)`;
    if (eyesRef.current) eyesRef.current.style.transform = `translate(${(px * 7).toFixed(2)}px, ${(py * 5).toFixed(2)}px)`;
  }, visible);

  // lines drift against each other with scroll and pointer; the character rises into place
  const l1x = useTransform([progress, x], ([p, px]: number[]) => `${(0.5 - p) * 7 + px * 1.4}cqw`);
  const l2x = useTransform([progress, x], ([p, px]: number[]) => `${(p - 0.5) * 7 - px * 1.4}cqw`);
  const rise = useTransform(progress, [0, 0.28], [14, 0], { clamp: true });
  const riseY = useTransform(rise, (v) => `${v}cqw`);
  const disc = useTransform(progress, [0, 0.3], [0.4, 1], { clamp: true });

  const studio = config.studio;

  return (
    <div className="world pw" data-mood="idle" data-reduce={reduce || undefined}>
      <svg className="pw-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="pw-outline" x="-5%" y="-10%" width="110%" height="120%">
          <feMorphology in="SourceAlpha" operator="erode" radius="0.28 0.16" result="inner" />
          <feComposite in="SourceGraphic" in2="inner" operator="out" />
        </filter>
      </svg>
      <div className="pw-stage">
        <motion.i className="pw-disc" style={{ scale: disc }} aria-hidden="true" />

        <p className="pw-hi">
          <span className="pw-wave" aria-hidden="true">👋</span> hi, I'm Samudra, and I'm a
        </p>

        <motion.div className="pw-l1" style={{ x: l1x }}>
          <Words words={SOLID} reduce={reduce} visible={visible} offset={0} />
        </motion.div>
        <motion.div className="pw-l2" style={{ x: l2x }}>
          <Words words={OUTLINE} outline reduce={reduce} visible={visible} offset={1600} />
        </motion.div>

        <motion.div className="pw-char" style={{ y: riseY }} aria-hidden="true">
          <svg viewBox="0 0 300 340" role="presentation">
            <g className="pw-breathe">
              {/* waving arm (tee sleeve) + hand */}
              <g className="pw-arm">
                <path d="M244 322 C270 292 274 238 262 202" fill="none" stroke={BUDDY.ink} strokeWidth="46" strokeLinecap="round" />
                <path d="M244 322 C270 292 274 238 262 202" fill="none" stroke={BUDDY.tee} strokeWidth="38" strokeLinecap="round" />
                <g className="pw-hand">
                  <rect x="242" y="148" width="12" height="34" rx="6" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="4" />
                  <rect x="255" y="142" width="12" height="38" rx="6" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="4" />
                  <rect x="268" y="148" width="12" height="34" rx="6" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="4" />
                  <rect x="280" y="158" width="11" height="28" rx="5.5" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="4" transform="rotate(18 285 172)" />
                  <rect x="230" y="166" width="13" height="26" rx="6.5" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="4" transform="rotate(-28 236 179)" />
                  <ellipse cx="262" cy="192" rx="24" ry="22" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="4" />
                </g>
              </g>

              {/* neck */}
              <path d="M128 182 L128 256 Q150 272 172 256 L172 182 Z" fill={BUDDY.skinShade} stroke={BUDDY.ink} strokeWidth="4.5" strokeLinejoin="round" />

              {/* tee */}
              <path d="M26 340 C26 284 68 256 118 248 L182 248 C232 256 274 284 274 340 Z" fill={BUDDY.tee} stroke={BUDDY.ink} strokeWidth="4.5" strokeLinejoin="round" />
              <path d="M118 248 Q150 276 182 248" fill="none" stroke={BUDDY.ink} strokeWidth="4.5" strokeLinecap="round" />

              {/* denim overalls: straps, bib, pocket, brass buttons */}
              <path d="M116 300 L124 258 M184 300 L176 258" stroke={BUDDY.ink} strokeWidth="24" strokeLinecap="round" />
              <path d="M116 300 L124 258 M184 300 L176 258" stroke={BUDDY.denim} strokeWidth="15" strokeLinecap="round" />
              <path d="M104 296 H196 V340 H104 Z" fill={BUDDY.denim} stroke={BUDDY.ink} strokeWidth="4.5" strokeLinejoin="round" />
              <rect x="126" y="308" width="48" height="28" rx="5" fill={BUDDY.denimLight} stroke={BUDDY.ink} strokeWidth="3.4" />
              <path d="M130 314 H170" stroke={BUDDY.ink} strokeWidth="1.6" strokeDasharray="4 4" opacity="0.6" />
              <circle cx="115" cy="298" r="6.5" fill={BUDDY.brass} stroke={BUDDY.ink} strokeWidth="3" />
              <circle cx="185" cy="298" r="6.5" fill={BUDDY.brass} stroke={BUDDY.ink} strokeWidth="3" />

              {/* head: follows the pointer */}
              <g className="pw-head" ref={headRef}>
                <g transform="translate(52 16) scale(0.98)">
                  <BuddyHead pupilsRef={eyesRef} />
                </g>
              </g>
            </g>
          </svg>
        </motion.div>

        <span className="world-label pw-here">You are here</span>
        <p className="pw-foot pw-foot--l mono">{studio} · 2026</p>
      </div>
    </div>
  );
}

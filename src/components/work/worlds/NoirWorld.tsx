import { useEffect, useRef } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { useTicker } from '../../../lib/hooks';
import { useBeat, useScene } from '../scene';
import './worlds.css';
import './noir.css';

/**
 * NOIR CAFÉ: a coffee house that exists only as a website.
 * Seen from above: a cup on its saucer. Scroll pours the latte art, then the
 * wallet-style pass for a booked table slides out from under the saucer. A
 * small menu plate turns through the four languages and four currencies the
 * site really ships (EN / JA / FR / IT, USD / EUR / JPY / GBP). Steam leans
 * toward the pointer. Everything is drawn; nothing here is a screenshot.
 */
const LOCALES = [
  { word: 'Menu', cur: '$', code: 'EN · USD' },
  { word: 'メニュー', cur: '¥', code: 'JA · JPY' },
  { word: 'Carte', cur: '€', code: 'FR · EUR' },
  { word: 'Menù', cur: '£', code: 'IT · GBP' },
];

/** a deterministic block pattern for the pass's code (decorative, encodes nothing) */
const CODE = Array.from({ length: 49 }, (_, i) => ((i * 37 + (i % 7) * 11) % 5 < 2 ? 1 : 0));

export default function NoirWorld() {
  const { progress, x, y, visible, reduce, compact } = useScene();

  // the pour: the rosetta draws itself, the crema spreads
  const pour = useBeat(progress, 0.1, 0.48);
  const crema = useTransform(pour, [0, 1], [0.55, 1]);
  const pass = useBeat(progress, 0.42, 0.7);
  const passY = useTransform(pass, [0, 1], ['46%', '0%']);
  const passRot = useTransform(pass, [0, 1], [9, -3]);

  // the cup sits still; the table moves under it with the pointer
  const tableX = useTransform(x, [-1, 1], ['-2.5%', '2.5%']);
  const tableY = useTransform(y, [-1, 1], ['-2%', '2%']);
  const steamLean = useTransform(x, [-1, 1], [-14, 14]);

  // the menu plate turns through the locales with scroll
  const codeRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const curRef = useRef<HTMLSpanElement>(null);
  const last = useRef(-1);
  const setLocale = (p: number) => {
    const i = Math.min(LOCALES.length - 1, Math.floor(p * LOCALES.length * 0.999));
    if (i === last.current) return;
    last.current = i;
    const l = LOCALES[i];
    if (wordRef.current) wordRef.current.textContent = l.word;
    if (curRef.current) curRef.current.textContent = l.cur;
    if (codeRef.current) codeRef.current.textContent = l.code;
  };
  useMotionValueEvent(progress, 'change', setLocale);
  useEffect(() => {
    setLocale(progress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // steam rises on its own, slowly, only while the world is on screen
  const steamRef = useRef<SVGGElement>(null);
  useTicker((t) => {
    if (reduce || !steamRef.current) return;
    const paths = steamRef.current.children;
    for (let i = 0; i < paths.length; i++) {
      const el = paths[i] as SVGPathElement;
      const k = (t * 0.22 + i / paths.length) % 1;
      el.style.transform = `translate(0, ${(-k * 18).toFixed(2)}%)`;
      el.style.opacity = (Math.sin(k * Math.PI) * 0.55).toFixed(3);
    }
  }, visible);

  return (
    <div className="world nw">
      <div className="layer nw-glow" aria-hidden="true" />

      <motion.div className="layer nw-table" style={{ x: tableX, y: tableY }} aria-hidden="true">
        {/* the pass, sliding out from under the saucer */}
        <motion.div className="nw-pass" style={{ y: passY, rotate: passRot, opacity: pass }}>
          <div className="nw-pass-top">
            <span className="nw-pass-brand">NOIR</span>
            <span className="mono">table</span>
          </div>
          <div className="nw-pass-rows">
            <i />
            <i />
          </div>
          <div className="nw-pass-code">
            {CODE.map((on, i) => (
              <b key={i} data-on={on} />
            ))}
          </div>
        </motion.div>

        {/* the cup, from above */}
        <svg className="nw-cup" viewBox="-100 -100 200 200">
          <circle r="96" className="nw-saucer" />
          <circle r="80" className="nw-saucer-rim" />
          <ellipse cx="78" cy="10" rx="22" ry="9" className="nw-handle" transform="rotate(24)" />
          <circle r="62" className="nw-cup-rim" />
          <circle r="55" className="nw-coffee" />
          <motion.circle r="52" className="nw-crema" style={{ scale: crema }} />
          <motion.path
            className="nw-art"
            d="M0 36 C -2 22 -26 18 -22 6 C -18 -6 -2 0 0 -8 C 2 0 18 -6 22 6 C 26 18 2 22 0 36 M 0 -8 C -2 -18 -16 -20 -12 -30 C -8 -38 0 -32 0 -40 C 0 -32 8 -38 12 -30 C 16 -20 2 -18 0 -8 M 0 36 L 0 -44"
            style={{ pathLength: pour }}
          />
          <motion.g ref={steamRef} className="nw-steam" style={{ skewX: steamLean }}>
            <path d="M-18 -20 C -26 -36 -10 -46 -18 -62" />
            <path d="M0 -24 C -8 -40 8 -50 0 -66" />
            <path d="M18 -20 C 10 -36 26 -46 18 -62" />
          </motion.g>
        </svg>
      </motion.div>

      {/* the menu plate: four languages, four currencies */}
      <div className="nw-menu" aria-hidden="true">
        <span ref={curRef} className="nw-menu-cur">
          $
        </span>
        <span ref={wordRef} className="nw-menu-word">
          Menu
        </span>
        <span ref={codeRef} className="nw-menu-code mono">
          EN · USD
        </span>
      </div>

      {!compact && (
        <>
          <span className="world-label nw-label-order">order ahead</span>
          <span className="world-label nw-label-offline">works offline</span>
        </>
      )}
    </div>
  );
}

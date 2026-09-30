import { motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { scrollVelocity } from '../../../lib/scroll';
import { useTicker } from '../../../lib/hooks';
import { useBeat, useScene } from '../scene';
import WaveCanvas from './WaveCanvas';
import './worlds.css';
import './tarang.css';

/**
 * TARANG: rhythm. Album tiles drift sideways at two speeds while you scroll,
 * a record spins faster the harder you scroll, the waveform swells under the
 * cursor, and hovering scrubs the playhead. A small floating player rides on
 * top, because the real app's player floats and persists.
 */

const ART = ['ring', 'half', 'stripes', 'dots', 'corner', 'sun'] as const;
const COLORS: [string, string][] = [
  ['#d8f827', '#111215'],
  ['#ff5226', '#fdf9f1'],
  ['#fdf9f1', '#111215'],
  ['#1e3ae8', '#d8f827'],
  ['#111215', '#ff5226'],
  ['#d8f827', '#1e3ae8'],
  ['#ff5226', '#111215'],
  ['#fdf9f1', '#1e3ae8'],
];

function Tile({ i }: { i: number }) {
  const [a, b] = COLORS[i % COLORS.length];
  return <div className="tg-tile" data-art={ART[i % ART.length]} style={{ '--a': a, '--b': b } as React.CSSProperties} />;
}

function Row({ x, offset, top }: { x: MotionValue<string>; offset: number; top: string }) {
  return (
    <motion.div className="tg-row" style={{ x, top }}>
      {Array.from({ length: 14 }, (_, i) => (
        <Tile key={i} i={i + offset} />
      ))}
    </motion.div>
  );
}

export default function TarangWorld() {
  const { progress, x, y, rawX, hover, visible, compact } = useScene();

  // horizontal drift: two rows, opposite directions, cursor adds a nudge
  const rowA = useTransform([progress, x] as MotionValue<number>[], ([p, px]: number[]) => `${-8 - p * 46 - px * 2}%`);
  const rowB = useTransform([progress, x] as MotionValue<number>[], ([p, px]: number[]) => `${-52 + p * 46 + px * 2}%`);

  // the record speeds up with scroll velocity and hover
  const angle = useMotionValue(0);
  useTicker((_, dt) => {
    const v = Math.min(Math.abs(scrollVelocity.get()), 60);
    angle.set(angle.get() + (36 + v * 14 + hover.get() * 90) * dt);
  }, visible);

  const amp = () => 0.4 + hover.get() * 0.45 + Math.min(Math.abs(scrollVelocity.get()) / 40, 0.35);

  // playhead: follows scroll, but the cursor takes over while it is on the scene
  const playhead = useTransform([progress, rawX, hover] as MotionValue<number>[], ([p, rx, h]: number[]) => {
    const auto = Math.min(1, Math.max(0, (p - 0.1) / 0.8));
    return auto + (rx - auto) * Math.min(1, h);
  });
  const playPct = useTransform(playhead, (v) => `${v * 100}%`);

  const cardIn = useBeat(progress, 0.02, 0.24);
  const cardY = useTransform(cardIn, [0, 1], ['24%', '0%']);
  const cardRotX = useTransform(y, [-1, 1], [5, -5]);
  const cardRotY = useTransform(x, [-1, 1], [-7, 7]);
  const pillX = useTransform(x, [-1, 1], ['16%', '-16%']);
  const pillY = useTransform(y, [-1, 1], ['10%', '-10%']);
  const tagX = useTransform(x, [-1, 1], ['-30%', '30%']);

  return (
    <div className="world tg">
      <Row x={rowA} offset={0} top="5cqh" />
      {!compact && <Row x={rowB} offset={5} top="68cqh" />}

      <motion.div className="tg-card-wrap" style={{ opacity: cardIn, y: cardY, rotateX: cardRotX, rotateY: cardRotY }}>
        <div className="tg-card">
          <div className="tg-vinyl">
            <motion.div className="tg-vinyl-spin" style={{ rotate: angle }}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="49" fill="#111215" />
              {[42, 36, 30, 24].map((r) => (
                <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#fdf9f1" strokeOpacity="0.14" strokeWidth="0.8" />
              ))}
              <path d="M50 8 A42 42 0 0 1 92 50" fill="none" stroke="#fdf9f1" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
              <circle cx="50" cy="50" r="15" fill="#d8f827" />
              <circle cx="50" cy="50" r="15" fill="none" stroke="#111215" strokeWidth="2" />
              <circle cx="50" cy="50" r="2.6" fill="#fdf9f1" />
            </svg>
            </motion.div>
          </div>
          <div className="tg-meta">
            <div className="tg-titlebars" aria-hidden="true">
              <i />
              <i />
            </div>
            <div className="tg-wave">
              <WaveCanvas bars={compact ? 26 : 38} color="#111215" accent="#ff5226" playhead={playhead} amp={amp} speed={2.2} />
              <motion.span className="tg-playhead" style={{ left: playPct }} />
            </div>
            <div className="tg-controls" aria-hidden="true">
              <span className="tg-prev" />
              <span className="tg-play" />
              <span className="tg-next" />
            </div>
          </div>
        </div>
      </motion.div>

      {!compact && (
        <motion.div className="tg-pill" style={{ x: pillX, y: pillY }}>
          <span className="tg-pill-btn" />
          <span className="tg-eq" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="mono">floating player</span>
        </motion.div>
      )}

      <motion.span className="world-label tg-tag tg-tag-a" style={{ x: tagX }}>
        Moods
      </motion.span>
      <motion.span className="world-label tg-tag tg-tag-b" style={{ x: tagX }}>
        Library
      </motion.span>
      {!compact && (
        <motion.span className="world-label tg-tag tg-tag-c" style={{ x: tagX }}>
          Stats
        </motion.span>
      )}
    </div>
  );
}

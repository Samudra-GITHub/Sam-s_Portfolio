import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useBeat, useScene } from '../scene';
import './worlds.css';
import './krama.css';

/**
 * KRAMA: product depth, editorial crops.
 * One sneaker, sliced into three tall crop windows. Scrolling assembles the
 * shoe (the slices slide into register), then lets it come apart again as the
 * chapter ends. The cursor decides which slice magnifies, and tilts the whole
 * product in perspective over a giant outlined wordmark.
 */

/** The shoe, drawn once and reused by every slice. */
function Shoe({ shadow = false }: { shadow?: boolean }) {
  const ink = '#111215';
  return (
    <svg viewBox="0 0 600 300" className="kw-shoe" aria-hidden="true">
      {shadow ? (
        <g fill={ink} stroke={ink} strokeWidth="6" strokeLinejoin="round">
          <path d="M42 232 H566 C572 262 552 276 528 276 H84 C60 276 44 262 42 232 Z" />
          <path d="M58 232 C54 190 66 160 94 150 C122 142 134 116 140 92 C144 76 160 70 172 78 L198 96 C216 108 234 106 252 98 C286 84 320 98 354 122 C394 150 454 158 508 178 C542 190 562 208 560 232 Z" />
        </g>
      ) : (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* midsole */}
          <path d="M42 232 H566 C572 262 552 276 528 276 H84 C60 276 44 262 42 232 Z" fill="#fdf9f1" stroke={ink} strokeWidth="6" />
          <path d="M56 252 H548" stroke={ink} strokeWidth="3" fill="none" />
          {/* upper */}
          <path d="M58 232 C54 190 66 160 94 150 C122 142 134 116 140 92 C144 76 160 70 172 78 L198 96 C216 108 234 106 252 98 C286 84 320 98 354 122 C394 150 454 158 508 178 C542 190 562 208 560 232 Z" fill="#f4f0e8" stroke={ink} strokeWidth="6" />
          {/* toe cap */}
          <path d="M452 168 C512 176 552 198 560 232 H448 C456 208 458 188 452 168 Z" fill="#ff5226" stroke={ink} strokeWidth="6" />
          {/* heel stripe */}
          <path d="M72 206 C120 216 200 220 300 212" stroke="#111215" strokeWidth="14" fill="none" />
          <path d="M72 206 C120 216 200 220 300 212" stroke="#d8f827" strokeWidth="5" fill="none" />
          {/* tongue */}
          <path d="M172 78 L204 56 C214 52 226 60 222 72 L200 98 Z" fill="#ebe5d8" stroke={ink} strokeWidth="6" />
          {/* laces */}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${228 + i * 30} ${106 + i * 9} l24 -20`} stroke={ink} strokeWidth="7" fill="none" />
          ))}
          {/* collar */}
          <path d="M140 92 C130 102 128 116 134 128" stroke={ink} strokeWidth="5" fill="none" />
        </g>
      )}
    </svg>
  );
}

const SLICES = 3;

export default function KramaWorld() {
  const { progress, x, y, rawX, compact } = useScene();

  const assemble = useBeat(progress, 0.2, 0.52);
  const scatter = useBeat(progress, 0.78, 0.98);
  // -1..1 offsets that ease to zero when assembled
  const disorder = useTransform([assemble, scatter] as MotionValue<number>[], ([a, s]: number[]) => (1 - a) + s * 0.7);

  const tiltY = useTransform(x, [-1, 1], [-9, 9]);
  const tiltX = useTransform(y, [-1, 1], [7, -7]);
  const wordX = useTransform([progress, x] as MotionValue<number>[], ([p, px]: number[]) => `${8 - p * 26 + px * -3}%`);
  const stampRot = useTransform(progress, [0, 1], [-18, 200]);
  const introOp = useBeat(progress, 0.04, 0.2);

  return (
    <div className="world kw">
      <motion.div className="kw-word font-display" style={{ x: wordX }} aria-hidden="true">
        KRAMA
      </motion.div>

      <motion.div className="kw-stage" style={{ rotateY: tiltY, rotateX: tiltX, opacity: introOp }}>
        <div className="kw-slices">
          {Array.from({ length: SLICES }, (_, i) => (
            <Slice key={i} i={i} disorder={disorder} rawX={rawX} />
          ))}
        </div>
      </motion.div>

      <motion.div className="kw-stamp mono" style={{ rotate: stampRot }} aria-hidden="true">
        <span>Krama</span>
        <span>Editorial</span>
      </motion.div>
      {!compact && <span className="world-label kw-tag">Motion design</span>}
      <span className="world-label kw-tag2">Product depth</span>
    </div>
  );
}

function Slice({ i, disorder, rawX }: { i: number; disorder: MotionValue<number>; rawX: MotionValue<number> }) {
  // each slice slides vertically out of register, alternating direction
  const dir = i === 1 ? -1 : 1;
  const offset = useTransform(disorder, (d) => `${dir * d * (i === 1 ? 26 : 34) * (i === 2 ? 0.8 : 1)}%`);
  // the slice under the cursor magnifies its crop
  const zoom = useTransform(rawX, (v) => 1 + 0.42 * Math.exp(-Math.pow((v * SLICES - (i + 0.5)) / 0.55, 2)));

  return (
    <motion.div className="kw-slice">
      <motion.div className="kw-slice-inner" style={{ y: offset }}>
        <motion.div className="kw-slice-crop" style={{ scale: zoom }}>
          <div className="kw-shoe-frame" style={{ '--i': i } as React.CSSProperties}>
            <div className="kw-shoe-shadow">
              <Shoe shadow />
            </div>
            <Shoe />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

import { useEffect, useRef } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { useBeat, useScene } from '../scene';
import './worlds.css';
import './prahari.css';

/**
 * PRAHARI: mine safety data, with a copilot that cannot make numbers up.
 * An open pit seen from above, its benches drawn as contour lines, with
 * sensors on them. Scroll runs one inspection: readings come in, one sensor
 * crosses its limit, the risk score climbs and lists the reasons it used
 * (the score is deterministic and explainable, not a model guess), and each
 * event is appended to a hash-linked audit chain. The pointer tilts the pit.
 * Illustrative: the numbers are drawn from scroll, not from the product.
 */
const TERRACES = 6;
const pit = (k: number) => {
  // a closed, slightly irregular ring; the same seed every time
  const R = 18 + k * 13;
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r = R * (1 + 0.09 * Math.sin(3 * a + 0.7) + 0.05 * Math.cos(5 * a + k * 0.4));
    pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r * 0.72).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
};
const RINGS = Array.from({ length: TERRACES }, (_, k) => pit(k));
const SENSORS = [
  { k: 1, a: 0.6 },
  { k: 2, a: 2.4 },
  { k: 3, a: 4.1 },
  { k: 4, a: 1.2 },
  { k: 5, a: 3.3 },
].map(({ k, a }) => {
  const R = (18 + k * 13) * (1 + 0.09 * Math.sin(3 * a + 0.7) + 0.05 * Math.cos(5 * a + k * 0.4));
  return { x: Math.cos(a) * R, y: Math.sin(a) * R * 0.72 };
});
const ALERT = 2;
const REASONS = ['violations', 'readings', 'inspections'];
const BLOCKS = 6;

export default function PrahariWorld() {
  const { progress, x, y, compact } = useScene();

  const readings = useBeat(progress, 0.08, 0.3);
  const alert = useBeat(progress, 0.28, 0.4);
  const score = useTransform(progress, [0.25, 0.75], [0.18, 0.74], { clamp: true });
  const chain = useBeat(progress, 0.2, 0.9);

  const tiltX = useTransform(y, [-1, 1], [10, -10]);
  const tiltY = useTransform(x, [-1, 1], [-8, 8]);
  const fill = useTransform(score, (s) => `scaleX(${s})`);

  const scoreRef = useRef<HTMLSpanElement>(null);
  const write = (s: number) => {
    if (scoreRef.current) scoreRef.current.textContent = s.toFixed(2);
  };
  useMotionValueEvent(score, 'change', write);
  useEffect(() => write(score.get()), [score]);

  return (
    <div className="world pr">
      <div className="layer pr-grid" aria-hidden="true" />

      {/* the pit */}
      <motion.div className="pr-pit" style={{ rotateX: tiltX, rotateY: tiltY }} aria-hidden="true">
        <svg viewBox="-100 -76 200 152">
          {RINGS.map((d, k) => (
            <path key={k} d={d} className="pr-bench" data-k={k} />
          ))}
          <path d="M 70 -10 C 40 -6 30 4 6 2" className="pr-haul" />
          {SENSORS.map((s, i) => (
            <Sensor key={i} x={s.x} y={s.y} on={readings} alert={i === ALERT ? alert : null} />
          ))}
        </svg>
      </motion.div>

      {/* the score and its reasons */}
      <div className="pr-panel" aria-hidden="true">
        <div className="pr-score">
          <span className="mono">risk</span>
          <span ref={scoreRef} className="pr-score-n">
            0.18
          </span>
        </div>
        <div className="pr-gauge">
          <motion.i style={{ transform: fill }} />
        </div>
        <ul className="pr-reasons">
          {REASONS.map((r, i) => (
            <Reason key={r} label={r} at={score} threshold={0.3 + i * 0.15} />
          ))}
        </ul>
        {!compact && <span className="world-label pr-copilot">copilot · cites the record</span>}
      </div>

      {/* the audit chain */}
      <div className="pr-chain" aria-hidden="true">
        {Array.from({ length: BLOCKS }, (_, i) => (
          <Block key={i} index={i} at={chain} />
        ))}
        {!compact && <span className="pr-chain-label mono">audit log, hash-linked</span>}
      </div>
    </div>
  );
}

function Sensor({ x, y, on, alert }: { x: number; y: number; on: MotionValue<number>; alert: MotionValue<number> | null }) {
  const ring = useTransform(alert ?? on, [0, 1], [0.6, 2.4]);
  const ringOp = useTransform(alert ?? on, [0, 0.2, 1], [0, 0.9, 0.35]);
  const dotOp = useTransform(on, [0, 1], [0.35, 1]);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
      {alert && <motion.circle r="4" className="pr-alert-ring" style={{ scale: ring, opacity: ringOp }} />}
      <motion.circle r="2.6" className={alert ? 'pr-sensor pr-sensor--alert' : 'pr-sensor'} style={{ opacity: dotOp }} />
    </g>
  );
}

function Reason({ label, at, threshold }: { label: string; at: MotionValue<number>; threshold: number }) {
  const op = useTransform(at, [threshold - 0.06, threshold], [0.15, 1], { clamp: true });
  const w = useTransform(at, [threshold - 0.06, threshold + 0.2], [0.1, 1], { clamp: true });
  return (
    <motion.li style={{ opacity: op }}>
      <span className="mono">{label}</span>
      <motion.i style={{ scaleX: w }} />
    </motion.li>
  );
}

function Block({ index, at }: { index: number; at: MotionValue<number> }) {
  const t = index / BLOCKS;
  const op = useTransform(at, [t, t + 0.1], [0, 1], { clamp: true });
  const yy = useTransform(at, [t, t + 0.1], [6, 0], { clamp: true });
  return (
    <motion.span className="pr-block" style={{ opacity: op, y: yy }}>
      <i />
      <i />
    </motion.span>
  );
}

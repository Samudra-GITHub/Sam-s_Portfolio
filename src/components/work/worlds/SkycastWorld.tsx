import { motion, useMotionTemplate, useTransform, type MotionValue } from 'framer-motion';
import { useBeat, useScene } from '../scene';
import './worlds.css';
import './skycast.css';

/**
 * SKYCAST: atmosphere. The slowest world.
 * Scroll is time of day: the sky walks dawn, noon, dusk, night through the
 * palette while a sun crosses and turns into a moon. Clouds drift on their own
 * clock; the cursor is the wind, sliding the layers. A radar sweeps, pressure
 * lines creep, and a small card breathes with the forecast.
 */
const CLOUD = 'M10 50 C2 50 0 37 10 35 C10 22 27 18 34 29 C40 14 66 16 68 33 C80 29 90 44 79 50 Z';

function Cloud({ className }: { className: string }) {
  return (
    <svg className={`sw-cloud ${className}`} viewBox="0 0 92 56" aria-hidden="true">
      <path d={CLOUD} />
    </svg>
  );
}

export default function SkycastWorld() {
  const { progress, x, y, compact } = useScene();

  const top = useTransform(progress, [0, 0.28, 0.62, 0.92], ['#fdf9f1', '#1e3ae8', '#111215', '#111215']);
  const bottom = useTransform(progress, [0, 0.28, 0.62, 0.92], ['#ff5226', '#fdf9f1', '#ff5226', '#1e3ae8']);
  const sky = useMotionTemplate`linear-gradient(to bottom, ${top} 0%, ${bottom} 100%)`;

  const t = useBeat(progress, 0.06, 0.94);
  const sunX = useTransform(t, [0, 1], ['6%', '88%']);
  const sunY = useTransform(t, (v) => `${68 - Math.sin(v * Math.PI) * 52}%`);
  const sunColor = useTransform(t, [0, 0.6, 0.78, 1], ['#ff5226', '#d8f827', '#fdf9f1', '#fdf9f1']);

  const farX = useTransform(x, [-1, 1], ['3%', '-3%']);
  const midX = useTransform(x, [-1, 1], ['8%', '-8%']);
  const nearX = useTransform(x, [-1, 1], ['16%', '-16%']);
  const nearY = useTransform(y, [-1, 1], ['3%', '-3%']);

  const temp = useTransform(progress, (p) => 0.35 + 0.5 * Math.sin(p * Math.PI));
  const wind = useTransform(progress, (p) => 0.3 + 0.4 * Math.abs(Math.sin(p * 6)));
  const uv = useTransform(progress, (p) => Math.max(0.06, Math.sin(p * Math.PI) ** 2));
  const aqi = useTransform(progress, (p) => 0.55 - 0.3 * Math.sin(p * 4));

  return (
    <motion.div className="world sw" style={{ background: sky }}>
      <motion.div className="sw-sun" style={{ left: sunX, top: sunY, backgroundColor: sunColor }} aria-hidden="true" />

      {!compact && (
        <svg className="sw-isobars" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 18 C20 8 40 30 62 20 S90 12 100 18" />
          <path d="M0 26 C22 16 42 38 64 28 S92 20 100 26" />
          <path d="M0 34 C24 24 44 46 66 36 S94 28 100 34" />
        </svg>
      )}

      <motion.div className="layer sw-layer" style={{ x: farX }} aria-hidden="true">
        <div className="sw-drift sw-drift-slow">
          <Cloud className="sw-c1" />
          <Cloud className="sw-c2" />
        </div>
      </motion.div>
      <motion.div className="layer sw-layer" style={{ x: midX }} aria-hidden="true">
        <div className="sw-drift sw-drift-mid">
          <Cloud className="sw-c3" />
          <Cloud className="sw-c4" />
        </div>
      </motion.div>
      <motion.div className="layer sw-layer" style={{ x: nearX, y: nearY }} aria-hidden="true">
        <div className="sw-drift sw-drift-fast">
          <Cloud className="sw-c5" />
        </div>
      </motion.div>

      <div className="sw-radar" aria-hidden="true">
        <span className="sw-ring sw-ring-1" />
        <span className="sw-ring sw-ring-2" />
        <span className="sw-sweep" />
        <span className="sw-blip sw-blip-1" />
        <span className="sw-blip sw-blip-2" />
      </div>

      <div className="sw-card">
        <div className="sw-card-head mono">
          <span>skycast</span>
          <span>any city</span>
        </div>
        <Row label="temp" v={temp} />
        <Row label="wind" v={wind} />
        <Row label="uv" v={uv} />
        <Row label="aqi" v={aqi} />
        <div className="sw-hours" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <Hour key={i} i={i} progress={progress} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, v }: { label: string; v: MotionValue<number> }) {
  return (
    <div className="sw-row">
      <span className="mono">{label}</span>
      <div className="sw-bar">
        <motion.i style={{ scaleX: v }} />
      </div>
    </div>
  );
}

function Hour({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const h = useTransform(progress, (p) => 0.25 + 0.75 * Math.abs(Math.sin(p * 5 + i * 0.6)));
  return <motion.i style={{ scaleY: h }} />;
}

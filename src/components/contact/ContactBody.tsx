import { useEffect, type CSSProperties } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useReducedMotion } from '../../lib/runtime';
import type { Aim } from './ContactField';

/**
 * The last body on the instrument: one enamel disc on two hairline orbits,
 * drawn crisp in SVG. Aiming at a link recolours the disc and walks its moon
 * round the orbit to that link's station. The moon's angle is a spring, so a
 * quick sweep across the rows carries its velocity instead of restarting.
 */
const LOOK: Record<'none' | Exclude<Aim, null>, { fill: string; moon: string; angle: number }> = {
  none: { fill: 'var(--lime)', moon: 'var(--line)', angle: -0.7 },
  instagram: { fill: 'var(--vermilion)', moon: 'var(--lime)', angle: 0.5 },
  github: { fill: 'var(--line)', moon: 'var(--lime)', angle: 2.3 },
  linkedin: { fill: 'var(--cobalt)', moon: 'var(--lime)', angle: 3.7 },
};

const RX = 158;
const RY = 56;
const TILT = (-10 * Math.PI) / 180;

export default function ContactBody({ aim }: { aim: Aim }) {
  const look = LOOK[aim ?? 'none'];
  const reduce = useReducedMotion();
  const angle = useSpring(look.angle, { stiffness: 70, damping: 16, mass: 0.8 });

  useEffect(() => {
    if (reduce) angle.jump(look.angle);
    else angle.set(look.angle);
  }, [look.angle, reduce, angle]);

  // a point on the tilted ellipse
  const cx = useTransform(angle, (a) => RX * Math.cos(a) * Math.cos(TILT) - RY * Math.sin(a) * Math.sin(TILT));
  const cy = useTransform(angle, (a) => RX * Math.cos(a) * Math.sin(TILT) + RY * Math.sin(a) * Math.cos(TILT));
  // the far half of the orbit passes behind the disc
  const behind = useTransform(angle, (a) => (Math.sin(a) < 0 ? 0 : 1));

  const style = { '--cb-fill': look.fill, '--cb-moon': look.moon } as CSSProperties;
  return (
    <div className="contact-body" style={style} aria-hidden="true">
      <svg viewBox="-200 -130 400 260">
        <g transform={`rotate(${(TILT * 180) / Math.PI})`}>
          <ellipse rx={RX + 34} ry={RY + 14} className="contact-body-orbit" />
          <ellipse rx={RX} ry={RY} className="contact-body-orbit contact-body-orbit--inner" />
        </g>
        <motion.circle cx={cx} cy={cy} r="15" className="contact-body-moon" />
        <circle r="92" className="contact-body-disc" />
        <path d="M 0 -92 A 92 92 0 0 1 0 92 A 46 92 0 0 0 0 -92 Z" className="contact-body-shade" />
        <motion.circle cx={cx} cy={cy} r="15" className="contact-body-moon" style={{ opacity: behind }} />
      </svg>
    </div>
  );
}

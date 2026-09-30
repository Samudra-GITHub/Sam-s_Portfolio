import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useFinePointer, useReducedMotion } from '../../lib/runtime';

/** Pulls its child toward the pointer. Off on touch and under reduced motion. */
export default function Magnetic({ children, strength = 0.35, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });
  const active = fine && !reduce;

  return (
    <motion.span
      ref={ref}
      className={`magnetic ${className}`}
      style={{ x: sx, y: sy, display: 'inline-block', position: 'relative' }}
      onPointerMove={
        active
          ? (e) => {
              const r = ref.current!.getBoundingClientRect();
              x.set((e.clientX - (r.left + r.width / 2)) * strength);
              y.set((e.clientY - (r.top + r.height / 2)) * strength);
            }
          : undefined
      }
      onPointerLeave={
        active
          ? () => {
              x.set(0);
              y.set(0);
            }
          : undefined
      }
    >
      {active && <span aria-hidden="true" style={{ position: 'absolute', inset: -22 }} />}
      {children}
    </motion.span>
  );
}

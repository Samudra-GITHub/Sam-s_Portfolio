import { useMemo, useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useTicker, useVisibleRef } from '../../lib/hooks';
import { MQ, useMedia, useReducedMotion } from '../../lib/runtime';
import type { Project } from '../../data/projects';
import { SceneContext, type SceneState } from './scene';
import './scene.css';

interface Props {
  project: Project;
  index: number;
  total: number;
  progress: MotionValue<number>;
  onOpen?: (rect: DOMRect) => void;
  /** inert decorative frame (detail page keeps it non-clickable) */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The compact viewport each project lives in. It owns the pointer and idle
 * motion for the world inside and exposes them through SceneContext.
 */
export default function SceneFrame({ project, index, total, progress, onOpen, interactive = true, className = '', children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useVisibleRef(ref, '25% 0px');
  const compact = useMedia(MQ.compact);
  const reduce = useReducedMotion();

  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const hoverRaw = useMotionValue(0);
  const spring = { stiffness: 110, damping: 18, mass: 0.6 };
  const x = useSpring(useTransform(rawX, (v) => (v - 0.5) * 2), spring);
  const y = useSpring(useTransform(rawY, (v) => (v - 0.5) * 2), spring);
  const hover = useSpring(hoverRaw, { stiffness: 140, damping: 20 });

  // With no pointer (touch, or the cursor elsewhere) the scene drifts by itself.
  useTicker((t) => {
    if (reduce || hoverRaw.get() > 0) return;
    rawX.set(0.5 + 0.3 * Math.sin(t * 0.45 + index));
    rawY.set(0.5 + 0.22 * Math.cos(t * 0.37 + index * 2));
  }, visible);

  const state = useMemo<SceneState>(
    () => ({ progress, x, y, rawX, rawY, hover, visible, compact, reduce, palette: project.palette }),
    [progress, x, y, rawX, rawY, hover, visible, compact, reduce, project.palette],
  );

  const readout = useTransform(progress, (v) => `${String(Math.round(v * 100)).padStart(3, '0')}`);

  // the whole scene leans a couple of degrees toward the cursor (and sways a little on its own)
  const tiltX = useTransform(y, [-1, 1], [2.4, -2.4]);
  const tiltY = useTransform(x, [-1, 1], [-3, 3]);

  return (
    <SceneContext.Provider value={state}>
      <div
        ref={ref}
        className={`scene-frame ${className}`}
        data-cursor={interactive ? 'project' : undefined}
        onClick={interactive ? () => onOpen?.(ref.current!.getBoundingClientRect()) : undefined}
        onPointerMove={(e) => {
          if (e.pointerType === 'touch') return;
          const r = ref.current!.getBoundingClientRect();
          rawX.set((e.clientX - r.left) / r.width);
          rawY.set((e.clientY - r.top) / r.height);
          hoverRaw.set(1);
        }}
        onPointerLeave={() => hoverRaw.set(0)}
      >
        <div className="scene-tab mono">
          World {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
        </div>
        <motion.div className="scene-canvas" style={{ rotateX: tiltX, rotateY: tiltY, scale: reduce ? 1 : 1.035 }}>
          {children}
        </motion.div>
        <div className="scene-readout mono" aria-hidden="true">
          scene <motion.span>{readout}</motion.span>
        </div>
      </div>
    </SceneContext.Provider>
  );
}

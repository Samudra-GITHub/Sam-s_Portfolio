import { createContext, useContext, type RefObject } from 'react';
import { useTransform, type MotionValue } from 'framer-motion';
import type { WorldPalette } from '../../data/projects';

/**
 * Everything a project world can react to. Worlds never read scroll or the
 * pointer directly, so they behave the same on a chapter and on the detail page.
 */
export interface SceneState {
  /** 0..1 across the chapter's whole scroll range */
  progress: MotionValue<number>;
  /** smoothed pointer inside the frame, -1..1 (drifts on its own when idle) */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** unsmoothed pointer inside the frame, 0..1 */
  rawX: MotionValue<number>;
  rawY: MotionValue<number>;
  /** 1 while a real pointer is over the frame */
  hover: MotionValue<number>;
  /** near the viewport: worlds pause per-frame work when false */
  visible: RefObject<boolean>;
  compact: boolean;
  reduce: boolean;
  palette: WorldPalette;
}

export const SceneContext = createContext<SceneState | null>(null);

export function useScene(): SceneState {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used inside <SceneFrame>');
  return ctx;
}

/** progress remapped so a beat that happens between `a` and `b` reads 0..1 */
export function useBeat(progress: MotionValue<number>, a: number, b: number) {
  return useTransform(progress, [a, b], [0, 1], { clamp: true });
}

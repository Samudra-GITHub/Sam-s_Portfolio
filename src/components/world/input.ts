import { matches, MQ } from '../../lib/runtime';

/** Pointer position in -1..1, written by the world's pointermove listener. */
export const pointer = { x: 0, y: 0 };

/** Reduced motion: the world holds still (no flight, frozen water and clouds). */
export const STILL = typeof window !== 'undefined' && matches(MQ.reducedMotion);

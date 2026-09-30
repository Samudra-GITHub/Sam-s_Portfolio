import { useSyncExternalStore } from 'react';

export const MQ = {
  finePointer: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  /** full pinned choreography */
  desktop: '(min-width: 1000px)',
  /** anything narrower gets the recomposed, lighter scenes */
  compact: '(max-width: 999px)',
} as const;

export const matches = (query: string): boolean =>
  typeof window !== 'undefined' && window.matchMedia(query).matches;

/** Subscribes to a media query without re-rendering on unrelated changes. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () => useMedia(MQ.reducedMotion);
export const useFinePointer = () => useMedia(MQ.finePointer);

/* --- global pause switch (Kage overlay, hidden tab) --- */
let paused = false;
export const isPaused = () => paused || (typeof document !== 'undefined' && document.hidden);
export const setPaused = (value: boolean) => {
  paused = value;
};

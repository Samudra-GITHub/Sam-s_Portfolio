import { useSyncExternalStore } from 'react';

/**
 * The intro gate. The loader holds the first scene back; everything that has a
 * entrance (hero type, dot, deck) waits for `useIntroDone()`.
 * The loader only runs on the first home-page visit of a session, never under
 * reduced motion, and never when someone lands directly on a project page.
 */
const FLAG = 'sk-intro-seen';

function shouldSkip(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  if (window.location.pathname !== '/') return true;
  try {
    return window.sessionStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
}

let done = shouldSkip();
const listeners = new Set<() => void>();

export const isIntroDone = () => done;

export function finishIntro() {
  if (done) return;
  done = true;
  try {
    window.sessionStorage.setItem(FLAG, '1');
  } catch {
    /* storage blocked: the loader just plays again next visit */
  }
  listeners.forEach((l) => l());
}

export function useIntroDone(): boolean {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => done,
    () => true,
  );
}

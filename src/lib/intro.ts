import { useSyncExternalStore } from 'react';

/**
 * The intro gate. The loader holds the first scene back; everything that has a
 * entrance (hero type, dot, deck) waits for `useIntroDone()`.
 * The loader only runs on the first home-page visit of a session, never under
 * reduced motion, and never when someone lands directly on a project page.
 */
const FLAG = 'sk-intro-seen';

// There is no loading screen any more: the gate is open from the start. The
// homepage plays its own short entrance (Universe.tsx), and any input skips it.
let done = true;
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

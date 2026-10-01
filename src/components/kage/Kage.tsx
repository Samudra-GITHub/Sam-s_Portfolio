import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { gsap } from '../../lib/gsap';
import { getLenis } from '../../lib/scroll';
import { matches, MQ, setPaused } from '../../lib/runtime';
import { whoosh } from '../../lib/sound';
import './kage.css';

const loadScene = () => import('./SecretScene');
const SecretScene = lazy(loadScene);

type Phase = 'closed' | 'opening' | 'open' | 'closing';

interface KageApi {
  /** origin is where the ink starts (the trigger); defaults to screen centre */
  open: (origin?: { x: number; y: number }) => void;
  /** warm the chunk (called when the pointer gets near the trigger) */
  prefetch: () => void;
}

const KageContext = createContext<KageApi>({ open: () => {}, prefetch: () => {} });
// eslint-disable-next-line react-refresh/only-export-components
export const useKage = () => useContext(KageContext);

const circle = (r: number, x: number, y: number) => `circle(${r}px at ${x}px ${y}px)`;

/**
 * portfolio -> discovery -> trigger -> the site drains of colour -> ink
 * irises out from the trigger -> Kage. Escape, the button, or the browser
 * back gesture all retrace the same path.
 */
export function KageProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('closed');
  const overlayRef = useRef<HTMLDivElement>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const returnFocus = useRef<Element | null>(null);
  const phaseRef = useRef<Phase>('closed');
  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const setSite = (fn: (site: HTMLElement) => void) => {
    const site = document.getElementById('site');
    if (site) fn(site);
  };

  const open = useCallback((origin?: { x: number; y: number }) => {
    if (phaseRef.current !== 'closed') return;
    const o = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    originRef.current = o;
    returnFocus.current = document.activeElement;
    go('opening');
    whoosh();
    void loadScene();

    const reduce = matches(MQ.reducedMotion);
    getLenis()?.stop();
    setPaused(true);
    document.documentElement.classList.add('kage-open');

    // wait a tick so the overlay is mounted
    requestAnimationFrame(() => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const maxR = Math.hypot(Math.max(o.x, window.innerWidth - o.x), Math.max(o.y, window.innerHeight - o.y)) + 40;
      const finish = () => {
        setSite((s) => {
          s.style.visibility = 'hidden';
          s.setAttribute('inert', '');
          gsap.set(s, { clearProps: 'filter' });
        });
        go('open');
      };
      if (reduce) {
        gsap.set(overlay, { visibility: 'visible', clipPath: circle(maxR, o.x, o.y) });
        finish();
        return;
      }
      gsap.set(overlay, { visibility: 'visible', clipPath: circle(0, o.x, o.y) });
      const tl = gsap.timeline({ onComplete: finish });
      tl.to('#site', { filter: 'grayscale(1) contrast(1.25) brightness(0.85)', duration: 0.55, ease: 'power2.out' })
        .to(overlay, { clipPath: circle(maxR, o.x, o.y), duration: 1.15, ease: 'expo.inOut' }, '-=0.15');
    });
  }, []);

  const close = useCallback(() => {
    if (phaseRef.current !== 'open') return;
    go('closing');
    const overlay = overlayRef.current;
    const o = originRef.current;
    const reduce = matches(MQ.reducedMotion);

    setSite((s) => {
      s.style.visibility = '';
      s.removeAttribute('inert');
      if (!reduce) gsap.set(s, { filter: 'grayscale(1) contrast(1.25) brightness(0.85)' });
    });

    const done = () => {
      gsap.set('#site', { clearProps: 'filter' });
      gsap.set(overlay, { visibility: 'hidden' });
      document.documentElement.classList.remove('kage-open');
      setPaused(false);
      getLenis()?.start();
      go('closed');
      (returnFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
    if (!overlay || reduce) return done();
    gsap
      .timeline({ onComplete: done })
      .to(overlay, { clipPath: circle(0, o.x, o.y), duration: 1, ease: 'expo.inOut' })
      .to('#site', { filter: 'grayscale(0) contrast(1) brightness(1)', duration: 0.6, ease: 'power2.out' }, '-=0.5');
  }, []);

  // typing "kage" anywhere is the other way in
  useEffect(() => {
    let buffer = '';
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-4);
      if (buffer === 'kage') open();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const api = useMemo<KageApi>(() => ({ open, prefetch: () => void loadScene() }), [open]);

  return (
    <KageContext.Provider value={api}>
      {children}
      <div ref={overlayRef} className="kage-overlay" data-phase={phase} data-lenis-prevent>
        {phase !== 'closed' && (
          <Suspense fallback={<div className="kage-loading mono">summoning shadows</div>}>
            <SecretScene onClose={close} />
          </Suspense>
        )}
      </div>
    </KageContext.Provider>
  );
}

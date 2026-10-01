import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { scrollToTarget } from '../../lib/scroll';
import { matches, MQ } from '../../lib/runtime';
import { whoosh } from '../../lib/sound';
import './transition.css';

export interface GoOptions {
  /** screen rect the curtain grows out of (the clicked scene) */
  from?: DOMRect | null;
  color?: string;
  ink?: string;
  label?: string;
  /** selector to land on after navigating */
  scrollTo?: string;
}

interface TransitionApi {
  go: (to: string, opts?: GoOptions) => void;
}

const TransitionContext = createContext<TransitionApi>({ go: () => {} });
// eslint-disable-next-line react-refresh/only-export-components
export const usePageTransition = () => useContext(TransitionContext);

const nextFrames = (n: number) =>
  new Promise<void>((resolve) => {
    const step = (left: number) => (left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
    step(n);
  });

/**
 * Route changes are a takeover: the clicked scene's rectangle grows into a
 * full-screen colour field carrying the destination's name, the route swaps
 * underneath, then the field wipes away upward.
 */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const curtainRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const go = useCallback(
    (to: string, opts: GoOptions = {}) => {
      if (busy.current) return;
      const land = async () => {
        navigate(to);
        await nextFrames(3);
        ScrollTrigger.refresh();
        scrollToTarget(opts.scrollTo ?? 0, { immediate: true });
      };

      const curtain = curtainRef.current;
      const label = labelRef.current;
      if (!curtain || !label || matches(MQ.reducedMotion)) {
        void land();
        return;
      }

      busy.current = true;
      whoosh();
      const { from, color = '#111215', ink = '#fdf9f1', label: text = '' } = opts;
      curtain.style.background = color;
      curtain.style.color = ink;
      label.textContent = text;
      const start = from
        ? `inset(${from.top}px ${window.innerWidth - from.right}px ${window.innerHeight - from.bottom}px ${from.left}px)`
        : 'inset(100% 0px 0px 0px)';

      void (async () => {
        gsap.set(curtain, { visibility: 'visible', clipPath: start });
        gsap.set(label, { yPercent: 110 });
        await gsap.to(curtain, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.85, ease: 'expo.inOut' });
        await gsap.to(label, { yPercent: 0, duration: 0.55, ease: 'expo.out' });
        await land();
        await gsap.to(label, { yPercent: -110, duration: 0.45, ease: 'expo.in', delay: 0.15 });
        await gsap.to(curtain, { clipPath: 'inset(0px 0px 100% 0px)', duration: 0.8, ease: 'expo.inOut' });
        gsap.set(curtain, { visibility: 'hidden' });
        busy.current = false;
      })();
    },
    [navigate],
  );

  const api = useMemo(() => ({ go }), [go]);

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div className="curtain" ref={curtainRef} aria-hidden="true">
        <div className="curtain-mask">
          <div className="curtain-text font-display" ref={labelRef} />
        </div>
      </div>
    </TransitionContext.Provider>
  );
}

import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { finishIntro, useIntroDone } from '../../lib/intro';
import { getLenis } from '../../lib/scroll';
import { config } from '../../data/config';
import './loader.css';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const pageLoaded = () =>
  document.readyState === 'complete' ? Promise.resolve() : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true }));

/**
 * First visit only. The name fills with lime as the page really loads
 * (webfonts and the window load event gate the last stretch), a dot rides the
 * progress bar, then the panel lifts off the hero like a curtain.
 */
export default function Loader() {
  const done = useIntroDone();
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (done) return;
    const root = rootRef.current!;
    const html = document.documentElement;
    let cancelled = false;
    html.style.overflow = 'hidden';
    getLenis()?.stop();

    const state = { p: 0 };
    const render = () => {
      const p = state.p;
      if (fillRef.current) fillRef.current.style.clipPath = `inset(${(100 - p).toFixed(2)}% 0 0 0)`;
      if (countRef.current) countRef.current.textContent = String(Math.round(p)).padStart(3, '0');
      if (barRef.current) barRef.current.style.transform = `scaleX(${p / 100})`;
      if (dotRef.current) dotRef.current.style.left = `${p}%`;
    };
    render();

    const ready = Promise.race([Promise.all([document.fonts.ready, pageLoaded()]), sleep(6000)]);
    const tweens: gsap.core.Tween[] = [];

    void (async () => {
      const climb = gsap.to(state, { p: 88, duration: 1.7, ease: 'power2.out', onUpdate: render });
      tweens.push(climb);
      await Promise.all([climb, ready]);
      if (cancelled) return;
      const finish = gsap.to(state, { p: 100, duration: 0.55, ease: 'power1.inOut', onUpdate: render });
      tweens.push(finish);
      await finish;
      await sleep(220);
      if (cancelled) return;

      const lift = gsap.to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' });
      tweens.push(lift);
      // the hero starts its own entrance while the panel is still leaving
      await sleep(380);
      if (cancelled) return;
      html.style.overflow = '';
      getLenis()?.start();
      finishIntro();
      await lift;
    })();

    return () => {
      cancelled = true;
      tweens.forEach((t) => t.kill());
      html.style.overflow = '';
      getLenis()?.start();
    };
  }, [done]);

  if (done) return null;

  const [first, last] = config.name.toUpperCase().split(' ');
  return (
    <div ref={rootRef} className="loader" role="status" aria-live="polite" aria-label="Loading the portfolio">
      <div className="loader-name font-display" aria-hidden="true">
        <span className="loader-line">{first}</span>
        <span className="loader-line loader-line-b">{last}.</span>
        <div ref={fillRef} className="loader-fill">
          <span className="loader-line">{first}</span>
          <span className="loader-line loader-line-b">{last}.</span>
        </div>
      </div>

      <div className="loader-foot mono">
        <span>Loading the worlds</span>
        <span ref={countRef} className="loader-count mono">
          000
        </span>
      </div>
      <div className="loader-track" aria-hidden="true">
        <span ref={barRef} className="loader-bar" />
        <span ref={dotRef} className="loader-dot" />
      </div>
    </div>
  );
}

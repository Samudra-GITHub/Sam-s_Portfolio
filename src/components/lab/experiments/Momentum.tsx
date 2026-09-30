import { useRef } from 'react';
import { scrollVelocity } from '../../../lib/scroll';
import { useTicker, useVisibleRef, clamp } from '../../../lib/hooks';
import { useReducedMotion } from '../../../lib/runtime';

/**
 * MOMENTUM: type has mass. Two strips of type coast on their own and take
 * their speed, lean, weight and tracking from how hard you are scrolling.
 * This is the only marquee on the site, and it is the point of the piece.
 */
const PHRASE = 'TYPE IS A MATERIAL';

function Strip({ reverse, outline }: { reverse?: boolean; outline?: boolean }) {
  return (
    <div className={`mo-strip${outline ? ' mo-strip--outline' : ''}`} data-dir={reverse ? -1 : 1}>
      <div className="mo-track font-display">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="mo-chunk" aria-hidden={i > 0}>
            {PHRASE}
            <i className="mo-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Momentum() {
  const rootRef = useRef<HTMLDivElement>(null);
  const visible = useVisibleRef(rootRef);
  const reduce = useReducedMotion();
  const readRef = useRef<HTMLSpanElement>(null);
  const state = useRef<{ x: number[] }>({ x: [0, 0] });

  useTicker((_, dt) => {
    const root = rootRef.current;
    if (!root || reduce) return;
    const v = scrollVelocity.get();
    const speed = clamp(Math.abs(v) / 30, 0, 1);
    const strips = root.querySelectorAll<HTMLElement>('.mo-strip');
    strips.forEach((strip, i) => {
      const track = strip.firstElementChild as HTMLElement;
      const dir = Number(strip.dataset.dir);
      const chunk = track.firstElementChild as HTMLElement;
      const cw = chunk.offsetWidth || 1;
      // scrolling down pushes both strips forward; base speed keeps them alive
      const px = (48 + Math.abs(v) * 26) * dt * dir * (i === 0 ? 1 : 0.8);
      state.current.x[i] = (((state.current.x[i] + px) % cw) + cw) % cw;
      track.style.transform = `translate3d(${(-state.current.x[i]).toFixed(1)}px, 0, 0) skewX(${(-clamp(v * 0.32, -16, 16)).toFixed(2)}deg)`;
      track.style.fontWeight = String(Math.round(520 + speed * 280));
      track.style.letterSpacing = `${(-0.05 + speed * 0.05).toFixed(3)}em`;
    });
    if (readRef.current) readRef.current.textContent = Math.abs(v).toFixed(1).padStart(4, '0');
  }, visible);

  return (
    <div ref={rootRef} className="mo" role="img" aria-label="Momentum experiment: the type speeds up, leans and thickens as you scroll" data-cursor="scroll">
      <Strip />
      <Strip reverse outline />
      <span className="mo-read mono" aria-hidden="true">
        v <span ref={readRef}>0.0</span> px/frame
      </span>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { pointer } from '../../lib/pointer';
import { useKage } from './Kage';

/**
 * The hidden door. It sits nearly invisible in the About scene and wakes when
 * the pointer comes within reach. Keyboard and screen-reader users can still
 * find it: it is a real button in the tab order.
 */
export default function KageSeed() {
  const ref = useRef<HTMLButtonElement>(null);
  const { open, prefetch } = useKage();

  useEffect(() => {
    let near = false;
    const check = () => {
      const el = ref.current;
      if (!el || !pointer.seen) return;
      const r = el.getBoundingClientRect();
      const d = Math.hypot(pointer.x.get() - (r.left + r.width / 2), pointer.y.get() - (r.top + r.height / 2));
      const now = d < 150;
      if (now !== near) {
        near = now;
        el.dataset.near = String(now);
        if (now) prefetch();
      }
    };
    const unsubs = [pointer.x.on('change', check), pointer.y.on('change', check)];
    return () => unsubs.forEach((u) => u());
  }, [prefetch]);

  return (
    <button
      ref={ref}
      type="button"
      className="kage-seed"
      data-cursor="play"
      data-cursor-label="OPEN"
      aria-label="A shadow is hiding here. Open the hidden Kage scene."
      title="影"
      onFocus={prefetch}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        open({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
    >
      <span aria-hidden="true">影</span>
    </button>
  );
}

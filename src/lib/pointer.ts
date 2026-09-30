import { motionValue } from 'framer-motion';

/**
 * One pointer listener for the whole site. Everything reads these motion
 * values, so no component ever puts pointer position into React state.
 */
export const pointer = {
  /** viewport px */
  x: motionValue(-100),
  y: motionValue(-100),
  /** viewport-relative, -0.5..0.5 */
  nx: motionValue(0),
  ny: motionValue(0),
  /** smoothed px/frame */
  speed: motionValue(0),
  /** true once a real (mouse/pen) pointer has moved */
  seen: false,
};

let started = false;
let lastX = 0;
let lastY = 0;

export function initPointer() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      pointer.seen = true;
      pointer.x.set(e.clientX);
      pointer.y.set(e.clientY);
      pointer.nx.set(e.clientX / window.innerWidth - 0.5);
      pointer.ny.set(e.clientY / window.innerHeight - 0.5);
      const d = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
      pointer.speed.set(pointer.speed.get() * 0.8 + d * 0.2);
    },
    { passive: true },
  );
}

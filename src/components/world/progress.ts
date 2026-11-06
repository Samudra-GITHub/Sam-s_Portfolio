import { PLACES } from './places';

/**
 * Where the visitor is in the world, as a float: 0 at the landing island,
 * 1 at the work district, and so on. Measured from the sections' positions,
 * so the camera always agrees with the page.
 */
let tops: number[] = [];

export function measure() {
  tops = PLACES.map((p) => {
    const el = document.getElementById(p.id);
    return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
  });
}

export function worldProgress(): number {
  if (!tops.length) measure();
  // the "arrival line" sits a third of the way down the viewport
  const y = window.scrollY + window.innerHeight * 0.33;
  for (let i = tops.length - 1; i >= 0; i--) {
    if (y >= tops[i]) {
      const next = tops[i + 1];
      if (next === undefined || !Number.isFinite(next)) return i;
      const span = next - tops[i];
      // hold at each island for the first half of its section, then travel
      const f = Math.min(1, Math.max(0, (y - tops[i]) / span));
      const travel = Math.max(0, (f - 0.5) / 0.5);
      return i + travel * travel * (3 - 2 * travel);
    }
  }
  return 0;
}

if (import.meta.env.DEV) (window as unknown as { __world: unknown }).__world = { measure, worldProgress, tops: () => tops };

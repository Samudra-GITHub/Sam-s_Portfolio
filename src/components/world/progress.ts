import { PLACES } from './places';

/**
 * Where the visitor is along a list of page anchors, as a float: 0 at the
 * first anchor, 1 at the second, and so on. Measured from the elements'
 * positions, so the camera and the nav always agree with the page.
 *
 * `hold` is the fraction of each stretch spent resting before travelling on
 * (0 = travel the whole way, used by the hero so the camera flies while the
 * introduction takes off).
 */
export function createTrack(ids: string[], hold: (id: string) => number = () => 0.5) {
  let tops: number[] = [];
  const measure = () => {
    tops = ids.map((id) => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
    });
  };
  const progress = () => {
    if (!tops.length) measure();
    // the "arrival line" sits a third of the way down the viewport
    const y = window.scrollY + window.innerHeight * 0.33;
    for (let i = tops.length - 1; i >= 0; i--) {
      if (y >= tops[i]) {
        const next = tops[i + 1];
        if (next === undefined || !Number.isFinite(next)) return i;
        const f = Math.min(1, Math.max(0, (y - tops[i]) / (next - tops[i])));
        const h = hold(ids[i]);
        const t = Math.max(0, (f - h) / (1 - h));
        return i + t * t * (3 - 2 * t);
      }
    }
    return 0;
  };
  return { measure, progress, tops: () => tops };
}

/** The page's main sections (nav, map). */
const sections = createTrack(PLACES.map((p) => p.id));
export const measure = sections.measure;
export const worldProgress = sections.progress;

if (import.meta.env.DEV) (window as unknown as { __world: unknown }).__world = sections;

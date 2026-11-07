import { useEffect, useRef, type RefObject } from 'react';
import { ScrollTrigger } from '../lib/gsap';
import { matches, MQ } from '../lib/runtime';
import { createLeaves, type Leaves } from './leaves';

/**
 * A zone is one section and how the leaves behave while it holds the middle of the screen.
 * `under` puts the layer beneath the page's pictures, so screenshots are never covered.
 * `enter` runs on the way in, with the scroll direction, for the gusts and clusters that join scenes.
 */
export interface LeafZone {
  sel: string;
  density: number;
  bias: number;
  under?: boolean;
  /** the large soft leaf passing the camera; on unless a zone turns it off */
  lens?: boolean;
  enter?: (l: Leaves, dir: 1 | -1) => void;
}

/** the home page, from the hero to the closing contact */
export const HOME_ZONES: LeafZone[] = [
  // a few composed leaves around the name
  { sel: '.st-hero', density: 9, bias: 0.75, enter: (l, d) => d < 0 && (l.cluster(4), l.gust(-1.4, 0.3, 1.2)) },
  // the cut out of the hero: the wind carries the leaves into the introduction
  { sel: '.st-intro', density: 5, bias: 0.5, enter: (l, d) => d > 0 && l.gust(2.6, -0.9, 1.6) },
  // work: sparse, at the edges and beneath the screenshots; a quick whip of wind on the way in
  { sel: '#building', density: 3, bias: 0.9, under: true, lens: false },
  { sel: '#work', density: 3, bias: 0.95, under: true, lens: false, enter: (l, d) => l.gust(3 * d, 0.2, 1.1) },
  { sel: '#universe', density: 3, bias: 0.85, under: true, lens: false },
  // about: a richer, slower atmosphere
  { sel: '#about', density: 12, bias: 0.45, enter: (l, d) => d > 0 && (l.cluster(5), l.gust(1.1, 0, 1.8)) },
  { sel: '#lab', density: 2, bias: 0.9, under: true },
  { sel: '#toolkit', density: 2, bias: 0.9, under: true },
  // contact: one last gathering of leaves over the dark ground
  { sel: '#contact', density: 6, bias: 0.6, enter: (l, d) => d > 0 && (l.cluster(7, window.innerWidth * 0.5), l.gust(0.6, -0.4, 2.2)) },
];

/** case pages: a quiet ambient layer that stays beneath the pictures */
export const CASE_ZONES: LeafZone[] = [{ sel: 'main', density: 3, bias: 0.9, under: true, lens: false }];

/** One fixed leaf canvas for a page; the zone holding the middle of the screen sets its density and wind. */
export function useLeaves(root: RefObject<HTMLElement | null>, zones: LeafZone[], key?: string) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvas.current, el = root.current;
    if (!cv || !el) return;
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return; // very weak devices: no leaves at all
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('noleaves')) return; // dev only: A/B frame timing
    const lite = matches(MQ.compact) || (nav.hardwareConcurrency ?? 8) <= 4;
    const leaves = createLeaves(cv, { reduced: matches(MQ.reducedMotion), lite });
    const apply = (z: LeafZone, dir: 1 | -1, quiet = false) => {
      leaves.setEdgeBias(z.bias);
      leaves.setLens(z.lens !== false);
      leaves.setDensity(z.density);
      cv.classList.toggle('st-leaves--under', !!z.under);
      if (!quiet) z.enter?.(leaves, dir);
    };
    const triggers = zones.flatMap((z, i) => {
      const target = z.sel === 'main' ? el : el.querySelector<HTMLElement>(z.sel);
      if (!target) return [];
      const t = ScrollTrigger.create({
        trigger: target,
        // the first zone owns the page from the very top; the others take over at the middle of the screen
        start: i === 0 ? 'top top' : 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && apply(z, self.direction as 1 | -1),
      });
      return [{ z, t }];
    });
    // whatever zone the page opens in (a reload halfway down, or /#about)
    apply((triggers.find(({ t }) => t.isActive) ?? triggers[0])?.z ?? zones[0], 1, true);
    return () => {
      triggers.forEach(({ t }) => t.kill());
      leaves.dispose();
    };
  }, [root, zones, key]);
  return canvas;
}

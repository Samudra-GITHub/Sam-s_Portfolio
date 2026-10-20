/**
 * The motion system, in one place.
 *
 * Every moving thing on the site uses one of these characters, picked by what
 * the motion is for, not by taste on the day:
 *
 *  respond   the hand did something: answer at once, settle fast, no overshoot
 *  carry     the hand threw something: keep its velocity, a little give
 *  scene     a view arrives or leaves: travels the screen, eases both ends
 *  develop   an image comes up out of the paper: slow start of light, once
 *
 * Springs are used for anything a hand can interrupt (they re-target from the
 * live value); fixed curves only for things that play to the end.
 */
export const EASE = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  drawer: [0.32, 0.72, 0, 1] as const,
};

export const SPRING = {
  respond: { type: 'spring', bounce: 0, duration: 0.4 } as const,
  carry: { type: 'spring', bounce: 0.18, duration: 0.45 } as const,
  scene: { type: 'spring', bounce: 0, duration: 0.62 } as const,
};

export const DUR = { press: 0.14, hover: 0.2, ui: 0.26, scene: 0.62, develop: 1.1 };

/** critically damped follow, frame-rate independent (for rAF loops) */
export const follow = (current: number, target: number, dt: number, response = 0.18) =>
  current + (target - current) * (1 - Math.exp(-dt / Math.max(0.001, response)));

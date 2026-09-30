import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// Lenis owns smoothing; avoid GSAP catching up in bursts after a long frame.
gsap.ticker.lagSmoothing(0);
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };

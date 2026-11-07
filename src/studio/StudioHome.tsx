import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToTarget } from '../lib/scroll';
import { StudioPage } from './StudioShell';
import { projects } from '../data/projects';
import { config } from '../data/config';
import { gsap } from '../lib/gsap';
import { HOME_ZONES, useLeaves } from './useLeaves';
import { matches, MQ } from '../lib/runtime';
import Magnetic from '../components/core/Magnetic';
import type { createSculpture } from './sculpture';
import { light, useStudioMotion } from './motion';
import { About, Contact, Experiments, Toolkit, Universe } from './sections';
import { Akasha, Building, Rinti } from './showcases';
import { Kinetic } from './Kinetic';
import { useReel } from './reel';

const W = `${import.meta.env.BASE_URL}world`;
const bySlug = (slug: string) => projects.find((p) => p.slug === slug)!;

/* ------------------------------------------------------------ sculpture */

/** One fixed canvas; the sculpture sits over the slot in the name, then travels to the introduction. */
function useSculpture() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hero = useRef<HTMLSpanElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cv = canvas.current, a = hero.current, b = intro.current;
    if (!cv || !a || !b) return;
    let s: ReturnType<typeof createSculpture> | null = null;
    let gone = false;
    const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const tick = () => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 while the name is in view, 1 once the introduction's slot reaches the middle of the screen
      const span = rb.top + rb.height / 2 - (ra.top + ra.height / 2);
      const travelled = span > 0 ? (vh * 0.5 - (ra.top + ra.height / 2)) / span : 1;
      const j = ease(travelled);
      const cx = ra.left + ra.width / 2 + (rb.left + rb.width / 2 - (ra.left + ra.width / 2)) * j;
      const cy = ra.top + ra.height / 2 + (rb.top + rb.height / 2 - (ra.top + ra.height / 2)) * j;
      // fit the band (about 2.8 times as wide as it is tall) inside each slot, by width and by height
      const fit = (r: DOMRect, k: number) => Math.min(r.height * k, r.width / 2.85);
      const h = fit(ra, 1.25) + (fit(rb, 0.8) - fit(ra, 1.25)) * j;
      s!.place(cx, cy, h, j);
      s!.setVisible(cy + h > -40 && cy - h < vh + 40);
      s!.tick(performance.now());
    };
    let make: (() => void) | null = null;
    // if the GPU drops the context, the slot shows the still chrome pill; when it comes back, the sculpture is rebuilt
    const lost = (e: Event) => {
      e.preventDefault();
      gsap.ticker.remove(tick);
      cv.style.visibility = 'hidden';
      setFailed(true);
    };
    const restored = () => {
      if (gone || !make) return;
      s?.dispose();
      cv.style.visibility = '';
      make();
      setFailed(false);
    };
    cv.addEventListener('webglcontextlost', lost);
    cv.addEventListener('webglcontextrestored', restored);
    // no WebGL at all: show the still pill straight away, without fetching three.js or letting it log its failure
    const probe = document.createElement('canvas');
    const probeGl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!probeGl) {
      const t = window.setTimeout(() => setFailed(true), 0);
      return () => {
        window.clearTimeout(t);
        cv.removeEventListener('webglcontextlost', lost);
        cv.removeEventListener('webglcontextrestored', restored);
      };
    }
    probeGl.getExtension('WEBGL_lose_context')?.loseContext(); // give the probe's context straight back
    // three.js arrives in its own chunk, after the name and the text have painted
    import('./sculpture')
      .then(({ createSculpture }) => {
        if (gone) return;
        make = () => {
          s = createSculpture(cv, { reduced: matches(MQ.reducedMotion), compact: matches(MQ.compact) });
          gsap.ticker.add(tick);
        };
        make();
      })
      .catch(() => {
        if (!gone) setFailed(true);
      });
    return () => {
      gone = true;
      cv.removeEventListener('webglcontextlost', lost);
      cv.removeEventListener('webglcontextrestored', restored);
      gsap.ticker.remove(tick);
      s?.dispose();
    };
  }, []);
  return { canvas, hero, intro, failed };
}


/** tilt: the angle the screen settles from as it comes up the page; leave it out for a screen that has its own entrance */
function Screen({ src, alt, w = 1440, h = 900, tilt, className = '' }: { src: string; alt: string; w?: number; h?: number; tilt?: number; className?: string }) {
  return (
    <figure className={`st-screen ${className}`} data-tilt={tilt} {...light}>
      <img src={src} alt={alt} width={w} height={h} loading="lazy" decoding="async" />
    </figure>
  );
}

function Links({ github, live }: { github?: string; live?: string }) {
  return (
    <p className="st-links" data-r>
      {live && (
        <a href={live} target="_blank" rel="noreferrer">
          Live site <span aria-hidden="true">↗</span>
        </a>
      )}
      {github && (
        <a href={github} target="_blank" rel="noreferrer">
          Source <span aria-hidden="true">↗</span>
        </a>
      )}
    </p>
  );
}

/* ------------------------------------------------------------ the showcases */

function Tarang() {
  const p = bySlug('tarang');
  return (
    <article className="st-show st-tarang" data-reveal aria-labelledby="w-tarang">
      <div className="st-tarang__text">
        <p className="st-meta" data-r>{p.category} · {p.year}</p>
        <h3 id="w-tarang" className="st-show__name" data-r>{p.title}</h3>
        <p className="st-lead" data-r>{p.tagline}</p>
        <p className="st-body" data-r>{p.description}</p>
        <ul className="st-facts" data-r>
          {p.highlights.slice(0, 3).map((h) => <li key={h}>{h}</li>)}
        </ul>
        <p className="st-meta" data-r>{p.tech.join(' · ')}</p>
        <Links github={p.github} live={p.live} />
      </div>
      <div className="st-tarang__stage">
        <Screen className="st-tarang__home" src={`${W}/tarang/home.webp`} alt="Tarang's home screen: the album 'Analog Hearts' with the floating player along the bottom" tilt={-10} />
        <Screen className="st-tarang__now" src={`${W}/tarang/now-playing.webp`} alt="Tarang's now-playing view with the record artwork and playback controls" tilt={8} />
        <Screen className="st-tarang__stats" src={`${W}/tarang/stats.webp`} alt="Tarang's listening stats: top artists, albums, genres and time of day" tilt={-6} />
      </div>
    </article>
  );
}

function Krama() {
  const p = bySlug('krama');
  return (
    <article className="st-show st-krama" data-reveal aria-labelledby="w-krama">
      <h3 id="w-krama" className="st-krama__word" data-r>{p.title}</h3>
      <div className="st-krama__stage">
        <Screen className="st-krama__home" src={`${W}/krama/home.webp`} alt="Krama's home page: the Gati Runner drop, set like a magazine cover" tilt={9} />
        <Screen className="st-krama__product" src={`${W}/krama/product.webp`} alt="Krama's product page for the Gati Runner, with sizes and add to cart" tilt={0} />
        <Screen className="st-krama__shop" src={`${W}/krama/shop.webp`} alt="Krama's shop grid with colour and size filters" tilt={-9} />
      </div>
      <div className="st-krama__text">
        <p className="st-meta" data-r>{p.category} · {p.role} · {p.year}</p>
        <p className="st-lead" data-r>{p.tagline}</p>
        <p className="st-body" data-r>{p.description}</p>
        <p className="st-meta" data-r>{p.tech.join(' · ')}</p>
        <Links github={p.github} />
      </div>
    </article>
  );
}

function Noir() {
  const p = bySlug('noir-cafe');
  return (
    <article className="st-show st-noir" data-reveal aria-labelledby="w-noir">
      <div className="st-noir__stage">
        <Screen className="st-noir__menu" src={`${W}/noir/menu.webp`} alt="Noir Café's menu page: 'Made slowly. Served simply.' with the espresso list" />
        <Screen className="st-noir__shop" src={`${W}/noir/shop.webp`} alt="Noir Café's shop page with brewing equipment" />
      </div>
      <div className="st-noir__text">
        <p className="st-meta" data-r>{p.category} · {p.year}</p>
        <h3 id="w-noir" className="st-show__name" data-r>{p.title}</h3>
        <p className="st-lead" data-r>{p.tagline}</p>
        <p className="st-body" data-r>{p.description}</p>
        <ul className="st-facts" data-r>
          {p.highlights.slice(0, 2).map((h) => <li key={h}>{h}</li>)}
        </ul>
        <Links github={p.github} />
      </div>
    </article>
  );
}

/* ------------------------------------------------------------ the page */

export default function StudioHome() {
  const root = useRef<HTMLElement>(null);
  const { canvas, hero, intro, failed } = useSculpture();
  const leafCanvas = useLeaves(root, HOME_ZONES);
  useStudioMotion(root);
  useReel(root);
  // arriving from another page with a section in the address (/#about): go there once the page has laid out
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const t = window.setTimeout(() => scrollToTarget(hash, { immediate: true }), 120);
    return () => window.clearTimeout(t);
  }, [hash]);

  return (
    <StudioPage rootRef={root}>
      <canvas ref={canvas} className="st-canvas" aria-hidden="true" />
      <canvas ref={leafCanvas} className="st-leaves" aria-hidden="true" />


      <section className="st-hero" aria-labelledby="st-name">
        <h1 id="st-name" className="st-name" aria-label="Samudra Kar, designer and developer">
          <span className="st-name__row" aria-hidden="true">
            <span className="st-clip"><span data-line>Samudra</span></span>
            <span ref={hero} className={`st-slot${failed ? ' st-slot--still' : ''}`} />
            <span className="st-clip"><span data-line>Kar</span></span>
          </span>
          <span className="st-role" aria-hidden="true">
            <span className="st-clip"><span data-line>Designer &amp; Developer</span></span>
          </span>
        </h1>
        <div className="st-hero__foot">
          <p className="st-meta" data-fade>
            Creative coding · AI interfaces · Web
            <br />
            Work from 2023 to 2026
          </p>
          <p className="st-hero__line" data-fade>
            I design and build interactive interfaces, web experiences and AI tools that feel like objects you could pick up.
          </p>
          <span data-fade>
            <Magnetic>
              <a className="st-button" href="#work">
                See selected work <span aria-hidden="true">↓</span>
              </a>
            </Magnetic>
          </span>
        </div>
      </section>

      <section className="st-intro" data-reveal aria-labelledby="st-approach">
        <div ref={intro} className="st-intro__slot" aria-hidden="true" />
        <div className="st-intro__text">
          <Kinetic as="h2" id="st-approach" className="st-title" text="Precision, with play." />
          <p className="st-statement" data-r>
            I&rsquo;m a designer, developer and student. I build digital spaces that feel physical: interfaces with weight, motion that explains what just
            happened, and AI tools you can actually read.
          </p>
          <dl className="st-notes" data-r>
            <dt>Now building</dt><dd>{config.personal.currentlyBuilding}</dd>
            <dt>Learning</dt><dd>{config.about.learning.replace(/^Deepening my knowledge in /, '').replace(/\.$/, '')}</dd>
            <dt>Experimenting</dt><dd>{config.about.experimenting.replace(/\.$/, '')}</dd>
          </dl>
        </div>
      </section>

      <Building />

      <section id="work" className="st-work" aria-labelledby="st-work-title">
        <div className="st-work__head" data-reveal>
          <Kinetic as="h2" id="st-work-title" className="st-title" mode="whip" text="Selected work" />
          <p className="st-lead" data-r>Music, research, satellites, sneakers and coffee, each designed and built end to end.</p>
        </div>
        <Tarang />
        <Akasha />
        <Krama />
        <Rinti />
        <Noir />
      </section>

      <Universe />
      <About />
      <Experiments />
      <Toolkit />
      <Contact />
    </StudioPage>
  );
}

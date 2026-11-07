import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import '@fontsource-variable/sora';
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import { projects } from '../data/projects';
import { config } from '../data/config';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { matches, MQ } from '../lib/runtime';
import Magnetic from '../components/core/Magnetic';
import { createSculpture } from './sculpture';
import { About, Contact, Experiments, Toolkit, Universe } from './sections';
import './studio.css';

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
    let s: ReturnType<typeof createSculpture>;
    try {
      s = createSculpture(cv, { reduced: matches(MQ.reducedMotion), compact: matches(MQ.compact) });
    } catch {
      setFailed(true);
      return;
    }
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
      s.place(cx, cy, h, j);
      s.setVisible(cy + h > -40 && cy - h < vh + 40);
      s.tick(performance.now());
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      s.dispose();
    };
  }, []);
  return { canvas, hero, intro, failed };
}

/* ------------------------------------------------------------ motion */

function useStudioMotion(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || matches(MQ.reducedMotion)) return;
    const ctx = gsap.context(() => {
      // the name: each part rises out of its own line
      gsap.from('.st-hero [data-line]', { yPercent: 105, duration: 1.15, ease: 'expo.out', stagger: 0.08, delay: 0.15 });
      gsap.from('.st-hero [data-fade]', { opacity: 0, y: 16, duration: 0.9, ease: 'power3.out', stagger: 0.07, delay: 0.6 });
      // every section: heading, then text, then pictures
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((n) => {
        gsap.from(n.querySelectorAll(':scope [data-r]'), {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.075,
          scrollTrigger: { trigger: n, start: 'top 82%', once: true },
        });
      });
      // project screens settle from a tilt to flat as they come up the page
      gsap.utils.toArray<HTMLElement>('[data-tilt]').forEach((n) => {
        gsap.fromTo(
          n,
          { rotateX: 14, rotateY: Number(n.dataset.tilt) || 0, y: 60 },
          { rotateX: 0, rotateY: 0, y: 0, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'center 55%', scrub: 0.6 } },
        );
      });
    }, el);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [root]);
}

/** the pointer lights a screen: a soft highlight where it is, and the screen leans toward it */
const light = {
  onPointerMove(e: RPointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    e.currentTarget.style.setProperty('--lean-x', `${((e.clientY - r.top) / r.height - 0.5) * -4}deg`);
    e.currentTarget.style.setProperty('--lean-y', `${((e.clientX - r.left) / r.width - 0.5) * 5}deg`);
  },
  onPointerLeave(e: RPointerEvent<HTMLElement>) {
    e.currentTarget.style.setProperty('--lean-x', '0deg');
    e.currentTarget.style.setProperty('--lean-y', '0deg');
  },
};

function Screen({ src, alt, w = 1440, h = 900, tilt = 0, className = '' }: { src: string; alt: string; w?: number; h?: number; tilt?: number; className?: string }) {
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

const PAIRS = [1, 2, 3];
function Akasha() {
  const p = bySlug('akasha-lens');
  const [pair, setPair] = useState(1);
  const [cut, setCut] = useState(50);
  return (
    <article className="st-show st-akasha" data-reveal aria-labelledby="w-akasha">
      <div className="st-akasha__viewer" data-r>
        <div className="st-compare" style={{ '--cut': `${cut}%` } as CSSProperties}>
          <img src={`${W}/akasha/cloudy${pair}.webp`} alt={`Sample ${pair}: the cloudy satellite image the model is given`} width={487} height={287} loading="lazy" />
          <img className="st-compare__clear" src={`${W}/akasha/clear${pair}.webp`} alt={`Sample ${pair}: the clear image of the same ground the model learns to reconstruct`} width={487} height={287} loading="lazy" />
          <span className="st-compare__edge" aria-hidden="true" />
          <span className="st-compare__tag st-compare__tag--a" aria-hidden="true">Cloudy input</span>
          <span className="st-compare__tag st-compare__tag--b" aria-hidden="true">Clear target</span>
          <input type="range" min={0} max={100} value={cut} onChange={(e) => setCut(+e.target.value)} aria-label="Slide between the cloudy input and the clear target" />
        </div>
        <div className="st-akasha__pairs" role="group" aria-label="Training pairs">
          {PAIRS.map((n) => (
            <button key={n} type="button" aria-pressed={pair === n} onClick={() => setPair(n)}>
              <img src={`${W}/akasha/clear${n}.webp`} alt="" width={487} height={287} loading="lazy" />
              <span>Pair {n}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="st-akasha__text">
        <h3 id="w-akasha" className="st-show__name" data-r>{p.title}</h3>
        <p className="st-lead" data-r>{p.tagline}</p>
        <p className="st-body" data-r>{p.description}</p>
        <dl className="st-spec" data-r>
          <dt>Model</dt><dd>U-Net, trained on cloudy and clear pairs</dd>
          <dt>Outputs</dt><dd>Reconstruction, cloud mask, cover percentage, confidence heatmap</dd>
          <dt>Evaluation</dt><dd>MAE, PSNR, SSIM</dd>
          <dt>Built for</dt><dd>ISRO Hackathon 2026</dd>
          <dt>Status</dt><dd>{p.status}</dd>
        </dl>
        <Links github={p.github} />
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

const STAGES = ['Intent', 'Planning', 'Search', 'Extraction', 'Claim checks', 'Cited answer'];
function Rinti() {
  const p = bySlug('rinti-ai');
  return (
    <article className="st-show st-rinti" data-reveal aria-labelledby="w-rinti">
      <div className="st-rinti__head">
        <h3 id="w-rinti" className="st-show__name" data-r>{p.title}</h3>
        <p className="st-lead" data-r>{p.tagline}</p>
      </div>
      <ol className="st-pipeline" aria-label="Rinti's research pipeline" data-r>
        {STAGES.map((s, i) => (
          <li key={s} style={{ '--i': i } as CSSProperties}>
            {s}
          </li>
        ))}
      </ol>
      <div className="st-rinti__foot">
        <p className="st-body" data-r>{p.description}</p>
        <p className="st-meta" data-r>{p.highlights[2]}</p>
        <Links github={p.github} live={p.live} />
        <Screen className="st-rinti__screen" src={`${W}/rinti/login.webp`} alt="Rinti's sign-in screen" w={520} h={540} tilt={6} />
      </div>
    </article>
  );
}

function Noir() {
  const p = bySlug('noir-cafe');
  return (
    <article className="st-show st-noir" data-reveal aria-labelledby="w-noir">
      <div className="st-noir__stage">
        <Screen className="st-noir__menu" src={`${W}/noir/menu.webp`} alt="Noir Café's menu page: 'Made slowly. Served simply.' with the espresso list" tilt={-7} />
        <Screen className="st-noir__shop" src={`${W}/noir/shop.webp`} alt="Noir Café's shop page with brewing equipment" tilt={7} />
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
  useStudioMotion(root);

  return (
    <main id="main" className="studio" ref={root}>
      <canvas ref={canvas} className="st-canvas" aria-hidden="true" />

      <header className="st-nav">
        <Link to="/" className="st-wordmark">Samudra Kar</Link>
        <nav aria-label="Main">
          <a href="#work">Work</a>
          <a href="#universe">Index</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

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
          <h2 id="st-approach" className="st-title" data-r>Precision, with play.</h2>
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

      <section id="work" className="st-work" aria-labelledby="st-work-title">
        <div className="st-work__head" data-reveal>
          <h2 id="st-work-title" className="st-title" data-r>Selected work</h2>
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
    </main>
  );
}

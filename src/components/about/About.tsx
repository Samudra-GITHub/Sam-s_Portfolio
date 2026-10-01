import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, useTransform } from 'framer-motion';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { pointer } from '../../lib/pointer';
import { MQ, useMedia, useReducedMotion } from '../../lib/runtime';
import { real } from '../../lib/content';
import { config } from '../../data/config';
import KageSeed from '../kage/KageSeed';
import './about.css';

/**
 * About is a desk you discover, not a page you read.
 * On desktop the stage pins and the objects land on the desk one by one as you
 * scroll: an ID card, index cards for each facet (drag them around), a print,
 * a cassette, a sticky note, a studio stamp. Somewhere on the desk is a door.
 * On smaller screens the same objects simply lay out in a stack.
 */
type Spot = { x: number; y: number; r: number };

const FACET_SPOTS: Record<string, Spot> = {
  design: { x: 49, y: 9, r: -3 },
  dev: { x: 66, y: 6, r: 2 },
  student: { x: 83, y: 11, r: -2.5 },
  code: { x: 49, y: 41, r: 2.2 },
  ai: { x: 66, y: 38, r: -2 },
  lab: { x: 83, y: 44, r: 3 },
};

function Artifact({ spot, className = '', children, drag = true }: { spot?: Spot; className?: string; children: ReactNode; drag?: boolean }) {
  const style = spot ? ({ '--x': `${spot.x}%`, '--y': `${spot.y}%`, '--r': `${spot.r}deg` } as CSSProperties) : undefined;
  return (
    <div className={`artifact ${className}`} style={style}>
      <motion.div
        className="artifact-inner"
        drag={drag}
        dragMomentum={false}
        dragElastic={0.12}
        whileDrag={{ scale: 1.05, zIndex: 30, cursor: 'grabbing' }}
        data-cursor={drag ? 'drag' : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const pin = useMedia(`${MQ.desktop} and (prefers-reduced-motion: no-preference)`);
  const reduce = useReducedMotion();

  const tiltY = useTransform(pointer.nx, [-0.5, 0.5], [-9, 9]);
  const tiltX = useTransform(pointer.ny, [-0.5, 0.5], [7, -7]);
  const sheen = useTransform(pointer.nx, [-0.5, 0.5], ['0%', '100%']);

  useEffect(() => {
    if (reduce) return;
    const section = sectionRef.current!;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);
      if (pin) {
        const tl = gsap.timeline({ defaults: { ease: 'back.out(1.5)' } });
        tl.from(q('.about-word'), { clipPath: 'inset(0 100% 0 0)', duration: 0.6, stagger: 0.55, ease: 'power2.out' }, 0)
          .from(q('.artifact'), { yPercent: -170, rotation: (i: number) => (i % 2 ? 16 : -16), opacity: 0, duration: 0.8, stagger: 0.42 }, 0.2);
        // everything has landed after ~1.3 screens; the rest is time to look around before Contact rises
        ScrollTrigger.create({ trigger: section, start: 'top top', end: '+=130%', scrub: 0.8, animation: tl });
      } else {
        gsap.from(q('.artifact-inner'), {
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: q('.about-desk')[0], start: 'top 80%', toggleActions: 'play none none reverse' },
        });
      }
    }, section);
    return () => ctx.revert();
  }, [pin, reduce]);

  const { roles, facets } = config.about;
  const track = real(config.personal.nowPlaying.track);
  const artist = real(config.personal.nowPlaying.artist);
  const instagram = real(config.contact.instagram);
  const getFacet = (key: string) => facets.find((f) => f.key === key);

  return (
    <section ref={sectionRef} id="about" className="about" data-mode={pin ? 'pin' : 'stack'} aria-labelledby="about-title">
      <div className="about-stage">
        <div className="about-desk">
          <h2 id="about-title" className="about-title font-display">
            {['designer', 'developer', 'student'].map((w, i) => (
              <span key={w} className={`about-word about-word-${i}`}>
                {w}
              </span>
            ))}
            <span className="sr-only">. Also {roles.slice(3).join(', ')}.</span>
          </h2>

          <Artifact spot={{ x: 5, y: 38, r: -4 }} className="a-id" drag={pin}>
            <motion.div className="id" style={{ rotateX: tiltX, rotateY: tiltY }}>
              <motion.div className="id-sheen" style={{ backgroundPositionX: sheen }} aria-hidden="true" />
              <div className="id-top mono">
                <span>{config.studio}</span>
                <span>ID</span>
              </div>
              <div className="id-body">
                <div className="id-photo font-display" aria-hidden="true">
                  SK
                </div>
                <dl className="id-fields">
                  <dt className="mono">Name</dt>
                  <dd className="font-display">{config.name}</dd>
                  <dt className="mono">Does</dt>
                  <dd>{roles.slice(0, 3).join(' + ')}</dd>
                </dl>
              </div>
              <div className="id-bars" aria-hidden="true">
                {Array.from({ length: 34 }, (_, i) => (
                  <i key={i} style={{ width: `${1 + ((i * 7) % 4)}px` }} />
                ))}
              </div>
            </motion.div>
          </Artifact>

          {Object.entries(FACET_SPOTS).map(([key, spot], i) => {
            const f = getFacet(key);
            if (!f) return null;
            return (
              <Artifact key={key} spot={spot} className="a-card">
                <article className={`facet facet-${i % 3}`}>
                  <h3 className="mono">{f.title}</h3>
                  <p>{f.line}</p>
                </article>
              </Artifact>
            );
          })}

          <Artifact spot={{ x: 30, y: 33, r: 3 }} className="a-photo">
            <figure className="polaroid">
              <div className="polaroid-pic" aria-hidden="true">
                <span className="polaroid-sun" />
                <span className="polaroid-hill polaroid-hill-a" />
                <span className="polaroid-hill polaroid-hill-b" />
              </div>
              <figcaption className="mono">
                {getFacet('photo')?.title ?? 'Photography'}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()}>
                    {' '}
                    more &#8599;
                  </a>
                )}
              </figcaption>
            </figure>
          </Artifact>

          <Artifact spot={{ x: 9, y: 72, r: -2 }} className="a-tape">
            <div className="cassette" data-playing={Boolean(track)}>
              <div className="cassette-label">
                <span className="mono">Now playing</span>
                <strong className="font-display">{track ?? 'silence, for now'}</strong>
                {artist && <span className="mono">{artist}</span>}
              </div>
              <div className="cassette-window" aria-hidden="true">
                <span className="reel" />
                <span className="reel" />
              </div>
            </div>
          </Artifact>

          <Artifact spot={{ x: 57, y: 68, r: 2.5 }} className="a-note">
            <aside className="note">
              <span className="mono">Currently building</span>
              <p className="font-display">
                {config.personal.currentlyBuilding}
                <i className="note-caret" aria-hidden="true" />
              </p>
            </aside>
          </Artifact>

          <Artifact spot={{ x: 84, y: 74, r: 0 }} className="a-stamp" drag={false}>
            <div className="stamp mono" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs>
                  <path id="studio-path" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
                </defs>
                <text fontSize="11" fill="currentColor" fontFamily="var(--font-mono)" fontWeight="700">
                  <textPath href="#studio-path" textLength="276" lengthAdjust="spacing">SAM&apos;S STUDIO * SAM&apos;S STUDIO * SAM&apos;S STUDIO *</textPath>
                </text>
              </svg>
              <b className="font-display">S</b>
            </div>
          </Artifact>

          <div className="about-door">
            <KageSeed />
          </div>
        </div>
      </div>
    </section>
  );
}

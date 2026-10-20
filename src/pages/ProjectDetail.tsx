import { Suspense, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMotionValue } from 'framer-motion';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { useTicker, useVisibleRef } from '../lib/hooks';
import { useReducedMotion } from '../lib/runtime';
import { real } from '../lib/content';
import { featured, getProject, moreWork, type Project } from '../data/projects';
import { usePageTransition } from '../components/core/PageTransition';
import Split from '../components/core/Split';
import SceneFrame from '../components/work/SceneFrame';
import RingLocator from '../components/work/RingLocator';
import ProjectPlate from '../components/more/ProjectPlate';
import { WORLDS } from '../components/work/worlds';
import NotFound from './NotFound';
import './detail.css';
import Arrow from '../components/core/Arrow';

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProject(slug);
  return project ? <ProjectView key={project.slug} project={project} /> : <NotFound />;
}

function ProjectView({ project }: { project: Project }) {
  const { go } = usePageTransition();
  const rootRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const visible = useVisibleRef(sceneRef);
  const reduce = useReducedMotion();
  const [auto, setAuto] = useState(!reduce);
  const progress = useMotionValue(reduce ? 0.55 : 0.32);

  // a featured world pages through the worlds; the rest page through "More work"
  const list: Project[] = project.tier === 'featured' ? featured : moreWork;
  const index = list.findIndex((p) => p.id === project.id);
  const next = list[(index + 1) % list.length];
  const World = project.world ? WORLDS[project.world] : null;
  const longest = Math.max(...project.title.split(' ').map((w) => w.length));
  const nextLongest = Math.max(...next.title.split(' ').map((w) => w.length));

  // the scene plays itself unless you take the scrub bar
  useTicker((t) => {
    if (!auto || reduce || !World) return;
    const p = 0.5 - 0.46 * Math.cos((t * Math.PI * 2) / 28 + 3.3);
    progress.set(p);
    if (rangeRef.current) rangeRef.current.value = String(Math.round(p * 1000));
  }, visible);

  // arrival
  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.45, defaults: { ease: 'expo.out' } });
      tl.from('.detail-title .split-inner', { yPercent: 110, duration: 1, stagger: 0.035 })
        .from('.detail-reveal', { y: 16, opacity: 0, duration: 0.7, stagger: 0.06 }, '-=0.75')
        .from('.detail-scene .scene-frame, .detail-scene .plate', { clipPath: 'circle(0% at 50% 50%)', duration: 1.1, ease: 'expo.inOut' }, 0.15);
      gsap.from('.detail-row', {
        y: 18,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.detail-body', start: 'top 78%', once: true },
      });
    }, root);
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, [reduce]);

  const style = { '--c-bg': project.palette.bg, '--c-fg': project.palette.fg, '--c-accent': project.palette.accent, '--len': longest, '--nlen': nextLongest } as CSSProperties;

  const backTarget = project.tier === 'featured' ? `#w-${project.slug}` : '#more';
  const back = (e: MouseEvent) => {
    e.preventDefault();
    go('/', { scrollTo: backTarget, label: project.tier === 'featured' ? 'Worlds' : 'More work', color: '#123a8c', ink: '#eef2fc' });
  };
  const openNext = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const box = (e.currentTarget.closest('.detail-next') as HTMLElement).getBoundingClientRect();
    go(`/work/${next.slug}`, { from: box, color: next.palette.bg, ink: next.palette.fg, label: next.title });
  };

  const long = real(project.longDescription);
  const live = real(project.live);
  const facts = [project.year, project.category, ...(project.role ? [project.role] : [])];

  return (
    <main id="main" ref={rootRef} className="detail" style={style}>
      <section className="detail-hero">
        <div className="detail-top">
          <a href={`/${backTarget}`} className="tlink detail-back" onClick={back}>
            <Arrow dir="left" /> {project.tier === 'featured' ? 'All worlds' : 'More work'}
          </a>
          {project.tier === 'featured' && (
            <span className="detail-locator mono">
              <RingLocator index={index} total={list.length} />
              World {String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="detail-grid">
          <div className="detail-text">
            <h1 className="detail-title">
              <Split text={project.title} by="chars" />
            </h1>
            {project.alias && <p className="detail-alias mono detail-reveal">also known as {project.alias}</p>}
            <p className="detail-tagline detail-reveal">{project.tagline}</p>
            <ul className="chapter-facts mono detail-reveal" aria-label="Facts">
              {facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {project.team && <p className="detail-team detail-reveal">{project.team}.</p>}
            <div className="detail-actions detail-reveal">
              {live && (
                <a href={live} className="btn btn--chapter" target="_blank" rel="noreferrer">
                  Open the live site <Arrow dir="out" className="btn-arrow" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              {project.github && (
                <a href={project.github} className={live ? 'tlink' : 'btn btn--chapter'} target="_blank" rel="noreferrer">
                  Source on GitHub <Arrow dir="out" className={live ? '' : 'btn-arrow'} />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
          </div>

          <div ref={sceneRef} className="detail-scene">
            {World ? (
              <>
                <SceneFrame project={project} index={index} total={list.length} progress={progress} interactive={false}>
                  <Suspense fallback={<div className="world-fallback" />}>
                    <World />
                  </Suspense>
                </SceneFrame>
                <div className="detail-scrub">
                  <label htmlFor="scrub" className="mono">
                    Scrub the scene
                  </label>
                  <input
                    id="scrub"
                    ref={rangeRef}
                    type="range"
                    min={0}
                    max={1000}
                    defaultValue={Math.round(progress.get() * 1000)}
                    onInput={(e) => {
                      setAuto(false);
                      progress.set(Number(e.currentTarget.value) / 1000);
                    }}
                  />
                  <button type="button" className="scrub-btn mono" aria-pressed={auto} onClick={() => setAuto((a) => !a)}>
                    {auto ? 'Pause' : 'Play'}
                  </button>
                </div>
              </>
            ) : (
              <figure className="detail-plate">
                <ProjectPlate project={project} />
                <figcaption className="mono">Drawn plate, not a screenshot</figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      <section className="detail-body on-sheet">
        <div className="detail-body-inner">
          <div className="detail-col">
            <h2 className="detail-row detail-h">What it is</h2>
            <p className="detail-row text-body-lg">{real(project.description)}</p>
            {long && <p className="detail-row text-body-lg">{long}</p>}
            {project.status && (
              <p className="detail-row detail-status">
                <span className="mono">Status</span> {project.status}
              </p>
            )}
          </div>

          <div className="detail-col">
            {project.highlights.length > 0 && (
              <>
                <h2 className="detail-row detail-h">What exists</h2>
                <ul className="detail-list">
                  {project.highlights.map((h) => (
                    <li key={h} className="detail-row">
                      <p>{h}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h2 className="detail-row detail-h detail-h--sub">Built with</h2>
            <ul className="detail-row detail-tech dotlist mono">
              {project.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="detail-next" style={{ '--n-bg': next.palette.bg, '--n-fg': next.palette.fg } as CSSProperties}>
        <div className="detail-next-inner">
          <p className="mono">{project.tier === 'featured' ? 'Next world' : 'Next project'}</p>
          <Link to={`/work/${next.slug}`} className="detail-next-link" onClick={openNext} data-cursor="project" data-cursor-label="NEXT">
            <span className="detail-next-title">
              <Split text={next.title} by="chars" />
            </span>
          </Link>
          <p className="detail-next-tag">{next.tagline}</p>
        </div>
      </section>
    </main>
  );
}

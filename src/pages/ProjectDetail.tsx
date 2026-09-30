import { Suspense, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMotionValue } from 'framer-motion';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { useTicker, useVisibleRef } from '../lib/hooks';
import { useReducedMotion } from '../lib/runtime';
import { real } from '../lib/content';
import { getProject, projects, type Project } from '../data/projects';
import { usePageTransition } from '../components/core/PageTransition';
import Magnetic from '../components/core/Magnetic';
import Split from '../components/core/Split';
import SceneFrame from '../components/work/SceneFrame';
import { WORLDS } from '../components/work/worlds';
import NotFound from './NotFound';
import './detail.css';

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

  const index = projects.findIndex((p) => p.id === project.id);
  const next = projects[(index + 1) % projects.length];
  const World = WORLDS[project.world];
  const longest = Math.max(...project.title.split(' ').map((w) => w.length));
  const nextLongest = Math.max(...next.title.split(' ').map((w) => w.length));

  // the scene plays itself unless you take the scrub bar
  useTicker((t) => {
    if (!auto || reduce) return;
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
      tl.from('.detail-title .split-inner', { yPercent: 118, duration: 1.1, stagger: 0.04 })
        .from('.detail-reveal', { y: 28, opacity: 0, duration: 0.8, stagger: 0.07 }, '-=0.8')
        .from('.detail-scene .scene-frame', { clipPath: 'circle(0% at 50% 50%)', duration: 1.3, ease: 'expo.inOut' }, 0.2);
      gsap.from('.detail-row', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.detail-body', start: 'top 75%', toggleActions: 'play none none reverse' },
      });
      gsap.from('.detail-next-title .split-inner', {
        yPercent: 118,
        duration: 1,
        stagger: 0.04,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.detail-next', start: 'top 70%', toggleActions: 'play none none reverse' },
      });
    }, root);
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, [reduce]);

  const style = { '--c-bg': project.palette.bg, '--c-fg': project.palette.fg, '--c-accent': project.palette.accent, '--len': longest, '--nlen': nextLongest } as CSSProperties;

  const back = (e: MouseEvent) => {
    e.preventDefault();
    go('/', { scrollTo: `#w-${project.slug}`, label: 'Work', color: '#111215', ink: '#d8f827' });
  };
  const openNext = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const box = (e.currentTarget.closest('.detail-next') as HTMLElement).getBoundingClientRect();
    go(`/work/${next.slug}`, { from: box, color: next.palette.bg, ink: next.palette.fg, label: next.title });
  };

  const long = real(project.longDescription);
  const live = real(project.live);

  return (
    <main id="main" ref={rootRef} className="detail" style={style}>
      <section className="detail-hero">
        <div className="detail-top">
          <a href="/#work" className="detail-back mono" onClick={back}>
            <span aria-hidden="true">&larr;</span> All work
          </a>
          <span className="mono">
            World {String(index + 1).padStart(2, '0')} of {String(projects.length).padStart(2, '0')}
          </span>
        </div>

        <div className="detail-grid">
          <div className="detail-text">
            <h1 className="detail-title font-display">
              <Split text={project.title} by="chars" />
            </h1>
            {project.alias && <p className="detail-alias mono detail-reveal">also known as {project.alias}</p>}
            <p className="detail-tagline detail-reveal">{project.tagline}</p>
            <ul className="chapter-chips detail-reveal">
              {[project.year, project.category, ...(project.role ? [project.role] : [])].map((f) => (
                <li key={f} className="chip mono">
                  {f}
                </li>
              ))}
            </ul>
            <div className="detail-actions detail-reveal">
              {live && (
                <Magnetic>
                  <a href={live} className="btn btn--chapter" target="_blank" rel="noreferrer">
                    Live site <span aria-hidden="true">&#8599;</span>
                  </a>
                </Magnetic>
              )}
              {project.github && (
                <Magnetic>
                  <a href={project.github} className="btn btn--chapter" target="_blank" rel="noreferrer">
                    Source on GitHub <span aria-hidden="true">&#8599;</span>
                  </a>
                </Magnetic>
              )}
            </div>
          </div>

          <div ref={sceneRef} className="detail-scene">
            <SceneFrame project={project} index={index} total={projects.length} progress={progress} interactive={false}>
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
              <button type="button" className="lab-btn mono" aria-pressed={auto} onClick={() => setAuto((a) => !a)}>
                {auto ? 'Playing' : 'Paused'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-body">
        <div className="detail-body-inner">
          <div className="detail-col">
            <h2 className="detail-row detail-h font-display">About this world</h2>
            <p className="detail-row text-body-lg">{real(project.description)}</p>
            {long ? <p className="detail-row text-body-lg">{long}</p> : <p className="detail-row detail-pending mono">Full case study coming soon.</p>}
            {project.status && <p className="detail-row detail-status mono">{project.status}</p>}
          </div>

          <div className="detail-col">
            <h2 className="detail-row detail-h font-display">What exists</h2>
            <ol className="detail-list">
              {project.highlights.map((h, i) => (
                <li key={h} className="detail-row">
                  <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                  <p>{h}</p>
                </li>
              ))}
            </ol>
            <h2 className="detail-row detail-h font-display detail-h--sub">Built with</h2>
            <ul className="chapter-chips detail-row">
              {project.tech.map((t) => (
                <li key={t} className="chip chip--lg mono">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="detail-next" style={{ '--n-bg': next.palette.bg, '--n-fg': next.palette.fg } as CSSProperties}>
        <div className="detail-next-inner">
          <p className="mono">Next world, {String(((index + 1) % projects.length) + 1).padStart(2, '0')}</p>
          <Link to={`/work/${next.slug}`} className="detail-next-link" onClick={openNext} data-cursor="project" data-cursor-label="NEXT">
            <span className="detail-next-title font-display">
              <Split text={next.title} by="chars" />
            </span>
          </Link>
          <p className="detail-next-tag">{next.tagline}</p>
        </div>
      </section>
    </main>
  );
}

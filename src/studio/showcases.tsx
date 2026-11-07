import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../data/projects';
import { BUILDING, current, type BuildingEntry } from '../data/building';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { matches, MQ } from '../lib/runtime';
import { akashaPairs, SHOTS, type AkashaPair } from './media';
import { detect, paint, LUM, SAT, type Detection } from './akashaDetect';
import { light } from './motion';
import './showcases.css';

const bySlug = (slug: string) => projects.find((p) => p.slug === slug)!;

function Links({ github, live, page }: { github?: string; live?: string; page?: string }) {
  return (
    <p className="st-links" data-r>
      {page && <Link to={page}>Case study</Link>}
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

/* ============================================================ AkashaLens */

type View = 'compare' | 'mask' | 'confidence';
const VIEWS: { id: View; label: string }[] = [
  { id: 'compare', label: 'Cloudy and clear' },
  { id: 'mask', label: 'Cloud mask' },
  { id: 'confidence', label: 'Confidence' },
];

/** the pipeline as the app runs it; `live` steps run on this page, the rest wait on a trained model */
const AK_STEPS: { name: string; note: string; live: boolean }[] = [
  { name: 'Input', note: 'resized to 256 × 256', live: true },
  { name: 'Cloud mask', note: `luminance above ${LUM}, saturation below ${SAT}`, live: true },
  { name: 'U-Net reconstruction', note: 'no trained weights yet', live: false },
  { name: 'Confidence map', note: 'distance into each cloud and its brightness', live: true },
  { name: 'MAE · PSNR · SSIM', note: 'waits on a reconstruction to score', live: false },
];

/** the cloudy frame with the clear one placed under it by the pair's inset, cropped to the same ground */
function Compare({ p, cut }: { p: AkashaPair; cut: number }) {
  const inset = p.inset!;
  const style = {
    width: `${(p.clear.w / p.cloudy.w) * 100}%`,
    left: `${(-inset.x / p.cloudy.w) * 100}%`,
    top: `${(-inset.y / p.cloudy.h) * 100}%`,
  };
  return (
    <>
      <img className="st-ak__clear" src={p.clearSrc} alt={`Pair ${p.n}: the clear image of the same ground, cropped to the cloudy frame`} width={p.clear.w} height={p.clear.h} style={{ ...style, clipPath: `inset(0 0 0 ${cut}%)` }} loading="lazy" />
      <span className="st-ak__edge" style={{ left: `${cut}%` }} aria-hidden="true" />
    </>
  );
}

export function Akasha() {
  const p = bySlug('akasha-lens');
  const [n, setN] = useState(1);
  const [view, setView] = useState<View>('compare');
  const [cut, setCut] = useState(50);
  const [result, setResult] = useState<Detection | null>(null);
  const pair = akashaPairs[n - 1];
  const side = !pair.inset; // pair 3 was framed differently: shown side by side, never overlaid
  const img = useRef<HTMLImageElement>(null);
  const layer = useRef<HTMLCanvasElement>(null);

  // run the detector on the cloudy image once it has loaded
  useEffect(() => {
    const el = img.current;
    if (!el) return;
    let gone = false;
    const run = () => !gone && setResult(detect(el));
    if (el.complete && el.naturalWidth) run();
    else el.addEventListener('load', run, { once: true });
    return () => {
      gone = true;
      el.removeEventListener('load', run);
    };
  }, [n]);

  // paint the layer for the chosen view, and sweep it in like a scan line
  useEffect(() => {
    const cv = layer.current;
    if (!cv || !result || view === 'compare') return;
    paint(cv, result, view);
    if (matches(MQ.reducedMotion)) return;
    const tw = gsap.fromTo(cv, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' });
    return () => {
      tw.kill();
    };
  }, [result, view]);

  const ratio = `${pair.cloudy.w} / ${pair.cloudy.h}`;
  return (
    <article className="st-show st-ak" data-reveal aria-labelledby="w-akasha">
      <div className="st-ak__viewer" data-r>
        <div className="st-ak__views" role="tablist" aria-label="What the viewer shows">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>

        <div className={`st-ak__frames${side && view === 'compare' ? ' st-ak__frames--side' : ''}`}>
          <figure className="st-ak__frame" style={{ aspectRatio: ratio }}>
            <img ref={img} className="st-ak__cloudy" src={pair.cloudySrc} alt={`Pair ${pair.n}: the cloudy satellite image the model is given`} width={pair.cloudy.w} height={pair.cloudy.h} />
            {view === 'compare' && !side && <Compare p={pair} cut={cut} />}
            {view !== 'compare' && <canvas ref={layer} className={`st-ak__layer st-ak__layer--${view}`} aria-hidden="true" />}
            <span className="st-ak__tag st-ak__tag--a" aria-hidden="true">{view === 'compare' ? 'Cloudy input' : view === 'mask' ? 'Cloud mask' : 'Confidence'}</span>
            {view === 'compare' && !side && <span className="st-ak__tag st-ak__tag--b" aria-hidden="true">Clear target</span>}
            {view === 'compare' && !side && (
              <input type="range" min={0} max={100} value={cut} onChange={(e) => setCut(+e.target.value)} aria-label="Slide between the cloudy input and the clear target" />
            )}
          </figure>
          {side && view === 'compare' && (
            <figure className="st-ak__frame" style={{ aspectRatio: `${pair.clear.w} / ${pair.clear.h}` }}>
              <img className="st-ak__cloudy" src={pair.clearSrc} alt={`Pair ${pair.n}: the clear image, captured at a different zoom`} width={pair.clear.w} height={pair.clear.h} loading="lazy" />
              <span className="st-ak__tag st-ak__tag--a" aria-hidden="true">Clear target</span>
            </figure>
          )}
        </div>

        <dl className="st-ak__read" aria-live="polite">
          <div><dt>Cloud cover</dt><dd>{result ? `${result.cover}%` : '…'}</dd></div>
          <div><dt>Confidence</dt><dd>{result ? result.score : '…'}</dd></div>
          <div><dt>Computed</dt><dd>in your browser, from the repo&rsquo;s rule</dd></div>
        </dl>
        {view === 'confidence' && (
          <p className="st-ak__legend" aria-hidden="true">
            <span>least sure</span><i /><span>clear ground</span>
          </p>
        )}

        <div className="st-ak__pairs" role="group" aria-label="Training pairs">
          {akashaPairs.map((q) => (
            <button key={q.n} type="button" aria-pressed={n === q.n} onClick={() => setN(q.n)}>
              <img src={q.cloudySrc} alt="" width={q.cloudy.w} height={q.cloudy.h} loading="lazy" />
              <span>Pair {q.n}{q.inset ? '' : ' · side by side'}</span>
            </button>
          ))}
        </div>
        <p className="st-meta st-ak__note">
          Training pairs from the dataset, not model outputs. Pairs 1 and 2 were matched by their map labels and shorelines and are aligned by eye; pair 3
          was captured at a different zoom.
        </p>
      </div>

      <div className="st-ak__text">
        <p className="st-meta" data-r>{p.category} · {p.year}</p>
        <h3 id="w-akasha" className="st-show__name" data-r>{p.title}</h3>
        <p className="st-lead" data-r>{p.tagline}</p>
        <p className="st-body" data-r>{p.description}</p>
        <ol className="st-ak__steps" aria-label="The AkashaLens pipeline" data-r>
          {AK_STEPS.map((s, i) => (
            <li key={s.name} className={s.live ? 'is-live' : 'is-wait'} style={{ '--i': i } as CSSProperties}>
              <span className="st-ak__dot" aria-hidden="true" />
              <span className="st-ak__step">{s.name}</span>
              <span className="st-meta">{s.live ? 'runs here · ' : ''}{s.note}</span>
            </li>
          ))}
        </ol>
        <p className="st-meta" data-r>{p.status}</p>
        <Links github={p.github} page={`/work/${p.slug}`} />
      </div>
    </article>
  );
}

/* ============================================================ Rinti */

/** the research stream as backend/research/engine.py sends it: stage, progress and label */
const RI_STAGES = [
  { id: 'intent', label: 'Reading the question', progress: null, shot: 0, crop: 'top' },
  { id: 'planning', label: 'Planning research...', progress: 0.05, shot: 0, crop: 'top' },
  { id: 'searching', label: 'Searching the web...', progress: 0.2, shot: 1, crop: 'mid' },
  { id: 'reading', label: 'Reading sources...', progress: 0.45, shot: 1, crop: 'mid' },
  { id: 'cross_checking', label: 'Cross-checking evidence...', progress: 0.65, shot: 2, crop: 'mid' },
  { id: 'writing', label: 'Writing answer...', progress: 0.8, shot: 0, crop: 'mid' },
] as const;

/** backend/research/config.py */
const BUDGETS = {
  quick: { searches: 2, sources: 6, extractions: 4, subqueries: 2 },
  standard: { searches: 5, sources: 16, extractions: 8, subqueries: 5 },
};
const BUDGET_MAX = BUDGETS.standard;

/** docs/benchmarks/benchmark-20261021-130752-final.md on the open feat/local-inference branch */
const BENCH = [
  { target: 'qwen2.5:7b, local in Ollama', failures: '0 / 28', first: '0.3 s', total: '6.8 s', speed: '12 tok/s' },
  { target: 'gpt-oss-120b on Groq', failures: '2 / 28', first: '7.0 s', total: '7.1 s', speed: '503 tok/s' },
];

export function Rinti() {
  const p = bySlug('rinti-ai');
  const shots = SHOTS['rinti-ai'];
  const [stage, setStage] = useState(0);
  const [mode, setMode] = useState<'quick' | 'standard'>('quick');
  const root = useRef<HTMLElement>(null);
  const auto = useRef(true);

  // walk the stages once the section is in view, like a live run; any click hands control to the reader
  useEffect(() => {
    const el = root.current;
    if (!el || matches(MQ.reducedMotion)) return;
    let id = 0;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      end: 'bottom 20%',
      onToggle: (self) => {
        window.clearInterval(id);
        if (self.isActive && auto.current) id = window.setInterval(() => auto.current && setStage((s) => (s + 1) % RI_STAGES.length), 2200);
      },
    });
    return () => {
      window.clearInterval(id);
      st.kill();
    };
  }, []);
  const pick = (i: number) => {
    auto.current = false;
    setStage(i);
  };

  const s = RI_STAGES[stage];
  const b = BUDGETS[mode];
  return (
    <article ref={root} className="st-show st-ri" data-reveal aria-labelledby="w-rinti">
      <div className="st-ri__head">
        <p className="st-meta" data-r>{p.category} · {p.year}</p>
        <h3 id="w-rinti" className="st-show__name" data-r>{p.title}</h3>
        <p className="st-lead" data-r>{p.tagline}</p>
        <p className="st-body" data-r>{p.description}</p>
        <Links github={p.github} live={p.live} page={`/work/${p.slug}`} />
      </div>

      <ol className="st-ri__flow" aria-label="Rinti's research stream" data-r>
        {RI_STAGES.map((x, i) => (
          <li key={x.id} className={i < stage ? 'is-done' : i === stage ? 'is-now' : ''}>
            <button type="button" onClick={() => pick(i)} aria-current={i === stage ? 'step' : undefined}>
              <span className="st-ri__node" aria-hidden="true" />
              <span className="st-ri__stage">{x.id.replace('_', ' ')}</span>
              <span className="st-meta">{x.progress === null ? 'before the stream' : `progress ${x.progress}`}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="st-ri__stage-view" data-r>
        <div className="st-ri__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${s.progress ?? 0})` }} />
        </div>
        <p className="st-ri__label" aria-live="polite">{s.label}</p>
        <figure className="st-ri__screen" {...light}>
          {shots.slice(0, 3).map((shot, i) => (
            <img
              key={shot.src}
              src={shot.src}
              alt={i === s.shot ? shot.alt : ''}
              aria-hidden={i === s.shot ? undefined : true}
              width={shot.w}
              height={shot.h}
              loading="lazy"
              className={`${i === s.shot ? 'is-on' : ''} st-ri__crop--${i === s.shot ? s.crop : 'mid'}`}
            />
          ))}
        </figure>
        <p className="st-meta">Real screens from one research run on the live site: &ldquo;How does the James Webb Space Telescope keep its instruments cold?&rdquo;</p>
      </div>

      <div className="st-ri__budget" data-r>
        <div className="st-ri__budget-head">
          <h4 className="st-meta">Research budget</h4>
          <div className="st-ri__toggle" role="radiogroup" aria-label="Research mode">
            {(['quick', 'standard'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}>{m === 'quick' ? 'Quick' : 'Standard'}</button>
            ))}
          </div>
        </div>
        <dl>
          {(Object.keys(b) as (keyof typeof b)[]).map((k) => (
            <div key={k}>
              <dt>{k === 'subqueries' ? 'sub-queries' : k}</dt>
              <dd>
                <span className="st-ri__meter" aria-hidden="true"><i style={{ transform: `scaleX(${b[k] / BUDGET_MAX[k]})` }} /></span>
                <b>{b[k]}</b>
              </dd>
            </div>
          ))}
        </dl>
        <p className="st-meta">Each source is cut to 3,500 characters, and all the evidence to 12,000, before the answer is written.</p>
      </div>

      <div className="st-ri__bench" data-r>
        <h4 className="st-meta">Same prompts, 28 cases each</h4>
        <table>
          <thead>
            <tr><th scope="col">Model</th><th scope="col">Failures</th><th scope="col">First token</th><th scope="col">Median reply</th><th scope="col">Speed</th></tr>
          </thead>
          <tbody>
            {BENCH.map((r) => (
              <tr key={r.target}><th scope="row">{r.target}</th><td>{r.failures}</td><td>{r.first}</td><td>{r.total}</td><td>{r.speed}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="st-meta">From the benchmark on the local-inference branch, 21 October 2026. That branch is an open pull request, not yet merged.</p>
      </div>
    </article>
  );
}

/* ============================================================ Currently building */

/** each smaller copy sits beside the original as name-<width>.webp */
const srcset = (s: BuildingEntry['screens'][number]) =>
  s.sizes ? [...s.sizes.map((w) => `${s.src.replace(/\.webp$/,`-${w}.webp`)} ${w}w`), `${s.src} ${s.w}w`].join(', ') : undefined;

export function Building() {
  const entry = current ? BUILDING[current] : null;
  const p = entry ? projects.find((q) => q.slug === entry.slug) : null;
  if (!entry || !p) return null;
  const [lead, ...rest] = entry.screens;
  return (
    <section id="building" className="st-building" data-reveal aria-labelledby="st-building-title">
      <div className="st-building__head">
        <p className="st-building__now" data-r><span aria-hidden="true" /> Currently building</p>
        <h2 id="st-building-title" className="st-building__name" data-r>{entry.nameParts ? entry.nameParts.map((n, i) => <span key={n}>{i > 0 && <wbr />}{n}</span>) : p.title}</h2>
        {p.alias && <p className="st-meta" data-r>{p.alias}</p>}
        <p className="st-lead" data-r>{p.tagline}</p>
        <p className="st-body" data-r>{p.description}</p>
        <Links github={p.github} page={`/work/${p.slug}`} />
      </div>
      {/* no fade on the stage: an opacity reveal made all three screens upload to the GPU in one frame (measured) */}
      <div className="st-building__stage">
        <figure className="st-screen st-building__lead" data-tilt={-5} {...light}>
          <img src={lead.src} srcSet={srcset(lead)} sizes="(max-width: 899px) 100vw, 47vw" alt={lead.alt} width={lead.w} height={lead.h} loading="lazy" decoding="async" />
        </figure>
        {rest.map((s, i) => (
          <figure key={s.src} className={`st-screen st-building__more st-building__more--${i}`} data-tilt={i ? 6 : -4} {...light}>
            <img src={s.src} srcSet={srcset(s)} sizes="(max-width: 899px) 40vw, 22vw" alt={s.alt} width={s.w} height={s.h} loading="lazy" decoding="async" />
          </figure>
        ))}
      </div>
      <div className="st-building__lists">
        <div data-r>
          <h3 className="st-meta">Working, checked in the app</h3>
          <ul className="st-facts">{entry.working.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div data-r>
          <h3 className="st-meta">In progress</h3>
          <ul className="st-facts">{entry.inProgress.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div data-r>
          <h3 className="st-meta">Not verified yet</h3>
          <ul className="st-facts">{entry.notVerified.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>
      <p className="st-meta st-building__record" data-r>{entry.record} · as of {entry.asOf}</p>
    </section>
  );
}

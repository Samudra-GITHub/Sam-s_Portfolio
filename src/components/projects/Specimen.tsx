import type { CSSProperties } from 'react';
import type { Project } from '../../data/projects';

/**
 * Each project's specimen: a small animated scene drawn from what the project
 * actually does. It rests still and plays only while it is "live" (hovered,
 * focused or in the spotlight), so a wall of them costs nothing at rest.
 * Illustrations, not screenshots.
 */
export default function Specimen({ project, live = false, className = '' }: { project: Project; live?: boolean; className?: string }) {
  const { bg, fg, accent } = project.palette;
  const style = { '--s-bg': bg, '--s-fg': fg, '--s-acc': accent } as CSSProperties;
  return (
    <svg className={`spec spec--${project.slug} ${className}`} data-live={live || undefined} viewBox="0 0 200 150" style={style} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="150" fill={bg} />
      <Scene slug={project.slug} fg={fg} accent={accent} />
    </svg>
  );
}

function Scene({ slug, fg, accent }: { slug: string; fg: string; accent: string }) {
  switch (slug) {
    case 'tarang': // a record spinning under a waveform
      return (
        <g>
          <g className="spec-spin" style={{ transformOrigin: '70px 80px' }}>
            <circle cx="70" cy="80" r="46" fill={fg} />
            {[38, 30, 22].map((r) => <circle key={r} cx="70" cy="80" r={r} fill="none" stroke={accent} strokeOpacity=".35" />)}
            <circle cx="70" cy="80" r="12" fill={accent} />
            <rect x="68" y="36" width="4" height="10" fill={accent} />
          </g>
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} className="spec-bar" x={128 + i * 5} y={50} width="3" height="60" fill={fg} style={{ animationDelay: `${-i * 0.11}s`, transformOrigin: `${129.5 + i * 5}px 80px` }} />
          ))}
        </g>
      );
    case 'rinti-ai': // a question, a plan of five steps, an answer
      return (
        <g>
          <rect x="112" y="22" width="66" height="14" rx="7" fill={accent} />
          {['plan', 'search', 'read', 'check', 'write'].map((s, i) => (
            <g key={s} className="spec-step" style={{ animationDelay: `${i * 0.35}s` }}>
              <circle cx={30 + i * 34} cy="76" r="9" fill="none" stroke={fg} strokeWidth="1.5" />
              <circle cx={30 + i * 34} cy="76" r="4" fill={accent} />
            </g>
          ))}
          <line x1="39" y1="76" x2="157" y2="76" stroke={fg} strokeOpacity=".4" strokeDasharray="2 3" />
          <rect x="22" y="104" width="120" height="8" fill={fg} opacity=".85" />
          <rect x="22" y="118" width="84" height="8" fill={fg} opacity=".5" />
        </g>
      );
    case 'akasha-lens': // terrain under cloud, a sweep that reconstructs it
      return (
        <g>
          <path d="M0 90 C40 70 70 100 110 80 C150 60 170 90 200 76 L200 150 L0 150Z" fill="#6b7545" />
          <path d="M0 118 C50 104 90 126 130 112 C160 102 180 116 200 110 L200 150 L0 150Z" fill="#3f6fd1" />
          <g className="spec-cloud" fill="#f3f5f9" opacity=".92">
            <circle cx="70" cy="62" r="26" /><circle cx="100" cy="54" r="22" /><circle cx="128" cy="66" r="20" /><rect x="60" y="62" width="80" height="26" />
          </g>
          <rect className="spec-sweep" x="0" y="0" width="2" height="150" fill={accent} />
        </g>
      );
    case 'skycast': // a sun crossing, clouds drifting
      return (
        <g>
          <circle className="spec-sun" cx="60" cy="58" r="20" fill={accent} />
          <g className="spec-drift" fill="#fff">
            <circle cx="120" cy="86" r="18" /><circle cx="140" cy="80" r="15" /><circle cx="104" cy="92" r="12" /><rect x="100" y="86" width="56" height="18" rx="9" />
          </g>
          <line x1="20" y1="128" x2="180" y2="128" stroke={fg} strokeOpacity=".3" />
        </g>
      );
    case 'krama': // a sneaker sole turning on a plinth
      return (
        <g>
          <ellipse cx="100" cy="122" rx="62" ry="9" fill={fg} opacity=".18" />
          <g className="spec-tilt" style={{ transformOrigin: '100px 92px' }}>
            <path d="M46 98 C52 70 86 62 112 70 C130 76 146 80 158 92 C162 102 152 108 132 108 L58 108 C48 108 44 104 46 98Z" fill={fg} />
            <path d="M48 104 L156 104" stroke={accent} strokeWidth="5" strokeLinecap="round" />
            {[70, 86, 102, 118].map((x) => <line key={x} x1={x} y1="78" x2={x + 8} y2="90" stroke={accent} strokeWidth="2" />)}
          </g>
        </g>
      );
    case 'grama-sathi': // a voice waveform answering
      return (
        <g>
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} className="spec-wave" x={22 + i * 7.5} y={45} width="4" height="60" rx="2" fill={i % 5 === 2 ? accent : fg} style={{ animationDelay: `${-i * 0.07}s`, transformOrigin: `${24 + i * 7.5}px 75px` }} />
          ))}
        </g>
      );
    case 'noir-cafe': // latte art pours into the cup
      return (
        <g>
          <circle cx="100" cy="75" r="56" fill="#2a1e17" />
          <circle cx="100" cy="75" r="44" fill="#f3e9dc" />
          <circle cx="100" cy="75" r="38" fill={accent} />
          <path className="spec-pour" d="M100 105 C98 95 84 93 86 85 C88 77 98 80 100 76 C102 80 112 77 114 85 C116 93 102 95 100 105 M100 76 C99 70 90 68 92 62 C94 56 100 60 100 54 C100 60 106 56 108 62 C110 68 101 70 100 76" fill="none" stroke="#f3e9dc" strokeWidth="3" strokeLinecap="round" pathLength="1" />
        </g>
      );
    case 'prahari': // a mine's contours, one sensor alarming, the score rising
      return (
        <g>
          {[52, 40, 28, 16].map((r, i) => <ellipse key={r} cx="80" cy="78" rx={r * 1.15} ry={r * 0.8} fill="none" stroke={fg} strokeOpacity={0.3 + i * 0.15} />)}
          <circle cx="58" cy="58" r="3.5" fill={accent} />
          <circle className="spec-ping" cx="58" cy="58" r="3.5" fill="none" stroke={accent} style={{ transformOrigin: '58px 58px' }} />
          <rect x="146" y="30" width="34" height="90" fill="none" stroke={fg} strokeOpacity=".4" />
          <rect className="spec-fill" x="146" y="30" width="34" height="90" fill={accent} style={{ transformOrigin: '163px 120px' }} />
        </g>
      );
    case 'personal-portfolio': // this site: a tiny universe around a name
      return (
        <g>
          <g className="spec-spin" style={{ transformOrigin: '100px 75px' }}>
            <ellipse cx="100" cy="75" rx="80" ry="30" fill="none" stroke={fg} strokeOpacity=".5" strokeDasharray="2 4" />
            <circle cx="180" cy="75" r="7" fill={accent} />
            <circle cx="20" cy="75" r="5" fill="#ff5226" />
          </g>
          <text x="100" y="82" textAnchor="middle" fill={fg} fontFamily="var(--font-display)" fontWeight="800" fontSize="22" style={{ fontStretch: '125%' }}>SK</text>
        </g>
      );
    case 'niriksh-ai': // revenue line, an anomaly, the recovery
      return (
        <g>
          <path d="M14 112 L200 112" stroke={fg} strokeOpacity=".25" />
          <path className="spec-draw" d="M14 70 L40 64 L64 72 L86 60 L104 66 L118 116 L134 104 L152 80 L172 68 L196 62" fill="none" stroke={accent} strokeWidth="3" strokeLinejoin="round" pathLength="1" />
          <circle cx="118" cy="116" r="6" fill="none" stroke={fg} strokeWidth="1.5" />
        </g>
      );
    case 'orbit-os': // an OS shell: windows and a command palette
      return (
        <g>
          <rect x="18" y="22" width="92" height="64" fill={fg} opacity=".14" stroke={fg} strokeOpacity=".5" />
          <rect x="122" y="22" width="60" height="40" fill={fg} opacity=".14" stroke={fg} strokeOpacity=".5" />
          <rect x="122" y="70" width="60" height="58" fill={fg} opacity=".14" stroke={fg} strokeOpacity=".5" />
          <g className="spec-palette">
            <rect x="40" y="96" width="120" height="22" rx="4" fill={accent} />
            <rect x="50" y="104" width="50" height="6" fill="#15123a" opacity=".7" />
          </g>
        </g>
      );
    case 'the-waffle-house': // syrup over a waffle grid
      return (
        <g>
          <rect x="42" y="38" width="116" height="84" rx="10" fill={accent} />
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => <rect key={`${r}${c}`} x={50 + c * 22} y={46 + r * 19} width="16" height="13" rx="2" fill={fg} opacity=".18" />))}
          <path className="spec-pour" d="M60 30 C70 50 90 46 100 64 C108 78 126 72 138 92" fill="none" stroke="#7a3f12" strokeWidth="7" strokeLinecap="round" pathLength="1" />
        </g>
      );
    case 'catch-the-rocket': // the flight curve, apogee and descent
      return (
        <g>
          <path d="M14 130 L196 130" stroke={fg} strokeOpacity=".3" />
          <path className="spec-draw" d="M20 130 C60 10 110 10 130 70 L160 128" fill="none" stroke={accent} strokeWidth="3" pathLength="1" />
          <circle cx="92" cy="40" r="4" fill={fg} />
          <path d="M146 96 l6 -10 l6 10 z" fill={fg} opacity=".8" />
        </g>
      );
    case 'speed-of-numbers': // timing bars: int, float, double, fixed
      return (
        <g>
          {[30, 60, 110, 44, 80].map((w, i) => (
            <rect key={i} className="spec-grow" x="30" y={28 + i * 20} width={w + 30} height="11" fill={i === 2 ? accent : fg} opacity={i === 2 ? 1 : 0.7} style={{ animationDelay: `${i * 0.12}s`, transformOrigin: `30px ${33 + i * 20}px` }} />
          ))}
        </g>
      );
    case 'previous-portfolio': // a persistent 3D layer
      return (
        <g>
          {[0, 1, 2].map((i) => <rect key={i} className="spec-float" x={50 + i * 14} y={30 + i * 14} width="90" height="64" fill="none" stroke={i === 2 ? accent : fg} strokeOpacity={0.4 + i * 0.25} style={{ animationDelay: `${-i * 0.4}s` }} />)}
        </g>
      );
    case 'first-website': // plain HTML: a page outline
      return (
        <g>
          <rect x="54" y="20" width="92" height="110" fill="#fff" stroke={fg} />
          <rect x="64" y="32" width="50" height="8" fill={accent} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="64" y={50 + i * 12} width={70 - (i % 2) * 18} height="4" fill={fg} opacity=".5" />)}
          <text className="spec-blink" x="64" y="122" fill={fg} fontFamily="var(--font-mono)" fontSize="9">&lt;h1&gt;</text>
        </g>
      );
    default:
      return <circle cx="100" cy="75" r="30" fill={accent} />;
  }
}

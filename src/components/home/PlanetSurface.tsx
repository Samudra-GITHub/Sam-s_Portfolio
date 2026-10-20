import type { WorldId, WorldPalette } from '../../data/projects';

/**
 * Each world's planet carries a mark of what the project is, drawn in its own
 * enamel: grooves for a music player, stacked sources for a research engine,
 * terrain under cloud for cloud removal, a sun for weather, sole lines for a
 * sneaker store, a voice waveform, a latte rosetta, a mine's contours, and a
 * tiny orrery for this site. Illustrations, not screenshots.
 */
export default function PlanetSurface({ world, palette }: { world: WorldId; palette: WorldPalette }) {
  const { bg, fg, accent } = palette;
  const id = `pl-${world}`;
  return (
    <svg className="planet-surface" viewBox="-50 -50 100 100" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <circle r="49" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <circle r="50" fill={bg} />
        <Motif world={world} fg={fg} accent={accent} />
        {/* the terminator: a flat second tone, the same enamel shading as the rest of the site */}
        <path d="M 0 -50 A 50 50 0 0 1 0 50 A 26 50 0 0 0 0 -50 Z" fill="rgb(8 28 74 / 0.26)" />
      </g>
      <circle r="49" fill="none" stroke="var(--line)" strokeWidth="1.4" />
    </svg>
  );
}

function Motif({ world, fg, accent }: { world: WorldId; fg: string; accent: string }) {
  switch (world) {
    case 'tarang':
      return (
        <g fill="none" stroke={fg} strokeOpacity="0.55" strokeWidth="1.1">
          {[40, 33, 26, 19].map((r) => (
            <circle key={r} r={r} />
          ))}
          <circle r="11" fill={accent} stroke="none" />
          <circle r="2.4" fill={fg} stroke="none" />
        </g>
      );
    case 'rinti':
      return (
        <g>
          <rect x="-30" y="-24" width="46" height="12" fill={accent} />
          <rect x="-22" y="-6" width="50" height="12" fill={fg} opacity="0.85" />
          <rect x="-34" y="12" width="40" height="12" fill={fg} opacity="0.5" />
        </g>
      );
    case 'akasha':
      return (
        <g>
          <path d="M-50 10 C-30 -6 -14 8 0 -4 C 14 -16 30 2 50 -8 L 50 50 L -50 50 Z" fill="#6b7545" />
          <path d="M-50 26 C-24 16 -6 30 14 20 C 30 12 40 24 50 18 L 50 50 L -50 50 Z" fill="#3f6fd1" />
          <g fill="#f3f5f9" opacity="0.92">
            <circle cx="-18" cy="-18" r="13" />
            <circle cx="-4" cy="-22" r="10" />
            <circle cx="8" cy="-14" r="9" />
          </g>
          <rect x="18" y="-50" width="1.4" height="100" fill={accent} />
        </g>
      );
    case 'skycast':
      return (
        <g>
          <circle cx="-10" cy="-8" r="17" fill={accent} />
          <g fill="#ffffff">
            <circle cx="8" cy="12" r="12" />
            <circle cx="20" cy="8" r="10" />
            <circle cx="-4" cy="16" r="8" />
          </g>
        </g>
      );
    case 'krama':
      return (
        <g stroke={fg} strokeWidth="2.6" strokeLinecap="round" opacity="0.85">
          {[-24, -12, 0, 12, 24].map((d) => (
            <line key={d} x1={-40} y1={d + 18} x2={40} y2={d - 18} />
          ))}
          <circle cx="16" cy="-16" r="9" fill={accent} stroke="none" />
        </g>
      );
    case 'grama':
      return (
        <g fill={accent}>
          {[6, 14, 24, 34, 22, 30, 16, 26, 10, 18, 8].map((h, i) => (
            <rect key={i} x={-33 + i * 6} y={-h / 2} width="3.4" height={h} rx="1.7" />
          ))}
        </g>
      );
    case 'noir':
      return (
        <g>
          <circle r="34" fill="#5a3a24" />
          <circle r="30" fill={accent} />
          <path d="M0 22 C -2 14 -16 12 -13 4 C -10 -4 -1 0 0 -5 C 1 0 10 -4 13 4 C 16 12 2 14 0 22 M 0 -5 C -1 -11 -10 -12 -7 -18 C -5 -23 0 -19 0 -24 C 0 -19 5 -23 7 -18 C 10 -12 1 -11 0 -5" fill="none" stroke={fg} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case 'prahari':
      return (
        <g fill="none" stroke={fg} strokeOpacity="0.6" strokeWidth="1">
          {[34, 26, 18, 10].map((r, i) => (
            <ellipse key={r} rx={r * 1.08} ry={r * 0.82} transform={`rotate(${i * 9 - 12})`} />
          ))}
          <circle cx="-14" cy="-12" r="4" fill={accent} stroke="none" />
        </g>
      );
    case 'portfolio':
      return (
        <g fill="none" stroke={fg} strokeOpacity="0.7" strokeWidth="1">
          <ellipse rx="36" ry="13" />
          <ellipse rx="24" ry="8.5" strokeDasharray="2 3" />
          <circle r="6" fill={fg} stroke="none" />
          <circle cx="30" cy="-7" r="4" fill={accent} stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

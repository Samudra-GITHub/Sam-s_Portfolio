import type { CSSProperties } from 'react';
import type { Project } from '../../data/projects';

/**
 * A project drawn as a body on its own ring, in its own enamel. This is what a
 * project without an interactive world looks like: a plate from the same
 * instrument, never a fake screenshot. The angle of the body comes from the
 * slug, so every plate is different and stable between visits.
 */
export default function ProjectPlate({ project, className = '' }: { project: Project; className?: string }) {
  let h = 0;
  for (const c of project.slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = (h % 360) * (Math.PI / 180);
  const R = 74;
  const bx = Math.cos(a) * R;
  const by = Math.sin(a) * R * 0.6;
  const style = { '--pl-bg': project.palette.bg, '--pl-fg': project.palette.fg, '--pl-acc': project.palette.accent } as CSSProperties;
  return (
    <svg className={`plate ${className}`} viewBox="-100 -70 200 140" style={style} aria-hidden="true">
      <ellipse rx="96" ry="57.6" className="plate-rim" />
      <ellipse rx={R} ry={R * 0.6} className="plate-orbit" />
      <ellipse rx="44" ry="26.4" className="plate-orbit plate-orbit--inner" />
      <circle r="7" className="plate-sun" />
      <g transform={`translate(${bx.toFixed(2)} ${by.toFixed(2)})`}>
        <circle r="17" className="plate-body" />
        <circle r="6.5" cx="6" cy="-5.5" className="plate-moon" />
      </g>
    </svg>
  );
}

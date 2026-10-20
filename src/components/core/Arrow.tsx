/**
 * The site's one arrow, drawn: a 1.6px stroke that matches the hairline
 * system, sized to the text it sits in. "out" is the external-link arrow.
 */
type Dir = 'right' | 'left' | 'up' | 'down' | 'out';

const ROT: Record<Exclude<Dir, 'out'>, number> = { right: 0, down: 90, left: 180, up: 270 };

export default function Arrow({ dir = 'right', className = '' }: { dir?: Dir; className?: string }) {
  return (
    <svg className={`arrow ${className}`} viewBox="0 0 16 16" width="0.85em" height="0.85em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" aria-hidden="true">
      {dir === 'out' ? (
        <path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" />
      ) : (
        <g transform={`rotate(${ROT[dir]} 8 8)`}>
          <path d="M2.5 8h10.5M9 4l4 4-4 4" />
        </g>
      )}
    </svg>
  );
}

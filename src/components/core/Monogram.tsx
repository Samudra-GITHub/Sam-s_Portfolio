/**
 * The studio mark: SK engraved on a white disc, one ring around it with a
 * single lime body, a one-world orrery. It is the centre of the hero
 * instrument, the brand in the nav and the favicon (public/favicon.svg).
 */
export default function Monogram({ size = 28, className = '', title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      className={`monogram ${className}`}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <circle r="46" className="monogram-ring" />
      <circle r="35" className="monogram-disc" />
      <text y="9.5" textAnchor="middle" className="monogram-type">
        SK
      </text>
      <circle cx="32.5" cy="-32.5" r="6.5" className="monogram-body" />
    </svg>
  );
}

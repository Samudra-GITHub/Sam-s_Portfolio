/**
 * A small engraving of the hero's instrument, used wherever one world is on
 * stage: every ring dashed, this world's ring solid with its body on it.
 * It tells you where you are without a section number.
 */
interface Props {
  index: number;
  total: number;
  className?: string;
}

const TILT = 0.6;

export default function RingLocator({ index, total, className = '' }: Props) {
  const r = (i: number) => 9 + i * 6.2;
  const outer = r(total - 1);
  // each world sits at its own angle, so the locator differs per chapter
  const a = -0.5 + index * 2.39996;
  return (
    <svg className={`ring-locator ${className}`} viewBox={`${-outer - 6} ${-outer * TILT - 6} ${(outer + 6) * 2} ${(outer * TILT + 6) * 2}`} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <ellipse key={i} rx={r(i)} ry={r(i) * TILT} className="ring-locator-orbit" data-on={i === index} />
      ))}
      <circle r="3.4" className="ring-locator-sun" />
      <circle cx={r(index) * Math.cos(a)} cy={r(index) * TILT * Math.sin(a)} r="3.6" className="ring-locator-body" />
    </svg>
  );
}

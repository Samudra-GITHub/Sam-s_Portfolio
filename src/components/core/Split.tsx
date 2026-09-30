import type { ElementType } from 'react';

interface SplitProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** "words" wraps each word in a mask, "chars" each letter */
  by?: 'words' | 'chars';
}

/**
 * Renders text as masked pieces (.split-inner) that a GSAP timeline can lift
 * into place. The full string stays on the wrapper as its accessible name.
 */
export default function Split({ text, as: Tag = 'span', className = '', by = 'words' }: SplitProps) {
  const words = text.split(' ');
  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      {words.map((word, wi) => (
        <span key={wi} className="split-word" aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {by === 'chars' ? (
            Array.from(word).map((c, ci) => (
              <span key={ci} className="split-mask">
                <span className="split-inner">{c}</span>
              </span>
            ))
          ) : (
            <span className="split-mask">
              <span className="split-inner">{word}</span>
            </span>
          )}
          {wi < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}

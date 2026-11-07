/**
 * Kinetic type: a heading set as words of separate characters, so the reel can move each one.
 * Screen readers get the plain text from aria-label; the pieces are hidden from them.
 * mode: rise (characters come up out of their word), drop (fall in with weight), whip (words streak in from the sides).
 * A newline in the text becomes a line break. useStudioMotion (motion.ts) plays them.
 */
export function Kinetic({ text, as: Tag = 'span', mode = 'rise', className = '', id }: { text: string; as?: 'h1' | 'h2' | 'h3' | 'span' | 'p'; mode?: 'rise' | 'drop' | 'whip'; className?: string; id?: string }) {
  const lines = text.split('\n');
  return (
    <Tag id={id} className={`${className} st-k st-k--${mode}`} data-kinetic={mode} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true">
          {li > 0 && <br />}
          {line.split(' ').map((w, wi) => (
            <span key={wi}>
              {wi > 0 && ' '}
              <span className="st-k__w">
                {[...w].map((c, ci) => (
                  <span key={ci} className="st-k__c">{c}</span>
                ))}
              </span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

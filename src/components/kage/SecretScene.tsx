import { useEffect, useRef } from 'react';
import { KageLandingPage } from '@designcodeio/threeui/components/KageLandingPage';
import '@designcodeio/threeui/style.css';

/**
 * The authored Kage landing page, unmodified: same component, same props.
 * The iframe it renders loads /landing-pages/kage.html from public/
 * (synced and hash-verified by scripts/sync-kage.mjs).
 * This wrapper only adds the way back.
 */
export default function SecretScene({ onClose }: { onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    // Once the pointer or focus is inside the iframe, Escape never reaches this
    // window. The frame is same-origin, so listen inside it too.
    const root = rootRef.current!;
    const attach = () => {
      const frame = root.querySelector('iframe');
      try {
        frame?.contentWindow?.addEventListener('keydown', onKey);
      } catch {
        /* cross-origin: the on-screen button still works */
      }
    };
    root.addEventListener('load', attach, true);
    attach();

    return () => {
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('load', attach, true);
      try {
        root.querySelector('iframe')?.contentWindow?.removeEventListener('keydown', onKey);
      } catch {
        /* frame already gone */
      }
    };
  }, [onClose]);

  return (
    <div ref={rootRef} className="kage-scene" role="dialog" aria-modal="true" aria-label="Kage, a hidden scene">
      <button ref={closeRef} type="button" className="kage-return mono" onClick={onClose}>
        <span aria-hidden="true">&larr;</span> Back to Samudra
        <kbd>Esc</kbd>
      </button>

      <div className="kage-frame">
        <KageLandingPage
          headingFont="onest"
          bodyFont="onest"
          headingWeight="400"
          bodyWeight="300"
          primaryColor="#e0231c"
          headingSize={46}
          bodySize={17}
          headingLetterSpacing={-0.012}
        />
      </div>
    </div>
  );
}

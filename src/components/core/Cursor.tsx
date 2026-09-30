import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { initPointer, pointer } from '../../lib/pointer';
import { useFinePointer } from '../../lib/runtime';
import './cursor.css';

/**
 * The cursor is a tool, not decoration: one arrow that looks like one of the
 * site's buttons (lime fill, 2px ink outline, hard offset shadow). The tip sits
 * exactly on the pointer. Its state follows data-cursor="kind" and
 * data-cursor-label="text" on whatever it is over:
 * default, link, project, play, drag, image, scroll, cta.
 * State lives in DOM attributes so nothing re-renders while it moves.
 */
const DEFAULT_LABELS: Record<string, string> = {
  project: 'VIEW',
  play: 'PLAY',
  drag: 'DRAG',
  image: 'LOOK',
  scroll: '↓',
  cta: 'SAY HI',
};

export default function Cursor() {
  const fine = useFinePointer();
  return fine ? <CursorTool /> : null;
}

function CursorTool() {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    initPointer();
    const root = rootRef.current!;
    const label = labelRef.current!;
    const html = document.documentElement;

    const setKind = (kind: string, text: string) => {
      if (root.dataset.kind !== kind) root.dataset.kind = kind;
      if (label.textContent !== text) label.textContent = text;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      html.classList.add('has-cursor');
      root.dataset.hidden = 'false';
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest<HTMLElement>('[data-cursor], a[href], button, [role="button"], summary, label');
      if (!el) return setKind('default', '');
      const kind = el.dataset.cursor ?? 'link';
      setKind(kind, el.dataset.cursorLabel ?? DEFAULT_LABELS[kind] ?? '');
    };
    const onDown = () => (root.dataset.down = 'true');
    const onUp = () => (root.dataset.down = 'false');
    const onLeave = () => (root.dataset.hidden = 'true');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      html.classList.remove('has-cursor');
    };
  }, []);

  return (
    <div ref={rootRef} className="cursor" data-kind="default" data-hidden="true" data-down="false" aria-hidden="true">
      <motion.div className="cursor-pos" style={{ x: pointer.x, y: pointer.y }}>
        <svg className="cursor-arrow" width="26" height="30" viewBox="0 0 26 30">
          <path className="cursor-shadow" d="M2 2 L2 24 L8 18.5 L12.5 28 L17 26 L12.6 16.8 L21 16.5 Z" />
          <path className="cursor-fill" d="M2 2 L2 24 L8 18.5 L12.5 28 L17 26 L12.6 16.8 L21 16.5 Z" />
        </svg>
        <span className="cursor-label mono" ref={labelRef} />
      </motion.div>
    </div>
  );
}

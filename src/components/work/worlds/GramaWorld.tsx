import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { useTicker } from '../../../lib/hooks';
import { useScene } from '../scene';
import WaveCanvas from './WaveCanvas';
import './worlds.css';
import './grama.css';

/**
 * GRAMA SATHI: voice, in Hindi.
 * The real app takes spoken Hindi, transcribes it, thinks, and answers aloud,
 * so this world is one loop of that: idle, listening, replying. Scroll plays
 * the loop on its own; pressing and holding the microphone takes over. The
 * waveform swells with the voice and the big Devanagari word follows it.
 */
type Mode = 'idle' | 'listen' | 'reply';

const TARGET: Record<Mode, number> = { idle: 0.16, listen: 0.95, reply: 0.62 };
const CAPTION: Record<Mode, string> = {
  idle: '',
  listen: 'सुन रहा हूँ',
  reply: 'मैं आपकी क्या मदद कर सकता हूँ?',
};

const auto = (p: number): Mode => (p < 0.3 ? 'idle' : p < 0.6 ? 'listen' : p < 0.94 ? 'reply' : 'idle');

export default function GramaWorld() {
  const { progress, visible } = useScene();
  const [holding, setHolding] = useState(false);
  const [scrolled, setScrolled] = useState<Mode>(auto(progress.get()));
  const level = useRef(TARGET.idle);
  const mode: Mode = holding ? 'listen' : scrolled;

  // Devanagari face loads only when this world mounts
  useEffect(() => {
    void import('@fontsource/noto-sans-devanagari/devanagari-800.css');
    void import('@fontsource/noto-sans-devanagari/devanagari-500.css');
  }, []);

  useMotionValueEvent(progress, 'change', (p) => {
    const next = auto(p);
    setScrolled((cur) => (cur === next ? cur : next));
  });

  useTicker((t, dt) => {
    const target = TARGET[mode] * (mode === 'idle' ? 1 : 0.9 + 0.1 * Math.sin(t * 9));
    level.current += (target - level.current) * (1 - Math.exp(-dt * 6));
  }, visible);

  const press = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setHolding(true);
  };
  const release = () => setHolding(false);
  const keyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setHolding(true);
    }
  };
  const keyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') setHolding(false);
  };
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="world gw" data-mode={mode}>
      <div className="gw-words" aria-hidden="true" lang="hi">
        <span className="gw-word gw-w-idle">नमस्ते</span>
        <span className="gw-word gw-w-listen">बोलिए</span>
        <span className="gw-word gw-w-reply">ग्राम साथी</span>
      </div>

      <ol className="gw-pipe mono" aria-hidden="true">
        <li>voice</li>
        <li>text</li>
        <li>ai</li>
        <li>voice</li>
      </ol>

      <div className="gw-wave" aria-hidden="true">
        <WaveCanvas bars={56} color="#111215" accent="#ff5226" playhead={progress} amp={() => level.current} mirror speed={4} fill={0.55} />
      </div>

      <p className="gw-caption" lang="hi" aria-live="polite">
        {CAPTION[mode]}
      </p>

      <div className="gw-mic-wrap">
        <button
          type="button"
          className="gw-mic"
          data-cursor="play"
          data-cursor-label="HOLD"
          aria-pressed={holding}
          aria-label="Hold to speak, a demo of the Hindi voice loop"
          onPointerDown={press}
          onPointerUp={release}
          onPointerCancel={release}
          onKeyDown={keyDown}
          onKeyUp={keyUp}
          onBlur={release}
          onClick={stop}
        >
          <span className="gw-ripple" aria-hidden="true" />
          <span className="gw-ripple gw-ripple-2" aria-hidden="true" />
          <span className="gw-glyph" aria-hidden="true" />
        </button>
        <span className="mono gw-hint" aria-hidden="true">
          hold to speak
        </span>
      </div>
    </div>
  );
}

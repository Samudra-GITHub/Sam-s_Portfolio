import { useEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import { gsap } from '../../../lib/gsap';
import { isPaused } from '../../../lib/runtime';
import { useScene } from '../scene';

interface Props {
  bars?: number;
  color: string;
  /** bars behind the playhead take this colour */
  accent?: string;
  /** 0..1 playhead position; omit for a single colour */
  playhead?: MotionValue<number>;
  /** current loudness 0..1, read every frame */
  amp: () => number;
  /** grow from the centre line in both directions */
  mirror?: boolean;
  /** how fast the shape shimmers */
  speed?: number;
  /** bar width as a share of its slot */
  fill?: number;
  className?: string;
}

/**
 * A waveform on a plain 2D canvas: one draw per frame, only while the scene is
 * near the viewport. Bar shapes come from summed sines, so they look organic
 * without any data.
 */
export default function WaveCanvas({ bars = 40, color, accent, playhead, amp, mirror = false, speed = 1.2, fill = 0.62, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { visible, reduce } = useScene();
  const ampRef = useRef(amp);
  useEffect(() => {
    ampRef.current = amp;
  });

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const shape = (i: number, t: number) => {
      const x = i / bars;
      const base = 0.35 + 0.65 * Math.abs(Math.sin(x * 9.3 + 1.7) * 0.55 + Math.sin(x * 23.1) * 0.3 + Math.sin(x * 3.1 + 0.4) * 0.4);
      const wob = 0.72 + 0.28 * Math.sin(t * speed + i * 0.55);
      return Math.min(1, base * wob);
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const slot = w / bars;
      const bw = Math.max(1.5, slot * fill);
      const level = ampRef.current();
      const ph = playhead ? playhead.get() : 1;
      for (let i = 0; i < bars; i++) {
        const v = shape(i, t) * level;
        const bh = Math.max(3, v * (mirror ? h * 0.5 : h));
        ctx.fillStyle = accent && i / bars <= ph ? accent : color;
        const x = i * slot + (slot - bw) / 2;
        if (mirror) ctx.fillRect(x, h / 2 - bh, bw, bh * 2);
        else ctx.fillRect(x, h - bh, bw, bh);
      }
    };

    let first = true;
    const tick = (time: number) => {
      if (isPaused()) return;
      if (reduce) {
        if (first) {
          draw(1.3);
          first = false;
        }
        return;
      }
      if (!visible.current) return;
      draw(time);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
    };
  }, [bars, color, accent, playhead, mirror, speed, fill, reduce, visible]);

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

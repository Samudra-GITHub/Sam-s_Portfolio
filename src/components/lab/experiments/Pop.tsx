import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTicker, useVisibleRef } from '../../../lib/hooks';
import { useReducedMotion } from '../../../lib/runtime';

/**
 * POP: every button should feel like a button. The whole panel is one: it
 * presses in under the pointer, and each click throws a burst of shapes that
 * tumble under gravity. Also reachable by keyboard (Enter or Space).
 */
interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  s: number;
  shape: 0 | 1 | 2 | 3;
  c: string;
  life: number;
}

const COLORS = ['#d8f827', '#ff5226', '#1e3ae8', '#111215', '#fdf9f1'];

export default function Pop() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const dpr = useRef(1);
  const size = useRef({ w: 0, h: 0 });
  const visible = useVisibleRef(btnRef);
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);

  const scale = useMotionValue(1);
  const wordScale = useSpring(scale, { stiffness: 420, damping: 12 });
  const rot = useMotionValue(0);
  const wordRot = useSpring(rot, { stiffness: 300, damping: 14 });

  useEffect(() => {
    const btn = btnRef.current!;
    const canvas = canvasRef.current!;
    const resize = () => {
      dpr.current = Math.min(window.devicePixelRatio || 1, 2);
      size.current = { w: btn.clientWidth, h: btn.clientHeight };
      canvas.width = Math.round(size.current.w * dpr.current);
      canvas.height = Math.round(size.current.h * dpr.current);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(btn);
    return () => ro.disconnect();
  }, []);

  const burst = (x: number, y: number) => {
    setCount((c) => c + 1);
    scale.set(1.3);
    rot.set((Math.random() - 0.5) * 16);
    window.setTimeout(() => {
      scale.set(1);
      rot.set(0);
    }, 70);
    if (reduce) return;
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 160 + Math.random() * 520;
      parts.current.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 260,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 14,
        s: 7 + Math.random() * 12,
        shape: Math.floor(Math.random() * 4) as P['shape'],
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1.4 + Math.random() * 0.8,
      });
    }
    if (parts.current.length > 240) parts.current.splice(0, parts.current.length - 240);
  };

  useTicker((_, dt) => {
    const list = parts.current;
    const canvas = canvasRef.current;
    if (!canvas || list.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const { w, h } = size.current;
    ctx.setTransform(dpr.current, 0, 0, dpr.current, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0 || p.y > h + 40) {
        list.splice(i, 1);
        continue;
      }
      p.vy += 1500 * dt;
      p.vx *= 0.992;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.c;
      ctx.strokeStyle = '#111215';
      ctx.lineWidth = 2;
      const s = p.s;
      if (p.shape === 0) {
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.strokeRect(-s / 2, -s / 2, s, s);
      } else if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.shape === 2) {
        ctx.beginPath();
        ctx.moveTo(0, -s / 1.6);
        ctx.lineTo(s / 1.6, s / 2);
        ctx.lineTo(-s / 1.6, s / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(-s / 2, -s / 6, s, s / 3);
        ctx.fillRect(-s / 6, -s / 2, s / 3, s);
      }
      ctx.restore();
    }
    if (list.length === 0) ctx.clearRect(0, 0, w, h);
  }, visible);

  return (
    <button
      ref={btnRef}
      type="button"
      className="pop"
      aria-label={`Pop: burst confetti. ${count} pops so far.`}
      data-cursor="play"
      data-cursor-label="POP"
      onClick={(e) => {
        const r = btnRef.current!.getBoundingClientRect();
        const fromKeyboard = e.detail === 0;
        burst(fromKeyboard ? r.width / 2 : e.clientX - r.left, fromKeyboard ? r.height / 2 : e.clientY - r.top);
      }}
    >
      <canvas ref={canvasRef} className="pop-canvas" aria-hidden="true" />
      <motion.span className="pop-word font-display" style={{ scale: wordScale, rotate: wordRot }} aria-hidden="true">
        POP
      </motion.span>
      <span className="pop-count mono" aria-hidden="true">
        {String(count).padStart(3, '0')} pops
      </span>
    </button>
  );
}

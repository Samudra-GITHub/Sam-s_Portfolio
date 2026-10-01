import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { isPaused, matches, MQ, useReducedMotion } from '../../lib/runtime';

export type UniformValue = number | number[];

interface Props {
  /** GLSL ES 1.00 fragment body. `uTime` (s), `uRes` (canvas px) and `uPx` (canvas px per CSS px) are always provided. */
  frag: string;
  /** Called each drawn frame. Return the uniforms declared in `frag`. */
  uniforms?: (time: number) => Record<string, UniformValue>;
  className?: string;
  /** Cap on devicePixelRatio. Compact (phone) screens are held to ~1.1: the shaders are flat-shaded, so fill-rate matters more than sharpness. */
  maxDpr?: number;
  /** Draw a single static frame (used for reduced motion). */
  frozen?: boolean;
  onUnsupported?: () => void;
  rootMargin?: string;
}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const HEAD = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float uTime; uniform vec2 uRes; uniform float uPx;
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || 'shader compile failed');
  }
  return sh;
}

/**
 * A fullscreen fragment shader on raw WebGL.
 * Lifecycle: renders only while near the viewport and the tab is visible,
 * caps DPR, follows its container size, survives context loss, and releases
 * the GPU context on unmount.
 */
export default function ShaderCanvas({ frag, uniforms, className, maxDpr = 1.5, frozen, onUnsupported, rootMargin = '15% 0px' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef(uniforms);
  const reduce = useReducedMotion();
  const still = frozen ?? reduce;

  useEffect(() => {
    uniformsRef.current = uniforms;
  });

  useEffect(() => {
    const wrap = wrapRef.current!;
    // A fresh canvas per mount: a released context can never be re-acquired
    // from the same element (React StrictMode mounts effects twice in dev).
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    wrap.appendChild(canvas);
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    const locations = new Map<string, WebGLUniformLocation | null>();
    let visible = false;
    let needsFrame = true;
    let lost = false;
    let start = performance.now();

    const build = () => {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
      if (!gl) throw new Error('WebGL unavailable');
      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, HEAD + frag);
      program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link failed');
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      locations.clear();
      resize();
    };

    const uniformLoc = (name: string) => {
      if (!locations.has(name)) locations.set(name, gl!.getUniformLocation(program!, name));
      return locations.get(name) ?? null;
    };

    const setUniform = (name: string, value: UniformValue) => {
      const l = uniformLoc(name);
      if (!l || !gl) return;
      if (typeof value === 'number') gl.uniform1f(l, value);
      else if (value.length === 2) gl.uniform2fv(l, value);
      else if (value.length === 3) gl.uniform3fv(l, value);
      else gl.uniform4fv(l, value);
    };

    function resize() {
      if (!gl) return;
      const compact = matches(MQ.compact);
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? Math.min(maxDpr, 1.1) : maxDpr);
      const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
      const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      needsFrame = true;
    }

    try {
      build();
    } catch (err) {
      console.warn('[ShaderCanvas]', err);
      canvas.remove();
      onUnsupported?.();
      return;
    }

    const draw = (time: number) => {
      if (!gl || lost) return;
      setUniform('uTime', time);
      setUniform('uRes', [canvas.width, canvas.height]);
      setUniform('uPx', canvas.width / Math.max(1, wrap.clientWidth));
      const u = uniformsRef.current?.(time);
      if (u) for (const key in u) setUniform(key, u[key]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = () => {
      if (lost || isPaused()) return;
      if (still) {
        if (needsFrame && visible) {
          draw(2.4);
          needsFrame = false;
        }
        return;
      }
      if (!visible) return;
      draw((performance.now() - start) / 1000);
      needsFrame = false;
    };
    gsap.ticker.add(tick);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) needsFrame = true;
    }, { rootMargin });
    io.observe(wrap);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
    };
    const onRestored = () => {
      lost = false;
      start = performance.now();
      try {
        build();
      } catch (err) {
        console.warn('[ShaderCanvas] restore failed', err);
        onUnsupported?.();
      }
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (gl) {
        if (program) gl.deleteProgram(program);
        if (buffer) gl.deleteBuffer(buffer);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      canvas.remove();
    };
  }, [frag, maxDpr, onUnsupported, rootMargin, still]);

  return <div ref={wrapRef} className={className} style={{ position: 'absolute', inset: 0 }} />;
}

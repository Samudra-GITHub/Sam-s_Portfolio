import type * as THREE from 'three';

/**
 * Development-only performance readout. Open the site with `?perf` under
 * `npm run dev`: FPS, frame time, draw calls, triangles, geometries, textures,
 * quality tier and GPU. Never shipped to visitors (the call sites check
 * import.meta.env.DEV). The same numbers are on window.__perf for scripts.
 */
export interface PerfStats {
  fps: number;
  frameMs: number;
  p95Ms: number;
  calls: number;
  tris: number;
  geometries: number;
  textures: number;
  tier: string;
  gpu: string;
}

export const perfEnabled = () => import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('perf');

export function createPerfMonitor(gl: THREE.WebGLRenderer, tier: () => string) {
  const times: number[] = [];
  let last = performance.now();
  let shown = last;
  let gpu = '';
  try {
    const ctx = gl.getContext();
    const ext = ctx.getExtension('WEBGL_debug_renderer_info');
    gpu = String(ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER));
  } catch {
    gpu = 'unknown';
  }
  const el = document.createElement('pre');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText =
    'position:fixed;left:8px;bottom:8px;z-index:9999;margin:0;padding:8px 10px;font:11px/1.35 ui-monospace,monospace;color:#d8f7e8;background:rgb(10 20 18/0.82);border-radius:6px;pointer-events:none;white-space:pre';
  document.body.appendChild(el);
  const stats: PerfStats = { fps: 0, frameMs: 0, p95Ms: 0, calls: 0, tris: 0, geometries: 0, textures: 0, tier: '', gpu };
  (window as unknown as { __perf: PerfStats }).__perf = stats;

  return {
    /** call once per frame, after rendering (gl.info.autoReset must be false, reset at frame start) */
    frame() {
      const now = performance.now();
      times.push(now - last);
      last = now;
      if (times.length > 120) times.shift();
      if (now - shown < 250) return;
      shown = now;
      const sorted = [...times].sort((a, b) => a - b);
      const avg = times.reduce((s, t) => s + t, 0) / times.length;
      Object.assign(stats, {
        fps: Math.round(1000 / avg),
        frameMs: +avg.toFixed(1),
        p95Ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
        calls: gl.info.render.calls,
        tris: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        tier: tier(),
      });
      el.textContent = `${stats.fps} fps  ${stats.frameMs} ms  p95 ${stats.p95Ms} ms\n${stats.calls} calls  ${(stats.tris / 1e3).toFixed(0)}k tris\n${stats.geometries} geo  ${stats.textures} tex  tier ${stats.tier}\n${gpu.slice(0, 60)}`;
    },
    dispose() {
      el.remove();
    },
  };
}

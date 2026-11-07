/**
 * Study 04: a field of contour lines the pointer pushes aside. One small WebGL context with a single fragment shader.
 * It draws only while it is on screen and the tab is visible; reduced motion gets one still frame.
 */
const VERT = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;
const FRAG = `
precision mediump float;
uniform vec2 r;   // canvas size in pixels
uniform float t;  // seconds
uniform vec3 p;   // pointer x, y in pixels, and how hard it pushes (0 to 1)
void main() {
  vec2 uv = gl_FragCoord.xy / r.y;
  vec2 d = uv - p.xy / r.y;
  float g = exp(-dot(d, d) * 14.0) * p.z;
  // the field: slow swells, then the pointer's push along the line out from it
  vec2 w = uv + normalize(d + 1e-4) * g * 0.16;
  float h = w.y * 46.0 + sin(w.x * 2.6 + t * 0.35) * 2.2 + sin(w.x * 7.0 - t * 0.2) * 0.4;
  float line = 1.0 - smoothstep(0.0, 0.09 + g * 0.05, abs(fract(h) - 0.5) - 0.38);
  vec3 ground = vec3(0.090, 0.098, 0.114);
  vec3 ink = mix(vec3(0.33, 0.42, 0.98), vec3(0.96, 0.95, 0.93), clamp(g * 1.4, 0.0, 1.0));
  gl_FragColor = vec4(mix(ground, ink, line * (0.55 + g * 0.45)), 1.0);
}`;

export function createField(canvas: HTMLCanvasElement, { reduced }: { reduced: boolean }) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl || gl.isContextLost()) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uP = gl.getUniformLocation(prog, 'p');

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, push: 0, target: 0 };
  let raf = 0, onScreen = false, start = performance.now();
  const size = () => {
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  const draw = (now: number) => {
    size();
    // the pointer eases toward where it is, and its push swells and fades rather than switching
    ptr.x += (ptr.tx - ptr.x) * 0.18;
    ptr.y += (ptr.ty - ptr.y) * 0.18;
    ptr.push += (ptr.target - ptr.push) * 0.08;
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, reduced ? 0 : (now - start) / 1000);
    gl.uniform3f(uP, ptr.x, ptr.y, ptr.push);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = (now: number) => {
    draw(now);
    raf = onScreen && !document.hidden ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => {
    if (!raf && onScreen && !document.hidden && !reduced) raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (reduced) draw(start);
    else wake();
  });
  io.observe(canvas);
  const move = (e: PointerEvent) => {
    const b = canvas.getBoundingClientRect();
    ptr.tx = (e.clientX - b.left) * dpr;
    ptr.ty = (b.bottom - e.clientY) * dpr;
    if (ptr.target === 0) {
      ptr.x = ptr.tx;
      ptr.y = ptr.ty;
    }
    ptr.target = 1;
    if (reduced) {
      ptr.push = 1;
      ptr.x = ptr.tx;
      ptr.y = ptr.ty;
      draw(start);
    }
  };
  const leave = () => {
    ptr.target = 0;
    if (reduced) {
      ptr.push = 0;
      draw(start);
    }
  };
  const vis = () => wake();
  const box = canvas.parentElement!;
  box.addEventListener('pointermove', move);
  box.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', vis);
  start = performance.now();
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    box.removeEventListener('pointermove', move);
    box.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', vis);
    // free what this run made, but keep the context: React may mount the study again on the same canvas
    gl.deleteBuffer(buf);
    gl.deleteProgram(prog);
  };
}

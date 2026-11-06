import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/** The painted finish: Kuwahara brushwork (optional), output transform, colour grade with vignette and grain. */
export function createPainter(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, opts: { paint: boolean; low: boolean }) {
  // ---------------- the painted finish ----------------
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: opts.low ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const VS = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  if (opts.paint) {
    // Kuwahara: each pixel takes the calmest of four neighbouring quadrants, which turns detail into brush strokes
    composer.addPass(
      new ShaderPass({
        uniforms: { tDiffuse: { value: null }, uRes: { value: size.clone() } },
        vertexShader: VS,
        fragmentShader: /* glsl */ `
          uniform sampler2D tDiffuse; uniform vec2 uRes; varying vec2 vUv;
          #define R 2
          void main(){
            vec2 px = 1.0 / uRes;
            vec3 m[4]; vec3 s[4];
            for (int q = 0; q < 4; q++) { m[q] = vec3(0.0); s[q] = vec3(0.0); }
            for (int j = -R; j <= R; j++) for (int i = -R; i <= R; i++) {
              vec3 c = texture2D(tDiffuse, vUv + vec2(float(i), float(j)) * px).rgb;
              if (i <= 0 && j <= 0) { m[0] += c; s[0] += c * c; }
              if (i >= 0 && j <= 0) { m[1] += c; s[1] += c * c; }
              if (i >= 0 && j >= 0) { m[2] += c; s[2] += c * c; }
              if (i <= 0 && j >= 0) { m[3] += c; s[3] += c * c; }
            }
            float n = float((R + 1) * (R + 1));
            float best = 1e9; vec3 outc = vec3(0.0);
            for (int q = 0; q < 4; q++) {
              vec3 mu = m[q] / n; vec3 v = abs(s[q] / n - mu * mu);
              float sv = v.r + v.g + v.b;
              if (sv < best) { best = sv; outc = mu; }
            }
            gl_FragColor = vec4(outc, 1.0);
          }`,
      }),
    );
  }
  composer.addPass(new OutputPass());
  composer.addPass(
    new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uRes: { value: size.clone() } },
      vertexShader: VS,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform vec2 uRes; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          c += mix(vec3(-0.012, 0.01, 0.03), vec3(0.03, 0.012, -0.025), smoothstep(0.15, 0.85, l));
          c = mix(vec3(l), c, 1.1);
          vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * 0.5;
          c += (h(vUv * uRes) - 0.5) * 0.022;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );

  // brushwork and grain are sized in pixels: keep them in step with the canvas
  const resize = composer.setSize.bind(composer);
  composer.setSize = (w: number, h: number) => {
    resize(w, h);
    const pr = renderer.getPixelRatio();
    for (const pass of composer.passes) {
      const u = (pass as ShaderPass).uniforms?.uRes;
      if (u) u.value.set(w * pr, h * pr);
    }
  };
  return composer;
}

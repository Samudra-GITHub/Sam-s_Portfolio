import * as THREE from 'three';

/**
 * Shared shading for the painted world. Every surface goes through the same
 * light model: a soft two-step key with brush-noise thresholds (the painted
 * terminator), cool violet-teal shadow fill, warm bounce from the cloud sea
 * underneath, a rim from the low sun, real sun shadows, and aerial perspective.
 */

export const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float hash1(float n){return fract(sin(n)*43758.5453123);}
`;

/**
 * Tileable 3D gradient noise baked into a 64^3 texture (period 16 units, so
 * 4 texels per lattice cell). One trilinear fetch replaces a procedural
 * simplex evaluation (about 60 ALU ops) in the per-pixel shaders, which is
 * where this scene spends its GPU time on integrated graphics.
 */
let noiseTex: THREE.Data3DTexture | null = null;
export function noiseTexture() {
  if (noiseTex) return noiseTex;
  const N = 64, P = 16;
  const r = (() => {
    let a = 0x9e3779b9;
    return () => ((a = (a + 0x6d2b79f5) | 0), (((a ^ (a >>> 15)) * (1 | a)) >>> 0) / 4294967296);
  })();
  const grads = new Float32Array(P * P * P * 3);
  for (let i = 0; i < P * P * P; i++) {
    const z = r() * 2 - 1, t = r() * Math.PI * 2, q = Math.sqrt(1 - z * z);
    grads.set([q * Math.cos(t), q * Math.sin(t), z], i * 3);
  }
  const g = (x: number, y: number, z: number, dx: number, dy: number, dz: number) => {
    const k = (((x % P) * P + (y % P)) * P + (z % P)) * 3;
    return grads[k] * dx + grads[k + 1] * dy + grads[k + 2] * dz;
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const data = new Uint8Array(N * N * N);
  const scale = P / N;
  for (let z = 0; z < N; z++)
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const px = x * scale, py = y * scale, pz = z * scale;
        const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
        const fx = px - ix, fy = py - iy, fz = pz - iz;
        const u = fade(fx), v = fade(fy), w = fade(fz);
        const l = (a: number, b: number, t: number) => a + (b - a) * t;
        const n = l(
          l(l(g(ix, iy, iz, fx, fy, fz), g(ix + 1, iy, iz, fx - 1, fy, fz), u), l(g(ix, iy + 1, iz, fx, fy - 1, fz), g(ix + 1, iy + 1, iz, fx - 1, fy - 1, fz), u), v),
          l(l(g(ix, iy, iz + 1, fx, fy, fz - 1), g(ix + 1, iy, iz + 1, fx - 1, fy, fz - 1), u), l(g(ix, iy + 1, iz + 1, fx, fy - 1, fz - 1), g(ix + 1, iy + 1, iz + 1, fx - 1, fy - 1, fz - 1), u), v),
          w,
        );
        // gradient noise peaks near +-0.9; stretch to roughly the range of simplex
        data[(z * N + y) * N + x] = Math.max(0, Math.min(255, Math.round((n * 1.15 * 0.5 + 0.5) * 255)));
      }
  const t = new THREE.Data3DTexture(data, N, N, N);
  t.format = THREE.RedFormat;
  t.type = THREE.UnsignedByteType;
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping;
  t.unpackAlignment = 1;
  t.needsUpdate = true;
  noiseTex = t;
  return t;
}

export const COMMON = /* glsl */ `
uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uShadeCol; uniform vec3 uBounceCol;
uniform vec3 uFogCol; uniform vec3 uFogSunCol; uniform float uFogDist; uniform vec3 uCam; uniform float uTime;
uniform sampler2DShadow uShadowMap; uniform mat4 uShadowMatrix; uniform float uShadowTexel;
uniform mediump sampler3D uNoise;
${SNOISE}
// texture noise in place of procedural simplex (see noiseTexture)
float tn(vec3 p){ return texture(uNoise, p * 0.0625).r * 2.0 - 1.0; }
#define snoise tn
// 4 hardware-filtered compare taps (each a bilinear 2x2 PCF) = soft 4x4 footprint
float shadowAt(vec3 wp, float bias){
  vec4 sc = uShadowMatrix * vec4(wp, 1.0);
  vec3 s = sc.xyz / sc.w * 0.5 + 0.5;
  float o = uShadowTexel * 0.9;
  float z = s.z - bias;
  float sum = texture(uShadowMap, vec3(s.xy + vec2(-o, -o), z)) + texture(uShadowMap, vec3(s.xy + vec2(o, -o), z))
            + texture(uShadowMap, vec3(s.xy + vec2(-o, o), z)) + texture(uShadowMap, vec3(s.xy + vec2(o, o), z));
  float inside = step(0.0, s.x) * step(s.x, 1.0) * step(0.0, s.y) * step(s.y, 1.0) * step(s.z, 1.0);
  return mix(1.0, sum * 0.25, inside);
}
vec3 fogApply(vec3 col, vec3 wp){
  vec3 v = wp - uCam; float d = length(v); vec3 dir = v / max(d, 1e-3);
  float f = 1.0 - exp(-pow(d / uFogDist, 1.45));
  f = clamp(f + (1.0 - smoothstep(-110.0, -60.0, wp.y)) * 0.25 * smoothstep(60.0, 200.0, d), 0.0, 1.0);
  vec3 fc = mix(uFogCol, uFogSunCol, pow(max(dot(dir, uSun), 0.0), 5.0));
  return mix(col, fc, f);
}
vec3 paint(vec3 albedo, vec3 n, vec3 wp, float ao, float brush, float sh){
  float ndl = dot(n, uSun);
  float lit = smoothstep(-0.04, 0.2, ndl + brush * 0.16) * sh;
  float hi = smoothstep(0.5, 0.78, ndl + brush * 0.12) * sh;
  vec3 amb = mix(uShadeCol, uSkyCol, n.y * 0.5 + 0.5);
  vec3 col = albedo * amb * (0.3 + 0.7 * ao);
  col += albedo * uSunCol * (lit * 0.85 + hi * 0.25) * (0.55 + 0.45 * ao);
  col += albedo * uBounceCol * max(0.0, -n.y) * (0.4 + 0.6 * ao) * 0.85;
  vec3 V = normalize(uCam - wp);
  float rim = pow(1.0 - max(dot(n, V), 0.0), 4.0);
  col += uSunCol * rim * 0.16 * (0.25 + 0.75 * sh) * (0.35 + 0.65 * max(0.0, dot(-V, uSun)));
  return col;
}
`;

export function commonUniforms() {
  return {
    uSun: { value: new THREE.Vector3(-0.78, 0.42, 0.48).normalize() },
    uSunCol: { value: new THREE.Color('#ffe4b8').multiplyScalar(1.9) },
    uSkyCol: { value: new THREE.Color('#8cc0ee').multiplyScalar(0.55) },
    uShadeCol: { value: new THREE.Color('#4a4f86').multiplyScalar(0.5) },
    uBounceCol: { value: new THREE.Color('#f3dcc0').multiplyScalar(0.8) },
    uFogCol: { value: new THREE.Color('#b8d5ef') },
    uFogSunCol: { value: new THREE.Color('#eef0e6') },
    uFogDist: { value: 1400 },
    uCam: { value: new THREE.Vector3() },
    uTime: { value: 0 },
    uShadowMap: { value: null as THREE.Texture | null },
    uShadowMatrix: { value: new THREE.Matrix4() },
    uShadowTexel: { value: 1 / 2048 },
    uNoise: { value: noiseTexture() },
  };
}
export type Common = ReturnType<typeof commonUniforms>;

const ROCK_VS = /* glsl */ `
attribute float aAO;
varying vec3 vWP; varying vec3 vN; varying float vAO; varying vec2 vUv;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vAO = aAO;
  #ifdef BAKED
  vUv = uv;
  #endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const ROCK_FS = /* glsl */ `
${COMMON}
uniform float uScale; uniform vec3 uStrata[5]; uniform vec3 uMossA; uniform vec3 uMossB; uniform vec3 uVein; uniform vec3 uUnder;
varying vec3 vWP; varying vec3 vN; varying float vAO; varying vec2 vUv;
#ifdef BAKED
uniform sampler2D uNormalMap;
#endif
void main(){
  vec3 p = vWP / uScale;
  vec3 n = normalize(vN);
  #ifdef BAKED
  // sculpted detail from the Blender bake: object-space normals in Blender axes (Z up) -> three (Y up)
  vec3 nb = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
  n = normalize(vec3(nb.x, nb.z, -nb.y)); // the baked rock is placed unrotated, so object space = world space
  #endif
  #if !defined(BAKED) && !defined(FAR)
  // carved relief: strata grain, stretched horizontally, plus chips (the sculpted bake carries its own)
  vec3 bp = p * vec3(5.0, 15.0, 5.0);
  float e = 0.02;
  float b0 = snoise(bp) + 0.45 * snoise(p * 31.0);
  vec3 grad = vec3(snoise(bp + vec3(e,0,0)) + 0.45 * snoise((p + vec3(e/5.0,0,0)) * 31.0) - b0,
                   snoise(bp + vec3(0,e,0)) + 0.45 * snoise((p + vec3(0,e/15.0,0)) * 31.0) - b0,
                   snoise(bp + vec3(0,0,e)) + 0.45 * snoise((p + vec3(0,0,e/5.0)) * 31.0) - b0) / e;
  n = normalize(n - 0.009 * (grad - dot(grad, n) * n));
  #endif

  // strata colour
  // tilted, unevenly thick beds
  float warp = snoise(p * 2.3) * 0.32 + snoise(p * 7.0) * 0.07;
  float band = dot(p, normalize(vec3(0.2, 1.0, 0.12))) * 8.0 + warp;
  band += 0.45 * sin(band * 0.63 + 1.3) + 0.25 * sin(band * 1.7);
  float layer = floor(band); float f = fract(band);
  float h = hash1(layer * 7.13 + 3.0);
  vec3 alb = uStrata[0];
  alb = mix(alb, uStrata[1], step(0.2, h));
  alb = mix(alb, uStrata[2], step(0.45, h));
  alb = mix(alb, uStrata[3], step(0.68, h));
  alb = mix(alb, uStrata[4], step(0.86, h));
  alb = mix(alb, vec3(0.32, 0.25, 0.19), 0.22);                // pull the beds toward one family
  alb *= 0.88 + 0.12 * sin(f * 18.85 + snoise(p * 18.0) * 2.0);
  alb *= mix(0.74, 1.0, smoothstep(0.0, 0.06, f));            // crevice between beds
  alb *= 0.9 + 0.16 * snoise(p * vec3(3.0, 0.8, 3.0));         // large tonal patches
  // the underside: cooler, wetter, darker
  alb = mix(alb, uUnder, (1.0 - smoothstep(-1.3, -0.2, p.y)) * 0.5);

  // moss: on tops and ledges, and dripping down from the rim
  float mossTop = smoothstep(0.55, 0.9, n.y + snoise(p * 9.0) * 0.3) * (0.55 + 0.45 * smoothstep(-0.3, 0.4, snoise(p * 3.0)));
  #ifdef FAR
  float drip = 0.0;
  #else
  float drip = smoothstep(0.35, 0.8, snoise(vec3(p.x * 28.0, p.y * 2.2, p.z * 28.0))) * smoothstep(-0.45, 0.05, p.y) * (1.0 - abs(n.y));
  #endif
  vec3 moss = mix(uMossA, uMossB, smoothstep(-0.4, 0.6, snoise(p * 14.0)));
  alb = mix(alb, moss, clamp(mossTop + drip * 0.85, 0.0, 1.0));

  // mineral seams on the cliffs
  float vn = abs(snoise(p * 4.2 + vec3(3.1, 0.0, 1.7)));
  // texture noise has gentler slopes than simplex: a tighter band keeps the seams hairline
  float vein = (1.0 - smoothstep(0.0, 0.012, vn)) * (1.0 - smoothstep(0.35, 0.7, n.y)) * smoothstep(0.1, 0.5, snoise(p * 1.7 + 9.0) + 0.5);

  float brush = snoise(p * vec3(8.0, 24.0, 8.0)) * 0.6 + snoise(p * 47.0) * 0.25;
  float sh = shadowAt(vWP, 0.0012);
  vec3 col = paint(alb, n, vWP, vAO, brush, sh);
  #ifdef FAR
  vein *= 0.45;
  #endif
  col += uVein * vein * (0.5 + 0.6 * sh);
  gl_FragColor = vec4(fogApply(col, vWP), 1.0);
}`;

export function rockMaterial(c: Common, scale: number, palette?: Partial<Record<'under' | 'mossA' | 'mossB', string>> & { strata?: string[] }, normalMap?: THREE.Texture, far = false) {
  const strata = (palette?.strata ?? ['#b4855a', '#cdb894', '#8f5439', '#6a7172', '#7a5a41']).map((h) => new THREE.Color(h));
  return new THREE.ShaderMaterial({
    vertexShader: ROCK_VS,
    fragmentShader: ROCK_FS,
    defines: { ...(normalMap ? { BAKED: '' } : {}), ...(far ? { FAR: '' } : {}) },
    uniforms: {
      ...c,
      uNormalMap: { value: normalMap ?? null },
      uScale: { value: scale },
      uStrata: { value: strata },
      uMossA: { value: new THREE.Color(palette?.mossA ?? '#2c4f36') },
      uMossB: { value: new THREE.Color(palette?.mossB ?? '#5f8646') },
      uVein: { value: new THREE.Color('#5fd0c0').multiplyScalar(0.55) },
      uUnder: { value: new THREE.Color(palette?.under ?? '#4b3c3c') },
    },
  });
}

/** bark, roots and branches */
const BARK_VS = /* glsl */ `
attribute float aAO;
varying vec3 vWP; varying vec3 vN; varying float vAO; varying vec3 vLocal;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vAO = aAO; vLocal = position;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BARK_FS = /* glsl */ `
${COMMON}
uniform vec3 uBark; uniform vec3 uBark2;
varying vec3 vWP; varying vec3 vN; varying float vAO; varying vec3 vLocal;
void main(){
  vec3 n = normalize(vN);
  float streak = snoise(vec3(vWP.x * 2.5, vWP.y * 0.35, vWP.z * 2.5));
  vec3 alb = mix(uBark, uBark2, smoothstep(-0.5, 0.7, streak));
  alb *= 0.8 + 0.25 * snoise(vWP * 3.0);
  float brush = snoise(vWP * vec3(1.5, 0.4, 1.5));
  float sh = shadowAt(vWP, 0.002);
  vec3 col = paint(alb, n, vWP, vAO, brush, sh);
  gl_FragColor = vec4(fogApply(col, vWP), 1.0);
}`;

export function barkMaterial(c: Common, a = '#4a3a2e', b = '#7c6550') {
  return new THREE.ShaderMaterial({
    vertexShader: BARK_VS,
    fragmentShader: BARK_FS,
    uniforms: { ...c, uBark: { value: new THREE.Color(a) }, uBark2: { value: new THREE.Color(b) } },
  });
}

/**
 * Foliage: alpha-tested leaf cards with normals bent to the canopy volume,
 * so a crown shades like one soft mass while its edge breaks into leaves.
 * Backlit leaves glow (sun through the canopy).
 */
const LEAF_VS = /* glsl */ `
attribute float aInner;
varying vec3 vWP; varying vec3 vN; varying vec2 vUv; varying vec3 vCol; varying float vInner;
uniform float uTime;
void main(){
  mat4 m = modelMatrix * instanceMatrix;
  vec4 wp = m * vec4(position, 1.0);
  float sway = sin(uTime * 0.9 + wp.x * 0.15 + wp.z * 0.11) * 0.06 * aInner;
  wp.x += sway; wp.z += sway * 0.6;
  vWP = wp.xyz; vN = normalize(mat3(m) * normal); vUv = uv; vInner = aInner;
  vCol = instanceColor;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LEAF_FS = /* glsl */ `
${COMMON}
uniform sampler2D uMap;
varying vec3 vWP; varying vec3 vN; varying vec2 vUv; varying vec3 vCol; varying float vInner;
void main(){
  vec4 tx = texture2D(uMap, vUv);
  // keep coverage as the texture minifies (mip averaging thins alpha-cut foliage to nothing)
  vec2 duv = fwidth(vUv * 256.0);
  float lod = max(0.0, log2(max(duv.x, duv.y)));
  float a = tx.a * (1.0 + lod * 0.32);
  a = (a - 0.5) / max(fwidth(a), 1e-4) + 0.5;
  if (a < 0.5) discard;
  vec3 n = normalize(vN); // volumetric normal, the same for both faces of a card
  vec3 alb = vCol * (0.7 + 0.45 * tx.r);
  alb *= mix(0.55, 1.0, vInner);                     // the inside of a crown is darker
  float brush = snoise(vWP * 0.9) * 0.7 + (tx.r - 0.5) * 0.6;
  float sh = shadowAt(vWP, 0.003);
  vec3 col = paint(alb, n, vWP, mix(0.45, 1.0, vInner), brush, sh);
  vec3 V = normalize(uCam - vWP);
  float back = pow(max(dot(-V, uSun), 0.0), 3.0) * (1.0 - max(dot(n, V), 0.0) * 0.5);
  col += vCol * uSunCol * back * 0.55 * sh * vInner;  // light through leaves
  gl_FragColor = vec4(fogApply(col, vWP), 1.0);
}`;

export function leafMaterial(c: Common, map: THREE.Texture) {
  return new THREE.ShaderMaterial({
    vertexShader: LEAF_VS,
    fragmentShader: LEAF_FS,
    uniforms: { ...c, uMap: { value: map } },
    side: THREE.DoubleSide,
  });
}

/** depth-only materials for the sun's shadow pass */
export function leafDepthMaterial(map: THREE.Texture) {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform sampler2D uMap; varying vec2 vUv; void main(){ if (texture2D(uMap, vUv).a < 0.5) discard; gl_FragColor = vec4(1.0); }`,
    uniforms: { uMap: { value: map } },
    side: THREE.DoubleSide,
  });
}
export const solidDepthMaterial = () =>
  new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `void main(){ gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `void main(){ gl_FragColor = vec4(1.0); }`,
    side: THREE.DoubleSide,
  });

/** mineral crystals: deep teal body, bright tips, fresnel edge */
export function crystalMaterial(c: Common) {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `attribute float aTip; varying vec3 vWP; varying vec3 vN; varying float vTip;
      void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vTip = aTip; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: /* glsl */ `${COMMON}
      varying vec3 vWP; varying vec3 vN; varying float vTip;
      void main(){
        vec3 n = normalize(vN); vec3 V = normalize(uCam - vWP);
        vec3 alb = mix(vec3(0.05,0.17,0.19), vec3(0.5,0.74,0.7), vTip);
        float sh = shadowAt(vWP, 0.002);
        vec3 col = paint(alb, n, vWP, 1.0, 0.0, sh);
        col += vec3(0.4,0.72,0.68) * pow(1.0 - max(dot(n,V),0.0), 2.5) * 0.38;
        col += vec3(0.25,0.6,0.55) * vTip * 0.35;
        gl_FragColor = vec4(fogApply(col, vWP), 1.0);
      }`,
    uniforms: { ...c },
  });
}

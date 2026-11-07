/**
 * A browser port of AkashaLens's rule-based cloud detector and confidence map (utils.py: detect_clouds and
 * generate_confidence_map). Same thresholds, same formulas, same 256 x 256 working size as the app's Resize.
 * The browser's resampling differs slightly from torchvision's, so a percentage can differ from the Python
 * run in its last digit. This is the rule-based part of the pipeline only: it is not the U-Net.
 */
export const SIZE = 256;
export const LUM = 0.68;
export const SAT = 0.28;

export interface Detection {
  /** 1 where the rule calls a pixel cloud */
  cloud: Uint8Array;
  /** 0..1 per pixel; 1 for clear ground, 0.15 to 0.85 inside clouds */
  confidence: Float32Array;
  /** percentage of cloud pixels, rounded to one place as in the app */
  cover: number;
  /** mean confidence x 100, rounded to one place as in the app */
  score: number;
}

/** exact Euclidean distance transform (Felzenszwalb and Huttenlocher), distance from each cloud pixel to clear ground */
function edt(cloud: Uint8Array, n: number): Float32Array {
  const INF = 1e20;
  const f = new Float64Array(n * n);
  for (let i = 0; i < f.length; i++) f[i] = cloud[i] ? INF : 0;
  const line = new Float64Array(n), out = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  const pass = (get: (i: number) => number, set: (i: number, x: number) => void) => {
    for (let i = 0; i < n; i++) line[i] = get(i);
    let k = 0;
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = (line[q] + q * q - (line[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) {
        k--;
        s = (line[q] + q * q - (line[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      out[q] = (q - v[k]) * (q - v[k]) + line[v[k]];
    }
    for (let i = 0; i < n; i++) set(i, out[i]);
  };
  for (let x = 0; x < n; x++) pass((i) => f[i * n + x], (i, d) => (f[i * n + x] = d));
  for (let y = 0; y < n; y++) pass((i) => f[y * n + i], (i, d) => (f[y * n + i] = d));
  const d = new Float32Array(n * n);
  for (let i = 0; i < d.length; i++) d[i] = Math.sqrt(f[i]);
  return d;
}

export function detect(img: HTMLImageElement): Detection {
  const cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  const c = cv.getContext('2d', { willReadFrequently: true })!;
  c.imageSmoothingQuality = 'high';
  c.drawImage(img, 0, 0, SIZE, SIZE);
  const px = c.getImageData(0, 0, SIZE, SIZE).data;
  const n = SIZE * SIZE;
  const cloud = new Uint8Array(n);
  const lum = new Float32Array(n);
  let count = 0;
  for (let i = 0; i < n; i++) {
    const r = px[i * 4] / 255, g = px[i * 4 + 1] / 255, b = px[i * 4 + 2] / 255;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max > 1e-5 ? (max - min) / max : 0;
    lum[i] = l;
    if (l > LUM && sat < SAT) {
      cloud[i] = 1;
      count++;
    }
  }
  const confidence = new Float32Array(n).fill(1);
  if (count) {
    const dist = edt(cloud, SIZE);
    let maxD = 0;
    for (let i = 0; i < n; i++) if (dist[i] > maxD) maxD = dist[i];
    if (maxD <= 0) maxD = 1;
    for (let i = 0; i < n; i++) {
      if (!cloud[i]) continue;
      const v = 0.85 - 0.45 * (dist[i] / maxD) - 0.2 * lum[i];
      confidence[i] = Math.min(0.85, Math.max(0.15, v));
    }
  }
  let sum = 0;
  for (let i = 0; i < n; i++) sum += confidence[i];
  return { cloud, confidence, cover: Math.round((count / n) * 1000) / 10, score: Math.round((sum / n) * 1000) / 10 };
}

/** matplotlib's RdYlGn, sampled at its eleven ColorBrewer stops */
const RDYLGN = ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'].map((h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]);
const rdylgn = (t: number) => {
  const x = Math.min(1, Math.max(0, t)) * 10;
  const i = Math.min(9, Math.floor(x)), f = x - i;
  const a = RDYLGN[i], b = RDYLGN[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
};

/** paint the mask (cloud pixels in one colour, the rest clear) or the confidence heatmap into a 256 x 256 canvas */
export function paint(cv: HTMLCanvasElement, d: Detection, mode: 'mask' | 'confidence') {
  cv.width = cv.height = SIZE;
  const c = cv.getContext('2d')!;
  const im = c.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const o = i * 4;
    if (mode === 'mask') {
      // cobalt for cloud, transparent for ground
      im.data[o] = 83;
      im.data[o + 1] = 107;
      im.data[o + 2] = 250;
      im.data[o + 3] = d.cloud[i] ? 200 : 0;
    } else {
      const [r, g, b] = rdylgn(d.confidence[i]);
      im.data[o] = r;
      im.data[o + 1] = g;
      im.data[o + 2] = b;
      im.data[o + 3] = 255;
    }
  }
  c.putImageData(im, 0, 0);
}

# Performance: audit, fixes and measurements

## How it was measured

- **Machine:** Intel UHD Graphics iGPU (0x468B), Direct3D 11 through ANGLE. Chrome headless (new) on the real GPU. Headless reports a device pixel ratio of 1.
- **Build:** production (`npm run build` then `vite preview`).
- **Benchmark:** a fixed path. Load, let it settle, 4 s idle at the top, then a steady wheel scroll (100 px every 40 ms) through the whole homepage.
  - Frame times come from an in-page `requestAnimationFrame` probe.
  - Long tasks come from a `PerformanceObserver`.
  - The script lives outside the repo; the method is described here so it can be rebuilt.
- **GPU cost per layer:** the lab page with `?prof` (`/lab/hero-island.html?prof&shot=0`).
  - It times GPU-synced frames (a 1 px `readPixels` makes the CPU wait for the GPU) with the scene empty, then with one layer at a time.
  - It also prints triangles per layer.
- **Live readout:** `npm run dev`, then open `/?perf`. Shows FPS, frame time, p95, draw calls, triangles, geometries, textures, quality tier and GPU. Development only; never shipped to visitors.

## Baseline (before)

| | 1280×800 |
| --- | --- |
| Idle FPS | 5.5 (182 ms frames) |
| Scroll FPS | 6.0 (167 ms average, p95 222 ms) |
| Main-thread block while the 3D builds | one 15.5 s task (dev); the page could not scroll |
| Triangles / draw calls | 1.25 M / 51 |

GPU time per layer at 1280×800, DPR 1 (lab, shot 0):

| Layer | ms |
| --- | --- |
| Full frame | 231 |
| Post-processing alone (MSAA ×4, Kuwahara, output, grade) | 41 |
| Hero rock | 65 |
| Hero foliage | 64 |
| Far formations (9) | 105 |
| Cloud floor | 19 |
| Water, clouds, sky, spores | under 10 together |

The same scroll without WebGL ran at 142 FPS (uncapped headless) with no long tasks. So the DOM, React, GSAP and Lenis were never the bottleneck: the 3D scene was.

## Causes found

1. **Per-pixel procedural noise.**
   - The rock shader ran 22 simplex-noise evaluations per pixel. Eight of them were a noise gradient for relief that the baked normal map already provides.
   - Leaves, bark, clouds and the cloud floor ran simplex too.
2. **Nine-tap shadow filtering** per pixel on every surface.
3. **The far formations were full detail at any distance:** 939 k triangles.
4. **Alpha-cut foliage overdraw:** discard defeats early depth rejection, so every overlapping leaf card is shaded.
5. **Post-processing at full cost on every device:** Kuwahara about 8 ms and multisampling about 5 ms on this GPU.
6. **Scene generation on the main thread:** the far formations took about 12 s and blocked scrolling during load.
7. **Shaders and buffers first used mid-scroll:** each new object compiled or uploaded the first time it came into view, causing 130 to 250 ms stalls.
8. **Two animation loops.** R3F ran its own `requestAnimationFrame` beside GSAP's ticker, which drives Lenis, so the camera could read the scroll position a frame late.
9. **Double smoothing.** Lenis lerp, then a 0.45 s camera follow on top, so the view trailed input.
10. **Whole-page style recalculation every frame.** The intro wrote `--veil` and the captions wrote `--isle-*` on `:root`.
11. **Expensive DOM effects:**
    - animated `filter: blur()` on the flying title words;
    - `backdrop-filter` on the nav and captions over a canvas that changes every frame.
12. **A re-render reset the adaptive pixel ratio** (Canvas `dpr` prop), and page state re-rendered the whole 3D stage.

## Fixes

| Fix | Where |
| --- | --- |
| A tileable 3D gradient-noise texture (64³, R8) replaces procedural simplex: one trilinear fetch per call | `veil/shaders.ts` `noiseTexture`, `tn` |
| Hardware depth-compare shadows: 4 filtered taps instead of 9 | `shadowAt`, `environment.ts` |
| No procedural relief on the baked rock; lighter `FAR` rock variant | `rockMaterial(..., far)` |
| Far formations meshed in two Web Workers | `veil/terrain.worker.ts`, `meshInWorkers` |
| Two LOD levels per far formation (cell 0.04 near, 0.09 far, with lighter leaf clusters) | `environment.ts` |
| Hero leaf clusters: 15 larger cards instead of 24 | `environment.ts` |
| All shaders compiled with `compileAsync`, and every object and LOD level drawn once before reveal | `World.tsx`, `environment.ts` |
| Output transform folded into the grade pass (one fewer full-screen pass) | `veil/paint.ts` |
| One loop: R3F `frameloop="never"`, advanced from GSAP's ticker after Lenis | `World.tsx` `Driver` |
| Camera follow cut from 0.45 s to 0.08 s (Lenis already smooths) | `Rig` |
| Caption anchor written on the chapter element, only when it changes; intro veil opacity set on the veil element | `World.tsx`, `FlyingIntro.tsx` |
| Removed animated blur on the title flight; removed `backdrop-filter` from the nav and captions | `FlyingIntro.tsx`, `nav.css`, `home.css` |
| Pixel ratio held in state; `WorldStage` memoised | `World.tsx`, `WorldStage.tsx` |

### Adaptive quality

Tiers, best first:
1. Brushwork and MSAA ×4 on.
2. Brushwork off.
3. MSAA off.
4. Resolution × 0.85.
5. Resolution × 0.72.

Phones start without brushwork or MSAA. How it moves between tiers:
- **Warm-up:** each 45-frame median is judged against an 18.5 ms budget. Far off budget, it skips a tier.
- **After that:** it keeps watching in 150-frame windows, so a heavier stretch of the page can still step down. Steps are never in quick succession.
- **Never up:** it never steps back up, so quality does not pump.

On this machine it settles on tier 3 (native resolution, no brushwork, no MSAA) at 1280×800 within about 2.5 s.

## After

| Viewport | Idle FPS | Scroll FPS | Scroll p95 | Long tasks while scrolling |
| --- | --- | --- | --- | --- |
| 1280×800 (before) | 5.5 | 6.0 | 222 ms | 0 (but 15.5 s blocked at load) |
| 1280×800 | 64.6 | 60.4 | 21 ms | 0 |
| 1920×1080 | 53.8 | 53.3 | 28 ms | 0 |
| 375×812 (phone tier) | 144* | 133* | 14 ms | 0 |

\* Headless Chrome does not cap at the display refresh rate.

Lab GPU time at 1280×800, DPR 1, with brushwork off: full frame **32.5 ms → about 15 ms on the settled tier**, from 231 ms. Triangles went from 1.25 M to about 0.70 M.

## Art pass (geology, far-island dressing, distant falls)

What changed:
- **Rock shader:**
  - beds fold at large scale and jump across near-vertical faults;
  - dark seams along the faults;
  - vertical rain streaks with sun-bleached rock between them;
  - hairline fissures on steep faces;
  - lower contrast between beds.
- **Far formations:**
  - hanging roots under every rim;
  - each formation gets one of three moss palettes;
  - flowering trees on every other formation;
  - a waterfall with mist on the three largest. Each fall leaves from a real rim: a ray test checks for open air outward and below.

A/B against the previous commit, production builds, back to back:

| Viewport | Before scroll FPS | After scroll FPS | Scroll p95 |
| --- | --- | --- | --- |
| 1280×800 (two runs each) | 65.2 / 63.5 | 64.5 / 60.9 | 21 ms both |
| 1920×1080 | 53.6 | 51.9 | 28 ms both |
| 375×812 | 133.7* | 132.4* | |

No long tasks while scrolling after the change.

## Creatures pass

Five species (see `docs/CREATURES.md`): about 220k triangles in all, most of them in instanced crowds.

**A regression found and fixed.** The first build of the Spinlet flocks moved the birds on the CPU and re-uploaded their instance matrices every frame. At 1280×800 that cost 11 ms a frame: scroll fell from 50 to 39 FPS against the previous commit. Isolating each species with temporary switches showed:
- with the flocks hidden, 50 FPS;
- with the flocks drawn but frozen (no uploads), 49 FPS;
- hiding the moths changed nothing.

Writing to a buffer the GPU is still drawing from stalls ANGLE/D3D11, even though the buffer is small (80 matrices). The flocks now fly on the GPU. Each bird's flight parameters go into its instance matrix once, and the vertex shader (`FLOCK`) computes its position, heading and bank from `uTime`. Nothing is uploaded per frame.

A/B against the previous commit after the fix (production builds, back to back, on the same machine):

| Viewport | Before scroll FPS | After scroll FPS | Scroll p95 |
| --- | --- | --- | --- |
| 1280×800 (two runs each) | 48.0 / 44.5 | 42.7 / 43.2 | 35 ms both |
| 1920×1080 | 29.5 | 29.1 | 56 ms both |
| 375×812 | 75.3 | 76.0 | 28 ms both |

The two builds are level within run-to-run noise, apart from the first 1280 pair. No long tasks while scrolling.

**Caveat on the absolute numbers.** The machine was much busier during this session: the previous commit measures 44–48 FPS here, against 61–65 in the art pass above. The comparison holds; the absolute FPS does not. The 60 FPS target needs re-measuring on a quiet machine.

**Load.** Placing the herd adds ray tests against every formation at build time, about 0.5 s on the phone-size run (2.7 s to 3.5 s ready). It happens once, while the loading screen shows.

## Not yet at target

- **1920×1080 on this iGPU** holds about 53 FPS, not 60. It settles at a reduced resolution (×0.72) to get there.
- **Leaf cards are still the largest cost.** A vegetation redesign (fewer, better-shaped cards, impostors for distant trees) is the next lever.
- **About 1 s of main-thread work remains at load:** flora scattering, cloud texture, and the warm-up draw.
- **Phones have not been measured on real hardware.** The phone numbers come from desktop Chrome at phone size.

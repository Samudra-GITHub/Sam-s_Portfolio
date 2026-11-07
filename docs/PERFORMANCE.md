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

## Project worlds pass (Noir Café)

The Noir Café world (see `docs/WORLDS.md`) adds about 4.8k triangles in 7 meshes: 7 draw calls. It uploads nothing per frame. The light-up, the screenshot crossfade and the steam all run on uniforms. Its screenshots are three 1024 px WebP files.

Chapters are now 300svh tall, so this benchmark scrolls a longer page than before. The scroll rate (FPS) is still comparable.

A/B against 323998c (production builds, back to back, same machine):

| Viewport | Before scroll FPS | After scroll FPS | Scroll p95 |
| --- | --- | --- | --- |
| 1280×800, run 1 | 64.7 | 67.2 | 21 ms both |
| 1280×800, run 2 | 45.9 | 44.8 | 28 ms both |
| 1920×1080 | 54.4 | 54.9 | 21 ms both |
| 375×812, three runs each | 138 / 83.1 / 82.2 | 85.3 / 83.8 / 84.6 | 7 to 21 ms |

The two builds are level. The spread between runs is the machine, not the build: the two 1280 pairs moved together with the load, and the first phone-size old run (138) caught the machine idle. When the machine was quiet, the new build scrolled at 67 FPS at 1280×800. 1920×1080 is still below 60.

## All nine project worlds

The eight new worlds bring the total to about 31k triangles in 47 meshes (see `docs/WORLDS.md`). Three measures keep that cost down:
- **Nothing is uploaded per frame.** Spinning parts are separate meshes that only change their transform. Lights, meters, ripples and the sky screen run on uniforms.
- **Distance culling.** A world more than 340 units from the camera is hidden and not updated, so only the one or two worlds near the current stop are drawn.
- **Textures upload on load.** The first A/B showed two long tasks per scroll run (none before). The cause: screenshots arrive after the warm-up draw, so each one uploaded the first time its world came into view. Every texture, and every sign repainted when its font arrives, now goes to `renderer.initTexture` as soon as it exists. On re-measuring, the long tasks were gone.

A/B against a250d6f (production builds, back to back, same machine, after the upload fix):

| Viewport | Before scroll FPS | After scroll FPS | Long tasks while scrolling |
| --- | --- | --- | --- |
| 1280×800, three pairs | 47.3 / 47.3 / 36.1 | 46.0 / 46.2 / 35.3 | 0 / 0 |
| 1920×1080 | 36.8 | 35.3 | 0 / 0 |
| 375×812, three pairs | 75.3 / 66.1 / 66.0 | 65.3 / 65.4 / 67.1 | 0 / 0 |

The new build runs 1 to 4% behind at desktop sizes and level at phone size; the one 10 FPS phone gap did not repeat. The machine was loaded throughout: the same old build measured 36 to 65 FPS at 1280 across this session. 60 FPS is not confirmed here.

## Refinement pass (2026-11-07)

### Quality presets

| Preset | Pixel-ratio cap | When it is used |
| --- | --- | --- |
| Ultra | 2 | First tier when the device pixel ratio is at least 1.5, or screen width × DPR is at least 2560. That covers a 4K monitor and Retina laptops. |
| High | 1.5 | First tier on other desktops. |
| Lower tiers | as above | The adaptive step-down still applies to Ultra: a GPU that cannot hold the budget drops to High and below. |
| Phone | 1.25 | `(max-width: 999px)`: lighter shadow maps (512²), 4× anisotropy, 1× sign canvases. |

Ultra is never forced. Adding `?quality=ultra` to the URL pins Ultra on a non-phone screen and disables the step-down, for review captures. With it, this iGPU rendered a 3810×2160 buffer at a 3840-wide viewport. Without it, the adaptive tiers stepped the same viewport down to about 2057 wide.

### A/B

Old: 7e9ea1c. New: this pass. Production builds, back to back, on the same machine, scroll benchmark (`perf.mjs`):

| Viewport | Old scroll FPS | New scroll FPS | Frames over 33 ms, old / new | Longest scroll task, old / new |
| --- | --- | --- | --- | --- |
| 1280×800 | 57.5 | 56.8 | 1.8% / 1.8% | 71 ms / 55 ms |
| 1920×1080 | 44.0 | 44.3 | 12.9% / 12.0% | none / none |
| 375×812 | 58.2 | 57.9 | 0.8% / 1.3% | none / none |

Idle FPS was level: 60 / 60 at 1280 and 375, 51.3 / 51.5 at 1920. The new build does more per frame, mainly the shadow sampling and the extra geometry, and measures level with the old one, within run-to-run noise. 60 FPS is not confirmed: 1920×1080 scrolls at about 44 FPS on this machine.

## Not yet at target

- **1920×1080 on this iGPU** holds about 53 FPS, not 60. It settles at a reduced resolution (×0.72) to get there.
- **Leaf cards are still the largest cost.** A vegetation redesign (fewer, better-shaped cards, impostors for distant trees) is the next lever.
- **About 1 s of main-thread work remains at load:** flora scattering, cloud texture, and the warm-up draw.
- **Phones have not been measured on real hardware.** The phone numbers come from desktop Chrome at phone size.

# Motion reel: storyboard and project concepts

Status: proposal for review, 2026-11-07. Nothing here is built yet.
Builds on `docs/DESIGN_SYSTEM.md` (palette, type, grid stay as they are).

---

## 1. Evidence report: what is being built right now

**Currently building: W.E.D.N.E.S.D.A.Y.** (repo `Samudra-GITHub/W.E.D.N.E.S.D.A.Y.`, local folder `My_Projects/Friday`).

| Evidence | What it shows |
| --- | --- |
| Commits | 15 commits, 27 Oct to 4 Nov 2026; the newest code of any of your repositories (ISS 3D model, adaptive Earth rendering, 4 Nov). |
| Pull requests | #1 *rebrand, living Earth, location modes* and #2 *Ask the Earth, Time Machine, Orbit, Pulse* both merged 3–4 Nov. |
| Uncommitted work | 10 modified files and a new Moon feature (`backend/friday/moon/`, `moon_router.py`, `MoonPanel.tsx`, `moonActions.ts` with a test), last saved 4 Nov 12:52. Work stopped mid-feature, not finished and parked. |
| README "Where it stands" | Lists what is verified in the running app and what is **not yet verified** (voice on a real microphone, frame rate on a dedicated GPU, GPU replies, live ships). |

**What it is:** a personal AI assistant for Windows 11 that runs a local model through Ollama, with a capability broker that denies tools by default and asks for approval. Around it sits a live 3D Earth (CesiumJS) with public data in three modes: Live, Time and Orbit.

**Implemented and checked (per the README):**
- whole-planet opening, orbit dial and Focus on me
- 3D models for a selected aircraft and satellite
- three location modes
- seven core states
- Ask the Earth with the local model
- Pulse briefing
- Time playback
- Follow the ISS
- What happened here?

The test suites passed at the last full run: backend 232, desktop 45.

**Still in development:**
- the Moon panel (uncommitted)
- the four unverified items above

**How the other candidates rank:**

| Project | Verdict | Why |
| --- | --- | --- |
| Rinti AI | Recently worked on, paused | 60 commits, 10 Sep to 21 Oct. Open PR #1 *local inference* has been idle since 21 Oct. |
| arthayukti | Completed | 49 commits over 24–25 Oct, ending in a project report PDF and team credits ("Medhavi"). A finished hackathon build. It is not in the portfolio yet. |
| Tarang, Krama, AkashaLens | Completed | Only README and screenshot polish since 5 Oct. |
| Samagra-OS, vyom | Not started | Empty repositories. |
| ChanakyaStack | Paused | 2 commits since August. |

`config.ts` still says "Now building: Tarang and Krama". The evidence says that is out of date.

**Asset gap:** W.E.D.N.E.S.D.A.Y. has no real screenshots. `docs/assets/banner*.png` are generated illustrations, with unreadable labels and a 2042 date, so they cannot stand in for the app. The README's SVGs (`hero.svg`, `core.svg`, `architecture.svg`, `acronym.svg`) are real project graphics and can be used as diagrams.

---

## 2. Motion language (shared system)

One file of tokens (`src/studio/motion.ts`) that every scene reads. Nothing animates with values outside it.

| Token | Value | Use |
| --- | --- | --- |
| `ease.cut` | `expo.inOut` | Scene changes: whip pans, wipes, zoom-throughs |
| `ease.settle` | `expo.out` | Things arriving: type, panels, screens |
| `ease.scrub` | `none` | Anything scroll-scrubbed, so the scroll *is* the curve |
| `ease.camera` | `power3.inOut` | The sculpture's camera and image zooms |
| `dur.beat` | 0.45 s | Component state changes |
| `dur.scene` | 0.9 s | Section arrivals (time-based) |
| `dur.cut` | 0.6 s | Whip pans and wipes |
| `stagger.char` | 0.018 s | Kinetic type, per character |
| `stagger.line` | 0.07 s | Lines and list items |
| `stagger.panel` | 0.12 s | Split-screen panels |
| `spring.ui` | bounce 0, 0.45 s | Framer Motion default (critically damped) |
| `spring.throw` | bounce 0.2, 0.4 s | Only after a drag or flick |
| `blur.max` | 14 px directional, transform-only fallback | Whip pans; applied to one layer, never the page |
| `mask` | `clip-path: inset()` / `polygon()` | All reveals; animatable on the compositor in Chromium |

**Scroll rules:**
- Lenis stays light (`lerp` 0.1 → 0.14, no extra damping), and reduced motion uses native scroll.
- No scroll hijacking and no snap.
- At most **three** pinned sequences on the home page, each 120–180 vh, with `scrub: 0.4`, so a reversed scroll plays backwards cleanly.
- Time-based arrivals use `toggleActions: "play none none reverse"` so they can be interrupted.

**Reduced motion:** every scene has a still final frame, and masks open instantly. The sculpture renders one pose, and nothing travels.

**Phones:**
- The pinned sequences become short time-based arrivals.
- Whip pans become crossfades with a 24 px slide.
- WebGL distortion is skipped, leaving a plain clip reveal.

---

## 3. Home storyboard (the reel)

Transitions are chosen per seam and never repeated back to back. **Bold** names the device.

| # | Scene | Transition into the next | Why this device here |
| --- | --- | --- | --- |
| 1 | **Hero.** The name arrives by line, and the chrome band turns in the word space. | **Zoom-through.** On scroll (pinned ~150 vh) the band rotates to face the camera and scales until one twist fills the viewport. The camera passes through the loop's opening, and the intro is revealed inside the hole, which grows into a circle mask. | The sculpture is the identity; going *through* it is the one memorable moment. |
| 2 | **Intro.** "Precision, with play." enters as **kinetic type**: the hero's role line "Designer & Developer" breaks into characters, which fly and re-set as the statement's first words. | **Match cut.** The band settles small beside the statement, and its outline matches the circular mask of the next scene. | It links the sculpture to the work. |
| 3 | **Currently building: W.E.D.N.E.S.D.A.Y.** Full-bleed graphite. The planet circle from the band's mask becomes the project's Earth limb. The W core line draws across it. | **Split-screen.** Three panels (Mind, World, Pulse) slide up at staggered heights, carrying the README's own words and its real diagrams. | The project is three systems; panels say that structurally. |
| 4 | **Selected Work title.** A word wall: the five project names slam in from alternating sides. | **Whip pan** left into Tarang: the word wall streaks with directional blur and the first screen arrives. | Energy before the first project. |
| 5 | **Tarang.** Screens are dealt like records and tilt to flat. | **Masked expand.** The now-playing artwork circle expands to fill the viewport in Tarang's teal, then the frame cuts to AkashaLens. | Tarang is about the record; the circle is its own shape. |
| 6 | **AkashaLens.** See concept B. Opens wide on a satellite scene and scans down into the comparison. | **Scan wipe.** A horizontal scanline (the detector's sweep) wipes into Krama. | Continuity with the scanning device. |
| 7 | **Krama.** The giant word KRAMA; the product screens rise through its counters. | **Perspective turn.** The product screen rotates 90° in Y, edge-on, and its back face is Rinti's first panel. | A product turning in a showroom. |
| 8 | **Rinti AI.** See concept A. | **Distortion reveal.** The one WebGL displacement: Rinti's green stage ripples away into Noir's espresso. | Used once, where two dark grounds meet. |
| 9 | **Noir Café.** Screens arrive through arched masks, the shape of the café's own hero arch. | **Fade to ivory** into the index. | A rest beat after the work. |
| 10 | **Project universe.** As built, with lens transitions set to masked crops. | Plain section rule. | An index is for reading. |
| 11 | **About.** See section 6. | **Whip pan** right into Experiments. | |
| 12 | **Experiments.** The existing three studies plus one shader study (below). | **Zoom-out** to the contact block. | |
| 13 | **Contact.** "Let's build something." Characters drop in with weight. | End. | |

**Budgets (measured, not assumed):**
- Each pinned sequence is benchmarked on its own with `perf.mjs`, held to p95 under 16.7 ms and an over-20 ms share under 2 % at 1440 and 1920.
- Only one WebGL context: the sculpture. The Rinti→Noir distortion reuses it, by moving the canvas over the seam for that scene.
- No `filter` on large layers except the 0.6 s whip blur, applied to one element.

---

## 4. Concept A: Rinti AI, "a research desk you can watch think"

**What the repository supports (verified in code):**
- Streaming chat: saved conversations, a model selector, Stop and Regenerate, Markdown with code.
- Per-user memory items.
- A research engine with real stages from `research/engine.py`:
  1. intent (`POST /research/intent`)
  2. **planning** (5 %)
  3. **searching** (20 %)
  4. **reading** (45 %)
  5. **cross-checking** (65 %)
  6. **writing** (80 %)
  7. done, with `source` and `answer_section` events streamed along the way.
- Real per-mode budgets: Quick is 2 searches, 6 sources, 4 extractions and 2 sub-queries. Standard is 5, 16, 8 and 5.
- A measured benchmark (`docs/benchmarks/…-final.md`):

  | Target | First token (median) | Speed | Failures |
  | --- | --- | --- | --- |
  | qwen2.5:7b (local) | 0.3 s | 12 tok/s | 0 of 28 cases |
  | gpt-oss-120b (Groq) | 7.0 s | 503 tok/s | 2 of 28 cases |

- **Correction needed:** sign-in is switched off. Every request runs as one shared user (`auth/dependencies.py`), even though Argon2 hashing and HttpOnly session code exists. The portfolio's current line "Real accounts: Argon2…" and its focus on the sign-in screen are out of date.

**Composition (full viewport, green-black like the product):**
1. **Zoom into the interface.** The live app's real landing screen (Rinti wordmark, composer, Research toggle, starter cards), captured at 1440 with the sidebar collapsed, enters as a large framed device at 70 % width. The camera pushes in on the composer.
2. **The Research toggle lights up**, and the composer slides away. The pipeline takes the screen:
   - six stage nodes on one horizontal line, labelled with the code's own names and progress values;
   - a travelling signal moves along the connection;
   - each node activates in turn, scrubbed by scroll.
3. **Under each node**, a mono readout of what that stage really does. For example: *searching: up to 5 searches, 3 at a time*, and *reading: trafilatura + BeautifulSoup, 3,500 characters per source*.
4. **The branch at "searching"** splits into the budget's sub-queries, drawn as 2 lines for Quick and 5 for Standard. A Quick/Standard toggle redraws it with the real numbers.
5. **Benchmark panel.** The two-row measured table, set as large typography: 0.3 s against 7.0 s first token, 12 against 503 tok/s.
6. **Supporting screens.** Memory, Models and Settings, captured from the live app, enter through masks.

**Motion personality:** precise and sequential, like a progress stream. Nodes tick and the signal moves at a constant speed. Nothing floats.

**Needs your OK (see the questions at the end):** capturing these real screens from `rinti-ai.vercel.app`. The capture would be read-only, with the sidebar collapsed or cropped, because the shared user exposes other visitors' chat titles. A real research answer would also make a strong screen, but it spends your Groq and Tavily quota, so I would only capture one if you ask.

---

## 5. Concept B: AkashaLens, "from orbit to the lake"

**What the repository supports:**
- A PyTorch U-Net (three downsampling stages, L1 loss, 256×256).
- A **rule-based cloud detector**: a pixel counts as cloud if luminance is above 0.68 and saturation below 0.28. It also produces a cover percentage and a confidence map.
- MAE, PSNR and SSIM evaluation.
- A Copernicus Sentinel-2 download script.
- **No trained weights and no outputs.** The README says so plainly.

**The images:**
- The dataset is three cloudy/clear pairs, at **native sizes up to 1177×792**. The portfolio currently squashes all six to 487×287, so they will be re-exported from the originals.
- The pairs are **not pixel-aligned**: each pair differs in size, aspect ratio and framing.

**Composition:**
1. **From orbit.** The clear image of pair 2 (the largest, 1177×792) fills the viewport, slightly scaled up. A mono coordinate-style frame shows only true labels: *Dataset pair 2 · clear reference · 1177 × 792*.
2. **Scan.** A horizontal scanline sweeps down, and the cloudy image of the same pair is revealed behind it. This is the zoom from a wide view into the comparison.
3. **The comparison** (the interactive core):
   - A large slider with a draggable vertical divider and keyboard arrows.
   - Labelled *Training input (cloudy)* and *Clear reference*.
   - Each pair is **aligned by hand**: a crop and scale chosen so the shoreline matches, stated on the page as "aligned by eye for comparison". If a pair cannot be aligned honestly, it is shown side by side instead of in the slider.
4. **The detector, live.** A toggle runs the repository's own cloud rule (ported line for line from `utils.py` to a canvas) on the cloudy image in your browser. It overlays the real mask and prints the real cover percentage it computes. Labelled *Rule-based cloud detector from the repo, running on this image now*. This shows implemented functionality, not a model result.
5. **Pipeline strip:** Sentinel-2 (Copernicus) → dataset pairs → U-Net training → reconstruction → mask and confidence → MAE, PSNR, SSIM. The last three nodes are drawn **outlined, not filled**, with the note *no trained weights yet*. The diagram tells the truth about where the project stands.
6. **Spec panel:** model, loss, input size, thresholds, metrics, data source and status.

**Motion personality:** mapping. Scanlines, measured sweeps and slow camera moves. Never flashy.

---

## 6. Concept C: Currently building, W.E.D.N.E.S.D.A.Y.

**Placement:** directly after the intro, before Selected Work, as its own full-bleed graphite chapter (scene 3 above).

**Composition:**
1. A small badge, **Currently building**, with a live-looking dot that does not blink. Then the wordmark W.E.D.N.E.S.D.A.Y. set huge, characters arriving by kinetic type, and the acronym line from the README beneath it.
2. **The Earth limb:** the band's circular mask becomes a planet edge, drawn in CSS and SVG (no globe texture is faked). The README's real `core.svg` W line draws across it. The seven core states are named in a row, and hovering one plays that state's description.
3. **Three panels**, Mind, World and Pulse, each with the README's real description. Below them:
   - "Working and checked" as a list, using the README's own items;
   - "Still being built" as a second list: the Moon panel, voice on a real microphone, GPU frame rate and live ships.

   **No percentages and no progress bars.** Status is the two lists.
4. The real `architecture.svg`, presented as the system diagram, revealed through a mask.
5. Links to the repository. There is no live product, because it is a desktop app.

**Screens:** this is the gap. With real screenshots, the panels become layered interface shots that open through masks. Without them, the section stands on typography, the README's own diagrams and the lists. It stays honest, but it is less visual.

**Made to change:** the section reads one `currentlyBuilding: 'wednesday'` key in `config.ts`, plus a project entry in `projects.ts` with `verified` and `inProgress` lists. Pointing the key at another project switches the section.

---

## 7. About and Experiments

- **About montage.** Overlapping layers: large role words, the facets, and a strip of project screenshots that drift at different depths on scroll.
  - **Photography is mentioned in your bio, but no photographs exist in the repository.** The montage needs 4–8 of your own photos to work as intended. Until then it uses type and real project imagery only.
- **Experiments.** Keep the three studies and add two:
  - **Study 04, shader.** A displacement field you can push with the pointer, on a 2D canvas with a fragment shader in one small WebGL context that renders only while visible.
  - **Study 05, the band.** A small interactive version of the sculpture with its twist count (1, 3, 5) as a control. It reuses the main canvas when it is on screen, so no second context is created.

---

## 8. Build order after approval

1. Motion tokens, then the hero zoom-through and kinetic intro. Benchmark both.
2. AkashaLens (re-exported images, alignment, detector port, scan transitions). Benchmark.
3. Rinti AI (pending captures).
4. Currently building.
5. Remaining seams (whip pans, perspective turn, distortion, arched masks), About montage, Experiments 04 and 05.
6. Phone alternatives, reduced motion, per-scene benchmarks, screenshots for review.

Work happens on a new branch, `feat/motion-reel`. Nothing is committed to `main` or pushed until you approve.

# Project worlds

Each featured project's island carries a small world built from that project. Noir Café came first, as the prototype. Once it was approved, the other eight followed on the same principles.

**Rule.** Everything in a world comes from the project itself:
- its palette and typeface;
- its own screenshots;
- features its README documents.

Nothing is invented. No world claims a role or a contribution that `src/data/projects.ts` does not record. Where a project has no screenshots (SkyCast, Grama Sathi), its display draws something that is plainly not a reading or a screen.

## Code

- `src/components/world/veil/worlds/kit.ts` holds the builder and materials:
  - **Builder** merges boxes, turned profiles, discs and struts into one vertex-coloured mesh.
  - **Architecture material** provides painted light with switched glow:
    - four channels (`uOn`): lamps, windows, accents, screen frame;
    - a run of lights that come on one after another (`SEQ(k)`, `uSeq`);
    - optional level-meter pulsing (`PULSE`).
  - **Screen material** crossfades, or wipes when `uWipe` is set.
  - **Steam.**
  - **Lit cards.**
- `worlds/stage.ts` holds the shared pieces:
  - the `Pad` and `ProjectWorld` types;
  - plinth, lamps;
  - the kiosk display (`kiosk`), canvas signs (`canvasCard`), a label strip in one draw call (`labels`);
  - ripples, a procedural sky screen;
  - the shared timeline (`beats`);
  - `detailShot`;
  - the texture uploader.
- One file per world. The environment keys them by formation (`WORLDS` in `environment.ts`).

## The nine worlds

| Project (formation) | What stands there | From the project | Size |
| --- | --- | --- | --- |
| Tarang (8) | Band shell in lime and ink. A record spinning on a room-sized deck, its tonearm swinging on. Sixteen level meters that dance once the music starts. Speakers sending rings across the terrace. | README screenshots: home, now playing, stats | 2.8k tris, 6 meshes |
| Rinti AI (7) | Cobalt observatory with a lime slit. The research pipeline the project runs (plan, search, read, check claims, write) as five beacons lit in order. Source cards circling and gathering above the dome. | README screenshots: sign-in, sign-up | 3.0k, 5 |
| AkashaLens (5) | Ground station. A dish that swings from stow onto its pass. A great lens whose glass sweeps a clear frame across a cloudy one. | The repo's `dataset/` cloudy/clear pairs (training images, not model output) | 4.4k, 5 |
| SkyCast (3) | Weather station on the smallest spire. Lattice mast, spinning anemometer, wind vane, louvred instrument screen, rain gauge. A display running a sky through the times of day. | No screenshots. The sky mirrors the app's animated sky. No readings are shown. | 1.5k, 5 |
| Krama (1) | Vermilion gallery with the outlined wordmark on its roof. An ink vitrine lit inside. One car-sized sneaker turning on a plinth. Drop boxes. | README screenshots: home, product, shop, admin | 5.2k, 4 |
| Grama Sathi (4) | Village chaupal. Two thatched huts, a charpai on a raised platform, a loudspeaker whose voice goes out in rings. | The name board says ग्राम साथी, as the case-study world sets it. Three posts for the pipeline the project lists: faster-whisper, Llama 3.3, edge-tts. There is no repository, so there is no screen. | 2.5k, 4 |
| Noir Café (0) | Charcoal hall, cream tower, terrace with five tables. Giant latte. Kiosk. Four-locale menu board. | Palette; Cormorant wordmark (OFL, licence alongside); README screenshots: menu, reservation, shop | 4.8k, 7 |
| PRAHARI (2) | Open pit stepping down inside a raised berm. Sensor posts that report in turn until one turns red. Safety-yellow headframe turning its sheave. Control room. | README screenshot: sign-in. Illustrative only: no number comes from the product. | 1.9k, 4 |
| Portfolio (6) | The site's instrument as an orrery: the SK monogram, three tilted rings with three bodies. Nine lights round the dais for the nine featured projects. | This site's own pages, captured from the current build (`public/world/portfolio/`) | 4.5k, 7 |

All nine together come to about 31k triangles and 47 meshes. A world is skipped entirely (not drawn, not updated) while the camera is more than 340 units from it, so only the one or two worlds near the current stop cost anything.

**Licences.** The screenshots come from the owner's own repositories, which are public with LICENSE files. Cormorant Garamond is SIL OFL 1.1. Its licence file (`public/world/noir/OFL-cormorant.txt`) was empty upstream, in noir-cafe's `src/fonts/OFL.txt`. It now holds the OFL 1.1 text with Cormorant's copyright line.

## Placement

`findPad` (environment.ts) chooses where each world stands:
- It looks for level ground near the top of the formation, on the side that faces the lens.
- The lens position comes from `lensesFor`, the same lenses the herd uses.
- It penalises points where rock rises through the footprint.

Trees are kept clear of three areas, using capsule clearings:
- the pad;
- the sightlines to every lens;
- the low approach of the detail shot.

On Tarang's formation, the Mossback herd's meadow is kept at least 20 units from the pad.

## Choreography

Each chapter is 300svh tall (240svh on phones). `track.phase()` gives the raw position `u` (0 to 1) through the stretch. The camera holds on the island until `PROJECT_HOLD` (0.62), then travels on.

The worlds wake on the presentation value `a = u / PROJECT_HOLD`. `beats()` times them against the move-in, so each world comes alive as the camera arrives.

| `u` | What happens |
| --- | --- |
| 0 to 0.08 | **Arrival.** The establishing shot. |
| 0.08 to 0.46 | **Move in.** The camera eases toward the world's own detail shot (`DETAIL_IN`). |
| 0.19 to 0.45 | **The world wakes.** Lamps first, then the building's light, accents and sign (lettered in), each world's signature motion, the run of sequenced lights, and finally the display powering on. |
| 0.40 | **Introduction.** The caption appears (`data-reveal`). |
| 0.40 to 0.62 | **Exploration.** The camera rests. Displays keep cycling; records, rings and anemometers keep turning. |
| above 0.72 | **Departure.** The caption leaves and the camera travels. The world stays lit once passed. |

Signature motion per world:

| World | Signature motion |
| --- | --- |
| Tarang | The arm swings on, the record spins up, the meters rise. |
| Rinti | Beacons light plan → write, and the sources gather. |
| Akasha | The dish slews onto its pass; the lens wipes cloudy to clear. |
| SkyCast | The wind gets up, and the sky starts its day. |
| Krama | The sneaker turns to present its side; spotlights come on one by one. |
| Grama Sathi | The pipeline posts light hear → answer → speak, then the loudspeaker's rings go out. |
| Noir Café | Steam, lamps, windows, wordmark, then the kiosk. |
| PRAHARI | Sensors report in, one goes red, and the sheave turns. |
| Portfolio | The project lights come on, and the orrery spins up. |

Scrolling back reverses every step. Under `prefers-reduced-motion`, every world is fully lit and the caption shows whenever its chapter is active.

**Composition.** Each world sets its own detail shot in its own frame:
- low and frontal for Tarang;
- high over Rinti's pipeline arc;
- low under Akasha's lens and dish;
- up the SkyCast mast;
- three-quarter on Krama's sneaker;
- raking across Grama's chaupal;
- straight down into PRAHARI's pit;
- level with the orrery.

On desktop the look point sits left of the world's middle, so the world fills the right of the frame, clear of the caption. On phones the caption is a sheet below, so the camera aims at the world's `centre`, steps back to fit its width, and keeps it in the upper half.

**Slower, but not laggy.** The pacing comes from chapter height alone. Lenis is untouched (`lerp 0.1`). There are no added delays and no extra damping.

## Caption

The caption is HTML, in the project's own colours (`--pal-bg`, `--pal-fg`, `--pal-ac` from `p.palette`). It is translucent, and solid under `prefers-reduced-transparency`.

It holds:
- the kicker;
- the title and tagline;
- role and team, when the data has them;
- the description, folded under "About the project";
- up to five technologies;
- the links.

## Refinement pass (audit, 2026-11-07)

Audit of the nine worlds at 1920×1080, detail shots, before any change. What failed, world by world, and what the pass does about it.

**Shared (all nine).**
- Every box has hard, unlit edges, so forms read as primitives. Boxes get a chamfer that catches the light.
- Flat colour per part: no tonal breakup, no wear. The architecture shader gets a painted tone breakup and grime toward the ground.
- Plinths are pale featureless slabs, and the island's grass pokes through their tops. They become paved stone terraces with a dressed kerb, set a little above the ground.
- Lamps are lollipops (a pole and a ball). They become lantern posts.
- Displays: the brush pass smears every screenshot and sign; screenshots are stretched to the plane (Rinti's portrait pages worst); pictures are 1024 px though the repos hold 1440 px originals. Screens and signs are kept out of the brush pass, pictures are fitted (cropped, never stretched) and re-encoded from the original captures, filtering uses the GPU's full anisotropy.
- No high-resolution preset: the pixel ratio is capped at 1.5.

| World | Audit | Pass |
| --- | --- | --- |
| Tarang | Record is a flat disc; tonearm a stick; meters a flat yellow bar chart; Mossbacks tower over the shell. | Grooved vinyl with a moving sheen, label, platter rim; jointed tonearm with headshell and counterweight; meters as segmented LED columns; herd moved back and scaled to the stage. |
| Rinti AI | Pipeline beacons are bare spheres on posts; screens stretched. | Beacon housings with collars and a lit lens, a lit conduit between stages; screens fitted. |
| AkashaLens | Lens shows the pair with no explanation. | A plate on the lens stand states what the pictures are (dataset pairs: cloudy input, clear target). Dish gets a ribbed back and feed horn. |
| SkyCast | Mast and screen are thin and lost on the slab. | Instrument details, a cobalt-trimmed equipment hut; the display keeps showing no readings. |
| Krama | Sneaker is a lumpy blob; gallery is a flat orange box; wordmark crops on phones. | New sneaker: last-shaped upper, midsole with sidewall, outsole, toe cap, collar, laces, heel tab; gallery with portal frame and plinth; wordmark lowered and narrowed. |
| Grama Sathi | Huts are cones on cylinders; board flat. | Thatch with layered eaves, mud walls with a plinth band, posts; board framed on legs. |
| Noir Café | Glazing hides the bar. | Lit interior brought forward. |
| PRAHARI | Benches are plain rings; sensors tiny; alert hard to see. | Bench faces stepped and toned as strata; larger sensor heads; the red alert pulses with a halo; a plate says the readings are illustrative. |
| Portfolio | Captures may drift from the build. | Re-captured from the current build; a script regenerates them. |

### Outcome

What shipped, beyond the table above:
- **Shadows.** Each world bakes its own sun shadow map once, before warm-up. The map is 1024² on desktop and 512² on phones, with an orthographic camera covering ±22 units around the world. Only the architecture mesh (`name = 'arch'`) casts. Before this, the worlds sat outside the hero's shadow map and had no shadows at all.
- **Screens and signs stay sharp.** Screens and cards write alpha 0. The brush (Kuwahara) pass passes those pixels through untouched. Pictures are cover-fitted with `fit()` in `kit.ts`: a wider picture loses its sides, a taller one shows from the top, and nothing is stretched. Sign canvases draw at 2× on desktop.
- **Pictures at native size.** No genuine source above 1440×900 exists for any project, so none is upscaled. Each picture is re-encoded from its original capture at native size. Portfolio's three captures are regenerated from the current build by `scripts/capture-portfolio-screens.mjs`.
- **Phone framing.** Each world passes its own framing centre to `detailShot`, and the phone step-back grows on tall screens. At 390×844, every main installation now fits in frame.
- **Mossbacks** graze farther from the Tarang pad, at the stage's scale.
- **Ultra preset.** See `docs/PERFORMANCE.md`.

Not reworked in this pass: terrain, vegetation, water and atmosphere; creature models; Noir's glazing.

## Open

- Noir's bar and pendants behind the glazing are hard to read through the painted pass.
- Environment (geology, vegetation, water, atmosphere) and creature models were not refined in the 2026-11-07 pass.
- No project has a capture above 1440×900. Sharper screens at 4K need new native captures from each project.
- The brief's SoleVerse is Krama: the data records it as Krama's former name. ArthaYukti is not in the project data, so it has no island until its details are supplied.

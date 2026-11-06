# Creatures

Five original species for the Veil Archipelago. The concepts below were approved and built. **Built** (at the end) records what shipped and where it differs from the concept.

**Originality.** These are not taken from any film or game.
- None is six-legged.
- None is a four-winged pterosaur.
- None is a floating jellyfish-seed.
- None has a hammer-shaped head crest.

Each silhouette comes from a different real-world body plan: cuttlefish, samara seed, pangolin, tortoise and elephant, moth.

**Scale.** Hero trees are 10–15 units tall.

**Pipeline.** The same one as the islands:
- Bodies are signed-distance sculpts meshed with `meshGrid`, with baked AO.
- Membranes and wings are parametric sheets with UVs, so they can flap or undulate in the vertex shader.
- Colour and glow are baked per vertex.
- Lighting uses the shared `paint()` model, plus fog.
- Flocks are instanced.

## 1. Veil Drifter (large aerial)

- **Size:** about 14 units long, 18 units across the fins.
- **Body:** long and blunt-headed. A continuous scalloped fin skirt runs down both sides, like a cuttlefish.
- **Tail:** two trailing ribbons.
- **Mouth:** a fringe of short feeding tendrils.
- **Colour:**
  - dusk-blue back with teal speckles;
  - cream belly;
  - fins translucent from peach to teal, with darker ribs, and they glow when backlit.
- **Behaviour:** drifts slowly between formations. Fin waves run down its length. It grazes on spores above the cloud sea.
- **Signature moment:** one passes behind the hero island during the About overlook.

## 2. Spinlets (small aerial, flocks)

- **Size:** about 0.5 units.
- **Body:** a seed-like body with two long forward blades and two short hind blades.
- **Colour:** amber and rust, with dark tips.
- **Behaviour:** flocks of 40–80. They spin like samara seeds when they glide, then flap in bursts and wheel together.
- **Signature moment:** a flock lifts off the canopy as the camera arrives at an island.

## 3. Shingleback (canopy dweller)

- **Size:** about 1.5 units.
- **Body:** round, with overlapping bark-like plates tipped with moss.
- **Tail:** long and prehensile, curled around branches.
- **Limbs:** short, with hooked claws.
- **Face:** large dark eyes.
- **Behaviour:** clings under boughs. It curls into a ball when the camera passes close, then slowly uncurls.
- **Signature moment:** two hang from the giant trees on the hero island.

## 4. Mossback (large terrestrial)

- **Size:** about 6 units tall.
- **Body:** a barrel body on four columnar legs with wide, flat feet.
- **Head:** a low head with a broad shovel snout, and forward-curving tusk plates on the lower jaw.
- **Back:** a living carpet of moss, shrubs and ferns, grown with the existing flora system.
- **Colour:** slate-grey hide with a lighter belly.
- **Behaviour:** grazes slowly. When it stands still it reads as part of the landscape.
- **Signature moment:** a small herd crosses a clearing on one of the large far formations.

## 5. Lumen Moth (bioluminescent)

- **Size:** about 0.6 units.
- **Body:** a fuzzy body with feathery antennae and two pairs of broad wings.
- **Markings:** teal eyespot rings and vein lines in the same colour as the islands' mineral seams, because it feeds on them.
- **Behaviour:** clusters on shaded cliffs and around the crystals. The wings pulse slowly, and they scatter when disturbed.
- **Signature moment:** a glowing cluster under the hero island in the Toolkit view.

## Built

Code: `src/components/world/veil/fauna.ts`. Turnaround sheet: `lab/creatures.html?c=0..4&v=0..2` (species, view), lit by the real environment with the sun behind the camera.

**Shared material.** `faunaMaterial` uses the shared `paint()` light and fog, with per-vertex colour and glow. Membranes are parametric sheets: a wave runs along `u` and its amplitude grows along `v` (fin ripple), and `uLift` folds the sheet about its root (wingbeat). Each individual gets its own phase from its position, so instanced crowds never move in step.

| Species | Triangles | Motion | Where it lives |
| --- | --- | --- | --- |
| Veil Drifter | 17k | Fin waves along both skirts, ribbon tails | Two. One loops behind the hero and crosses the arrival view (never nearer than about 90 units to any stop's camera). The other sweeps the far formations. Drawn 2.2× and 3× concept size so they read at camera distance. |
| Spinlets | 1k each | Wingbeat (fast fold of the blades), banking turns. The whole flight runs in the vertex shader (`FLOCK`), so no instance data is uploaded per frame (see PERFORMANCE.md) | Two instanced flocks of 40 (24 on low tier) wheel in the open sky either side of the hero. Over the hero they would sit behind the title and tagline in the arrival view. |
| Shingleback | 17k | None yet | Two on the hero's canopy floor. Not yet confirmed visible from any stop. |
| Mossback | 20k | The head dips to graze and lifts again, hinged at the neck; the body stays still | A herd of three on the open top of far formation 8, which is Tarang's island (the first project stop). |
| Lumen Moth | 2k each | Slow wing pulse | 24 instanced (12 on low tier), resting flat on the shaded cliffs under the hero. Seen in the Toolkit view. |

**Placing the herd.** The spot must be seen by the shot, so the placement asks `camera.ts` (`lensesFor`) where the lens stands for that formation's project shot, at five screen shapes from phone to wide desktop. It ranks flat ground toward the lens and keeps only spots that pass three tests:
1. Rays to every lens clear all formations and the hero.
2. A second, lower ray clears the other formations' canopies.
3. There is enough level ground for three animals a body length apart.

Trees are then kept off the meadow and off the sightlines to the lens: `scatterForest` clearings can be capsules. The giant's plateau (Grama Sathi's island) was tried first and fails test 1: far 1 hides it from that shot.

**Size.** Mossbacks are drawn a quarter larger than the far trees' scale would make them, so they still read at the shot's distance.

**Differences from the concept, still open:**
- Motion runs on time, not scroll. Nothing is scroll-synced yet.
- The Drifter does not yet pass on cue in the About overlook.
- Spinlets do not lift off the canopy as the camera arrives.
- The Shingleback hangs nowhere and does not curl.
- The herd grazes in place rather than crossing its clearing.
- Moths do not scatter.
- On a phone the herd is only a few pixels tall.

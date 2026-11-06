# Creature concepts (awaiting approval)

Five original species for the Veil Archipelago. These designs are proposals. Nothing is modelled, animated or placed until they are approved.

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

## After approval

1. Build `veil/fauna.ts` and a lab turnaround sheet. Screenshots come back for a second look.
2. Animation: fin waves, flapping, spinning, a walk cycle, curling. Done in the vertex shader, driven by `uTime`.
3. Placement and signature moments, synced to scroll.
4. Performance check: an A/B against the current build.

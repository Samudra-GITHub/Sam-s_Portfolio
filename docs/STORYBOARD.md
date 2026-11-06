# Storyboard: flying introduction and project islands

Part of the Veil Archipelago direction. Everything below is grounded in `src/data/projects.ts`; no project gets a capability it does not have.

## A. Opening sequence and typography flight

The hero section is two screens tall. Its content is sticky, so the flight plays while the visitor scrolls the first screen. The camera moves forward through the archipelago at the same time, toward the first project island.

| Beat | Scroll | Typography | Camera / world |
|---|---|---|---|
| 1. Arrive | 0% | Sky and haze appear first, then the hero island fades in under the text | Establishing view, the hero island low in frame |
| 2. Settle | 0% (after load) | Name, role and sentence rise into place in three depth layers: the name nearest, the role in the middle, the sentence furthest | The island and drifting spores respond slightly to the pointer |
| 3. Lift-off | 0–25% | "SAMUDRA" banks left and climbs; "KAR" banks right a beat later | Camera starts a slow forward dolly |
| 4. Glide | 25–70% | Each word follows its own curved path (an S-curve with a bank into the turn), grows smaller as it recedes in depth and picks up a soft blur trail. The role line and the sentence words leave next, at lower and deeper planes | Camera passes the hero island's flank |
| 5. Vanish | 70–100% | The words thin into the haze at different distances. Opacity drops only in the last stretch, after the shrink and blur have done the work | The first project island (Tarang) enters the frame |
| 6. Arrive at work | next screen | — | Camera settles on Tarang's island; its panel slides in beside it |

- **Reduced motion:** the text fades and rises a little, with no flight paths. The camera cuts to each shot without travelling.
- **Phones:** the same choreography with shorter paths, words rather than letters, and no blur trail.
- **Accessibility:** the `h1` keeps the real text. The flying pieces are `aria-hidden` copies.

## B. Project islands

> **Status: pending the new pipeline.** The first toon-shaded build of these islands was rejected on visual quality and removed. The live site now has only the sculpted hero island (`src/components/world/veil/`, see `docs/HERO_ISLAND_PIPELINE.md`). Each project chapter currently frames a different face of the hero. The designs below still stand. Each one will be rebuilt on the hero pipeline (density spec, Blender sculpt and bake, painted shading) one island at a time, with a visual sign-off for each.

The plan: one island per featured project, nine in all, arranged in a wide ring around the hero island, so the camera travels from one to the next and then returns home for the later chapters. Each island has its own silhouette, its own palette (taken from the project's own palette and translated into the world's natural tones), a landmark that comes from what the project actually does, and one animated element.

| Project | What it really is | Silhouette | Landmark (the focal point) | Palette | Living detail |
|---|---|---|---|---|---|
| **Tarang** | Music streaming web app with a floating player | Terraced: stepped shelves like a waveform | A ring of standing stones whose heights trace an equaliser, around a slowly turning dark disc | Warm ochre, chartreuse foliage, a vermilion accent | The disc turns and the stones pulse gently |
| **Rinti AI** | Research engine: plans sub-queries, gathers sources, writes cited answers | Spire: tall and narrow | A stack of rotated layers (planning stages) topped by a beacon, with small source stones orbiting on thin threads | Mineral teal, deep blue stone, lime glints | The source stones orbit the spire |
| **AkashaLens** | U-Net cloud removal for satellite imagery (prototype, ISRO Hackathon) | Mesa: high plateau, sparse plants, sits highest in the sky | Two dishes aimed upward and a scanning ring; half the island is wrapped in its own cloud, half clear | Cool stone, ink, a pale teal scan | The scan ring sweeps; the cloud drifts across |
| **SkyCast** | Weather app (forecast, UV, air quality) | Classic deep cone with several waterfalls | Three wind turbines and an anemometer mast, with cloud formations hugging the rim | Sky teal, pale stone, white water | Turbines spin; the clouds and water move |
| **Krama** (formerly SoleVerse) | Luxury sneaker storefront: editorial lookbook, drops | Shelf: wide, thin, flat-topped | A cantilevered stone runway past the rim, a row of plinths with sculptural pieces, a framing arch, warm spotlights | Sand, ink, a vermilion accent | The pieces turn slowly on their plinths |
| **Grama Sathi** | Hindi voice assistant for rural India | Rounded cone with crop terraces | A giant banyan-like tree with hanging aerial roots; rings of sound ripple outward from it | Sand, field green, warm ochre | Ripples expand and fade |
| **Noir Café** | Specialty-coffee brand site; editorial, night | Dark basalt mesa | A glass pavilion glowing amber, lanterns and a steam plume | Basalt, coffee brown, amber light: the world's one night pocket | Steam rises; the lanterns flicker softly |
| **PRAHARI** | Mine safety and compliance platform: sensors, risk score, audit | Cut cliff: quarry terraces carved into one face | A lattice headframe tower and sensor beacons on poles | Dark stone, an amber signal | The beacons blink slowly |
| **Portfolio** | This site | Small, twin-lobed | An orrery: a pillar with rings and tiny orbiting islets, the archipelago in miniature | Linen, jade, teal | The rings and islets turn |

### Project presentation

When the camera settles on an island, a panel beside it shows real data only:
- category
- title
- tagline
- description
- two highlights
- role or team credit, where recorded
- stack
- honest status
- links: the case study, plus the live site and source code where they exist

**Screenshots: open item.** The repository has no project screenshots yet (the `image` field is unused). Panels link to each project's case study page and live demo until real screenshots are supplied. They are not faked.

### Not included

ArthaYukti appears in the brief but is not in the project data, so it has no island until its details are supplied.

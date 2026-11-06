# Hero island: rendering audit, new pipeline, concept v1

Status: **concept v2 (sculpted) approved and live on the homepage.** Project islands come next, one at a time, on this pipeline.

Live concept: `npm run dev`, then open `/lab/hero-island.html`.
- Camera shots: `?shot=0` to `3`.
- Free camera: `?cam=x,y,z&look=x,y,z&fov=n`.
- `?paint=0` turns off the paint filter.
- `?q=low` is the phone budget.
- Drag to orbit.

Renders are in `docs/concept/hero-island/`. `00-rejected-current.png` is the island being replaced.

## 1. What the current island is (and why it fails)

The current islands (`src/components/world/island.ts`) are fully procedural, built in the browser, with no imported or authored assets.

| Part | How it is built | Why it reads as a casual game |
| --- | --- | --- |
| Rock | A `LatheGeometry` (a profile spun around an axis) pushed by value noise, then vertex-coloured | A spun shape is always a cone or bowl. It cannot overhang, crack or hang lobes. The noise only wobbles the cone. |
| Trees | Instanced faceted spheres (`crownGeometry`) on instanced cylinder trunks | Every crown is the same primitive. One species. No leaves, no branches. |
| Shading | `MeshToonMaterial` with a 4-step ramp | Flat toon bands, no shadows, no ambient occlusion. That is the "basic 3D game" lighting. |
| Water | A single ribbon shader per fall | Thin, single-layer, with no spray or mist. |
| Atmosphere | A CSS gradient behind the canvas plus a fog colour | Flat and empty, with no depth layers. |

## 2. The new pipeline

The concept replaces every layer. It is still generated in code because this workstation has no Blender and only an Intel UHD GPU. The generator is plain TypeScript, so the same code can run offline to bake assets (see section 5).

1. **Geology is a density field, not a profile.** `src/lab/hero-island/terrain.ts` defines rock as "density > 0" and builds that field from:
   - a domain-warped plateau;
   - karst crags terraced by rock layers;
   - an oval body with an overhanging lip;
   - layer ledges and vertical erosion grooves;
   - bulges and recesses at every height;
   - hanging lobes and carved caves;
   - river channels cut into the top.

   It is meshed with surface nets (a method that turns the field into a smooth triangle mesh). Normals come from the field gradient, and ambient occlusion is baked per vertex by casting rays through the field.
2. **Painted rock material.** `shaders.ts` gives the rock:
   - tilted rock layers of uneven thickness;
   - dark crevices between the layers;
   - a cooler, darker underside;
   - moss on ledges and moss streaks dripping from the rim;
   - teal mineral veins;
   - procedural relief that perturbs the normals.
3. **One painted light model for everything:**
   - a soft two-step key light with brush-noise edges at the shadow line;
   - violet-teal shadow fill;
   - warm bounce light from the cloud sea;
   - a rim light from the low sun;
   - real sun shadows from a depth pass, filtered with PCF (percentage-closer filtering, which softens edges);
   - aerial perspective that warms toward the sun.
4. **Vegetation from growth rules, not primitives.** `flora.ts` builds:
   - five tree species: a buttressed umbrella giant, a tiered spire, a weeping tree with hanging strands, a flowering tree, and shrubs;
   - fern fronds on the forest floor;
   - branching tapered trunks carrying clusters of alpha-cut painted leaf cards. The card normals are bent to the crown's volume, and leaves glow when backlit.

   Placement follows a forest mask, altitude (spires on the crags) and rivers (weeping trees near water, banks kept clear). The rim gets drapery, roots, moss strands and mineral crystal clusters. All foliage is instanced.
5. **Water systems.** Three river channels run across the plateau. Each ends in a three-sheet waterfall:
   - the sheets follow a gravity arc and widen as they fall;
   - they break up into spray low down, with mist at the base.

   A fourth fall pours out of a cave mouth.
6. **Atmosphere in layers:**
   - nine far formations, generated the same way at lower resolution, each with its own forest;
   - a noise-shaded cloud floor;
   - cloud puffs lit from above with cool undersides;
   - cloud banks on the horizon;
   - a painted sky with high streaks of cloud;
   - drifting spores.
7. **Painted finish.** Two post-processing passes:
   - a Kuwahara filter (radius 2), which turns pixel detail into brush strokes;
   - a colour grade: gentle S-curve, teal-violet shadows and warm highlights, slight saturation, vignette, paper grain.

## 3. Concept v1 against the art direction

Met, or clearly better than before:
- an irregular mountain with overhangs, a lip, hanging lobes, caves, rock layers, erosion grooves and mineral seams. It is no longer an inverted cone;
- several distinct tree species, layered foliage, roots, moss and drapery;
- several wide, layered waterfalls with spray and mist;
- real cast shadows, warm key against cool fill, atmospheric depth, distant formations, and cloud layers;
- it holds up as a still image. Nothing depends on animation.

Not yet at the bar. This is honest feedback for the approval call:
- **Foliage close up is the strongest part.** At distance, the Kuwahara filter merges the leaf cards into blocks, which still hints at low-poly. Two options: bake impostors (pre-rendered tree images) with painted alpha for distant trees, or make the paint radius scale with depth.
- **Rock reads as stylised, not filmic.** The field gives the right forms but not sculpted macro detail: fractured planes, scree slopes, crisp ledge lips. That needs either a sculpt-and-bake pass in Blender or tileable normal and roughness maps. Section 5 covers the cost.
- **The haze is a little milky** in the wide shot. The fog distance and the cloud-floor value need one more grading pass.
- **The cloud puffs repeat** at distance. They need more atlas variants, or a raymarched cloud layer on desktop only (rendered by stepping through a density volume).
- **This is not film-quality.** It is a clear step toward the painted-3D look, but a hand-sculpted, hand-painted hero asset would still beat it.

## 4. Performance (measured, 1600×900, headless Chrome on Intel UHD)

| | Desktop | Phone budget (`q=low`) |
| --- | --- | --- |
| Build time (generated in the browser) | about 16 to 22 s | about 9 s |
| Triangles per frame | about 1.3 M | about 0.9 M |
| Draw calls | 45 to 49 | 46 |
| Shadow map | 2048², rendered once | 1024² |

The build time and phone triangle count are **not acceptable for the site**. This page is a quality reference, not the shipping form. Hence the plan below.

## 5. Implementation plan (after approval)

1. **Bake offline, don't generate on load.**
   - Run the same generator in Node (`scripts/bake-island.mts`) to write GLB files: rock mesh with normals and AO, trunks, and per-species foliage instance tables.
   - Compress them with `gltf-transform` + meshopt (both already in `node_modules`) and KTX2 textures.
   - Target: hero island ≤ 1.5 MB, loaded in under 1 s, with no main-thread generation.
2. **Level of detail (LOD):**
   - Rock in three levels (grid cell 0.024, 0.04 and 0.07 radius units).
   - Foliage: card clusters close up, impostor billboards in the middle distance, coloured canopy shells for the far formations.
   - Phones get LOD1 rock, half the foliage, no Kuwahara and a 1024² shadow map. Target about 300k triangles and 30 draw calls.
3. **Sculpt pass (optional, the biggest quality jump).**
   - Install Blender (free; needs your OK to download).
   - Import the baked rock, sculpt fractured cliff planes and ledge lips, then bake normal and cavity maps back onto the low-poly mesh.
   - Hand-paint one rock texture set and one foliage atlas. This is how Arcane gets its hand-made surface.
4. **Integrate into the site.**
   - Replace `buildIsland` in the world scene with the baked hero.
   - Keep the scroll camera and the flying intro.
   - Reduced motion: still frame, no camera flight. No WebGL: the existing CSS fallback.
5. **Only then: the project islands.** Each gets its own density spec, palette and landmark, all on the same pipeline.

## 5b. Blender sculpt pass (done, concept v2)

Tooling:
- Blender 5.2.3 LTS, portable. Source zip checked against the official SHA-256.
- Lives at `~/.claude/tools/blender`, outside the repo.

Pipeline:

1. `node scripts/export-hero.mjs 0.02` runs the same generator in Node via Vite's module loader. Output: `art/hero-island/rock_base.ply` (74k verts, 149k tris), git-ignored.
2. `blender -b --factory-startup -P art/hero-island/sculpt.py -- 0.2 2048` runs headless in about 50 s:
   - **Voxel remesh** at 0.2 units: 623k verts.
   - **Fracture:** Voronoi cells over the cliff surface at two scales, about 360 large and 2,600 small. Each cell is flattened toward its own randomly tilted plane and stepped in or out, which gives chiselled faces with cracks between them. Only steep faces are touched, so the plateau, river channels and waterfall lips stay where the scene expects them.
   - **Ledge lips:** each rock layer gets a crisp overhanging lip at its top and a recess below.
   - **Erosion relief:** fractal and ridged displacement along the normal, stronger on cliffs.
   - **Low meshes:** decimated to 58k tris (LOD0) and 20k tris (LOD1), UV-unwrapped with smart project.
   - **Cycles bake (CPU):** an object-space normal map at 2048, plus ambient occlusion into vertex colours.
   - **Export:** meshopt-compressed `public/world/hero/rock_lod0.glb` (1.95 MB) and `rock_lod1.glb` (0.82 MB), plus `rock_normal.webp` (1.05 MB). The `.blend` is saved next to the script, git-ignored.
3. The lab page loads the baked rock by default (`?rock=field` shows the unsculpted version). The rock shader samples the object-space normal map in place of the geometric normal and keeps its painted layers, moss and veins on top.

Effect, comparing `11-14-sculpted-*.png` with `01-04-*.png`:
- cliffs now break into planar facets, stepped cracks and crisp ledges instead of smooth noise;
- the underside reads as fractured, recessed rock.

Load is now about 7 to 11 s on desktop (was 16 to 22 s), and the phone budget is 785k tris.

Still open:
- **Phone budget:** foliage instancing, not rock, dominates the triangle count. Phones need foliage LOD and impostors (section 5, step 2).
- **Asset size:** now meshopt + WebP, 3.0 MB on desktop and 1.9 MB on phones. Quantising positions and a KTX2 normal map would bring it closer to the 1.5 MB target.
- **Kuwahara hides fine sculpt detail.** Consider scaling the paint radius with depth, or masking it off rock close up.
- **Scripted, not hand-sculpted.** A hand pass on the saved `.blend` (hero crags, signature arch) is still possible later.

## 5c. Site integration (done)

- The generator modules live in `src/components/world/veil/`: `terrain`, `spec`, `shaders`, `flora`, `environment` (builds the whole scene), `paint` (the composer).
- `World.tsx` builds the environment inside the R3F canvas. It renders through the painted composer at `useFrame` priority 1.
- The camera stops are retuned to the hero's scale. Each project chapter frames a different face of the hero until its own island exists.
- Phones use rock LOD1, fewer plants and a 1024 shadow map, and skip the Kuwahara pass.
- Reduced motion freezes time and the camera flight. Without WebGL, the CSS fallback stays.
- The lab page (`/lab/hero-island.html`) renders the same environment alone.

## 6. Decisions needed (historical, concept v1)

- Is concept v1 the right direction? If yes, which gaps from section 3 must close before integration?
- Sculpt pass in Blender (about a day of work, needs a Blender download), or stay fully procedural?
- Keep the four camera shots as the hero composition, or reframe?

# Project worlds

Each project island is to carry a small world built from that project. Noir Café is the first, and it is the prototype for the rest. The other islands keep their current dressing until Noir is approved.

**Rule.** Everything in a world comes from the project itself:
- its palette and typeface;
- its own screenshots;
- features its README documents.

Nothing is invented. No world claims a role or a contribution that `src/data/projects.ts` does not record.

## Noir Café (formation 0, stop 7)

Code: `src/components/world/veil/worlds/noir.ts`, built from the shared kit in `worlds/kit.ts`.

| Piece | Source in the project |
| --- | --- |
| Charcoal hall, cream tower, copper trim | Palette `#1b1410` / `#f3e9dc` / `#c98a4b` |
| Wordmark on the fascia: a ring, then NOIR CAFÉ | Cormorant Garamond, the brand display face (OFL; `public/world/noir/cormorant.woff2` with its licence) |
| Ordering kiosk whose screen cycles menu, reservation and shop | The repo's own README screenshots (`assets/readme/screens/*-desktop.jpg`), resized to 1024 px WebP in `public/world/noir/` |
| A-frame board listing Menu / メニュー / Carte / Menù with EN·USD, JA·JPY, FR·EUR, IT·GBP | The four locales and currencies the site ships |
| Giant latte with a rosetta and a steam plume | The latte pour of the case-study world (`components/work/worlds/NoirWorld.tsx`) |
| Terrace: five tables, cups steaming | Scenery |

**Size.** About 4.8k triangles in 7 meshes, so 7 draw calls. The architecture is one merged mesh with baked colour and AO. Lamps, windows, accents and the screen frame switch on through four glow channels in one material (`uOn`). The steam is one mesh of camera-facing wisp cards.

**Placement.** `findPad` (environment.ts) chooses where the world stands:
- It looks for level ground near the top of the formation that faces the lens.
- The lens position comes from `lensesFor`, the same lenses the herd uses.
- It penalises any point where rock rises through the footprint.

Trees are kept off the pad and off the sightlines to every lens, using capsule clearings.

## Choreography

The chapter is now 300svh tall (240svh on phones). Inside it, `track.phase()` gives the raw position `u` (0 to 1) through the stretch. The camera holds on the island until `PROJECT_HOLD` (0.62), then travels on to the next island.

| `u` | What happens |
| --- | --- |
| 0 to 0.08 | **Arrival.** The establishing shot, the same island framing as before. |
| 0.08 to 0.46 | **Move in.** The camera eases toward the world's detail shot (`DETAIL_IN`, smoothstep). The detail shot is set in the world's own frame and turned into world space. |
| 0.06 to 0.32 | **The café opens.** The order is: lamps, steam, windows, copper accents, wordmark (lettered in left to right), screen (a power-on band). These run on the presentation value `a = u / PROJECT_HOLD`. |
| 0.40 | **Introduction.** The caption appears (`data-reveal`). |
| 0.40 to 0.62 | **Exploration.** The camera rests on the detail shot. The kiosk keeps cycling the screenshots. |
| above 0.72 | **Departure.** The caption leaves and the camera travels. The world stays lit once passed. |

Scrolling back reverses every step. Under `prefers-reduced-motion` (STILL), the world is fully lit and the caption shows whenever its chapter is active.

**Slower, but not laggy.** The pacing comes from chapter height alone. Lenis is untouched (`lerp 0.1`) and there are no added delays or extra damping. Input moves the camera on the same frame.

## Caption

The caption is still HTML, in the project's own colours: `--pal-bg`, `--pal-fg` and `--pal-ac` come from `p.palette`. It is a translucent panel at 90%, and solid under `prefers-reduced-transparency`.

It holds:
- the kicker: number, category, year;
- the title and the tagline;
- the role and team, when the data has them;
- the description, folded under "About the project" (`<details>`);
- up to five technologies;
- the links: case study, live site, source.

It stays in the left gutter, clear of the island. On phones it is a bottom sheet.

## Open

- On phones, the kiosk screen falls just outside the right edge of the detail shot.
- The bar and pendants inside the glazing are hard to read through the painted pass.
- No other project has a world yet. The brief's examples (ArthaYukti, SoleVerse) are not projects in `src/data/projects.ts`. The nine featured projects are Tarang, Rinti, Akasha, SkyCast, Krama, Grama Sathi, Noir Café, Prahari and this portfolio.

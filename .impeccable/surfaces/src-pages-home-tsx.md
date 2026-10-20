---
version: 1
slug: "src-pages-home-tsx"
primary_target: "src/pages/Home.tsx"
related_targets: ["src/pages/ProjectDetail.tsx"]
---

# Home + case studies

Scope: the whole portfolio (home `/`, case studies `/work/:slug`, 404). Visitor mode: Experience.

Audience and job: recruiters (20-second scan: who, what, proof, contact), studios (craft), freelance clients, peers. Success: visitor names Samudra, recalls the orrery and at least one world, and finds Instagram/GitHub/LinkedIn.

Constraints: keep every feature, evolved (the featured worlds, case studies, toolbox from project tech, about desk content, cursor, sound, loader, Kage). The cartoon companion was removed at the owner's request (2026-10-20) and replaced by the SK monogram. Every suitable GitHub repository is represented (docs/github-project-audit.md): featured worlds first, then "More work". No invented claims. Kage assets untouched.

Memorable moment: a planet leaving its orbit, passing in front of the name, and landing as the focus with its real project beside it.

## Decisions recorded

- Hero identity: three treatments were sketched in `.impeccable/mocks/hero/sketches.html` (A split with the monogram as the orrery's centre, B editorial one-line band, C engraved seal). Picked A: B clips the name at desktop and fails on phones, C demotes the orrery. No portrait exists, so none was used.
- The plate does not bleed on compact screens: the owner asked for nothing to be clipped. On phones it becomes a numbered diagram; names are carried by the readout and the index directly below.
- The white sheet (About, case-study bodies) is the cyanotype's own other material: white is where light never reached the paper. It gives the long blue page a quiet passage. Objects on it are hairline-framed, without shadows. The facet cards keep a slight tilt and stay draggable: About is a desk the visitor discovers (an owner-kept feature), and a few degrees of rotation is what makes the objects read as set down rather than laid out in a grid.
- Contact's body is an SVG enamel disc on two hairline orbits (the hero's vocabulary); the WebGL field behind it only draws the night ground, stars and the cursor light.
- The project worlds keep their own visual languages (including the hard-shadow kits some of them use). Each world illustrates its project; the instrument frames them as enamel bodies and does not repaint them.

- 2026-10-20 creative reset (owner: the hero felt conventional). Three homepage concepts were prototyped in `.impeccable/mocks/home/` (A digital universe, B cinematic portal, C interactive studio). A won: it grows the existing orrery into an environment around the name, carries real project selection, and works on a phone as a rail. B read as a film the visitor watches rather than explores; C turned projects back into cards. The loader was removed; the universe's own sub-second entrance replaces it.

## Direction contract

THESIS: The portfolio is one working instrument, a cyanotype orrery with Samudra at the centre and his projects on its rings; scrolling turns it. It refuses the category default of a name hero above a grid of project cards, and the loud sticker-collage of the previous build.

OWN-WORLD: Drenched Prussian cyanotype blue ground (deep to mid blue, never black), with the unexposed white sheet for quiet passages. White engraved hairline linework, dashed for available and solid for committed, enamel discs in each world's own palette. Archivo across its width axis: expanded caps for display, normal width for reading; JetBrains Mono for instrument readouts. No cards, no shadows, no rounded tiles; hierarchy by type size alone. Labels sit beside their bodies with a ground-colour halo and step aside to avoid collisions.

STORY: Visitor learns who he is in one line, sees the featured worlds as one system, turns through them, sees the rest of the work as smaller bodies, opens a case study, ends at three contact rows.

FIRST VIEWPORT: Full-bleed scene. SAMUDRA KAR centred at about 13rem in wide caps, nine tilted rings in perspective around it (near halves in front of the name, far halves behind), project planets on them. Upper left: one plain line of who he is and the most-used tools; upper right: the count of worlds and how to explore. A rail of named world buttons along the bottom. Selecting a world moves its planet to the right-hand focus slot and opens its panel on the left. Nav is a transparent mono strip over the scene.

FORM: Cyanotype Orrery, position 7 of 7 on the ordered list (assigned). seed:261c1fb50f439635. Signature interaction: scroll and drag turn the orrery; bodies are links; the conjunction readout updates. Motion grammar: orbital, continuous, velocity-coupled, ease-out on arrivals, nothing bouncy.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

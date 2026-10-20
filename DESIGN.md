---
name: Sam's Studio
description: The portfolio of Samudra Kar, printed as a working cyanotype orrery.
colors:
  cyanotype-deep: "#081c4a"
  cyanotype-night: "#0b2560"
  cyanotype-strip: "#0e2d72"
  cyanotype-ground: "#123a8c"
  cyanotype-lit: "#1a49a6"
  cyanotype-exposed: "#2a5cc0"
  engraved-line: "#eef2fc"
  engraved-line-soft: "#aebee2"
  hairline: "rgb(238 242 252 / 0.22)"
  hairline-strong: "rgb(238 242 252 / 0.5)"
  sheet: "#f3f5f9"
  sheet-shade: "#e4e9f3"
  sheet-ink: "#0e2d72"
  sheet-ink-soft: "#3d5591"
  sheet-hairline: "rgb(14 45 114 / 0.2)"
  signal-lime: "#d8f827"
  enamel-cobalt: "#1e3ae8"
  enamel-vermilion: "#ff5226"
  mount-ink: "#111215"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "min(6.3vw, 14dvh, 7.25rem)"
    fontWeight: 760
    lineHeight: 0.84
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 1.6rem + 3.4vw, 4.6rem)"
    fontWeight: 760
    lineHeight: 0.95
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 1.2rem + 1.6vw, 2.6rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  index-row:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1rem + 2.2vw, 3rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 100"
  tagline:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 1.02rem + 0.55vw, 1.45rem)"
    fontWeight: 600
    lineHeight: 1.25
    fontVariation: "'wdth' 112"
  body-lg:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 1.02rem + 0.55vw, 1.45rem)"
    fontWeight: 400
    lineHeight: 1.42
  body:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.94rem + 0.25vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label-floor:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
  label:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.1em"
    fontFeature: "'tnum' 1"
rounded:
  none: "0"
  disc: "50%"
spacing:
  s-1: "0.25rem"
  s-2: "0.5rem"
  s-3: "0.75rem"
  s-4: "1rem"
  s-5: "1.5rem"
  s-6: "2rem"
  s-7: "3rem"
  s-8: "4.5rem"
  s-9: "clamp(4.5rem, 3rem + 6vw, 8rem)"
components:
  button-primary:
    backgroundColor: "{colors.engraved-line}"
    textColor: "{colors.cyanotype-strip}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 1.4rem"
    height: "48px"
  button-primary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.engraved-line}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.engraved-line}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 1.4rem"
    height: "48px"
  button-line-hover:
    backgroundColor: "{colors.engraved-line}"
    textColor: "{colors.cyanotype-strip}"
  text-link:
    textColor: "{colors.engraved-line-soft}"
    typography: "{typography.label}"
  nav:
    backgroundColor: "{colors.cyanotype-strip}"
    textColor: "{colors.engraved-line}"
    height: "60px"
  nav-link:
    textColor: "{colors.engraved-line-soft}"
    typography: "{typography.label}"
    height: "44px"
  nav-link-active:
    textColor: "{colors.engraved-line}"
  index-row:
    textColor: "{colors.engraved-line}"
    typography: "{typography.index-row}"
    padding: "0 0.75rem"
  orbit-disc:
    rounded: "{rounded.disc}"
    size: "1rem"
  social-row:
    textColor: "{colors.engraved-line}"
    height: "56px"
  social-row-hover:
    backgroundColor: "{colors.engraved-line}"
    textColor: "{colors.cyanotype-strip}"
  scene-tab:
    backgroundColor: "{colors.cyanotype-strip}"
    textColor: "{colors.engraved-line}"
    padding: "0.3rem 0.55rem"
  sheet-card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.sheet-ink}"
    rounded: "{rounded.none}"
    padding: "0.8rem 0.95rem 0.95rem"
---

# Design System: Sam's Studio

## Overview

**Creative North Star: "The Cyanotype Orrery"**

The site is one working instrument printed as a sun print: Prussian blue where light hit the paper, white where it did not. Samudra sits at the centre as the SK monogram sun; the projects are enamel bodies on dashed elliptical rings, and scrolling or dragging turns the whole mechanism. Everything on the blue is drawn as white engraved linework, so hierarchy comes from type size, type width and line weight rather than from boxes, fills or elevation.

Density is low and deliberate. Long blue passages (hero, worlds index, toolbox, more work) are broken by one quiet material, the unexposed white sheet, which carries About and the case-study bodies in blue ink. The project worlds are the loud exception: each keeps its own visual kit and palette, mounted inside the instrument on a hairline frame and never repainted by it.

Motion is orbital: continuous, velocity-coupled, settling on a long ease-out. Nothing overshoots or bounces, and every pin, scrub and smooth-scroll falls back to a static stacked layout under reduced motion.

**Key Characteristics:**
- Drenched cyanotype blue ground, never black; the white sheet for quiet passages.
- White hairline engraving: dashed means available, solid means committed.
- One signal colour (lime) for conjunction, active state, focus and selection.
- Archivo across its width axis: expanded caps display, normal-width reading; JetBrains Mono only for readouts.
- No drop shadows and no rounded tiles; circles are the only curved form.
- Project bodies carry each project's own enamel palette.

## Exposure (the final direction)

The cyanotype is no longer only a palette; it is the interaction model. A cyanotype is paper that turns Prussian blue where light reaches it and stays white where something lies on it.

- **Home** is one drop of glass on one name: a single screen, a single object, a single action. The drop refracts the name (ball-lens optics), follows the hand, and settles back with a spring.
- **Projects** is the dark room. Prints come up blue and develop to their own colour as they scroll in; a picked print lifts into a full-screen viewing room.
- **About** is the contact sheet: one roll, seven frames, one loupe.
- **Contact** is the last print, hung at night.

## Motion

Motion is chosen by purpose (`src/lib/motion.ts`, tokens in `tokens.css`):

| Character | Used for | Curve |
| --- | --- | --- |
| respond | presses, hovers, toggles | `--ease-out`, 140-260ms, no overshoot |
| carry | something the hand threw (drags) | spring, bounce 0.18 |
| scene | views arriving and leaving, view transitions | `--ease-drawer`, 420-620ms |
| develop | an image coming up out of the paper | ease-out, about 1.1s, once |

Rules: nothing waits on an entrance (any input finishes it); everything a hand can interrupt re-targets from its live value; expensive scenes render only while visible; reduced motion keeps every state and drops the travel.

## Colors

A single-hue cyanotype print with one acid signal, and enamel colours that belong to the projects rather than to the frame.

### Primary
- **Cyanotype Ground** (`cyanotype-ground`): the page itself. Body, hero, work, toolbox and the loader all sit on it.
- **Cyanotype Strip** (`cyanotype-strip`): the nav bar, the More Work section, scene tabs, cursor labels, and the ink colour of every white plate (button text, monogram letters).
- **Cyanotype Night / Deep** (`cyanotype-night`, `cyanotype-deep`): the shadow end of the print. The hero's radial light falls off to Night; Contact is printed on Deep, the darkest the site ever goes.
- **Cyanotype Lit / Exposed** (`cyanotype-lit`, `cyanotype-exposed`): the bright end of the print, used only inside gradients (the hero's light spot, the About print) and for About's second title word.

### Secondary
- **Signal Lime** (`signal-lime`): conjunction line, active nav underline, scroll progress, focus outline, selection, the chosen toolbox star, availability pulse, loader count and bar, the cursor's interactive state, and the single About note.

### Tertiary
- **Enamel Cobalt and Enamel Vermilion** (`enamel-cobalt`, `enamel-vermilion`): enamel tones for the Contact body, which recolours toward each social link. Project bodies elsewhere take their palette from each project's data, not from these tokens.

### Neutral
- **Engraved Line** (`engraved-line`): primary text and all strong linework on the blue; also the fill of solid plates (primary button, sun disc, social-row flood).
- **Engraved Line Soft** (`engraved-line-soft`): secondary text on the blue, roughly 5:1 on the ground.
- **Hairline / Hairline Strong** (`hairline`, `hairline-strong`): section rules and list dividers at rest; orbits, rims and dashed available discs.
- **Sheet / Sheet Shade** (`sheet`, `sheet-shade`): the unexposed paper for About and case-study bodies.
- **Sheet Ink / Sheet Ink Soft** (`sheet-ink`, `sheet-ink-soft`): text on the sheet; soft is secondary, roughly 7:1.
- **Sheet Hairline** (`sheet-hairline`): rules and object frames on the sheet.
- **Mount Ink** (`mount-ink`): the ground behind a world inside its scene frame, visible only before the world paints.

### Named Rules
**The Never-Black Rule.** The instrument's darkest value is Cyanotype Deep. Pure or near-black grounds belong only to a project world's own kit.

**The One Signal Rule.** Lime marks what is current or focused: the conjunction, the active link, the selection. It is never decoration and never a section background.

**The Enamel Rule.** A project's body, index-row flood, chapter, case study and transition curtain take that project's own palette. The instrument frames the worlds and never repaints them.

## Typography

**Display Font:** Archivo Variable (with Archivo, system-ui, sans-serif), width axis 62-125%
**Body Font:** Archivo Variable at normal width
**Label/Mono Font:** JetBrains Mono Variable (with JetBrains Mono, ui-monospace, monospace)

**Character:** One grotesque stretched across its width axis does the work of a pairing: expanded caps engrave the titles like lettering on an instrument plate, normal width reads plainly. Mono appears only where something is measured or labelled.

### Hierarchy
- **Display** (760, wide, about 7.25rem at 1440, line-height 0.84): the hero name only; the loader, contact headline and chapter titles use the same treatment, sized to their own column.
- **Headline** (760, wide, fluid 2.4-4.6rem, line-height 0.95): section titles (Toolbox, More work).
- **Title** (700, wide, fluid 1.6-2.6rem): index headings, preview titles, lead entries, case-study subheads.
- **Index Row** (600, normal width, fluid 1.5-3rem): world names in the index. The committed row widens to wide and 700.
- **Tagline** (600, semi-wide 112%, fluid 1.15-1.45rem, line-height 1.25, max 28-30ch): chapter and lead-entry taglines.
- **Body** (400, fluid 1-1.125rem, line-height 1.55): prose, max 46-60ch. Large body (same face at the tagline size, line-height 1.42-1.5) carries the hero lede at 34ch.
- **Label** (JetBrains Mono 600, 0.72rem, 0.1em tracking, uppercase, tabular numerals): nav, buttons, text links, readouts, numbers, facts.
- **Body small** (`--t-sm`, 0.875rem): secondary lines, team credits, card prose on the desk.
- **Label floor** (`--t-2xs`, 0.6875rem): the smallest size anywhere on the site, including chips inside project worlds, the cursor readout and the nav on the narrowest phones. Nothing is set below it.

All sizes come from the `--t-*` scale in `src/styles/tokens.css` (2xs, xs, sm, md, lg, xl, 2xl, 3xl); the Toolbox magnitudes map onto it (2xl, xl, lg, md, sm).

### Named Rules
**The Width Axis Rule.** Hierarchy comes from size and width together: wide caps for anything that names, normal width for anything that reads. Display titles are never set in a different family.

**The Mono-Is-Measurement Rule.** Mono is for readouts, numbers, labels and controls. It never sets a sentence of prose.

**The Fitted Title Rule.** Long display titles are sized from their container and longest word (container-query units), so wide caps never spill under a scene or clip on a phone.

## Layout

Content sits in a 1440px max-width container with a fluid gutter of 1-2.5rem (safe-area aware). Spacing runs on one nine-step rhythm (`s-1` to `s-9`); section padding is `s-9`, a fluid 4.5-8rem. The nav is a fixed 60px strip, and scroll padding keeps focused elements clear of it.

Desktop (1000px and up, motion allowed) is a scroll-driven instrument. The hero is a 240dvh pinned stage: the name, lede and actions sit lower-left in about 42vw, and the orrery plate takes about 48vw on the right with its conjunction readout bottom-right. World chapters are 265dvh sticky stages that slide over each other on a 5:7 text/scene grid, mirrored on alternate chapters. About is a pinned desk of absolutely placed objects sized in container units.

Below 1000px, or with reduced motion, everything unpins into a single stacked column (reduced motion on a wide screen keeps the two-column chapter). The orrery stays whole on the page: nothing bleeds and nothing clips. Below 600px it becomes a numbered diagram, with names carried by the readout and the index directly below. Availability moves from the nav to under the hero actions below 1100px. Tap targets are at least 44px throughout, with invisible hit extensions on small text links.

## Elevation & Depth

The instrument is flat. Depth is conveyed by tonal steps of the print (Deep, Night, Strip, Ground, Lit), by a single radial light falling from the upper right in the hero, by line weight (a committed ring is solid at 1.4px; an available ring is dashed at 1px), and by sections that physically slide over one another in z-order. A fine fractal-noise paper grain at 8% overlay sits above everything except the curtain and cursor.

### Shadow Vocabulary
- **None for elevation.** Objects on the blue and on the sheet are framed by hairlines, never lifted by shadow.
- **Ground halo** (`paint-order: stroke; stroke: cyanotype-ground; stroke-width: 6px`): orrery labels carry a halo in the ground colour so crossing labels stay legible, like a printed map.
- **Hairline mount** (`outline: 1px solid; outline-offset: 6px`): the scene frame is mounted with an offset hairline that tightens to 2px on hover.

### Named Rules
**The Line-Weight Depth Rule.** On instrument surfaces, a thing becomes more important by getting a heavier or solid line, a lime halo, or a wider typeface; never by gaining a shadow.

## Shapes

Square corners everywhere: buttons, rows, the nav, scene frames, sheet objects and readout tabs are all 0-radius. The circle is the one curved form, reserved for bodies: orrery discs and moons, the monogram, index and row discs, the social arrow ring, status pulses. Orbits are ellipses drawn as hairlines. Engraved outline type (transparent fill with a 1-1.5px stroke) is used for the loader name, About's first title word and the oversized chapter background word.

### Named Rules
**The Dashed-Available, Solid-Committed Rule.** An available orbit, row disc or toolbox body is a dashed hairline. Once committed (in conjunction, hovered, focused, selected) it becomes solid and takes its enamel fill.

## Components

### Buttons
White plates printed on the blue: confident, flat, and inverted on hover.
- **Shape:** square corners (0), 48px minimum height, 1px border in the plate colour.
- **Primary:** Engraved Line plate with Cyanotype Strip text in the mono label style at 0.78rem, padding 0 1.4rem.
- **Hover / Focus:** on fine pointers the plate empties to transparent and the text takes the plate colour; a trailing arrow nudges 3px. Press scales to 0.97 over 140ms. Focus is a 2px lime outline at 3px offset (Cyanotype Lit on the sheet).
- **Line variant:** transparent with the hairline-weight border, filling on hover.
- **Chapter variant:** the plate takes the world's own foreground and the text its background.

### Text links
- **Style:** mono label in Engraved Line Soft with an underline at 45% of the current colour, 0.45em offset; the underline goes to full colour on hover. Hit area extends 14px vertically.
- **Title links** (More work): the title itself is the link; its 1px underline engraves in from transparent on hover.

### Cards / Containers
The instrument has no cards. The About desk and the case-study body use sheet objects instead, by owner decision.
- **Corner Style:** square (0).
- **Background:** Sheet, Sheet Shade or white; one note in Signal Lime with Cyanotype Deep text.
- **Shadow Strategy:** none; see Elevation & Depth.
- **Border:** 1px Sheet Hairline; index cards carry a ruled header.
- **Internal Padding:** about 0.8-0.95rem.
- **Placement:** objects keep a slight tilt and stay draggable on the desk, so they read as set down rather than laid out in a grid.

### Inputs / Fields
The only input is the case-study scrubber: a native range tinted to the world foreground at 44px height, between square 1px-bordered mono buttons that fill on hover.

### Navigation
- **Style:** a fixed 60px Cyanotype Strip bar with a bottom hairline and a 1px lime scroll-progress rule. Brand is the monogram plus the name in wide 700; the monogram turns -24deg on hover.
- **Links:** mono labels in Engraved Line Soft with 44px targets. The active section turns Engraved Line and gains a 1px lime underline that draws in from the left.
- **Sound toggle:** a 7px ring that fills lime when on.
- **Mobile:** status hides below 1100px, the sound toggle and studio name below 720px, and the links tighten below 560px. The bar hides on scroll down.

### The Universe (signature)
The homepage: SAMUDRA KAR at the centre of one tilted ring per featured project, drawn in perspective on two canvases so the near half of each ring passes in front of the name and the far half behind it. Rings are hairlines in Engraved Line, dashed at rest, solid and brighter for the hovered or focused world. Planets are enamel discs (`PlanetSurface`) carrying a drawn motif of their project, with a 1.4px Engraved Line rim and a flat shaded terminator. Selecting a world moves its planet by transform from its orbit to a focus slot (eased from the live value every frame, so it is interruptible), dims the name to about 5% and the other worlds to about 40%, and cross-fades the panel (240ms, `--ease-out`, a 3px blur bridge). Drag turns the system with momentum (exponential decay). The rail of named buttons is the accessible and touch-first way in; on phones it becomes a swipeable row.

### Worlds Index Row
A hairline-ruled list on a 4-column grid (number, disc, name, meta). On hover or focus the row floods upward with the world's own enamel over 260ms and the text takes the world foreground; the committed row widens its name to wide 700.

### Plates and the Ring Locator
Smaller instruments reuse the same vocabulary: More Work plates (rim, two dashed orbits, sun, one enamel body) and a 64px ring locator on each chapter and case study, showing which ring you are on as a solid orbit among dotted ones.

### Contact Rows
Three full-width social rows, the point of the final page. Labels are wide uppercase at up to 3.75rem; on hover or focus an Engraved Line flood wipes in from the left, each letter rolls up in a staggered two-high window, and a circular stroked SVG arrow turns 45deg and fills Cyanotype Strip with a lime arrow. Beside them, one enamel disc on two hairline orbits recolours toward the aimed link.

### Cursor
An engraved white arrow with a Cyanotype Strip hairline that reads on both blue and sheet. Over interactive targets it tips -12deg, fills lime, and shows a mono readout label (lime for primary actions).

### Exceptions (recorded, and suppressed in the detector with these reasons)
- **Project worlds** (`src/components/work/worlds/*.css`): each keeps its project's own palette, corners and in-scene display sizes. Their label floors still follow `--t-2xs`.
- **SVG plate units:** font sizes on the orrery, the monogram and the Portfolio world's plate are viewBox user units, scaled with the drawing; they are not CSS pixels.
- **The engraved background word** behind each chapter (7rem to 20rem) is ornament sized to the viewport, not reading type.
- **The Kage overlay** frames an authored third-party scene and uses its ink and red.
- **The dev-only data toggle** is plain neutral chrome and never ships.

### Project Worlds (exception)
The project worlds in `src/components/work/worlds/` keep their own per-project visual kits, including paper, ink, hard offset shadows and thick borders read from the legacy world tokens. They are illustrations of their projects, mounted in the scene frame. Their materials are not the instrument's system, and the instrument's prohibitions do not apply inside them.

## Do's and Don'ts

### Do:
- **Do** print every instrument surface on the cyanotype ramp, from Cyanotype Deep to Cyanotype Exposed, and put quiet long-form passages on the Sheet in Sheet Ink.
- **Do** draw structure as hairlines: `hairline` at rest, `hairline-strong` for orbits and rims, 1px rules between list rows.
- **Do** use dashed for available and solid for committed, on orbits, discs and toolbox bodies alike.
- **Do** keep lime for the current, focused or selected thing only.
- **Do** set names and titles in Archivo at wide width (125%) and reading text at normal width; use JetBrains Mono only for labels, readouts and controls.
- **Do** give every project body, flood, chapter and curtain that project's own palette.
- **Do** keep targets at 44px or more and give every pinned or scrubbed sequence a static stacked fallback for reduced motion and screens under 1000px.
- **Do** draw icons and arrows as inline stroked SVG, as the contact arrow does.

### Don't:
- **Don't** use drop shadows or offset shadows on instrument surfaces; depth is line weight and tone. (Project worlds keep their own kits.)
- **Don't** round corners on buttons, rows, frames or objects; the circle is reserved for bodies.
- **Don't** use black or near-black as an instrument ground; the darkest value is Cyanotype Deep.
- **Don't** wrap content in cards on the blue; separate with type size and hairline rules.
- **Don't** set prose in mono or titles in any face other than Archivo.
- **Don't** make a planet the only way into a project: every world is also a named button in the rail.
- **Don't** repaint a project world in the instrument's colours.

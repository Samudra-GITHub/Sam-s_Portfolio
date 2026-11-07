# Spatial Creative Studio — design system

Direction approved 2026-11-07. Replaces the cyanotype and floating-islands directions.

**The idea.** *Samudra* means ocean. The site's one 3D object is a liquid-chrome band, a wave closed on itself
with three half-twists, set into the word space of the name: **SAMUDRA ⟨sculpture⟩ KAR**. The pointer ripples its
surface; scrolling carries it out of the name and into the introduction, then it leaves. Everything else is
typography, real screenshots and space.

Composition engine: *the name as a monument* (taste-skill, seed 2115820997). The name is set as architecture;
after it the page is calm, so the contrast holds.

## Colour

Light, two values carry the page; colour is rare and means something.

| Token | Value | Role |
| --- | --- | --- |
| `--st-ivory` | `#F5F3EE` | Ground |
| `--st-paper` | `#FFFFFF` | Raised surface (screens, frames) |
| `--st-stone` | `#E8E5DE` | A tone step: fields, image beds |
| `--st-graphite` | `#17191D` | Ink, inverse ground (footer, dark showcases) |
| `--st-ink-2` | `#50535B` | Secondary text (7.3:1 on ivory) |
| `--st-violet` | `#8275FF` | Accent: focus, selection, the active state, one highlight per screen |
| `--st-cobalt` | `#536BFA` | Second accent: links on hover, data marks |
| `--st-cobalt-ink` | `#3149D6` | Cobalt for text on light grounds (5.6:1) |
| `--st-chrome` | `#C9CCD3` | Silver: rules of the sculpture's world, fallback fill |

Violet and cobalt are never set as small body text on ivory (contrast); they fill large shapes, mark focus and
carry the hover. Each project showcase may bring **one** tint taken from its own screenshots (Tarang's teal,
Krama's midnight, Noir's espresso) and nothing else.

No gradients as backgrounds, no glass panels, no shadows on things at rest. The one exception is light: the
sculpture's reflections and the pointer highlight on project images.

## Type

| Role | Face | Use |
| --- | --- | --- |
| Display | Sora Variable (100–800) | The name, section titles, project names |
| Text | Inter Variable | Body, interface, buttons |
| Metadata | IBM Plex Mono | Years, stacks, coordinates, status lines: technical facts only |

Scale (fluid, five visible steps):

| Token | Size | Use |
| --- | --- | --- |
| `--st-t-monument` | `clamp(4.5rem, 11.2vw, 12rem)` | The name |
| `--st-t-display` | `clamp(3rem, 7vw, 7.5rem)` | Project names |
| `--st-t-title` | `clamp(2rem, 3.4vw, 3.25rem)` | Section titles, statements |
| `--st-t-lead` | `clamp(1.125rem, 1.2vw, 1.375rem)` | Lead sentences |
| `--st-t-body` | `1rem` | Body (16px floor) |
| `--st-t-meta` | `0.8125rem` | Plex Mono metadata (13px floor) |

Display tracking −0.045em to −0.06em, leading 0.86–0.95; weights move with size (700 at the monument, 500 for
titles, 300 for the overlapping secondary lines). Sentence case everywhere except the monument.

## Space and frame

- One 12-column grid, outer margin `--st-margin: clamp(20px, 2.4vw, 40px)`, gutter `--st-gutter: clamp(12px, 1.4vw, 24px)`.
- Sections 160–240px apart on desktop, 96–128px on phones.
- Asymmetry lives inside the grid; the frame's margins are always equal.

## Components

- **Button:** pill, graphite fill, ivory text, 48px tall; hover lifts to violet. Magnetic on fine pointers.
- **Link:** text with a 1px underline drawn on hover from the left.
- **Screen frame:** a real screenshot on white with an 8px radius, set in perspective; the pointer draws a soft
  light across it. Screenshots are never cropped to imply features they do not show.
- **Metadata row:** Plex Mono, sentence case, separated by space, not rules.

## Motion

GSAP + ScrollTrigger for scroll sequences, Framer Motion for component interaction, Lenis kept (measured
smooth with GSAP's ticker driving it; native scroll under reduced motion).

- Typography enters by line, 70ms apart, rising 24px with opacity.
- Project screens settle from a 12° tilt to flat as they enter, and tilt toward the pointer on hover.
- The sculpture: slow rotation, a surface swell travelling around the band, a pointer ripple, and the scroll
  journey from the name to the introduction.
- Everything is transform and opacity. Under `prefers-reduced-motion` content appears in place, the sculpture
  renders still, and nothing travels.

## Performance rules

- One WebGL canvas, one object, rendered only while it is on screen; nothing else on the page is WebGL.
- Pixel ratio capped at 2 (1.5 on phones); the canvas stops its loop when the sculpture leaves the viewport or
  the tab is hidden.
- Screenshots are WebP at native size, lazy-loaded below the first screen, with width and height set.

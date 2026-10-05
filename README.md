<div align="center">

<img src="docs/screenshots/hero.jpg" alt="Samudra Kar's portfolio hero: a big SAMUDRA KAR wordmark, a throwable lime dot, and a fanned deck of seven project cards" width="100%" />

<br />
<br />

# Samudra Kar, portfolio

**A scroll-driven, cursor-aware portfolio where every project is its own small world.**

Seven interactive project scenes · a little companion that roams the page · a hidden door · a social-first contact scene

<br />

[**Live site**](https://sam-sportfolio.vercel.app) &nbsp;·&nbsp; [The tour](#the-tour) &nbsp;·&nbsp; [The seven worlds](#the-seven-worlds) &nbsp;·&nbsp; [How it works](#how-it-works) &nbsp;·&nbsp; [Run it](#run-it-locally) &nbsp;·&nbsp; [Optional backend](#optional-backend)

<br />

![React](https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3.15-88ce02?style=flat-square&logo=greensock&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-13-0055ff?style=flat-square&logo=framer&logoColor=white)
![Lenis](https://img.shields.io/badge/Lenis-1.3-111215?style=flat-square)
![WebGL](https://img.shields.io/badge/WebGL-raw_shaders-990000?style=flat-square&logo=webgl&logoColor=white)

</div>

---

## What this is

A portfolio built to feel like a **tactile object, not a template**. Warm paper, deep ink, and three loud accents (electric lime, cobalt, vermilion). Hard 2px borders, hard offset shadows, slightly crooked layouts.

The idea behind the build: **scrolling is navigation, motion is storytelling, the cursor is a tool, sections are scenes.** Nothing animates just because it can. If you can't say what a movement communicates, it isn't in here.

<div align="center">

<img src="docs/scroll.gif" alt="A scroll through the site: the lime dot drops ink that takes over the screen, then project chapters slide up over each other" width="86%" />

<sub>The signature scroll: the dot drops ink, the ink takes over, and project chapters slide up over each other.</sub>

</div>

## The tour

### 1. Hero: stillness, then a small thing to play with

Paper, a grid, and one lime dot. The type inflates in letter by letter (Syne's variable weight axis), then thickens and lifts under your cursor. Grab the dot and throw it. Seven project cards are dealt out like a hand; hover one to lift it, click to jump to that world.

Scroll and the stage pins. **The dot drops ink from wherever you left it.** The ink fills the screen, the type inverts, and the ink flows straight into the Work section.

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/hero-deck.jpg" alt="The hero with a project card lifted under the arrow cursor" /><br /><sub>The deck: each card is a link to its chapter.</sub></td>
    <td width="50%"><img src="docs/screenshots/hero-ink.jpg" alt="Mid-takeover: a circle of ink growing from the lime dot, inverting the type it crosses" /><br /><sub>Mid-takeover: the type inverts as the ink crosses it.</sub></td>
  </tr>
</table>

**Little things that add up**

- A first-visit **loader** (an outlined name that fills lime as the fonts and page load) gates the intro, then the hero type inflates in.
- A **chapter rail** on the right edge (Top / Work / Toolbox / About / Contact) tracks where you are.
- An optional **UI sound** toggle in the nav (off by default): soft ticks on hover, a thunk on press, a whoosh on page transitions, all synthesised with WebAudio, no audio files.

### 2. Work: seven chapters that cover each other

An index of the seven worlds with a live preview card. Then each project is a pinned, full-height stage. The next chapter **slides up over the previous one** while the old one shrinks back, and each scene opens with its own mask (rise, wipe, iris, wipe from the other side). A giant outlined title drifts sideways behind every chapter, so there's horizontal motion inside the vertical scroll.

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/work-index.jpg" alt="The Work index: seven project names with a colour preview card for the hovered one" /></td>
    <td width="50%"><img src="docs/screenshots/case-study.jpg" alt="A case-study page: the AkashaLens world at large with a scrub bar underneath" /></td>
  </tr>
  <tr>
    <td><sub>The index. Hovering fills a row and wakes the preview.</sub></td>
    <td><sub>Case-study page: the same world, large, with a scrub bar you can drive by hand.</sub></td>
  </tr>
</table>

Opening a case study uses a curtain that **grows out of the scene you clicked**, carries the project's name, swaps the route underneath, then wipes away.

### 3. Toolbox: a sticker sheet that can't lie

Every tool in every project's `tech` list becomes a sticker. The more worlds use it, the bigger it prints. It is computed from the project data, so it can only ever show what the work actually used. Stickers are draggable.

<img src="docs/screenshots/toolbox.jpg" alt="The Toolbox: a sheet of draggable tool stickers, sized by how many projects use each one" width="100%" />

### 4. About: a desk you discover

On desktop the stage pins and objects land on the desk one by one as you scroll: an ID card, index cards for each facet (drag them anywhere), a print, a cassette (Now Playing), a sticky note (Currently Building) and a studio stamp.

<img src="docs/screenshots/about.jpg" alt="The About desk covered in cards, an ID card, a polaroid, a cassette and a sticky note" width="100%" />

### 5. Contact: find me online

No form and no email address: three big rows (**Instagram, GitHub, LinkedIn**) over a field of shader light. Hovering a row sweeps it lime, rolls its letters, and **a 3D toon-shaded orb behind it changes colour and shape** to match the link (vermilion and spiky for Instagram, paper for GitHub, cobalt for LinkedIn). Links come from `contact` in [`src/data/config.ts`](src/data/config.ts); a missing one simply isn't shown.

<img src="docs/screenshots/contact.jpg" alt="The contact scene: three social rows over a shader field with a recoloured 3D orb, and the companion wandering past" width="100%" />

### 6. The companion

A small cartoon buddy lives in the viewport and wanders the whole site on random targets (never a fixed path), trailing the page a little when you scroll fast. It looks at and **points an arm at your cursor**, chats in cloud bubbles that match the section you are in, **chuckles when you hover it** and **gets sad (with a tear) if you click it**, then forgives you. It is drawn as layered SVG (`src/components/buddy`) so every part can animate, and it is the same character as in the Portfolio world. It respects `prefers-reduced-motion` (parked in a corner, no wandering). On touch screens he is click-through, so he never swallows a tap meant for a link; a tap that lands on him is detected separately.

<img src="docs/screenshots/buddy.jpg" alt="The companion in four moods: smiling, talking, chuckling when hovered, sad when clicked" width="100%" />

### 7. Kage: one hidden door

Somewhere on the About desk is a faint ink blot. (Or type `kage` anywhere.) Click it: the site drains of colour, ink irises out from the blot, and you're in **Kage**, a full scroll-storytelling scene. Escape or the Back button retraces the path and puts you exactly where you were.

<img src="docs/screenshots/kage.jpg" alt="The Kage scene: a moonlit temple gate with a Back to Samudra button" width="100%" />

## The seven worlds

Every project is a small interactive scene with **its own motion personality**, driven by scroll, cursor, hover and scroll velocity. All of them run from the same `SceneContext`, so the scene in a chapter and the large one on the case-study page are the same component.

<table>
  <tr>
    <td width="33%"><img src="docs/screenshots/world-tarang.jpg" alt="Tarang world" /></td>
    <td width="33%"><img src="docs/screenshots/world-rinti.jpg" alt="Rinti AI world" /></td>
    <td width="33%"><img src="docs/screenshots/world-akashalens.jpg" alt="AkashaLens world" /></td>
  </tr>
  <tr>
    <td><b>Tarang</b><br /><sub>Rhythm. Album tiles drift sideways at two speeds, the record spins faster the harder you scroll, the waveform swells under the cursor, hovering scrubs the playhead.</sub></td>
    <td><b>Rinti AI</b><br /><sub>Conversation. One exchange plays as you scroll while the research pipeline (plan, search, read, check claims, write) lights up stage by stage.</sub></td>
    <td><b>AkashaLens</b><br /><sub>Reconstruction. A WebGL shader draws one landscape twice, cloudy and clean. A wavefront sweeps across on scroll, and a lens reconstructs under the cursor.</sub></td>
  </tr>
  <tr>
    <td width="33%"><img src="docs/screenshots/world-skycast.jpg" alt="SkyCast world" /></td>
    <td width="33%"><img src="docs/screenshots/world-krama.jpg" alt="Krama world" /></td>
    <td width="33%"><img src="docs/screenshots/world-grama-sathi.jpg" alt="Grama Sathi world" /></td>
  </tr>
  <tr>
    <td><b>SkyCast</b><br /><sub>Atmosphere. Scroll is time of day: dawn to night through the palette, a sun that becomes a moon, clouds on their own clock, a radar sweep.</sub></td>
    <td><b>Krama</b><br /><sub>Product depth. One sneaker sliced into three crop windows that assemble as you scroll and come apart again. The cursor magnifies a slice and tilts the product.</sub></td>
    <td><b>Grama Sathi</b><br /><sub>Voice. Idle, listening, replying, in Hindi (Devanagari). Scroll plays the loop; press and hold the mic to take over.</sub></td>
  </tr>
  <tr>
    <td colspan="3"><img src="docs/screenshots/world-portfolio.jpg" alt="Portfolio world: a big squeezed headline with an outlined second line and the site's cartoon character in front" /><br /><b>Portfolio</b><br /><sub>The site introduces itself. A tall squeezed headline whose role words roll over, an outlined second line, and the site's cartoon character standing across both: his head and pupils follow the pointer, he blinks, breathes and waves. The two lines drift against each other with scroll.</sub></td>
  </tr>
</table>

| Project | What it is | Source |
| :-- | :-- | :-- |
| **Tarang** | A music streaming web app built around motion, glass surfaces and a floating player | [Samudra-GITHUB/Tarang](https://github.com/Samudra-GITHUB/Tarang) |
| **Rinti AI** | An AI companion with a research engine (planner, extractors, claim checking, synthesis), memory and voice | [Samudra-GITHUB/Rinti-Ai](https://github.com/Samudra-GITHUB/Rinti-Ai) |
| **AkashaLens** | Satellite cloud removal and image reconstruction; built for the ISRO Hackathon 2026 | [Samudra-GITHUB/AkashaLens](https://github.com/Samudra-GITHUB/AkashaLens) |
| **SkyCast** | A live weather app: current conditions, hourly and 5-day forecast, UV index and air quality | [Samudra-GitHub/SkyCast-Weather-App](https://github.com/Samudra-GitHub/SkyCast-Weather-App) |
| **Krama** *(also SoleVerse)* | A luxury sneaker marketplace built around storytelling and motion | [Samudra-GITHUB/Krama](https://github.com/Samudra-GITHUB/Krama) |
| **Grama Sathi** | A Hindi voice assistant: speak, it transcribes, thinks, and answers aloud | n/a |
| **Portfolio** | This site | you're here |

> The scenes are visual interpretations of each project, not screenshots. The AkashaLens shader, for example, is a metaphor for cloud removal, not output from the model.

## On small screens

Mobile isn't a scaled desktop. Below 1000px (or with `prefers-reduced-motion`) the pins and chapter overlaps are dropped: scenes stack, scroll still drives each scene, and the hero deck re-fans across the width of the screen. It was audited at 390, 360 and 320px wide and in landscape.

- **No horizontal scroll** at any phone width (the nav folds its surname away on the smallest screens so all four links fit).
- **Touch targets** of at least 44px, including small text links (their hit areas extend past the visible underline).
- **Cheaper shaders:** the canvases render at about 1x on phones, and every per-frame loop pauses offscreen.
- The Contact orb moves below the links instead of sitting behind them; the companion is click-through on touch.

<table>
  <tr>
    <td width="25%"><img src="docs/screenshots/mobile-hero.jpg" alt="Mobile hero" /></td>
    <td width="25%"><img src="docs/screenshots/mobile-work.jpg" alt="Mobile work chapter" /></td>
    <td width="25%"><img src="docs/screenshots/mobile-toolbox.jpg" alt="Mobile toolbox" /></td>
    <td width="25%"><img src="docs/screenshots/mobile-about.jpg" alt="Mobile about" /></td>
  </tr>
</table>

## How it works

### Motion stack

Motion is split on purpose. **GSAP owns page-level choreography and Framer Motion owns component-level values. They never animate the same element.**

| Job | Tool |
| :-- | :-- |
| Smooth scroll and scroll velocity | **Lenis**, driven by GSAP's ticker |
| Pinned scenes, scrubbed timelines, masks, reveals | **GSAP + ScrollTrigger** |
| Cursor, hover and drag physics, per-scene parallax values | **Framer Motion** motion values |
| Shader worlds (AkashaLens, Portfolio) | **Raw WebGL** (`ShaderCanvas`), no Three.js |
| Every per-frame effect | **One shared `gsap.ticker`**: a single `requestAnimationFrame` for the whole site |

```mermaid
flowchart LR
  Input["Wheel / touch"] --> Lenis
  Ticker["gsap.ticker<br/>(the only rAF)"] --> Lenis
  Lenis -->|scroll| ST["ScrollTrigger"]
  ST --> Choreo["Pins, masks,<br/>scrubbed timelines"]
  ST --> Progress["Scene progress<br/>(motion values)"]
  Pointer["One pointer listener"] --> MV["Pointer motion values"]
  Progress --> Worlds["Project worlds"]
  MV --> Worlds
  MV --> Cursor["Cursor"]
  Ticker --> Frame["Per-frame effects<br/>(gated by visibility)"]
```

### The scroll system (desktop)

- The hero is a sticky 100dvh stage inside a taller section. A scrubbed timeline fades the copy while the ink circle grows from the dot's *current* position.
- Each project chapter is a sticky stage inside a taller box. The **next chapter has a negative top margin**, so it slides up over the pinned one. The covered chapter scales back and is marked `inert` so keyboard focus can't land on something you can't see.
- Each chapter hands its world a `progress` value (0 to 1 across its whole scroll range). Worlds never read scroll or the pointer directly.

### The cursor

One lime arrow that looks like one of the site's buttons: lime fill, 2px ink outline, hard offset shadow, tip exactly on the pointer. It only runs on `(hover: hover) and (pointer: fine)` devices. State comes from attributes on whatever it's over:

```html
<a data-cursor="project" data-cursor-label="ENTER">…</a>
```

| `data-cursor` | Used for |
| :-- | :-- |
| *(default)* | the plain arrow |
| `link` *(any `a` or `button`)* | the arrow tilts and its shadow grows, like a button lifting |
| `project` · `play` · `drag` · `image` · `scroll` · `cta` | a small mono label chip appears beside the arrow |

Pressing nudges the arrow down and right and collapses the shadow, matching `.btn:active`.

### Typography as a material

Syne is a variable font whose width changes a lot with weight (an "S" is about half as wide at 400 as at 800). `ProximityText` gives every letter its own slot sized for the *resting* weight; letters swell past their slot symmetrically under the cursor, so the line never reflows.

### Performance and accessibility

- **Nothing runs offscreen.** Per-frame work is gated by `IntersectionObserver`, tab visibility and whether Kage is open.
- **WebGL is disciplined:** DPR is capped (lower on compact screens), context loss is handled, the context is released on unmount, and a fresh canvas is created per mount.
- **Code splitting:** each world, the case-study page and Kage are separate lazy chunks. The main bundle is about **603 kB (201 kB gzipped)**.
- **Fonts are self-hosted** variable fonts (Fontsource); the Devanagari face loads only when the Grama Sathi world mounts.
- **Reduced motion** disables Lenis, pins, scrubs, animated shaders and the page-transition curtain.
- Semantic landmarks, a skip link, visible `:focus-visible` rings, and keyboard-operable controls where an interaction has a real purpose (the mic, the scene scrub bar, the Kage door, the social links). The companion is decorative and hidden from assistive tech.

## Run it locally

```bash
git clone https://github.com/Samudra-GITHub/Sam-s_Portfolio.git
cd Sam-s_Portfolio
npm install
npm run dev
```

Open <http://localhost:5173>. The frontend needs no keys.

| Script | What it does |
| :-- | :-- |
| `npm run dev` | Verifies the Kage assets, then starts Vite |
| `npm run build` | Verifies the Kage assets, typechecks (`tsc -b`), builds |
| `npm run preview` | Serves the production build |
| `npm run lint` | `oxlint` |
| `npm run sync:kage` | Copies and hash-verifies the Kage assets (see below) |

### Optional backend

The site itself no longer needs a server: the Contact scene is plain social links. [`backend/`](backend) still holds the earlier Express contact API (the UI does not call it right now). To run it:

```bash
cd backend
npm install
cp .env.example .env     # then fill in the values below
npm run dev              # http://localhost:3000
```

If you wire a form back in, point the frontend at it with a root `.env` (defaults to `http://localhost:3000` if unset):

```env
VITE_BACKEND_URL=http://localhost:3000
```

### Backend API (optional)

A deliberately small Express + TypeScript service.

| Endpoint | Purpose |
| :-- | :-- |
| `GET /api/health` | Returns `{ "status": "ok" }` |
| `POST /api/contact` | Validates the message and emails it to you through [Resend](https://resend.com) |

`POST /api/contact` takes JSON:

```json
{ "name": "Ada", "email": "ada@example.com", "message": "Hello" }
```

- **Validation** (Zod): `name` 1 to 100 characters, a valid `email`, `message` 1 to 2000 characters. Failures return `400` with `error.code = "VALIDATION_ERROR"`.
- **Rate limit:** 10 requests per 15 minutes per IP on `/api/contact` (`429` with `TOO_MANY_REQUESTS`).
- **Hardening:** `helmet` headers, CORS pinned to `FRONTEND_ORIGIN`, and every user-supplied field HTML-escaped before it goes into the email body.
- Replies set `reply-to` to the sender, so you answer straight from your inbox.

| Variable | Meaning |
| :-- | :-- |
| `PORT` | Port to listen on (default `3000`) |
| `FRONTEND_ORIGIN` | Allowed CORS origin, e.g. your site URL (defaults to `*`, so set it in production) |
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_FROM` | Sender address (defaults to Resend's `onboarding@resend.dev`) |
| `CONTACT_EMAIL` | The inbox that receives messages |

`npm test` inside `backend/` runs the API tests against a server that is already running on `localhost:3000`.

## Deploy

| Part | Where | Config |
| :-- | :-- | :-- |
| Frontend | **Vercel** (live at <https://sam-sportfolio.vercel.app>) | [`vercel.json`](vercel.json) rewrites every path to `index.html` so deep links like `/work/krama` work |
| Contact API (optional, currently unused by the UI) | **Render** (web service) | [`render.yaml`](render.yaml): build `cd backend && npm install && npm run build`, start `cd backend && npm start`; secrets are set in the dashboard, not in the repo |

Only if you re-enable a form: set `VITE_BACKEND_URL` in the Vercel project to your deployed API URL.

## Make it yours

All content lives in `src/data/`, and **placeholders are hidden automatically**: any field still holding a `[PLACEHOLDER_…]` string is skipped by the UI (via `real()` in `src/lib/content.ts`), so nothing renders as broken text or a dead link.

| File | What to edit |
| :-- | :-- |
| `config.ts` | Name, studio, roles, About facets, *Currently building*, *Now playing* (set `track` and `artist` and the cassette starts spinning), and contact links (empty ones are hidden) |
| `projects.ts` | The seven projects: copy, tech, highlights, palette, links. The Toolbox is generated from each project's `tech`. Add a `live` URL or a `longDescription` and the case-study page picks it up |

Adding a project world means a new file in `src/components/work/worlds/` and one line in its `index.ts`.

## Kage

The Kage scene is the authored `KageLandingPage` from [`@designcodeio/threeui`](https://threeui.com), used **unmodified**, with the same props. The component loads `/landing-pages/kage.html` from the site root, so [`scripts/sync-kage.mjs`](scripts/sync-kage.mjs) copies those files out of the package into `public/landing-pages/` and **verifies every file's sha256 against [`scripts/kage-landing-page.json`](scripts/kage-landing-page.json)**. It runs automatically before `dev` and `build` and fails loudly if anything doesn't match.

The scene is a lazy chunk, so visitors who never open it never download it.

## Project structure

```
.
├── backend/                 optional Express contact API (Resend, Zod, helmet, rate limit); not used by the UI right now
├── docs/                    README screenshots and the scroll GIF
├── public/                  favicon, plus Kage's assets (synced + verified)
├── scripts/                 sync-kage.mjs (copy + sha256-verify Kage assets) and kage-landing-page.json (its manifest)
├── src/
│   ├── lib/                 runtime (media queries, pause), pointer, scroll, ticker hooks, gsap setup
│   ├── data/                config.ts, projects.ts   ← content lives here
│   ├── components/
│   │   ├── core/            SmoothScroll, Cursor, Magnetic, PageTransition, ProximityText, Split, ShaderCanvas
│   │   ├── hero/            the dot, the deck, the ink takeover
│   │   ├── work/            index, chapters, SceneFrame, worlds/ (one file per project)
│   │   ├── stack/           the Toolbox
│   │   ├── about/           the desk
│   │   ├── contact/         the social-first final scene (shader field + orb)
│   │   ├── buddy/           the cartoon character (shared SVG head, palette)
│   │   ├── companion/       the roaming buddy: wander, point, laugh, sad, bubbles
│   │   └── kage/            the hidden door (lazy) and its trigger
│   ├── pages/               Home, ProjectDetail, NotFound
│   └── styles/              design tokens and base styles
└── render.yaml · vercel.json
```

## Design system

| Token | Value | Role |
| :-- | :-- | :-- |
| Paper | `#fdf9f1` | main canvas |
| Sand | `#ebe5d8` | secondary surfaces |
| Ink | `#111215` | text, borders, hard shadows |
| Electric lime | `#d8f827` | primary accent, CTAs, the cursor |
| Cobalt | `#1e3ae8` | secondary accent (white text on it) |
| Vermilion | `#ff5226` | tertiary accent |

**Type:** [Syne](https://fonts.google.com/specimen/Syne) for display, [Epilogue](https://fonts.google.com/specimen/Epilogue) for body, [JetBrains Mono](https://www.jetbrains.com/lp/mono/) for labels, and Noto Sans Devanagari for the Grama Sathi scene.

**Rules:** 2px borders, hard offset shadows (never blurred), asymmetry on purpose, lime stays under ink text and cobalt stays under white. The system evolves, but it should always read as the same person with better craft.

## Known limitations

- The sneaker in the Krama world is hand-drawn SVG; real photography or renders would beat it.
- The About ID card uses an "SK" monogram because there's no portrait.
- Frame rates haven't been profiled on real GPUs or a range of phones, and the touch experience has had less testing than the mouse one.
- The main JS bundle is large for a portfolio (573 kB, 190 kB gzipped) because it carries React, Router, GSAP, Framer Motion and Lenis. Worlds, case studies and Kage are split out.

## Credits and licenses

- Fonts are served through [Fontsource](https://fontsource.org) (SIL Open Font License).
- Kage comes from [ThreeUI](https://threeui.com) (`@designcodeio/threeui`, MIT, including its bundled Three.js runtime and fonts; see the package's `ASSET-LICENSES.md`).
- [GSAP](https://gsap.com/standard-license) is used under its standard no-charge license. [Lenis](https://lenis.darkroom.engineering) and [Framer Motion](https://www.framer.com/motion/) are MIT.
- No license has been chosen for this repository's own code yet, so until one is added, all rights are reserved by the author.

---

<div align="center">

**Human-crafted · 0% boring**

Designed and built by [Samudra Kar](https://github.com/Samudra-GITHUB) · Sam's Studio

</div>

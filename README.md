<div align="center">

<img src="docs/screenshots/hero.webp" alt="The homepage: SAMUDRA KAR on deep blue, with one drop of liquid glass resting between the words and showing the name upside down" width="100%" />

<br />
<br />

# Samudra Kar, portfolio

**One name, one drop of glass: a single-screen homepage, then an exhibition of the real work.**

A WebGL glass drop you can pick up · 16 projects as live specimens · interactive case-study worlds · an optional, generated soundtrack · a hidden door

<br />

[**Live site**](https://sam-sportfolio.vercel.app) &nbsp;·&nbsp; [The tour](#the-tour) &nbsp;·&nbsp; [Pages](#pages) &nbsp;·&nbsp; [Sound](#sound) &nbsp;·&nbsp; [Run it](#run-it-locally) &nbsp;·&nbsp; [Design system](#design-system)

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

The portfolio of Samudra Kar, a designer and developer who builds interactive interfaces, web experiences and AI tools. The look is cyanotype: Prussian blue, paper white, and one acid-lime signal colour. One typeface (Archivo) across its width axis carries the hierarchy, and every effect has to earn its place.

## The tour

### 1. Home: one drop of glass on one name

One screen, no scrolling. The name is set large on deep blue; a single drop of liquid glass rests on it and really refracts it, the way a drop of water does (the name appears inside it widened and upside down). Hover and it leans toward you; press and drag, with a mouse or a finger, to carry it; let go and it springs home with a damped wobble. Under it: *Designer & Developer*, one sentence, and **Explore my work**.

<table>
  <tr>
    <td width="68%"><img src="docs/screenshots/hero.webp" alt="Homepage on desktop" /></td>
    <td width="32%"><img src="docs/screenshots/mobile-hero.webp" alt="Homepage on a phone: the name stacked, the drop between the lines" /></td>
  </tr>
</table>

### 2. Projects: the exhibition

All 16 projects that earned a place (see `docs/github-project-audit.md`) hang as live SVG specimens drawn from what each one does. Filter by kind, switch between the wall and a fast index, and pick a print to lift it into a full-screen viewing room with its real links. The filter and the open print live in the URL, so links can be shared.

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/projects.webp" alt="The projects wall" /></td>
    <td width="50%"><img src="docs/screenshots/projects-room.webp" alt="The viewing room for Noir Café" /></td>
  </tr>
</table>

### 3. Case studies and worlds

The nine featured projects have case-study pages (`/work/:slug`), each with its own interactive world.

### 4. About and Contact

**About** is a contact sheet: seven frames from one roll with a loupe, what is on the bench now, and the toolbox. **Contact** is the last print, at night: Instagram, GitHub and LinkedIn as tall rows over a WebGL field.

### 5. Kage

Somewhere on the About page there is a hidden door.

## Pages

The site is printed in cyanotype: Prussian blue, paper white, one acid-lime signal.

| Route | What it is |
| --- | --- |
| `/` | One screen, no scrolling: the name, one line, one way in (Explore my work, to `/projects`), and one drop of liquid glass resting on the name. The drop is a real ball lens in WebGL: it shows the name behind it widened and upside down, with a lime rim light and a highlight that follow the pointer. Hover and it leans toward you; press and drag (mouse or finger) to carry it, release and it springs home with a damped wobble. Idle, it only breathes. Reduced motion: a still lens. No WebGL: the plain name. |
| `/projects` | The exhibition: all 16 projects as live SVG specimens. Wall view (prints lean toward the pointer and develop from blue to colour as they scroll in) or Index view (a fast list with a hover preview). Filters per kind (`?room=ai`), each with its own light. Picking a print opens a full-screen viewing room with a shared-element transition; arrow keys step through, Escape puts it back. `?p=slug` opens straight into it. |
| `/about` | A contact sheet: seven frames from one roll (designer, developer, student, photography, creative coding, AI, experiments) with a loupe; what is on the bench now; the toolbox. Arrow keys walk the frames. |
| `/contact` | The last print, at night: the WebGL field and enamel orb answer the channel you aim at; Instagram, GitHub and LinkedIn as tall rows. Email shows automatically once `config.contact.email` is filled in. |
| `/work/:slug` | Case studies, including the interactive worlds. |

The motion system (springs and curves by purpose) is in `src/lib/motion.ts` and `src/styles/tokens.css`. Project categories are in `src/data/kinds.ts`.

## Sound

Off by default on every visit; nothing plays until the sound control (top right, on every page) is pressed. Everything is synthesised with Web Audio in `src/lib/sound.ts`, so there are no audio files to load or license.

- **Ambient:** a slow pad in D (four open chords, detuned triangles through a breathing low-pass, generated room reverb, a faint band of air, an occasional distant glass note). It is scheduled chord by chord, so it never loops or restarts; it fades in over about 3s and out over 0.6s.
- **Interface:** a glass dyad when a link is taken, a soft tactile click when a button is pressed, glass tones when the homepage drop is picked up and let go, and a rising/falling pair when sound is turned on/off. Never on hover.
- **Behaviour:** one AudioContext for the whole visit (it survives route changes, so the music never doubles), a master limiter, quiet levels for phone speakers, fades and suspends when the tab is hidden, and the site works the same without Web Audio.

## The worlds

Every featured project is a small interactive scene with **its own motion personality and its own visual language**, driven by scroll, cursor, hover and scroll velocity. All of them run from the same `SceneContext`, so the scene in a chapter and the large one on the case-study page are the same component. The instrument frames them; it does not repaint them.

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
    <td width="50%" colspan="2"><img src="docs/screenshots/world-noir.webp" alt="Noir Café world: a cup seen from above with latte art, a caramel table pass and a euro menu plate" /></td>
    <td width="50%"><img src="docs/screenshots/world-prahari.webp" alt="PRAHARI world: an open pit drawn as contours with sensors, a risk score of 0.58 with its reasons, and an audit chain" /></td>
  </tr>
  <tr>
    <td colspan="2"><b>Noir Café</b><br /><sub>Night service. Seen from above, scroll pours the latte art into the cup and the wallet-style pass for a booked table slides out from under the saucer. A menu plate turns through the four languages and currencies the site ships (EN/USD, JA/JPY, FR/EUR, IT/GBP). Steam leans toward the pointer.</sub></td>
    <td><b>PRAHARI</b><br /><sub>Inspection. An open pit as contour lines with sensors on its benches. Scroll runs one inspection: a sensor crosses its limit, the deterministic risk score climbs and lists its reasons, and each event is appended to a hash-linked audit chain.</sub></td>
  </tr>
</table>

**Portfolio** is the ninth, on the outermost ring: the site introduces itself with a squeezed headline whose role words roll over and a small copy of the orrery standing across it, turned by scroll and tipped by the pointer.

| Project | What it is | Source | Live |
| :-- | :-- | :-- | :-- |
| **Tarang** | Music streaming web app: a floating player, queue, synced lyrics, moods and stats | [Tarang](https://github.com/Samudra-GITHub/Tarang) | [tarang-ecru.vercel.app](https://tarang-ecru.vercel.app) |
| **Rinti AI** | Chat workspace with a cited research pipeline, per-user memory and real accounts | [Rinti-Ai](https://github.com/Samudra-GITHub/Rinti-Ai) | [rinti-ai.vercel.app](https://rinti-ai.vercel.app) |
| **AkashaLens** | U-Net cloud removal for satellite imagery; a prototype built for the ISRO Hackathon 2026 | [AkashaLens](https://github.com/Samudra-GITHub/AkashaLens) | |
| **SkyCast** | Flask weather app: conditions, forecast, UV and air quality | [SkyCast-Weather-App](https://github.com/Samudra-GitHub/SkyCast-Weather-App) | |
| **Krama** *(also SoleVerse)* | Editorial sneaker storefront front end: shop, cart, checkout, admin for drops | [Krama](https://github.com/Samudra-GITHub/Krama) | |
| **Grama Sathi** | A Hindi voice assistant: speak, it transcribes, thinks, and answers aloud | n/a | |
| **Noir Café** | A coffee brand that exists only as a website: order ahead, table booking, 3D cup, AI concierge, offline app, four languages | [noir-cafe](https://github.com/Samudra-GITHub/noir-cafe) | |
| **PRAHARI** | Mine safety and compliance: explainable risk score, a copilot that only narrates retrieved data, tamper-evident audit log | [PRAHARI](https://github.com/Samudra-GITHub/PRAHARI) | |
| **Portfolio** | This site | [Sam-s_Portfolio](https://github.com/Samudra-GITHub/Sam-s_Portfolio) | you're here |

> The scenes are visual interpretations of each project, not screenshots. The AkashaLens shader, for example, is a metaphor for cloud removal, not output from the model.

## Case studies

Every featured world and every "More work" project has a page at `/work/:slug`: the world (or the drawn plate) at large with a scrub bar, then what it is, what exists, its honest status and what it was built with, printed on the white sheet.

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/case-study.webp" alt="The Rinti AI case study" /></td>
    <td width="50%"><img src="docs/screenshots/case-study-plate.webp" alt="The PRAHARI case study with its drawn plate" /></td>
  </tr>
</table>

## On small screens

Every page is designed for phones, not scaled down. The homepage fits one screen on any phone (it uses the dynamic viewport height), the name stacks, and the drop rests between the lines. Touch targets are at least 44px, there is no horizontal scroll, and the WebGL renders at a capped pixel ratio on phones.

<img src="docs/screenshots/mobile-hero.webp" alt="Homepage on a phone" width="320" />

## How it works

### Motion stack

Motion is split on purpose. **GSAP owns page-level choreography and Framer Motion owns component-level values. They never animate the same element.**

| Job | Tool |
| :-- | :-- |
| Smooth scroll and scroll velocity | **Lenis**, driven by GSAP's ticker |
| Pinned scenes, scrubbed timelines, masks, reveals | **GSAP + ScrollTrigger** |
| Cursor, hover and drag values, per-scene parallax | **Framer Motion** motion values |
| The homepage drop | One raw WebGL fragment shader (ball-lens refraction of a texture of the name), a spring for the drop's position, and one `requestAnimationFrame` loop that pauses when the tab is hidden |
| Shader worlds and the Contact field | **Raw WebGL** (`ShaderCanvas`), no Three.js |
| Every per-frame effect | **One shared `gsap.ticker`**: a single `requestAnimationFrame` for the whole site |

Easing is two curves from `src/styles/tokens.css`: a strong ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`) for anything arriving or answering a press, and a strong ease-in-out for things moving on screen. UI transitions stay between 140ms and 260ms; presses scale to 0.97; hover motion is gated to fine pointers.

### The scroll system (desktop)

- The homepage is a single screen with nothing to scroll; no page hijacks scrolling.
- Each project chapter is a sticky stage inside a taller box. The **next chapter has a negative top margin**, so it slides up over the pinned one. The covered chapter scales back and is marked `inert` so keyboard focus can't land on something you can't see.
- Each chapter hands its world a `progress` value (0 to 1 across its whole scroll range). Worlds never read scroll or the pointer directly.

### The cursor

On mouse and trackpad devices the system cursor is replaced by a white arrow with a blue hairline that reads on both the blue and the white sheet. It turns lime and tips toward anything you can use, and shows a small readout (VIEW, DRAG, VISIT, SOUND) set by `data-cursor` and `data-cursor-label`. The readout moves to the other side of the tip near the right and bottom edges, so it is never cut off. While a modal `<dialog>` is open (the projects viewing room), the arrow steps aside and the real system cursor returns, because the dialog sits in the browser's top layer above anything a page can draw. Touch devices never get the custom cursor.

### Typography

Archivo is a variable font with a width axis (62% to 125%) as well as weight. Display type is set expanded, reading text at normal width, and the Portfolio world squeezes it. `ProximityText` gives every letter of the name its own slot sized for the resting weight; letters thicken under the cursor and swell past their slot, so the line never reflows.

### Performance and accessibility

- **Nothing runs offscreen.** Per-frame work is gated by `IntersectionObserver`, tab visibility and whether Kage is open.
- **WebGL is disciplined:** DPR is capped (lower on compact screens), context loss is handled, and the context is released on unmount.
- **Code splitting:** each world, the case-study page and Kage are separate lazy chunks.
- **Fonts are self-hosted** variable fonts (Fontsource); the Devanagari face loads only when the Grama Sathi world mounts.
- **Reduced motion** disables Lenis, pins, scrubs, the homepage drop's breathing and entrance (it becomes a still lens), animated shaders and the page-transition curtain; chapters keep their two-column layout.
- Semantic landmarks, one `h1`, a skip link, visible lime focus rings, keyboard-operable controls, and accessible names that start with the visible text.
- Lighthouse 12 on the production build (`npm run build` + `vite preview`, home page, first visit with the entrance, 2026-10-20, two runs each): desktop 93 to 97 performance, 100 accessibility, 100 best practices, 100 SEO, CLS 0; mobile (simulated 4x CPU throttling) 63 to 69 performance, 100 / 100 / 100, CLS 0.

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
| `config.ts` | Name, studio, roles, About facets, *Currently building*, *Now playing* (set `track` and `artist` and the cassette appears on the desk and starts spinning; it stays hidden until then), and contact links (empty ones are hidden) |
| `projects.ts` | Every project: copy, tech, highlights, status, palette, links, and its `tier`. The Toolbox is generated from each project's `tech`. |

Each project has a `tier`:

| Tier | Where it appears |
| :-- | :-- |
| `featured` | A case study with its own interactive world, and a larger print on the projects wall. Needs a `world` (a scene in `src/components/work/worlds/`, registered in its `index.ts`). |
| `more` | "More work", with a drawn plate and a case study. Set `lead: true` to give it more room. |
| `earlier` | A short line under "More work". |

Only add a `live` URL you have checked opens the right page. For team work, set `team` and `role` so the credit is never implied to be solo.

**Stress-testing the layouts (dev only):** on the dev server, add `?data=worst`, `?data=empty`, `?data=one` or `?data=many` to the URL, or use the toggle at the bottom of the page. It swaps in realistic worst-case project data (long titles, missing links, one tech, twelve techs, forty projects) from `src/data/stress.ts`. Production builds never read the parameter, and the toggle and fixtures are stripped from the bundle.

## Kage

The Kage scene is the authored `KageLandingPage` from [`@designcodeio/threeui`](https://threeui.com), used **unmodified**, with the same props. The component loads `/landing-pages/kage.html` from the site root, so [`scripts/sync-kage.mjs`](scripts/sync-kage.mjs) copies those files out of the package into `public/landing-pages/` and **verifies every file's sha256 against [`scripts/kage-landing-page.json`](scripts/kage-landing-page.json)**. It runs automatically before `dev` and `build` and fails loudly if anything doesn't match.

The scene is a lazy chunk, so visitors who never open it never download it.

## Project structure

```
.
├── backend/                 optional Express contact API (Resend, Zod, helmet, rate limit); not used by the UI right now
├── docs/                    github-project-audit.md, README screenshots
├── public/                  favicon (the SK mark), robots.txt, Kage's assets (synced + verified)
├── scripts/                 sync-kage.mjs (copy + sha256-verify Kage assets) and kage-landing-page.json (its manifest)
├── src/
│   ├── lib/                 runtime (media queries, pause), pointer, scroll, ticker hooks, gsap setup
│   ├── data/                config.ts, projects.ts (content), stress.ts (dev-only worst-case data)
│   ├── components/
│   │   ├── core/            SmoothScroll, Cursor, Monogram, Magnetic, PageTransition, ProximityText, Split, ShaderCanvas, Loader
│   │   ├── home/            the homepage glass drop (GlassHero)
│   │   ├── work/            index, chapters, RingLocator, SceneFrame, worlds/ (one file per project)
│   │   ├── more/            More work and the drawn project plates
│   │   ├── stack/           the Toolbox
│   │   ├── about/           the desk
│   │   ├── contact/         the final scene (shader field + enamel body)
│   │   └── kage/            the hidden door (lazy) and its trigger
│   ├── pages/               Home, ProjectDetail, NotFound
│   └── styles/              design tokens and base styles
└── render.yaml · vercel.json
```

## Design system

| Token | Value | Role |
| :-- | :-- | :-- |
| `--cy-700` | `#123a8c` | the cyanotype ground |
| `--cy-950` … `--cy-500` | `#081c4a` … `#2a5cc0` | deeper and lighter blues: nav, Contact, light on the plate |
| `--line` | `#eef2fc` | text and engraved linework on the blue |
| `--line-2` | `#aebee2` | secondary text on the blue (5:1 on the ground) |
| `--sheet` / `--sheet-ink` | `#f3f5f9` / `#0e2d72` | the white sheet and the blue that prints on it |
| `--lime` | `#d8f827` | the one signal colour: conjunction, focus, selection |
| World enamels | lime, cobalt, ink, paper, vermilion, sand, plus each "More work" project's own | project discs and chapter grounds |

**Type:** [Archivo](https://fonts.google.com/specimen/Archivo) across its width axis (expanded for display, normal for reading), [JetBrains Mono](https://www.jetbrains.com/lp/mono/) for readouts only, and Noto Sans Devanagari for the Grama Sathi scene.

**Rules:** hairlines, not boxes; dashed for available, solid for committed; no shadows on the sheet; hierarchy by type size; one signal colour. The full record is in `DESIGN.md`.

## Known limitations

- **JavaScript and set-up cost.** The main bundle is about 600 kB (200 kB gzipped) because it carries React, Router, GSAP, Framer Motion and Lenis, and the nine pinned chapters create their ScrollTriggers at load. On a throttled phone profile that is one to two seconds of main-thread time before the page is interactive. Worlds, case studies and Kage are already split out; deferring each chapter's triggers until it is near would be the next step.
- The five projects in "More work" have no interactive world yet; they are drawn plates.
- Grama Sathi has no repository on the account, so it is listed without a source link.
- The sneaker in the Krama world is hand-drawn SVG; real photography or renders would beat it.
- The About ID card uses the SK monogram because there's no portrait.
- Frame rates haven't been profiled on real GPUs or a range of phones.

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

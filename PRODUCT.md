# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four audiences, all confirmed by the owner, none primary over the others:

- **Internship recruiters** at product and tech companies, scanning quickly for skill, taste and proof that things were actually built.
- **Creative studios and agencies** judging craft, motion and originality.
- **Freelance clients** deciding whether to commission a site or app.
- **Peers and community**: other developers and designers, hackathon judges, people arriving from socials.

The site has to work for a 20-second recruiter scan and a 5-minute studio exploration at the same time.

## Product Purpose

The personal portfolio of Samudra Kar (Sam's Studio): a designer, developer and student working on creative coding, AI interfaces and tactile web experiences. It shows real projects (the strongest as interactive worlds, the rest as drawn plates) and gives people an obvious way to reach him on Instagram, GitHub or LinkedIn. It works when a visitor leaves knowing who he is, what he builds, and how to contact him, and remembers the site.

## Positioning

Each project is presented as its own small interactive "world" with its own motion personality (a record that spins with scroll velocity, a cloud-removal shader, a time-of-day sky), driven by one shared scene system. The portfolio is itself a project in the list. A neighbouring portfolio could copy the layout but not these worlds, which are built from what each project actually does.

## Operating Context

- Single-page home (`/`) with sections Hero, Work, Toolbox, About, Contact, plus case-study routes `/work/:slug` and a 404.
- Deployed on Vercel at https://sam-sportfolio.vercel.app; deep links rely on the SPA rewrite in `vercel.json`.
- Visitors arrive on desktop and phones (socials send mobile traffic).

## Capabilities and Constraints

- Stack: React 19, TypeScript, Vite, GSAP + ScrollTrigger, Lenis, Framer Motion, raw WebGL. Keep it.
- Content lives in `src/data/config.ts` and `src/data/projects.ts`. `[PLACEHOLDER_*]` values are hidden by `real()` in `src/lib/content.ts`.
- Contact is social-first: Instagram, GitHub, LinkedIn. No email address is published. An optional Express/Resend contact API exists in `backend/` but the UI does not call it.
- Kage is an unmodified `@designcodeio/threeui` scene whose assets are copied and sha256-verified by `scripts/sync-kage.mjs`; do not edit those files.
- Every existing feature stays, evolved (owner: "evolve everything"): the featured project worlds, case-study pages, Toolbox generated from project tech, About desk, custom cursor, optional UI sound, first-visit loader, Kage hidden door (the mark on the desk or typing `kage`).
- The cartoon companion buddy was removed at the owner's request on 2026-10-20 ("looks childish"); the SK monogram is the identity mark instead. Do not reintroduce a mascot, avatar or stock portrait.
- Every suitable public GitHub repository is represented, with a documented outcome per repository in `docs/github-project-audit.md`. Live links only after checking they open the right page.
- Undecided: a now-playing track and artist (placeholders).

## Brand Commitments

- Name **Samudra Kar**, studio name **Sam's Studio**, handle `samudra`.
- The SK monogram (`src/components/core/Monogram.tsx`, `public/favicon.svg`) is the studio mark.
- Voice: plain, first-person, a little dry and playful ("Most of them never ship. The lab keeps the good failures."). No marketing superlatives.
- The owner is open to replacing the current paper/ink/lime visual world if a stronger one wins; the character, voice and features carry over.

## Evidence on Hand

- Sixteen projects with real repo-sourced copy, tech lists, highlights and status lines (`src/data/projects.ts`, audited in `docs/github-project-audit.md`). Featured worlds: Tarang, Rinti AI, AkashaLens (built for the ISRO Hackathon 2026), SkyCast, Krama (alias SoleVerse), Grama Sathi, Noir Café, PRAHARI, Portfolio. More work: Niriksh AI, Orbit OS, The Waffle House, Catch the Rocket (team), The Speed of Numbers (team coursework). Earlier: the previous portfolio and the first website.
- Verified live demos: Tarang, Rinti AI, The Waffle House.
- No project screenshots or photography of the products; the worlds are illustrative interpretations, not product captures. No portrait of Samudra.
- README screenshots of the current site in `docs/screenshots/`.
- Absent and not to be fabricated: employers, clients, awards (beyond the ISRO Hackathon entry), metrics, testimonials, outcomes, deployment of projects marked "Not deployed yet".

## Product Principles

1. The work is the centerpiece; everything else frames it.
2. Every interaction has to say something about the project or the person. Nothing moves just because it can.
3. Honest over impressive: show the real state of each project and never invent proof.
4. Fast to understand, rewarding to explore: the recruiter scan and the studio dig both succeed.
5. Personal, not template: the character, the voice and the hidden door are the point.

## Accessibility & Inclusion

- Full use with `prefers-reduced-motion` (pins, scrubs, smooth scroll and shaders off) and keyboard-only.
- Touch devices are first-class: no hover-only information, 44px targets, no horizontal scroll down to 320px.
- Grama Sathi content includes Devanagari (Hindi).

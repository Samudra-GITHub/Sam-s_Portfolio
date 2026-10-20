# GitHub project audit

Audit of every repository on the GitHub account behind this portfolio, and what the portfolio does with each one. Done on 2026-10-20 with the authenticated GitHub CLI (`gh api --paginate user/repos`), so the list covers every page of results.

- **Account:** [Samudra-GITHub](https://github.com/Samudra-GITHub) (the same account linked from `src/data/config.ts`)
- **Repositories discovered:** 23 (18 public repositories owned by the account, 1 public repository owned by a teammate where the account is a collaborator, 4 private)
- **Inspected in depth:** 19 (every public repository: metadata, topics, languages, file tree, README, dependency manifests, contributors; live URLs checked with HTTP requests)
- **Private repositories:** 4, of which 2 are forks. They are counted but not described, inspected or published here.
- **Distinct projects in the portfolio:** 16 (9 featured worlds, 5 in "More work", 2 in "Earlier")

## How the portfolio uses this

All project content lives in `src/data/projects.ts`. Each entry has a `tier`:

| Tier | Where it appears | Count |
| :-- | :-- | :-- |
| `featured` | The hero orrery, the index of worlds, a full interactive chapter, a case-study page | 9 |
| `more` | The "More work" section after the worlds, with a case-study page that uses a drawn plate instead of a world | 5 |
| `earlier` | A compact list at the end of "More work" | 2 |

A featured project needs a `world` (an interactive scene in `src/components/work/worlds/`). Any other project only needs data. To promote one, give it a world and set `tier: 'featured'`.

## Inventory

| Repository | Visibility | What it is (from README and source) | Evidence | Outcome |
| :-- | :-- | :-- | :-- | :-- |
| [Tarang](https://github.com/Samudra-GITHub/Tarang) | public | Music streaming web app: persistent floating player, queue, synced lyrics, playlists, moods, listening stats, simulated offline downloads. No backend. | README, package.json (Next.js, Zustand, Framer Motion, shadcn) | **Featured** (world 01). Live demo verified: tarang-ecru.vercel.app (HTTP 200, title "Tarang"). Old "not deployed yet" status corrected. |
| [Rinti-Ai](https://github.com/Samudra-GITHub/Rinti-Ai) | public | Chat workspace with per-user memory, a cited research pipeline (plan, search, extract, evaluate claims, synthesise) and real accounts (Argon2, HttpOnly sessions). | README, backend/requirements.txt (FastAPI, openai, trafilatura, argon2) | **Featured** (world 02). Live demo verified: rinti-ai.vercel.app (redirects to /login). Removed the old "voice in and out" highlight: the README says the voice router is not registered and text-to-speech is a stub. |
| [AkashaLens](https://github.com/Samudra-GITHub/AkashaLens) | public | U-Net cloud removal for Sentinel-2 imagery, rule-based cloud mask and confidence heatmap, MAE/PSNR/SSIM evaluation, Flask demo. Built for ISRO Hackathon 2026. Prototype: three sample pairs, no trained weights. | README, requirements.txt | **Featured** (world 03). Tech list corrected: OpenCV is not a dependency; Flask and scikit-image are. |
| [SkyCast-Weather-App](https://github.com/Samudra-GITHub/SkyCast-Weather-App) | public | Flask app over OpenWeatherMap: current conditions, hourly and daily forecast, UV, air quality, animated sky canvas, JSON endpoint. | README | **Featured** (world 04). |
| [Krama](https://github.com/Samudra-GITHub/Krama) | public | Editorial sneaker storefront front end: filterable shop, rotatable product viewport, cart, wishlist, multi-step checkout, account, admin console for drops. Seed data and browser storage; payments are not real. | README, package.json (Next.js, GSAP, Lenis, Zustand) | **Featured** (world 05). Old "landing page only" status corrected to what the README now documents. |
| *(no repository)* Grama Sathi | n/a | Hindi voice assistant (faster-whisper, Llama 3.3 on Groq, edge-tts), as described in the existing portfolio content. | Existing portfolio content only. No public or private repository with this project was found on the account. | **Featured** (world 06), kept as the owner wrote it, with no source link. **Needs owner confirmation**: add a repository URL if one exists elsewhere. |
| [Sam-s_Portfolio](https://github.com/Samudra-GITHub/Sam-s_Portfolio) | public | This site. | This repository | **Featured** (world 09, "Portfolio"). |
| [noir-cafe](https://github.com/Samudra-GITHub/noir-cafe) | public | A specialty-coffee brand that exists only as a website: order ahead, table booking, 3D cup, AI concierge, installable offline app, four languages and currencies; every integration has a labelled demo fallback. | README, case-study folder, package.json (Next.js, R3F, Supabase, Stripe, Clerk, Anthropic SDK, web-push) | **Featured** (world 07, `NoirWorld.tsx`). No public deployment URL yet (the README says one is added later), so no live link. |
| [PRAHARI](https://github.com/Samudra-GITHub/PRAHARI) | public | Mine compliance and safety monitoring: role-scoped inspections, violations, sensor readings and alerts, a deterministic explainable risk score, a copilot that only narrates retrieved data, a tamper-evident audit log. | README, docker-compose.yml, backend tree | **Featured** (world 08, `PrahariWorld.tsx`). The GitHub description ("disaster monitoring") does not match the README and code, which are about mine compliance; the portfolio follows the README. |
| [Niriksh-AI](https://github.com/Samudra-GITHub/Niriksh-AI) | public | Operations copilot for merchant payment failures, built for a payments hackathon: anomaly, investigation, memory, recovery workflow, voice copilot. Frontend complete; backend mostly mocked. | README, package.json, backend tree (FastAPI) | **More work.** |
| [orbit-os](https://github.com/Samudra-GITHub/orbit-os) | public | Interface exploration: a personal dashboard that borrows from OS design (shell, command palette, notification centre, AI workspace). Mostly mock data. | README, package.json | **More work.** |
| [the-waffle-house](https://github.com/Samudra-GITHub/the-waffle-house) | public | One-page site for a waffle café in Siliguri where every picture is drawn in code (SVG, canvas, Framer Motion) on a shared scene system. | README, package.json | **More work.** Live demo verified: the-waffle-house.vercel.app (HTTP 200). |
| [Catch_the_Rocket---Team-ByteForce](https://github.com/ChaithraGana/Catch_the_Rocket---Team-ByteForce) | public, teammate's repo | ESP32 rocket ground station for an FCA mid-semester hackathon: 100,000 altitude readings, 12,000-cycle and 4 KB limits. Team of four; Samudra Kar is listed as Measurer. All commits are by the repository owner. | README team table, contributors API | **More work**, credited as team work with his listed role. |
| [speed-of-numbers-fca](https://github.com/Samudra-GITHub/speed-of-numbers-fca) | public | FCA team lab: six timing experiments on ESP32 number representations, with a LaTeX report. Three-person team; the README lists Samudra as primary architect, lead builder and scribe. | README | **More work**, credited as coursework and team work. |
| [samudra-kar-portfolio](https://github.com/Samudra-GITHub/samudra-kar-portfolio) | public | The previous portfolio: a persistent WebGL scene behind every page, adaptive quality, procedural sound. | README | **Earlier.** Its homepage URL returns HTTP 404, so no live link. |
| [website](https://github.com/Samudra-GITHub/website) | public | First personal site (2023): plain HTML and CSS. | index.html, README | **Earlier.** |
| [Samudra-GITHub](https://github.com/Samudra-GITHub/Samudra-GITHub) | public | Profile README and banner tooling. | README | Excluded: profile page, not a project. |
| [Samagra-OS](https://github.com/Samudra-GITHub/Samagra-OS) | public | Empty repository. The profile README calls it the flagship in progress. | GitHub API: "This repository is empty" | Excluded: no code yet. Add it once there is something to show. |
| [vyom](https://github.com/Samudra-GITHub/vyom) | public | Empty repository. | GitHub API | Excluded: no code. |
| [singularity-login](https://github.com/Samudra-GITHub/singularity-login) | public | Planned login component set. The README states there is no code yet. | README | Excluded: planned, not built. |
| 4 private repositories | private | Not described here. 2 are forks. | Authenticated listing only | Excluded: private. None is published. |

## Reconciliation

- 16 portfolio entries = 15 public repositories (this one included, as world 09) + Grama Sathi, which has no repository.
- 4 public exclusions: the profile README, Samagra-OS, vyom, singularity-login.
- 15 + 4 = 19 public repositories (18 owned, 1 teammate's); + 4 private = 23 discovered. Each repository has exactly one outcome and no project appears twice.
- Live links in the portfolio are only the three that returned HTTP 200 and showed the right page title: Tarang, Rinti AI, The Waffle House.

## Open questions for the owner

1. Grama Sathi: is there a repository or demo to link?
2. Done on 2026-10-20: Noir Café and PRAHARI now have interactive worlds (`NoirWorld.tsx`, `PrahariWorld.tsx`) and are featured.
3. PRAHARI's GitHub description says "disaster monitoring", but the code is about mine compliance. Consider updating the description on GitHub (no remote changes were made).

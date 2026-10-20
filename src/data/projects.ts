import { readStressMode, stress } from './stress';

/**
 * Project content model.
 *
 * Every factual line below comes from the project's own repository (README,
 * package.json, source layout), audited in docs/github-project-audit.md.
 * Where a field has no real source it is left out (or kept as a
 * [PLACEHOLDER_*] string) and the UI hides it via `real()`.
 * Nothing here is invented: no metrics, clients, awards or results.
 *
 * Tiers
 *   featured  rides the hero orrery and gets a full interactive chapter (needs a `world`)
 *   more      listed in "More work", with a case-study page drawn as a plate
 *   earlier   a compact line at the end of "More work"
 * To feature a project: build its world in components/work/worlds, set `world` and `tier`.
 */

export type WorldId = 'tarang' | 'rinti' | 'akasha' | 'skycast' | 'krama' | 'grama' | 'noir' | 'prahari' | 'portfolio';
export type Tier = 'featured' | 'more' | 'earlier';

export interface WorldPalette {
  /** chapter background */
  bg: string;
  /** text colour on that background */
  fg: string;
  /** the world's signature accent */
  accent: string;
}

export interface Project {
  id: string;
  title: string;
  /** earlier / alternate name, shown quietly beside the title */
  alias?: string;
  slug: string;
  tier: Tier;
  /** the interactive scene; required for featured projects */
  world?: WorldId;
  year: string;
  category: string;
  /** one short line, used as the chapter hook */
  tagline: string;
  description: string;
  longDescription?: string;
  /** his part in it, when it was not a solo project or the role is worth naming */
  role?: string;
  /** set for team work, so the credit is never implied to be solo */
  team?: string;
  tech: string[];
  /** true facts about what exists, taken from the repo */
  highlights: string[];
  /** honest current state */
  status?: string;
  /** visual direction words for the scene (design language, not claims) */
  motifs: string[];
  palette: WorldPalette;
  image?: string;
  github?: string;
  /** only URLs that were checked and answered with the right page */
  live?: string;
  /** a lead entry in "More work" gets more room */
  lead?: boolean;
}

const INK = '#111215';
const PAPER = '#fdf9f1';
const SAND = '#EBE5D8';
const LIME = '#d8f827';
const COBALT = '#1e3ae8';
const VERMILION = '#ff5226';

const source: Project[] = [
  /* ---------------- featured worlds ---------------- */
  {
    id: 'proj_01',
    title: 'Tarang',
    slug: 'tarang',
    tier: 'featured',
    world: 'tarang',
    year: '2026',
    category: 'Music / Web app',
    tagline: 'Music, redesigned for the web.',
    description:
      'A music streaming web app built around motion, glass surfaces and a floating player that feels closer to an object than a browser tab. It plays demo audio and YouTube search results, with a queue, synced lyrics, playlists, moods and listening stats.',
    tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Zustand'],
    highlights: [
      'A persistent floating player that survives navigation and expands into a full now-playing view',
      'Time-synced lyrics with translations, a queue drawer, playlists and folders',
      'Listening stats and history charts',
      'Shared motion variants and a living design-system reference inside the app',
    ],
    status: 'Live demo. No backend: offline downloads are simulated in browser storage.',
    motifs: ['Rhythm', 'Waveform', 'Drift'],
    palette: { bg: LIME, fg: INK, accent: VERMILION },
    github: 'https://github.com/Samudra-GITHub/Tarang',
    live: 'https://tarang-ecru.vercel.app',
  },
  {
    id: 'proj_02',
    title: 'Rinti AI',
    slug: 'rinti-ai',
    tier: 'featured',
    world: 'rinti',
    year: '2026',
    category: 'AI assistant',
    tagline: 'An AI companion that plans its research.',
    description:
      'A chat workspace with a research engine at its core: it plans sub-queries, searches, extracts sources, checks claims and writes back a cited answer. Conversations, per-user memory and real accounts sit alongside.',
    tech: ['Next.js', 'React', 'FastAPI', 'Python', 'Framer Motion', 'Lenis'],
    highlights: [
      'Research pipeline: intent, planning, search, extraction, claim evaluation, synthesis with citations',
      'Streaming chat with saved conversations and per-user memory',
      'Real accounts: Argon2 password hashing and HttpOnly session cookies',
    ],
    status: 'Live demo (sign-in required). Voice code exists in the repo but is not wired up yet.',
    motifs: ['Conversation', 'Research', 'Layers'],
    palette: { bg: COBALT, fg: PAPER, accent: LIME },
    github: 'https://github.com/Samudra-GITHub/Rinti-Ai',
    live: 'https://rinti-ai.vercel.app',
  },
  {
    id: 'proj_03',
    title: 'AkashaLens',
    slug: 'akasha-lens',
    tier: 'featured',
    world: 'akasha',
    year: '2026',
    category: 'Computer vision',
    tagline: 'Getting the ground back from under the clouds.',
    description:
      'Cloud removal for satellite imagery: a U-Net learns to reconstruct the clear scene under the clouds, next to a rule-based cloud mask and a confidence heatmap that shows which regions to trust least.',
    tech: ['Python', 'PyTorch', 'Flask', 'NumPy', 'scikit-image', 'Matplotlib'],
    highlights: [
      'A U-Net reconstruction model trained on cloudy and clear image pairs',
      'Cloud mask, cloud-cover percentage and a confidence heatmap',
      'MAE, PSNR and SSIM evaluation, and a Sentinel-2 download script',
      'Built for the ISRO Hackathon 2026',
    ],
    status: 'Prototype: three sample image pairs, no trained weights or benchmark numbers yet.',
    motifs: ['Reconstruction', 'Cloud and terrain', 'Before and after'],
    palette: { bg: INK, fg: PAPER, accent: LIME },
    github: 'https://github.com/Samudra-GITHub/AkashaLens',
  },
  {
    id: 'proj_04',
    title: 'SkyCast',
    slug: 'skycast',
    tier: 'featured',
    world: 'skycast',
    year: '2026',
    category: 'Weather app',
    tagline: 'The sky, on a slow loop.',
    description:
      'A live weather app: current conditions, hourly and five-day forecast, UV index and air quality for any city you type in, over an animated sky.',
    tech: ['Python', 'Flask', 'OpenWeatherMap API'],
    highlights: ['Current weather and a multi-day forecast', 'Hourly outlook, UV index and air quality', 'A JSON endpoint behind the page'],
    status: 'Runs locally with your own OpenWeatherMap key.',
    motifs: ['Atmosphere', 'Clouds', 'Slow weather'],
    palette: { bg: PAPER, fg: INK, accent: COBALT },
    github: 'https://github.com/Samudra-GitHub/SkyCast-Weather-App',
  },
  {
    id: 'proj_05',
    title: 'Krama',
    alias: 'SoleVerse',
    slug: 'krama',
    tier: 'featured',
    world: 'krama',
    year: '2026',
    category: 'E-commerce',
    tagline: 'Luxury sneakers, told as a story.',
    description:
      'A sneaker storefront designed like a fashion editorial: drops announced like events, product pages that lead with a sneaker you can rotate, then a filterable shop, cart, multi-step checkout, account and an admin console for drops.',
    tech: ['Next.js', 'React', 'Tailwind CSS', 'GSAP', 'Lenis', 'Zustand'],
    highlights: ['Editorial home, lookbook and journal', 'Shop filters, cart drawer, wishlist and multi-step checkout', 'Admin console for drops, products and orders'],
    role: 'Design & Development',
    status: 'Complete front end on seed data and browser storage. No backend, and payments are not real.',
    motifs: ['Product depth', 'Editorial crops', 'Sneaker'],
    palette: { bg: VERMILION, fg: INK, accent: PAPER },
    github: 'https://github.com/Samudra-GITHub/Krama',
  },
  {
    id: 'proj_06',
    title: 'Grama Sathi',
    slug: 'grama-sathi',
    tier: 'featured',
    world: 'grama',
    year: '2026',
    category: 'Voice AI / Social impact',
    tagline: 'A voice assistant that answers in simple spoken Hindi.',
    description:
      'A voice assistant for rural India: you speak in Hindi, it transcribes what you said, thinks it through and answers back out loud in a natural voice.',
    tech: ['Python', 'Flask', 'faster-whisper', 'Llama 3.3 (Groq)', 'edge-tts'],
    highlights: ['Hindi speech-to-text on the server', 'Plain, spoken-style answers', 'Spoken reply through text-to-speech'],
    motifs: ['Voice', 'Waveform', 'Devanagari'],
    palette: { bg: SAND, fg: INK, accent: VERMILION },
  },

  {
    id: 'proj_08',
    title: 'Noir Café',
    slug: 'noir-cafe',
    tier: 'featured',
    world: 'noir',
    year: '2026',
    category: 'Brand & web product',
    tagline: 'A coffee house that exists only as a website.',
    description:
      'A specialty-coffee brand designed and built end to end: order ahead, book a table and get a wallet-style pass, take a 3D journey through the cup, ask an AI concierge, or install it as an app that works offline. It speaks four languages and prices in four currencies.',
    tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Three.js', 'Supabase', 'Stripe'],
    highlights: [
      'Started as seven Figma frames; the desktop build is screenshot-diffed against them',
      '44 prerendered pages: 11 routes in English, Japanese, French and Italian',
      'Every integration (Supabase, Clerk, Stripe, Resend, Anthropic, Web Push) has a labelled demo fallback',
      'Installable, with an offline menu',
    ],
    status: 'Runs locally with no keys. No public deployment link yet.',
    motifs: ['Editorial', 'Coffee', 'Night'],
    palette: { bg: '#1b1410', fg: '#f3e9dc', accent: '#c98a4b' },
    github: 'https://github.com/Samudra-GITHub/noir-cafe',
  },
  {
    id: 'proj_09',
    title: 'PRAHARI',
    slug: 'prahari',
    tier: 'featured',
    world: 'prahari',
    year: '2026',
    category: 'Full-stack / Safety',
    tagline: 'Mine safety data, with a copilot that cannot make numbers up.',
    description:
      'A role-based platform for mine safety and environmental compliance: inspections, violations, sensor readings and alerts in one place, with an explainable risk score and a copilot that only narrates data it pulled from the database.',
    tech: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Docker', 'Groq'],
    highlights: [
      'Deterministic 0 to 1 risk score that lists its reasons',
      'Copilot: deterministic parsing, role-scoped retrieval, then LLM narration',
      'Tamper-evident audit log and an OpenAPI-documented API',
    ],
    status: 'Runs with Docker Compose on a seeded, fictional mine dataset.',
    motifs: ['Signal', 'Terrain', 'Audit'],
    palette: { bg: '#2b2a24', fg: '#f2ede1', accent: '#f2b632' },
    github: 'https://github.com/Samudra-GITHub/PRAHARI',
  },
  {
    id: 'proj_07',
    title: 'Portfolio',
    slug: 'personal-portfolio',
    tier: 'featured',
    world: 'portfolio',
    year: '2026',
    category: 'Creative development',
    tagline: 'This site. You are standing inside it.',
    description: 'A scroll-driven, cursor-aware portfolio: an orrery you turn by scrolling, a world for each featured project, a toolbox built from the projects themselves and one hidden door.',
    tech: ['React', 'TypeScript', 'GSAP', 'Lenis', 'Framer Motion', 'WebGL'],
    highlights: ['Scroll choreography with pinned scenes', 'Raw WebGL shaders with mobile fallbacks', 'A hidden Kage scene, verified against its authored source'],
    role: 'Design & Development',
    motifs: ['Shader language', 'Geometry', 'Distortion'],
    palette: { bg: INK, fg: PAPER, accent: LIME },
    github: 'https://github.com/Samudra-GITHub/Sam-s_Portfolio',
  },
  /* ---------------- more work ---------------- */
  {
    id: 'proj_10',
    title: 'Niriksh AI',
    slug: 'niriksh-ai',
    tier: 'more',
    lead: true,
    year: '2026',
    category: 'AI / Hackathon',
    tagline: 'An operations teammate for payments that go wrong.',
    description:
      'Built for a payments hackathon: it notices a revenue anomaly, investigates the cause, recalls the merchant’s history and walks through recovery, with a voice copilot. The frontend is complete; most backend data is still mocked.',
    tech: ['Next.js', 'React', 'TypeScript', 'FastAPI', 'Python', 'Recharts'],
    highlights: ['Merchant dashboard and a live investigation view', 'Voice copilot', 'Recovery workflow over a webhook'],
    status: 'Frontend complete. Backend serves the final API with mocked data where integrations are not wired.',
    motifs: ['Signal', 'Investigation'],
    palette: { bg: '#0f3d3a', fg: '#eef6f2', accent: '#7ee0b5' },
    github: 'https://github.com/Samudra-GITHub/Niriksh-AI',
  },
  {
    id: 'proj_11',
    title: 'Orbit OS',
    slug: 'orbit-os',
    tier: 'more',
    year: '2026',
    category: 'Interface exploration',
    tagline: 'A personal dashboard that borrows from operating systems.',
    description:
      'What a dashboard feels like with a persistent shell, a command palette with fuzzy search, a notification centre and an AI workspace. Most data is mock data; the weather view can call a live API.',
    tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'GSAP'],
    highlights: ['Command palette with fuzzy search and recent commands', 'Notes, files and project workspaces', 'A written design bible for tokens and motion'],
    status: 'Interface exploration on mock data.',
    motifs: ['Shell', 'Widgets'],
    palette: { bg: '#15123a', fg: '#ecebff', accent: '#9b8cff' },
    github: 'https://github.com/Samudra-GITHub/orbit-os',
  },
  {
    id: 'proj_12',
    title: 'The Waffle House',
    slug: 'the-waffle-house',
    tier: 'more',
    lead: true,
    year: '2026',
    category: 'Landing page / Motion',
    tagline: 'A café site where every picture is drawn in code.',
    description:
      'A one-page site for a Belgian waffle café in Siliguri. The hero, menu and story are SVG, canvas and Framer Motion scenes on one shared scene system: syrup pours, butter melts, a waffle iron opens on scroll. No photographs or video.',
    tech: ['React', 'TypeScript', 'Vite', 'Framer Motion', 'Tailwind CSS'],
    highlights: ['Eight menu plates, each with its own build animation', 'A pinned, scroll-scrubbed waffle iron', 'Reduced-motion rest frames for every scene'],
    status: 'Live.',
    motifs: ['Syrup', 'Steam'],
    palette: { bg: '#f4d9a6', fg: '#3a2412', accent: '#b5541c' },
    github: 'https://github.com/Samudra-GITHub/the-waffle-house',
    live: 'https://the-waffle-house.vercel.app',
  },
  {
    id: 'proj_13',
    title: 'Catch the Rocket',
    slug: 'catch-the-rocket',
    tier: 'more',
    year: '2026',
    category: 'Embedded / Hackathon',
    tagline: 'A rocket ground station on an ESP32, inside 4 KB.',
    description:
      'An autonomous ground station for a mid-semester hackathon: a physical ESP32 reads a 100,000-sample altitude stream within 12,000 CPU cycles per reading and estimates gravity, apogee, parachute deployment, descent and landing.',
    tech: ['C++', 'ESP32', 'Arduino'],
    highlights: ['Streaming curve fitting under a 4 KB state budget', 'Glitch detection on the sensor stream', 'Verified on physical hardware'],
    team: 'Team ByteForce, four people',
    role: 'Measurer',
    motifs: ['Trajectory'],
    palette: { bg: '#101820', fg: '#e8f0f5', accent: '#ff7a3d' },
    github: 'https://github.com/ChaithraGana/Catch_the_Rocket---Team-ByteForce',
  },
  {
    id: 'proj_14',
    title: 'The Speed of Numbers',
    slug: 'speed-of-numbers',
    tier: 'more',
    year: '2026',
    category: 'Coursework / Embedded',
    tagline: 'How fast is a number on a 240 MHz chip?',
    description:
      'A computer architecture lab on the ESP32: six experiments timing integer widths, float against double, bit tricks, Q16.16 fixed point and serial output, written up as a LaTeX report.',
    tech: ['C++', 'ESP32', 'LaTeX'],
    highlights: ['Six timed experiments and a 10 kHz sensor latency budget', 'Raw serial logs kept with the report'],
    team: 'Three-person team',
    role: 'Lead builder and scribe',
    motifs: ['Measurement'],
    palette: { bg: '#e9e4d6', fg: '#1d1d1b', accent: '#2f6b4f' },
    github: 'https://github.com/Samudra-GITHub/speed-of-numbers-fca',
  },

  /* ---------------- earlier ---------------- */
  {
    id: 'proj_15',
    title: 'Previous portfolio',
    slug: 'previous-portfolio',
    tier: 'earlier',
    year: '2026',
    category: 'Portfolio',
    tagline: 'One persistent WebGL scene behind every page.',
    description: 'The portfolio before this one: a 3D layer that never unmounts between pages, adaptive quality and procedural sound.',
    tech: ['React', 'Three.js', 'React Three Fiber', 'Tailwind CSS'],
    highlights: [],
    motifs: [],
    palette: { bg: '#0d1b14', fg: '#e8f2ec', accent: '#9fd36b' },
    github: 'https://github.com/Samudra-GITHub/samudra-kar-portfolio',
  },
  {
    id: 'proj_16',
    title: 'First website',
    slug: 'first-website',
    tier: 'earlier',
    year: '2023',
    category: 'Personal site',
    tagline: 'Where it started: plain HTML and CSS.',
    description: 'A first personal site with an about page, skills and contact details.',
    tech: ['HTML', 'CSS'],
    highlights: [],
    motifs: [],
    palette: { bg: PAPER, fg: INK, accent: COBALT },
    github: 'https://github.com/Samudra-GITHub/website',
  },
];

/** dev only: ?data=worst|empty|one|many swaps in break-ui fixtures; production always uses the real list */
const mode = import.meta.env.DEV ? readStressMode() : null;
export const projects: Project[] = mode ? stress(source, mode) : source;

export const featured = projects.filter((p): p is Project & { world: WorldId } => p.tier === 'featured' && Boolean(p.world));
export const moreWork = projects.filter((p) => p.tier === 'more');
export const earlier = projects.filter((p) => p.tier === 'earlier');
/** projects that get their own page */
export const paged = [...featured, ...moreWork];

export const getProject = (slug: string | undefined) => paged.find((p) => p.slug === slug);

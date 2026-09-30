/**
 * Project content model.
 *
 * Every factual line below comes from the project's own repository (README,
 * package.json, source layout). Where a field has no real source it is left
 * out (or kept as a [PLACEHOLDER_*] string) and the UI hides it via `real()`.
 * Nothing here is invented: no metrics, clients, awards or results.
 */

export type WorldId = 'tarang' | 'rinti' | 'akasha' | 'skycast' | 'krama' | 'grama' | 'portfolio';

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
  world: WorldId;
  year: string;
  category: string;
  /** one short line, used as the chapter hook */
  tagline: string;
  description: string;
  longDescription?: string;
  role?: string;
  tech: string[];
  /** true facts about what exists, taken from the repo */
  highlights: string[];
  /** honest current state, e.g. "Runs locally. Not deployed yet." */
  status?: string;
  /** visual direction words for the scene (design language, not claims) */
  motifs: string[];
  palette: WorldPalette;
  image?: string;
  github?: string;
  live?: string;
  featured: boolean;
}

const INK = '#111215';
const PAPER = '#fdf9f1';
const SAND = '#EBE5D8';
const LIME = '#d8f827';
const COBALT = '#1e3ae8';
const VERMILION = '#ff5226';

export const projects: Project[] = [
  {
    id: 'proj_01',
    title: 'Tarang',
    slug: 'tarang',
    world: 'tarang',
    year: '2026',
    category: 'Music / Web app',
    tagline: 'Music, redesigned for the web.',
    description:
      'A music streaming web app built around motion, glass surfaces and a floating player that feels closer to an object than a browser tab.',
    tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Zustand'],
    highlights: [
      'A persistent floating player that survives navigation',
      'Moods, library, search and stats surfaces',
      'Shared motion variants reused across every route',
      'A living design-system reference inside the app',
    ],
    status: 'Runs locally. Not deployed yet.',
    motifs: ['Rhythm', 'Waveform', 'Drift'],
    palette: { bg: LIME, fg: INK, accent: VERMILION },
    github: 'https://github.com/Samudra-GITHUB/Tarang',
    featured: true,
  },
  {
    id: 'proj_02',
    title: 'Rinti AI',
    slug: 'rinti-ai',
    world: 'rinti',
    year: '2026',
    category: 'AI assistant',
    tagline: 'An AI companion that plans its research.',
    description:
      'An AI companion with a research engine at its core: it plans a question, reads sources, checks claims and writes the answer back, with memory and voice alongside.',
    tech: ['Next.js', 'React', 'FastAPI', 'Python', 'Framer Motion', 'Lenis'],
    highlights: [
      'Research pipeline: planner, extractors, claim checking, synthesis',
      'Chat with persistent memory',
      'Voice in and out (speech-to-text and text-to-speech)',
    ],
    motifs: ['Conversation', 'Research', 'Layers'],
    palette: { bg: COBALT, fg: PAPER, accent: LIME },
    github: 'https://github.com/Samudra-GITHUB/Rinti-Ai',
    featured: true,
  },
  {
    id: 'proj_03',
    title: 'AkashaLens',
    slug: 'akasha-lens',
    world: 'akasha',
    year: '2026',
    category: 'Computer vision',
    tagline: 'Getting the ground back from under the clouds.',
    description:
      'AI-powered satellite cloud removal and image reconstruction, using computer vision and deep learning to recover cloud-covered imagery.',
    tech: ['Python', 'PyTorch', 'OpenCV', 'NumPy', 'Matplotlib'],
    highlights: [
      'Cloud removal and satellite image reconstruction',
      'A dataset pipeline for cloudy and clear image pairs',
      'Built for the ISRO Hackathon 2026',
    ],
    motifs: ['Reconstruction', 'Cloud and terrain', 'Before and after'],
    palette: { bg: INK, fg: PAPER, accent: LIME },
    github: 'https://github.com/Samudra-GITHUB/AkashaLens',
    featured: true,
  },
  {
    id: 'proj_04',
    title: 'SkyCast',
    slug: 'skycast',
    world: 'skycast',
    year: '2026',
    category: 'Weather app',
    tagline: 'The sky, on a slow loop.',
    description:
      'A live weather app: current conditions, hourly and five-day forecast, UV index and air quality for any city you type in.',
    tech: ['Python', 'Flask', 'OpenWeatherMap API'],
    highlights: ['Current weather and 5-day forecast', 'Hourly outlook, UV index and air quality'],
    motifs: ['Atmosphere', 'Clouds', 'Slow weather'],
    palette: { bg: PAPER, fg: INK, accent: COBALT },
    github: 'https://github.com/Samudra-GitHub/SkyCast-Weather-App',
    featured: true,
  },
  {
    id: 'proj_05',
    title: 'Krama',
    alias: 'SoleVerse',
    slug: 'krama',
    world: 'krama',
    year: '2026',
    category: 'E-commerce',
    tagline: 'Luxury sneakers, told as a story.',
    description:
      'A luxury sneaker marketplace inspired by Apple and Nike: a premium shopping experience built around storytelling, motion design and product presentation.',
    tech: ['Next.js', 'React', 'Tailwind CSS', 'Framer Motion'],
    highlights: ['Editorial landing page', 'Motion design system', 'Responsive layouts'],
    role: 'Design & Development',
    status: 'Landing page shipped. Product pages, cart and checkout are on the roadmap.',
    motifs: ['Product depth', 'Editorial crops', 'Sneaker'],
    palette: { bg: VERMILION, fg: INK, accent: PAPER },
    github: 'https://github.com/Samudra-GITHUB/Krama',
    featured: true,
  },
  {
    id: 'proj_06',
    title: 'Grama Sathi',
    slug: 'grama-sathi',
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
    featured: true,
  },
  {
    id: 'proj_07',
    title: 'Portfolio',
    slug: 'personal-portfolio',
    world: 'portfolio',
    year: '2026',
    category: 'Creative development',
    tagline: 'This site. You are standing inside it.',
    description:
      'A scroll-driven, cursor-aware portfolio: seven project worlds, a lab of playable experiments and one hidden door.',
    tech: ['React', 'TypeScript', 'GSAP', 'Lenis', 'Framer Motion', 'WebGL'],
    highlights: ['Scroll choreography with pinned scenes', 'Raw WebGL shaders with mobile fallbacks', 'A hidden Kage scene, verified against its authored source'],
    role: 'Design & Development',
    motifs: ['Shader language', 'Geometry', 'Distortion'],
    palette: { bg: INK, fg: PAPER, accent: LIME },
    featured: true,
  },
];

export const getProject = (slug: string | undefined) => projects.find((p) => p.slug === slug);

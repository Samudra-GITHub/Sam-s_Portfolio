import type { Project } from './projects';

/**
 * Dev-only worst-case data for break-ui testing. Enter it with ?data=worst,
 * ?data=empty, ?data=one or ?data=many on the dev server; production builds
 * never read the param (see projects.ts). Every value is something a real
 * project could plausibly have, not random noise.
 */
export type StressMode = 'worst' | 'empty' | 'one' | 'many';

const LONG_DESC =
  'A Hindi and Bengali voice assistant for community health workers in villages with patchy connectivity: it records a question, transcribes it on the server with faster-whisper, drafts a plain-language answer with a hosted Llama model, checks it against a short list of approved health guidance, and reads the answer back aloud, keeping a log the worker can show a supervisor later.';

export function stress(source: Project[], mode: StressMode): Project[] {
  if (mode === 'empty') return [];
  if (mode === 'one') {
    const f = source.find((p) => p.tier === 'featured');
    const m = source.find((p) => p.tier === 'more');
    return [f, m].filter((p): p is Project => Boolean(p));
  }
  if (mode === 'many') {
    const more = source.filter((p) => p.tier === 'more');
    const copies = Array.from({ length: 40 }, (_, i) => {
      const p = more[i % more.length];
      return { ...p, id: `${p.id}_x${i}`, slug: `${p.slug}-${i}`, title: `${p.title} ${i + 2}`, lead: i < 2 };
    });
    return [...source.filter((p) => p.tier !== 'more'), ...copies];
  }

  // worst: spread different failures across the first rows, as real data does
  return source.map((p, i) => {
    switch (i) {
      case 0:
        return { ...p, title: 'Grama Sathi Community Health Voice Companion', tagline: 'A voice assistant for health workers that answers in spoken Hindi and Bengali, even on a 2G connection.', category: 'Voice AI / Social impact / Accessibility' };
      case 1:
        return { ...p, title: 'Ek', tagline: 'Short.', tech: ['Rust'], highlights: [], status: undefined, github: undefined, live: undefined };
      case 2:
        return { ...p, alias: 'AkashaLens Satellite Cloud Removal Research Prototype', description: LONG_DESC, tech: ['Python', 'PyTorch', 'torchvision', 'Flask', 'Werkzeug', 'Pillow', 'NumPy', 'SciPy', 'scikit-image', 'Matplotlib', 'Copernicus Data Space API', 'Vercel Python Runtime'] };
      case 3:
        return { ...p, title: 'Sky­Cast', category: 'Weather', highlights: ['Current weather'] };
      case 7:
        return { ...p, title: 'Noir Café: A Specialty Coffee House That Exists Only as a Website', team: 'Team of five from three colleges, built over a 36-hour hackathon weekend', role: 'Design system, motion and the 3D cup' };
      case 8:
        return { ...p, title: 'PRAHARI', tagline: 'x', description: 'Mine compliance.', tech: ['TypeScript'], highlights: [] };
      case 9:
        return { ...p, title: 'NirikshAIMerchantPaymentsInvestigationCopilot', github: undefined, live: undefined };
      default:
        return p;
    }
  });
}

export function readStressMode(): StressMode | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('data');
  return v === 'worst' || v === 'empty' || v === 'one' || v === 'many' ? v : null;
}

/**
 * The "Currently building" feature on the home page.
 *
 * To feature another project, add an entry below and point `current` at its slug (the slug must exist in
 * projects.ts). Set `current` to null to hide the section. Every line here must be checkable in the project's
 * own repository or running app: no percentages, progress bars, dates that have not happened, or user counts.
 */
const W = `${import.meta.env.BASE_URL}world`;

export interface BuildingEntry {
  /** a project slug from projects.ts */
  slug: string;
  /** optional places the name may wrap, so a long name breaks where it reads well */
  nameParts?: string[];
  /** what the record says, with the date the record was read */
  record: string;
  asOf: string;
  /** checked in the running app */
  working: string[];
  /** being built right now */
  inProgress: string[];
  /** said plainly, so nobody reads more into the screens than is there */
  notVerified: string[];
  /** smaller copies of the same capture (800 and 1280 wide), for screens shown smaller than the original */
  screens: { src: string; sizes?: number[]; w: number; h: number; alt: string }[];
}

export const BUILDING: Record<string, BuildingEntry> = {
  wednesday: {
    slug: 'wednesday',
    nameParts: ['W.E.D.N.E.S.', 'D.A.Y.'],
    record: '15 commits from 27 October to 4 November 2026 · 232 backend and 45 desktop tests passing',
    asOf: '8 November 2026',
    working: [
      'Live, Time and Orbit modes on a real-sun globe, with Focus on me and Follow the ISS',
      'Ask the Earth and What happened here? with the local model',
      'The capability broker and its seven core states, including executing',
      'Pulse, Activity, Memory, Security and Settings, and the phone layout',
    ],
    inProgress: ['Moon mode: landing and impact sites, a lunar time machine and live orbiters (in the working copy, not yet pushed)'],
    notVerified: [
      'Voice recognition on a real microphone',
      'Frame rate on a dedicated graphics card',
      'Replies on a GPU: on this machine a question takes about six minutes on the CPU',
      'Live ships, which need an AISStream key',
    ],
    screens: [
      { src: `${W}/wednesday/moon.webp`, sizes: [800, 1280], w: 1920, h: 1200, alt: "W.E.D.N.E.S.D.A.Y.'s Moon mode: the near side with landing sites, and the lunar time machine listing missions and orbiters" },
      { src: `${W}/wednesday/orbit.webp`, sizes: [800, 1280], w: 1920, h: 1200, alt: 'Orbit mode: satellites, aircraft and ships from live public feeds over a lit 3D Earth' },
      { src: `${W}/wednesday/security.webp`, sizes: [800, 1280], w: 1920, h: 1200, alt: 'The Security screen: deny by default, 16 tools registered, no shell access' },
    ],
  },
};

/** the project featured now; null hides the section */
export const current: string | null = 'wednesday';

/**
 * Site-level content.
 *
 * Fields that still hold a [PLACEHOLDER_*] value are hidden by the UI (see
 * `real()` in lib/content.ts) instead of being rendered as broken text or
 * dead links. Fill them in and they appear automatically.
 */

export interface Facet {
  key: string;
  title: string;
  line: string;
}

export interface SiteConfig {
  name: string;
  handle: string;
  studio: string;
  about: {
    bio: string;
    interests: string;
    learning: string;
    experimenting: string;
    roles: string[];
    facets: Facet[];
  };
  personal: {
    /** Fill in to light up the Now Playing cassette. */
    nowPlaying: { track: string; artist: string };
    currentlyBuilding: string;
    photographyNote: string;
  };
  contact: {
    email: string;
    github: string;
    linkedin: string;
    instagram: string;
    otherLinks: { label: string; url: string }[];
  };
}

export const config: SiteConfig = {
  name: 'Samudra Kar',
  handle: 'samudra',
  studio: "Sam's Studio",
  about: {
    bio: "I'm a designer, developer, and student focused on creative coding, AI interfaces, and tactile web experiences. I build digital spaces that feel physical, blending precision with play.",
    interests: "Creative coding, WebGL shaders, artificial intelligence, and kinetic typography.",
    learning: "Deepening my knowledge in PyTorch, computer vision, and spatial computing.",
    experimenting: "Physics-based web interactions, voice AI models, and scroll-driven choreographies.",
    roles: ['designer', 'developer', 'student', 'photographer', 'creative coder'],
    facets: [
      { key: 'design', title: 'Designer', line: 'Paper, ink, thick borders. I make interfaces that look like you could pick them up.' },
      { key: 'dev', title: 'Developer', line: 'React, Next.js, Python. Happiest when the interface pushes back a little.' },
      { key: 'student', title: 'Student', line: 'Studying first. Most of this got built between labs, deadlines and hackathons.' },
      { key: 'photo', title: 'Photography', line: 'How I practise looking: light, edges, timing.' },
      { key: 'code', title: 'Creative coding', line: 'Shaders, particles and physics toys. Code that is more fun to play with than to read.' },
      { key: 'ai', title: 'AI', line: 'Language models and computer vision, and what they feel like to actually use.' },
      { key: 'lab', title: 'Experiments', line: 'Most of them never ship. The lab keeps the good failures.' },
    ],
  },
  personal: {
    // TODO(samudra): set a real track to show it on the cassette, e.g.
    // nowPlaying: { track: '...', artist: '...' }
    nowPlaying: { track: '[PLACEHOLDER_TRACK]', artist: '[PLACEHOLDER_ARTIST]' },
    currentlyBuilding: 'Tarang and Krama',
    photographyNote: 'Develop a print. Real photos plug in through src/data/playground.ts.',
  },
  contact: {
    // TODO(samudra): add your public contact details. Empty ones are hidden.
    email: '[PLACEHOLDER_EMAIL: e.g., hello@example.com]',
    github: 'https://github.com/Samudra-GITHUB',
    linkedin: '[PLACEHOLDER_LINKEDIN: e.g., https://linkedin.com/in/username]',
    instagram: '[PLACEHOLDER_INSTAGRAM: e.g., https://instagram.com/username]',
    otherLinks: [],
  },
};

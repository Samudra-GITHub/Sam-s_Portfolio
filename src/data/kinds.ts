/**
 * Exhibition filters. Each project is filed under what its repository shows it
 * actually is (see docs/github-project-audit.md). A project can sit in more
 * than one room.
 */
export const KINDS = [
  { id: 'ai', label: 'AI & vision' },
  { id: 'web', label: 'Web apps' },
  { id: 'creative', label: 'Creative & motion' },
  { id: 'full', label: 'Full-stack' },
  { id: 'embedded', label: 'Embedded' },
] as const;

export type Kind = (typeof KINDS)[number]['id'];

export const KIND_OF: Record<string, Kind[]> = {
  tarang: ['web', 'creative'],
  'rinti-ai': ['ai', 'full'],
  'akasha-lens': ['ai'],
  skycast: ['web'],
  krama: ['web', 'creative'],
  'grama-sathi': ['ai'],
  'noir-cafe': ['web', 'creative', 'full'],
  prahari: ['full', 'ai'],
  'personal-portfolio': ['creative'],
  'niriksh-ai': ['ai', 'full'],
  'orbit-os': ['web', 'creative'],
  'the-waffle-house': ['creative', 'web'],
  'catch-the-rocket': ['embedded'],
  'speed-of-numbers': ['embedded'],
  'previous-portfolio': ['creative'],
  'first-website': ['web'],
};

export const kindsOf = (slug: string): Kind[] => KIND_OF[slug] ?? [];

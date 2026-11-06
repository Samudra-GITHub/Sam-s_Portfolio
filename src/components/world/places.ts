/**
 * The chapters of the world, in the order the camera visits them.
 * Each one is a real section of the homepage (its `id` is the section's
 * anchor), so every 3D place has a plain HTML equivalent.
 */
export interface Place {
  id: string;
  label: string;
  /** what the island is, shown on the map */
  island: string;
  /** kept for older callers; camera shots live in World.tsx */
  at: [number, number, number];
  /** accent colour of the island's details */
  accent: string;
}

export const PLACES: Place[] = [
  { id: 'top', label: 'Welcome', island: 'The arrival', at: [0, 0, 0], accent: '#d29a54' },
  { id: 'work', label: 'Work', island: 'Over the archipelago', at: [0, 0, 0], accent: '#28785d' },
  { id: 'experiments', label: 'Experiments', island: 'Down by the falls', at: [0, 0, 0], accent: '#80d5cf' },
  { id: 'about', label: 'About', island: 'The overlook', at: [0, 0, 0], accent: '#58a987' },
  { id: 'toolkit', label: 'Toolkit', island: 'Under the roots', at: [0, 0, 0], accent: '#8c725b' },
  { id: 'contact', label: 'Contact', island: 'The horizon', at: [0, 0, 0], accent: '#318e91' },
];

/** Navigation shows these; "top" is the brand link. */
export const NAV_PLACES = PLACES.filter((p) => p.id !== 'top');

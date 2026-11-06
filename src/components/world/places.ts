/**
 * The islands of the world, in the order the camera visits them.
 * Each one is a real section of the homepage (its `id` is the section's
 * anchor), so every 3D place has a plain HTML equivalent.
 */
export interface Place {
  id: string;
  label: string;
  /** what the island is, shown on the map */
  island: string;
  /** island centre in world units */
  at: [number, number, number];
  /** accent colour of the island's details */
  accent: string;
}

export const PLACES: Place[] = [
  { id: 'top', label: 'Welcome', island: 'Landing island', at: [0, 0, 0], accent: '#536bfa' },
  { id: 'work', label: 'Work', island: 'Project district', at: [14, -2.2, -9], accent: '#f49a7b' },
  { id: 'experiments', label: 'Experiments', island: 'The garden', at: [27, 1.4, -2], accent: '#9fd9e8' },
  { id: 'about', label: 'About', island: 'Observatory', at: [39, -0.6, -12], accent: '#b9a9f4' },
  { id: 'toolkit', label: 'Toolkit', island: 'Workshop', at: [51, 1.8, -4], accent: '#d5e978' },
  { id: 'contact', label: 'Contact', island: 'The gate', at: [63, 0, -10], accent: '#536bfa' },
];

/** Navigation shows these; "top" is the brand link. */
export const NAV_PLACES = PLACES.filter((p) => p.id !== 'top');

/**
 * The real screenshots that exist for each project, at their native sizes. Nothing here is drawn or mocked:
 * a project with no entry has no screenshots, and the pages show its own line on its colour instead.
 */
const W = `${import.meta.env.BASE_URL}world`;

export interface Shot {
  src: string;
  w: number;
  h: number;
  alt: string;
}

const wide = (src: string, alt: string): Shot => ({ src: `${W}/${src}`, w: 1440, h: 900, alt });

export const SHOTS: Record<string, Shot[]> = {
  tarang: [
    wide('tarang/home.webp', "Tarang's home screen: the album 'Analog Hearts' with the floating player along the bottom"),
    wide('tarang/now-playing.webp', "Tarang's now-playing view with the record artwork and playback controls"),
    wide('tarang/stats.webp', "Tarang's listening stats: top artists, albums, genres and time of day"),
  ],
  krama: [
    wide('krama/home.webp', "Krama's home page: the Gati Runner drop, set like a magazine cover"),
    wide('krama/product.webp', "Krama's product page for the Gati Runner, with sizes and add to cart"),
    wide('krama/shop.webp', "Krama's shop grid with colour and size filters"),
    wide('krama/admin.webp', "Krama's admin console"),
  ],
  'noir-cafe': [
    wide('noir/menu.webp', "Noir Café's menu page: 'Made slowly. Served simply.' with the espresso list"),
    wide('noir/shop.webp', "Noir Café's shop page with brewing equipment"),
    wide('noir/reservation.webp', "Noir Café's table reservation page"),
  ],
  'rinti-ai': [
    { src: `${W}/rinti/research-answer.webp`, w: 1920, h: 1200, alt: "Rinti answering a research question about how the James Webb Space Telescope stays cold, with a summary and cited key findings" },
    { src: `${W}/rinti/research-sources.webp`, w: 1920, h: 1200, alt: 'The six sources behind that answer, each with its site and date and tagged Official, User-reported or Older' },
    { src: `${W}/rinti/research-claims.webp`, w: 1920, h: 1200, alt: "Rinti's claim check: findings confirmed by official sources, set apart from the synthesis that explains them" },
    { src: `${W}/rinti/landing.webp`, w: 1920, h: 1200, alt: "Rinti's empty chat in the dark theme: 'Think clearly. Ask anything.', the message box with the Research switch, and four starter prompts" },
    { src: `${W}/rinti/models.webp`, w: 1920, h: 1200, alt: "Rinti's models page, listing the models the server reports as configured; openai/gpt-oss-120b is in use" },
    { src: `${W}/rinti/memory.webp`, w: 1920, h: 1200, alt: "Rinti's memory page: facts Rinti can draw on, each of which can be switched off without deleting it" },
  ],
  wednesday: [
    { src: `${W}/wednesday/moon.webp`, w: 1920, h: 1200, alt: "W.E.D.N.E.S.D.A.Y.'s World screen in Moon mode: the near side with landing sites, and the lunar time machine listing missions and orbiters" },
    { src: `${W}/wednesday/orbit.webp`, w: 1920, h: 1200, alt: 'World in Orbit mode: satellites, aircraft and ships from live public feeds over a lit 3D Earth' },
    { src: `${W}/wednesday/mind.webp`, w: 1920, h: 1200, alt: "The Mind screen: 'Good evening.', starter questions and the message box, with the local model qwen2.5:7b shown as reachable" },
    { src: `${W}/wednesday/security.webp`, w: 1920, h: 1200, alt: 'The Security screen: deny by default, 16 tools registered, no shell access, and the session permissions you switch on yourself' },
    { src: `${W}/wednesday/pulse.webp`, w: 1920, h: 1200, alt: "Pulse: today's earthquakes, natural events, disaster alerts and world news, each with its source and a Show on Earth link" },
  ],
  prahari: [wide('prahari/login.webp', "PRAHARI's sign-in screen")],
  'akasha-lens': AKASHA_PAIRS().flatMap((p) => [
    { src: p.cloudySrc, w: p.cloudy.w, h: p.cloudy.h, alt: `Training pair ${p.n}: the cloudy satellite image the model is given` },
    { src: p.clearSrc, w: p.clear.w, h: p.clear.h, alt: `Training pair ${p.n}: the clear image of the same ground` },
  ]),
};

/**
 * AkashaLens training pairs, at their native sizes. These are dataset images, not model outputs.
 * The cloudy and clear captures were taken at different framings; where the same ground could be matched by its
 * map labels and shorelines, `inset` says where the cloudy frame sits inside the clear one (scale 1, by eye).
 * Pair 3 was captured at a different zoom and has no inset, so it is shown side by side, never overlaid.
 */
export interface AkashaPair {
  n: number;
  cloudySrc: string;
  clearSrc: string;
  cloudy: { w: number; h: number };
  clear: { w: number; h: number };
  inset?: { x: number; y: number };
}
function AKASHA_PAIRS(): AkashaPair[] {
  const pair = (n: number, cloudy: [number, number], clear: [number, number], inset?: [number, number]): AkashaPair => ({
    n,
    cloudySrc: `${W}/akasha/cloudy${n}.webp`,
    clearSrc: `${W}/akasha/clear${n}.webp`,
    cloudy: { w: cloudy[0], h: cloudy[1] },
    clear: { w: clear[0], h: clear[1] },
    inset: inset && { x: inset[0], y: inset[1] },
  });
  return [pair(1, [487, 287], [625, 350], [72, 60]), pair(2, [897, 576], [1177, 792], [108, 120]), pair(3, [382, 295], [822, 586])];
}
export const akashaPairs = AKASHA_PAIRS();

/** the one picture that stands for a project in an index */
export const cover = (slug: string): Shot | undefined => {
  if (slug === 'akasha-lens') return SHOTS['akasha-lens'][3];
  return SHOTS[slug]?.[0];
};

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
    { src: `${W}/rinti/login.webp`, w: 520, h: 540, alt: "Rinti's sign-in screen" },
    { src: `${W}/rinti/register.webp`, w: 520, h: 540, alt: "Rinti's create-account screen" },
  ],
  prahari: [wide('prahari/login.webp', "PRAHARI's sign-in screen")],
  'akasha-lens': [1, 2, 3].flatMap((n) => [
    { src: `${W}/akasha/cloudy${n}.webp`, w: 487, h: 287, alt: `Training pair ${n}: the cloudy satellite image the model is given` },
    { src: `${W}/akasha/clear${n}.webp`, w: 487, h: 287, alt: `Training pair ${n}: the clear image of the same ground` },
  ]),
};

/** the one picture that stands for a project in an index */
export const cover = (slug: string): Shot | undefined => {
  if (slug === 'akasha-lens') return SHOTS['akasha-lens'][3];
  return SHOTS[slug]?.[0];
};

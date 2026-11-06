# Camera composition

Code: `src/components/world/camera.ts` (shots, framing, composition overlay), driven by `Rig` in `src/components/world/World.tsx`.

## How an island is framed

Island shots are not stored as coordinates. Each one is a **direction** plus a **framing rule**:

- **`az`** (degrees): azimuth measured from the direction pointing at the hero.
- **`el`** (degrees): elevation, chosen per island. Small islands are shot steeper so the canopy reads. Tall masses are shot lower so the underside towers.
- **Bounds:** the real bounding box of each island's mesh, set by the environment once it is built (`setIslandBounds`).
- **Distance:** comes from those bounds, the field of view and the viewport aspect. The silhouette fills about 72% of the height and at most 42% of the width on desktop, or 80% of the width on phones and tablets in portrait.
- **Aim:** a little above the box centre (7% of the visible height). The box reaches down to the thinnest drip tips, and the nav covers the top of the screen. Without this lift the visual mass sat high.
- **Phones and tablets under 1000 px wide:** the island is composed into the upper screen with a lens shift (`setViewOffset`, 22%), not a camera tilt, because the caption is a sheet below.
- **Clearing neighbours:** the authored azimuth is a preference. The camera may turn up to 60° either way (`turn` caps it per shot) when that clears other formations, the hero included, out of a padded zone around the subject. Formations nearer than the subject count three times as heavily. The choice is cached per island and viewport shape, so it costs nothing per frame.

Between two islands the camera interpolates both poses and lifts on a small arc (12% of the move), so each move reveals the formations beyond. The hero, Experiments, About, Toolkit and Contact keep authored shots.

The project caption keeps to the left gutter, level with its island (`--isle-y` on the chapter element), so it never covers the centred subject.

## Composition mode (development only)

Run `npm run dev` and open `/?frame`. The overlay draws:

- the thirds;
- the target centre (raised on phones);
- the island's projected bounding rectangle;
- camera position, target, field of view, and the island's size and offset from centre.

`window.__frame` holds the same numbers for scripted checks. The mode does not exist in production builds.

## Measured framing

Scripted check: the scroll position was set to the start, middle and end of each of the nine project chapters, at each viewport, and `window.__frame` was read at each point. Figures below are for chapter middles. Horizontal offset is the box centre's distance from screen centre, as a fraction of width. Desktop vertical offsets are box-centre numbers and include the intentional lift described above.

| Viewport | Max horizontal offset | Island height (of screen) | Island width |
| --- | --- | --- | --- |
| 1920×1080 | 1.6% | 58–71% | 25–36% |
| 1280×800 | 1.8% | 54–67% | 28–36% |
| 1024×768 | 1.6% | 47–57% | 30–39% |
| 768×1024 | 2.2% | 36–42% (upper screen) | 37–53% |
| 375×812 | 3.1% | 31–37% (upper screen) | 61–73% |

## Performance

A/B at 1280×800 on the Intel UHD iGPU, back to back under the same machine load, production builds:

| Build | Scroll FPS |
| --- | --- |
| Previous camera | 50 and 55 |
| This one | 52 and 52 |

The camera change costs nothing measurable. Both builds ran below the 60.4 FPS recorded in `PERFORMANCE.md`, because another WebGL page was open on the machine during this run. Re-measure on an idle machine before quoting 60.

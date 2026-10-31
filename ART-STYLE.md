# Zoom Town — Art & Motion Style

The single reference for every visual asset in Zoom Town. **Artist of record:** DeepSeek V4.1 Flash (`opencode-go/deepseek-v4.1-flash`) unless the owner says otherwise. **Reference neighbours:** `kids-games-4` (cozy restraint) and `restaurant-manager-game` (arrival bounce), both read-only.

## 1. Principles

- **Sunny toy town, not realistic racing.** Rounded low-poly shapes, flat colour, one soft light, no dirt, no damage, no grit.
- **One hand made it.** One palette, one shading recipe, one face grammar, one easing family.
- **Legible at arm's length.** A five-year-old holds the phone at ~30 cm. Silhouette first, detail second.
- **Nothing looks dangerous.** No spikes, no fire, no sharp chrome, no aggressive faces.
- **No emoji anywhere.** Use original SVG/CSS shapes and 3D primitives. Plain symbols (★ ← ↑ →) are allowed.
- **No text in the world.** All instruction is icon, animation, or voice.

## 2. Colour

Source of truth for the web UI: `src/lib/styles/tokens.css` (`--zt-*`). Three.js materials use the same hex values imported from `src/lib/game/palette.ts`; never hard-code a second copy.

| Token           | Value     | Use                                                 |
| --------------- | --------- | --------------------------------------------------- |
| `--zt-sky`      | `#7EC8F2` | sky, distant hills, water highlights                |
| `--zt-sky-top`  | `#4FB3E8` | upper sky gradient                                  |
| `--zt-cream`    | `#FFF6E3` | paper, clouds, road markings                        |
| `--zt-grass`    | `#7CC242` | verges, park, hills                                 |
| `--zt-grass-2`  | `#4E8F2A` | shadowed grass, tree undersides                     |
| `--zt-road`     | `#6B6F76` | asphalt                                             |
| `--zt-road-2`   | `#555A62` | asphalt shadow, tyre marks                          |
| `--zt-ink`      | `#26313C` | outlines, text, darkest value                       |
| `--zt-ink-soft` | `#5B6B78` | secondary text                                      |
| `--zt-red`      | `#E8433F` | balloons, curb accents, Fox's rivals? no — see cars |
| `--zt-yellow`   | `#F7C948` | balloons, stars, sunshine accents                   |
| `--zt-gold`     | `#FFC93C` | stars, trophy, celebration                          |
| `--zt-blue`     | `#3B82D6` | Bear's car                                          |
| `--zt-pink`     | `#F06E9C` | Bunny's car                                         |
| `--zt-orange`   | `#F28C28` | Fox's car                                           |
| `--zt-teal`     | `#2FB8A6` | Cat's car                                           |
| `--zt-water`    | `#59C3E8` | fountain, stream                                    |
| `--zt-wood`     | `#B9773F` | bridge, crates                                      |
| `--zt-white`    | `#FFFFFF` | cloud tops, eye highlights                          |

**Rules**

- Background is always lighter than the car; the car is always the most saturated thing on screen.
- Never rely on colour alone: each car also has a distinct silhouette, each balloon a distinct shape stripe, each star a filled/unfilled silhouette.
- UI contrast target: 4.5:1 for text, 3:1 for large shapes. Ink on cream or cream on ink; never pale yellow on white.
- Shadows are cool and soft, never pure black: `rgba(38, 49, 60, 0.18)`.

## 3. Shape language

- **Round everything.** No sharp 90° exterior corners; use 2–6 cm bevels/radii in world scale.
- **Chunky proportions.** Cars are wide and short, wheels oversized, cabins tall enough to see the driver's ears.
- **Three-value shading.** Base colour, one lighter top plane, one darker side plane. Flat-shaded, no textures except generated road markings.
- **Trees:** ice-cream-cone canopies or stacked spheres, never realistic foliage.
- **Houses:** one box + one triangular roof + one door + two windows; no more than 12 meshes each.
- **Clouds:** three overlapping spheres, pure white, no outline.
- **Water:** flat `--zt-water` with two lighter ripple rings; no reflection, no refraction.

## 4. Cast

| Driver | Car colour    | Silhouette signature        | Personality sound  |
| ------ | ------------- | --------------------------- | ------------------ |
| Bear   | `--zt-blue`   | tall round ears, broad body | low friendly hum   |
| Bunny  | `--zt-pink`   | long ears, small body       | bright double-beep |
| Fox    | `--zt-orange` | pointed ears, bushy tail    | quick triple-beep  |
| Cat    | `--zt-teal`   | triangular ears, slim body  | soft chirp         |

- The player sees the car from behind; ears and tail must read at 64 px.
- Drivers are friendly, never competitive. Eyes are two dots and a smile; no eyebrows, no teeth.
- Rival cars use the other three drivers; the player's chosen car is never duplicated on track.
- Cars have no numbers, no sponsors, no decals except a single balloon icon on the door.

## 5. World

- **Tracks:** five closed loops, 353–456 m, 8 m wide (about four car widths): Sunny Town, Park Loop, Harbor Dash, Dino Valley, Candy Hills. Each has its own palette, landmark, and scenery set.
- **Landmarks, in order:** start gantry → first S-curve → duck fountain on the right sweep → park straight → wooden bridge → esses → bottom hairpin → toy shop on the top straight → home straight.
- **Start gantry:** two cream posts, red-and-white striped beam, three balloon-shaped lamps, placed 18 m ahead of the car so the camera never starts inside the beam.
- **Scenery props:** instanced hills, trees, houses, flowers, rocks, lamp posts, flags and clouds; per-theme landmarks (fountain/toy shop, pond/bandstand, lighthouse/boats, volcano/bones, lollipops/gumdrops).
- **Fountain:** round two-tier basin, duck on top, water rings, four benches.
- **Park:** eight trees, six lamp posts, a bandstand, balloons tied to two benches.
- **Bridge:** wooden planks, low rails, stream underneath, two ducks.
- **Toy shop:** striped awning, giant pencil sign, stacked blocks outside.
- **Verges:** flowers as flat coloured discs on stems; never countable-looking (≤ 0.45 opacity at distance, no repeated grid).
- **Sky:** gradient `--zt-sky-top` → `--zt-sky`, three clouds, no sun disc (bloom risk).

## 6. Lighting & rendering

- One `HemisphereLight` (sky `--zt-sky`, ground `--zt-grass-2`, intensity ~0.9).
- One `DirectionalLight` (warm white, intensity ~1.1, from front-left-high) for form; **no real-time shadow maps**.
- **Blob shadows:** a soft radial-gradient plane under every car, tree, and building. Opacity 0.18, y = 0.02.
- Flat shading (`flatShading: true`) on low-poly meshes. No PBR, no env maps, no post-processing, no bloom, no film grain.
- Fog: linear `--zt-sky` from 55 m to 160 m to hide the world edge while keeping the next corners readable.
- Pixel ratio cap: `Math.min(devicePixelRatio, 2)`; drop to 1.5 on low-end devices.

## 7. Camera

- **High chase, pulled back.** Height ~7 m, distance ~11 m, vertical FOV 62–70°.
- **Corner look-ahead:** the camera target leads the car along the track by ~8 m; the camera yaw eases toward the track tangent, so the next corner enters frame before the car reaches it.
- **Edge arrow:** when the next corner is outside the safe frame, a cream chevron with a red tip appears at the screen edge. It never covers the car.
- **No screen shake** except a 2 px, 120 ms bump on rival contact; reduced motion removes it.
- **Calm camera** (reduced motion): no look-ahead sway, no speed FOV pulse, fixed 65° FOV.

## 8. Motion

**Durations:** tap = 120 ms · pop = 280 ms · arrive = 420 ms · celebration = 900 ms · ambience = 3–8 s.

**Easings:**

- Settle: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Overshoot “boing”: `cubic-bezier(0.2, 1.5, 0.4, 1)`
- Snap: `cubic-bezier(0.18, 0.85, 0.32, 1.05)`

**Patterns**

- **Button press:** scale `1 → 0.9 → 1.04 → 1` over 220 ms; a cream ring flashes once.
- **Balloon pop:** balloon scales `1 → 1.35 → 0`, six confetti triangles fly outward, a gold ring expands to 1.6× and fades. 280 ms.
- **Boost start:** two cream speed lines sweep past; the car squashes `1 → 0.94 → 1.06 → 1`; the camera pulls back 1 m and returns. 600 ms.
- **Star arrive:** each star lands with an overshoot at 120 ms stagger; unfilled stars stay as cream outlines.
- **Car unlock:** the garage card flips, the car drives in from the left, the driver's ears bounce once.
- **Trophy:** confetti cannon, three stars orbit, all four cars honk in sequence.
- **Idle:** balloons bob ±0.15 m over 2.6 s with a 0.3 s phase offset; trees sway ±1.2° over 5 s; fountain rings pulse over 3 s.
- **Reduced motion:** replace travel with opacity fades; no camera sway, no confetti travel, no orbiting stars.

## 9. HUD & UI

- **Portrait canvas** fills the screen; all UI is HTML/SVG over the WebGL canvas.
- **Top row:** pause (top-right, 56 px), balloon count (top-left, balloon icon + 0–10 dots), lap pips (top-centre, two cream rings that fill gold).
- **Track ribbon:** 12 px wide, left edge, 60% of screen height, cream with ink ticks; player dot is the car colour with a white ring; rivals are 8 px dots.
- **Boost meter:** three chunky segments above the boost button; filled `--zt-teal`, empty cream. The button is 84 px, always visible, dimmed below one charge.
- **Speedometer:** compact cream gauge above the right steer button; teal arc, red needle, km/h digits, boost glow. Never covers the car.
- **AUTO badge:** top-centre under the lap pips; steering-wheel icon plus AUTO, only while auto-steer is active.
- **Steer buttons:** 88 px circles in the bottom corners, cream with ink arrows; pressed state sinks 3 px and turns `--zt-yellow`.
- **Results:** cream card with three stars, balloon tally as icons, one unlocked-car card, two big buttons: “Again” (circular arrow) and “Home” (house). Text is decoration; icons carry meaning.
- **Settings:** picture rows, 64 px targets, no typing. Reset uses a 3-second hold with a filling red ring and a spoken warning.
- **Type:** `Fredoka` variable for titles and any optional labels; fallback `system-ui`. Never below 18 px.
- **No emoji. No third-party icon fonts.** Inline SVG only.

## 10. Performance guardrails

- Draw calls under 90; merge static track scenery into one or two geometries.
- Cars: ≤ 40 meshes each, shared geometries/materials across rivals.
- Balloons: one shared geometry, one material per colour; instancing is welcome.
- No shadow maps, no post-processing, no transparent overdraw larger than the HUD.
- Target 60 fps on a mid-range phone; if the average frame time exceeds 20 ms for 2 s, drop pixel ratio to 1.25 and scenery density by one step.

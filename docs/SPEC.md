# Zoom Town — v1 Specification

**Status:** locked 2026-10-31 · **Audience:** ages 5–7 · **Orientation:** portrait only · **Platform:** web (installable PWA)

## 1. Goal

A five-year-old can open Zoom Town, pick a shape, pick a car, and finish a race without reading, without an adult, and without ever losing. The game should feel like driving a toy through a sunny toy town: soft, fast enough to be exciting, and impossible to fail.

**Top priority when goals conflict:** a 5-year-old plays unaided. Clarity, safety, and forgiveness beat visual polish, frame rate, and extra content.

## 2. Non-goals for v1

- Ages 8–10 difficulty, time attack, endless mode, free drive, multiplayer.
- More than one track, track variants, car performance stats, car upgrades, currency, shop, ads, accounts, analytics, chat, user-generated content.
- Landscape play, left-handed layout mode (the controls are already symmetric), external art or music files.
- Any runtime network request after the first load.

## 3. Screen flow

```
Splash (1.2 s, skippable by tap)
  → Profile picker (star / flower / moon)
    → Garage (car choice; locked cars show star pips)
      → GO
        → Countdown 3-2-1-GO
          → Race (2 laps)
            → Results overlay (stars, balloons, unlock)
              → Again | Home (garage)
```

- **Pause overlay:** Resume · Restart · Sound · Home.
- **Settings:** gear on the profile screen. Sound, language, reduced motion, reset current profile (3 s hold).
- **Tutorial:** before the first race of each profile, over the countdown; skippable; replayable from pause.
- **Maximum three taps to driving:** profile → car → GO.

## 4. Controls & portrait layout

| Element       | Position                       | Behaviour                                   |
| ------------- | ------------------------------ | ------------------------------------------- |
| Steer left    | bottom-left, 88 px circle      | Hold to turn left; release to centre        |
| Steer right   | bottom-right, 88 px circle     | Hold to turn right; release to centre       |
| Boost         | bottom-centre, above steer row | Tap to spend one charge; 2 s burst          |
| Pause         | top-right, 56 px               | Free pause; auto-pause on focus loss        |
| Track ribbon  | left edge, 60% height          | Player and rival dots                       |
| Balloon count | top-left                       | Icon + 10 small dots                        |
| Lap pips      | top-centre                     | Two rings; fill gold when the lap completes |

- No brake, reverse, or gear control. Auto-accelerate from 0 to cruise in ~2 s.
- Touch targets ≥ 64 px with 12 px padding; taps slightly outside still register.
- The game canvas is portrait 9:16; on desktop it is centred in a portrait column.
- On a coarse-pointer device held landscape, a friendly rotate overlay covers the game. Installed PWA declares `orientation: portrait`.

## 5. Race rules

| Rule            | Value                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------- |
| Laps            | 2                                                                                            |
| Target duration | ~73 s                                                                                        |
| Cruise speed    | 11.5 m/s (~41 km/h); boost 1.4× for 2 s                                                      |
| Acceleration    | 6 m/s² to cruise                                                                             |
| Steering        | 2.2 rad/s at low speed, easing to 1.6 rad/s at cruise                                        |
| Steering assist | Strong auto-centre on release; gentle lateral pull back to the racing line                   |
| Track width     | 8 m; car 1.4 m wide                                                                          |
| Balloons        | 5 per lap, 10 per race, on the racing line                                                   |
| Boost charges   | Each balloon +1; max 3 stored; one tap = 1 charge                                            |
| Guardrail       | Clamp lateral offset; 10% target-speed reduction while touching; sparkle + boop              |
| Auto-recover    | Stuck (<0.4 m/s for 2 s) or wrong-way (>1.5 s) → last safe point, facing forward; boost kept |
| Rival contact   | Soft bump: separate laterally, no speed loss, no spin, no damage; AI avoids repeat contact   |
| Rivals          | 3, rubber-banded, never collect balloons, never block                                        |
| Finish          | Crossing the line after lap 2 → auto-brake, confetti, results                                |

### Stars

| Stars | Condition                       |
| ----- | ------------------------------- |
| 1     | Finish the race                 |
| 2     | Finish with at least 5 balloons |
| 3     | Finish with all 10 balloons     |

- Stars are a **best-ever** rating per profile. A worse race never removes a star.
- A perfect first race can unlock every car. That is intentional: no grind.

### Unlocks

| Car   | Driver | Requirement      |
| ----- | ------ | ---------------- |
| Bear  | Bear   | Always available |
| Bunny | Bunny  | 1 star           |
| Fox   | Fox    | 2 stars          |
| Cat   | Cat    | 3 stars          |

- All cars are cosmetic: identical speed, acceleration, steering, and boost.
- Trophy: 3 stars + all four cars unlocked. Show once per profile, then free replay.

## 6. Track

One closed loop, clockwise, ~456 m, ten corners, 8 m wide. The layout has an early S-curve, a long right-hand sweep, a bottom hairpin, a chicane, and a final left kink.

**Control points** (x, z), used as a closed Catmull-Rom spline:

```
(-76, 58)  start/finish straight
(-48, 60)
(-24, 54)  first S
( -2, 60)
( 18, 54)
( 44, 48)
( 64, 38)
( 78, 24)  right-hand sweep
( 82,  6)
( 76, -12)
( 62, -26)
( 44, -34)
( 24, -32)  esses
(  8, -38)
( -6, -50)
(-24, -54)  bottom hairpin
(-40, -46)
(-50, -30)
(-54, -10)  left kink
(-66,   2)
(-78,  16)
```

**Landmarks, in order:** start gantry → first S-curve → duck fountain on the right sweep → park straight → wooden bridge over the stream → esses → bottom hairpin → toy shop on the top straight → home straight.

- Start line at `t = 0.04`, car starts at `t = 0`.
- Balloon positions per lap at `t = 0.06, 0.24, 0.42, 0.60, 0.78`, alternating lateral offsets `-1.4, 0, +1.4, 0, -1.4`.
- Lap 2 balloons reuse the same positions but respawn; only the current lap's set is visible.
- Scenery outside the track: park trees, benches, fountain, bridge, toy shop, houses. All non-collidable.
- Guardrails are visual low curbs; collision is a mathematical lateral clamp that preserves the car's progress along the tangent, so it slides rather than pinning. With no input, a gentle centring force returns the car to the racing line.

## 7. Camera

- High chase: ~4.8 m above the car, ~8.5 m behind, vertical FOV 68°.
- Target leads the car by ~9 m along the track tangent; yaw eases with a 0.18 s time constant.
- Speed FOV pulse: +3° at boost, 0.4 s in, 0.6 s out.
- Edge chevron when the next corner is outside the safe frame.
- Calm camera (reduced motion): fixed FOV 65°, no look-ahead sway, no shake.

## 8. AI & rubber-band

- Three rivals follow the spline with lane offsets `-2.2, 0, +2.2` and target speed multipliers `0.94, 1.00, 1.06`.
- Rubber-band: if the player is more than 25 m ahead, rival target speed +8%; if more than 25 m behind, −8%. Clamp so rivals never leave the player alone.
- Rivals avoid contact: when within 2.4 m of the player, steer to the free side and lift the target speed by 2%.
- On contact: separate both cars laterally by 0.12 m per frame, no speed change, play a soft double-beep. Cooldown 0.6 s.
- Rivals never collect or hide balloons; balloons are player-only.

## 9. Profiles & save

- Three profile slots, each with a shape avatar (star, flower, moon), no names, no typing.
- Per-profile data: best stars, unlocked cars, selected car, tutorial seen, trophy seen.
- Device-wide settings: sound on/off, language (`it` default, `en`), reduced motion.
- Storage: `localStorage`, JSON, `version: 1`. Key `zoomtown.save.v1`; a corrupt or missing save boots a fresh profile picker.
- Reset current profile requires a 3 s hold with a filling ring and a spoken warning. Other profiles untouched.
- No accounts, no cloud sync, no export.

## 10. Tutorial

- Shown once per profile before the first countdown; ~15 s; skippable by tapping anywhere.
- Three beats, each with an icon, an animated thumb ghost, and a spoken callout:
  1. “Hold left or right to steer.” — ghost thumb presses the left button, then the right.
  2. “Tap the big button to boost.” — balloon flies into the meter, boost button pulses.
  3. “Pop balloons to earn stars.” — three balloons pop into three stars.
- Replayable from the pause menu (“?” button).
- No reading required; text is optional decoration.

## 11. Audio

- **All audio is generated on this Mac and committed**, never spoken by the browser and never fetched from a third party. Voices come from the local Qwen3-TTS studio; music and organic SFX come from the local Stable Audio 3 studio; click/beep/rail/bump are the studio's procedural SFX.
- **Voice:** 13 callouts in Italian and English: tutorial beats, 3-2-1-Go, great driving, three stars, new car, trophy, turn upright, pick driver. Music ducks under voice.
- **Music:** a 45 s original toy-town loop (toy piano, ukulele, whistling, 100 BPM, no vocals), generated locally.
- **SFX:** balloon pop, boost whoosh, star chime, unlock/trophy fanfares, engine loop, guardrail boop, soft bump, UI tap, countdown beep.
- Generation is reproducible with `pnpm audio` (`tools/generate-audio.mjs`) against `music-sfx-voice-studio` on `127.0.0.1:7910`.
- iOS audio unlock on the first pointer event.
- Mute persists; fully playable silently.

## 12. Accessibility & safety

- No reading required for any action; icons + voice + animation.
- Never colour-only: cars have silhouette + colour; balloons have shape stripes; stars have fill state.
- All touch targets ≥ 64 px; forgiving hit areas.
- Reduced motion: no camera sway, no screenshake, no confetti travel; functional feedback remains.
- Sound-off remembered; no autoplay audio before a tap.
- No ads, external links, analytics, cookies, accounts, chat, or runtime network.
- No emoji in UI, art, or assets. Plain symbols (★ ← ↑ →) allowed.

## 13. Technical architecture

- **SvelteKit 3 + static adapter**, Svelte 5 runes, TypeScript, Vite 8.
- **Three.js** scene in a single `<canvas>`; Svelte owns menus/HUD via stores.
- **No physics engine.** Kinematic car with a 2D position, heading, speed, and a spline lateral clamp.
- **Game loop** with `requestAnimationFrame`, fixed-step accumulator at 60 Hz for physics, render interpolation optional.
- **State machine:** `boot → profile → garage → countdown → racing → paused → finished → results`.
- **Modules:**
  - `src/lib/game/track.ts` — spline, sampling, ribbon geometry, landmarks.
  - `src/lib/game/car.ts` — car model, physics, boost, guardrail.
  - `src/lib/game/rivals.ts` — spline followers, rubber-band, bump.
  - `src/lib/game/camera.ts` — chase camera, look-ahead, calm mode.
  - `src/lib/game/balloons.ts` — placement, bob, collection.
  - `src/lib/game/scene.ts` — renderer, lights, world, resize.
  - `src/lib/game/audio.ts` — local sample playback for music/SFX/voice/engine, with WebAudio mixing and ducking.
  - `src/lib/game/state.ts` — race state, stars, unlocks.
  - `src/lib/save.ts` — localStorage schema and migration.
  - `src/lib/styles/tokens.css` — colour and motion tokens.
- **Static deploy:** `pnpm build` → `build/`, served by Cloudflare Workers static assets via Wrangler.
- **PWA:** portrait manifest, generated icons, service worker that precaches the shell and all committed audio; installable and playable offline after the first load.
- **iOS PWA:** `apple-mobile-web-app-capable`, `black-translucent` status bar, `Zoom Town` title, 152/167/180 touch icons, safe-area insets, `navigator.standalone` detection, and a custom install sheet. iOS Safari has no `beforeinstallprompt`, so the game shows a first-visit banner on the profile screen and keeps a Settings → Install app entry. The sheet explains Share → Add to Home Screen → Add, warns when the page is not in Safari, and stores “don’t show again”. Installed mode is full-screen, portrait, and offline.
- **Tests:** Vitest for star/unlock/save/track math and iOS detection; Playwright for the portrait flow, a debug-driven race, persistence, audio asset loading, the iOS Safari install sheet, and screenshot baselines.

## 14. Performance & quality bar

- 60 fps on a mid-range phone; stable 30 fps fallback; no frame spike > 50 ms on lap 1.
- Initial download < 5 MB; draw calls < 90; no real-time shadows or post-processing.
- Works on iPhone Safari and Android Chrome, portrait; desktop Chrome for development.
- Installable PWA, offline after first load; portrait manifest; fullscreen; wake lock where supported.
- No console errors or unhandled rejections in the shipped build.

## 15. Acceptance tests

### Unit

- Stars: finish + 0, 4, 5, 9, 10 balloons → 1, 1, 2, 2, 3.
- Best stars never decrease.
- Unlock thresholds: 0 → Bear only; 1 → Bunny; 2 → Fox; 3 → Cat.
- Save round-trip, corrupt save fallback, reset only current profile.
- Track: closed spline length > 0; lateral clamp keeps the car within half-width; lap wrap does not double-count.
- Boost: charge cap 3; tap below 1 does nothing; 2 s duration; speed multiplier returns exactly.

### E2E (portrait 390 × 844)

- Boot → profile → garage → GO → countdown → race renders; no console errors.
- Debug hook `window.__zoomtown` can set speed, collect all balloons, force finish; results show 3 stars and a car unlock.
- Reload preserves best stars and selected car.
- Landscape phone shows the rotate overlay; portrait hides it.
- Screenshot baselines: profile, garage, race start, boost, results, trophy.

### Device

- iPhone Safari (notch, safe areas, audio unlock).
- Android Chrome (mid-range, 60 fps target).
- Desktop Chrome (centred portrait column, keyboard optional for dev).
- Offline reload after first load.

## 16. Build order

1. Docs (this file, glossary, art style, ADRs).
2. Scaffold, tokens, Three.js boot, portrait frame.
3. Track, car, camera, steering, guardrails — tune on a real phone.
4. Balloons, boost, rivals, bumps, laps, stars.
5. Profiles, garage, tutorial, pause, results, trophy.
6. Audio, reduced motion, PWA, offline, icons.
7. Device tuning, tests, Cloudflare deploy.

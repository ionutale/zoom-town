# Code review — 2026-11-12

Scope: the whole `kids-racing` (Zoom Town) app — 8.7k lines of Svelte/TypeScript, 10
unit suites, the Playwright suite, docs and tooling. Every finding below was fixed in
the same pass; the gates were red when the review started.

| Gate             | Before                               | After          |
| ---------------- | ------------------------------------ | -------------- |
| `pnpm check`     | 0 errors, `tsconfig_invalid` warning | 0 errors       |
| `pnpm lint`      | failed on 12 files                   | clean          |
| `pnpm test:unit` | 32 tests                             | 58 tests       |
| `pnpm build`     | clean                                | clean          |
| `pnpm test:e2e`  | 10 tests                             | 14 tests       |
| CI               | none                                 | GitHub Actions |

Nothing here is a Critical security finding: there is no server, no account, no
runtime network and no untrusted HTML. `localStorage` is the only durable surface and
it is validated field by field on load.

## Bugs

### 🟠 Advanced driving: the pause button was unreachable

The full-screen drag surface lives in `.bottom`, which came **after** `.top` in the DOM,
so it painted over the pause button. A child in Advanced mode could not pause, restart
or go home. Verified with `document.elementFromPoint` before the fix:
`topElementAtPauseCentre: "drag-surface"`.

Fix: `.top { z-index: 2 }` / `.bottom { z-index: 1 }` in
[Hud.svelte](../src/lib/components/Hud.svelte). Regression test:
`advanced driving › can still pause while the drag surface covers the screen`.

### 🟠 The boot recovery card covered a healthy game

The capture-phase `error` listener in [app.html](../src/app.html) revealed the
`z-index: 9999` card for _any_ failure that was not a `<script>` — a missing stylesheet,
icon or image — and for any later `unhandledrejection`. Verified: appending one bad
`<link>` to a running game revealed an Italian dead-end card with an empty detail line.

Fix: `show()` now returns unless the app has not mounted (`!document.querySelector('.stage')`),
non-script resource errors are ignored, and the card is bilingual (IT heading with
`lang="it"`, EN line, bilingual buttons). Tests: `a broken stylesheet cannot fake a boot failure`
and the rewritten offline/recovery test.

### 🟠 GPU buffers leaked on car change, track change and restart

`replaceCar`, `clearRivals` and `setTrack` removed groups from the scene without calling
`dispose()`; `dispose()` only handled the track. Every garage tap and every **Again /
Restart** leaked the merged car meshes. New
[dispose.ts](../src/lib/game/dispose.ts) gives the scene one owner: `disposeObject3D`
releases geometries and materials, `markSharedResource` protects the wheel mesh and the
balloon trim that are reused by every car.

Verified in a production build over 40+ swaps: geometry count stays flat across ten car
swaps and ten restarts, and every circuit returns to the exact same `calls`/`triangles`
when revisited (`park 71 calls/25 582 tris` on both visits). A screenshot after the churn
renders correctly.

### 🟡 Music stayed ducked at 28% for the rest of the session

`stopVoice()` called `source.stop()`, which never fires `onended`, so the duck applied at
the start of a voice line was never undone — pausing during the countdown was enough.
Fix in [audio.ts](../src/lib/game/audio.ts): `stopVoice()` restores the music gain.

### 🟡 Effect particles disposed a shared geometry

`effects.update()` disposed `sparkGeometry`/`ringGeometry` when one particle died while
others still used them, forcing buffer re-upload on every pop. Fix: particles only dispose
their own material; the shared geometry is released once by `Effects.dispose()`.

### 🟡 HUD CSS had 40 duplicated lines inside a media query

A paste put `.drag-surface`, `.drag-hint`, `.drag-track` and `.drag-knob` inside
`@media (max-height: 700px)`. Removed; that duplication was the Prettier failure.

### 🟡 Language was never applied to the document

`<html lang="en">` shipped while the default UI is Italian, and every accessible name was
English-only. Fix: [i18n.ts](../src/lib/i18n.ts) is now the single table for labels,
counts, formatters and accessible names; `document.documentElement.lang` follows the saved
setting on mount and on change. `app.html` starts at `lang="it"` to match the default.

### 🟡 Modals did not own focus

Settings, Tutorial, Install, Pause and Results declared `aria-modal` but left the game
behind focusable and ignored Escape. Fix: [modal.ts](../src/lib/components/modal.ts) is a
Svelte action that focuses the panel, cycles Tab, closes on Escape and restores focus; the
canvas and screens are wrapped in a `.world` container that is `inert` whenever an overlay
is open.

### 🟢 Smaller fixes

- `forceCollect(7.5)` collected 8 items but reported 7.5 balloons.
- `Rival.update` clamped `lane` and then overwrote the clamp with an unclamped lerp.
- A rival bump wrote straight to `player.pos`, so it could push the car through the rail;
  bumps now go through `player.nudge()` and the lateral clamp.
- `lastRailContact` was not reset between races, so the first rail graze could be silent.
- `pick_driver` existed in both languages and was preloaded but never played; it now plays
  when a profile enters the garage.
- `static/audio/manifest.json` was generated, committed and precached but never read; the
  generator writes it to `.audio-raw/manifest.json` (provenance, not shipped).
- Lap boundary vs painted start line (`t = 0` vs `0.04`) is intentional and documented in
  the SPEC rather than changed: lap counting must stay on the spline seam.

## Architecture

- **Resource ownership.** No more ad-hoc `traverse` in `game.ts`; `dispose.ts` owns the rule
  and shared buffers are declared once.
- **State machines.** Screens and race phase are still separate, but the HUD snapshot is the
  only contract and every overlay flag now feeds one `worldInert` derivation, so a dialog
  can no longer leave a live game underneath it.
- **Theme dispatch.** Scenery landmarks switch on `track.def.theme` instead of comparing a
  palette colour, matching `decorations.ts`.
- **Unlocks.** The stored `profile.unlocked` list is the single truth the garage renders;
  `isCarUnlocked` is gone.
- **Save migration.** A version mismatch no longer wipes progress: saves are read field by
  field, unversioned saves are accepted, and unknown fields are ignored. Covered by tests.
- **Debug surface.** `window.__zoomtown` only exists with `?debug=1`; the shipped game has
  no cheat hooks, and a regression test asserts it.
- **CAR update loop.** The 140-line `PlayerCar.update` is split into `drive`,
  `updateSpeed`, `steerAndMove`, `applyGuardrail`, `updateAutoSteer`, `updateRecovery`,
  `advanceProgress` and `coast`, with the former magic numbers named. Operation order is
  unchanged.
- **Scenery placement.** `Track.isFartherThan` short-circuits instead of running a full
  720-sample nearest search for every rejected candidate, and reuses one scratch vector.
- **Startup.** Audio preloading is deferred to an idle callback (forced early by the first
  gesture), so the shell paints before 1.2 MB of samples and decoded buffers are released
  from the raw map after decoding.

## Clean code

Removed dead code: `starsFor`, `CAR_COLORS`, `cssColor`, `allRivalIds`,
`PlayerCar.setCar`, `CarUpdate.boostStarted`, `CarUpdate.autoSteer`, `lapProgress`, the
unused `near` in `emitHud`, `createProfile(slot, …)`, the unused `skipped` flag on
`Tutorial.onDone`, the audio manifest asset. `merge.ts` reads material properties through a
narrowed structural type instead of casting every material to Lambert.
`TrackMiniMap` computes its projection once instead of twice.

## Docs & tooling

- `docs/SPEC.md`: laps 3, star thresholds, rival numbers, tutorial skip, module list
  (`scene.ts`/`state.ts` never existed), variable-step loop, save migration, debug flag,
  test expectations, start-line note.
- `GLOSSARY.md`: a race is three laps.
- `AGENTS.md`: lint is part of the gate list; code rules for i18n, disposal, modals and the
  debug hook.
- `README.md`: the `?debug=1` hook and the i18n rule.
- `package.json`: `test:e2e` builds first (the `pretest:e2e` hook is not guaranteed under
  pnpm), so Playwright always tests the current build.
- `tsconfig.json`: services worker excluded (removes the `tsconfig_invalid` warning), `e2e/`
  included.
- `vitest-setup.ts`: Map-backed `localStorage` for the Node test environment.
- `e2e/game.e2e.ts` moved out of `src/routes/`.
- `.github/workflows/ci.yml`: check → lint → unit → build, then Playwright on Chromium.

## Deliberately not changed

- `user-scalable=no` in the viewport: a deliberate game choice (WCAG 1.4.4 trade-off),
  documented rather than removed.
- `SvelteKit` screen state vs race phase: merging them is a larger refactor than a bug fix;
  the `worldInert` derivation and the HUD snapshot keep them consistent for now.
- Screenshot baselines were listed in the SPEC but never existed; the SPEC now describes the
  tests that do exist instead of promising baselines.

## Verify

```sh
pnpm check && pnpm lint && pnpm test:unit && pnpm test:e2e
```
